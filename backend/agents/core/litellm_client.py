# Shared LiteLLM client singleton — replaces anthropic_client.py
import logging
import asyncio
import litellm
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure LiteLLM
litellm.drop_params = True  # Drop unsupported params instead of erroring

# Rate limit retry settings
MAX_RETRIES = 2
RETRY_BASE_DELAY = 2  # seconds — keep short to avoid pipeline timeouts


async def call_llm(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1000,
    model: str | None = None,
) -> dict:
    """
    Call the LLM via LiteLLM. Uses Groq by default with automatic retry
    for rate limits (429). Falls back to Ollama on persistent failure.

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

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            response = await litellm.acompletion(**kwargs)
            return response
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            # Check if it's a rate limit error (429)
            is_rate_limit = "429" in error_str or "rate" in error_str or "too many" in error_str
            if is_rate_limit and attempt < MAX_RETRIES - 1:
                delay = RETRY_BASE_DELAY * (2 ** attempt)  # 5s, 10s, 20s
                logger.warning(
                    f"LLM rate limited (attempt {attempt + 1}/{MAX_RETRIES}). "
                    f"Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
                continue
            elif not is_rate_limit:
                # Non-rate-limit error — don't retry
                break

    # All retries exhausted — try Ollama fallback
    logger.warning(f"Primary LLM ({target_model}) failed after {MAX_RETRIES} attempts: {last_error}. Trying fallback...")
    try:
        kwargs["model"] = "ollama/qwen2.5-coder:32b"
        response = await litellm.acompletion(**kwargs)
        return response
    except Exception as fallback_err:
        logger.error(f"Fallback LLM also failed: {fallback_err}")
        raise last_error  # Raise original error
