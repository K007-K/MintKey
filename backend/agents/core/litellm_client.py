# Shared LiteLLM client singleton — replaces anthropic_client.py
import logging
import asyncio
import re
import litellm
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure LiteLLM
litellm.drop_params = True  # Drop unsupported params instead of erroring

# Rate limit retry settings — tuned for Groq free tier (12K TPM / 6K TPM)
MAX_RETRIES = 4
RETRY_BASE_DELAY = 5  # seconds — Groq rate limits typically need 10-30s wait


def _parse_retry_after(error_str: str) -> float | None:
    """Extract the suggested wait time from a Groq rate limit error message."""
    match = re.search(r"try again in (\d+\.?\d*)s", error_str.lower())
    if match:
        return float(match.group(1))
    return None


async def _call_with_retry(kwargs: dict, model_label: str, retries: int = MAX_RETRIES) -> dict:
    """Call LiteLLM with exponential backoff retry for rate limits."""
    last_error = None
    for attempt in range(retries):
        try:
            response = await litellm.acompletion(**kwargs)
            return response
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            is_rate_limit = "429" in error_str or "rate" in error_str or "too many" in error_str

            if is_rate_limit and attempt < retries - 1:
                # Use Groq's suggested wait time if available, else exponential backoff
                suggested = _parse_retry_after(str(e))
                delay = suggested if suggested else RETRY_BASE_DELAY * (2 ** attempt)
                delay = min(delay, 60)  # Cap at 60s
                logger.warning(
                    f"[{model_label}] Rate limited (attempt {attempt + 1}/{retries}). "
                    f"Waiting {delay:.1f}s..."
                )
                await asyncio.sleep(delay)
                continue
            elif not is_rate_limit:
                break  # Non-rate-limit error — don't retry

    raise last_error


async def call_llm(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1000,
    model: str | None = None,
) -> dict:
    """
    Call the LLM via LiteLLM. Uses Groq by default with automatic retry
    for rate limits (429). Falls back to smaller model on persistent failure.

    Response format (OpenAI-compatible):
        response.choices[0].message.content      -> text output
        response.choices[0].finish_reason         -> "stop" or "tool_calls"
        response.choices[0].message.tool_calls    -> list of tool call objects
    """
    target_model = model or settings.LLM_MODEL

    kwargs = {
        "model": target_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    # Try primary model with retry
    primary_err = None
    try:
        return await _call_with_retry(kwargs, model_label=target_model)
    except Exception as e:
        primary_err = e

    # All retries exhausted — wait then try fallback model
    fallback_model = "groq/llama-3.1-8b-instant"
    logger.warning(
        f"Primary LLM ({target_model}) failed after {MAX_RETRIES} attempts: {primary_err}. "
        f"Waiting 10s before fallback ({fallback_model})..."
    )
    await asyncio.sleep(10)  # Let rate limit window pass before hitting fallback

    try:
        kwargs["model"] = fallback_model
        response = await _call_with_retry(kwargs, model_label=fallback_model, retries=3)
        logger.info(f"Fallback LLM ({fallback_model}) succeeded")
        return response
    except Exception as fallback_err:
        logger.error(f"Fallback LLM ({fallback_model}) also failed: {fallback_err}")
        raise primary_err  # Raise original error


