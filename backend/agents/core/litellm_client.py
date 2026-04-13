# Shared LiteLLM client singleton — multi-provider rotation for free tier rate limits
import logging
import asyncio
import re
import os
import litellm
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure LiteLLM
litellm.drop_params = True  # Drop unsupported params instead of erroring

# ─── Provider Pool ───
# All serve Llama 3.3 70B — same quality, distributed across 3 free APIs
# Each provider has its own rate limit, so spreading calls avoids hitting any single limit
PROVIDER_POOL: list[dict] = []


def _build_provider_pool() -> list[dict]:
    """Build the provider pool from available API keys."""
    pool = []

    # Ollama — LOCAL, unlimited, no rate limits (M3 Pro GPU)
    # Primary provider when available — falls through to cloud if offline
    ollama_base = settings.OLLAMA_BASE_URL or "http://localhost:11434"
    try:
        import httpx
        r = httpx.get(f"{ollama_base}/api/tags", timeout=2.0)
        if r.status_code == 200:
            models = [m["name"] for m in r.json().get("models", [])]
            # Prefer larger models first
            for preferred in ["qwen2.5:14b", "qwen2.5:7b", "llama3.1:8b"]:
                if preferred in models:
                    pool.append({
                        "model": f"ollama/{preferred}",
                        "api_base": ollama_base,
                        "label": f"Ollama-{preferred}",
                    })
                    logger.info(f"[LLM] Ollama local model found: {preferred}")
                    break
            else:
                if models:
                    pool.append({
                        "model": f"ollama/{models[0]}",
                        "api_base": ollama_base,
                        "label": f"Ollama-{models[0]}",
                    })
                    logger.info(f"[LLM] Ollama using first available: {models[0]}")
    except Exception:
        logger.info("[LLM] Ollama not running — using cloud providers only")

    # Groq 70B — 12K TPM, 100K TPD free tier
    if settings.GROQ_API_KEY:
        pool.append({
            "model": "groq/llama-3.3-70b-versatile",
            "api_key": settings.GROQ_API_KEY,
            "label": "Groq-70B",
        })

    # Cerebras — llama3.1-8b (confirmed available: 60K TPM, 1M TPD)
    if settings.CEREBRAS_API_KEY:
        os.environ["CEREBRAS_API_KEY"] = settings.CEREBRAS_API_KEY
        pool.append({
            "model": "cerebras/llama3.1-8b",
            "api_key": settings.CEREBRAS_API_KEY,
            "api_base": "https://api.cerebras.ai/v1",
            "label": "Cerebras-8B",
        })

    # OpenRouter — auto-selects from available free models (last resort)
    if settings.OPENROUTER_API_KEY:
        os.environ["OPENROUTER_API_KEY"] = settings.OPENROUTER_API_KEY
        pool.append({
            "model": "openrouter/openrouter/free",
            "api_key": settings.OPENROUTER_API_KEY,
            "label": "OpenRouter-Free",
        })

    # Fallback: if no keys configured, use Groq default
    if not pool:
        pool.append({
            "model": settings.LLM_MODEL,
            "api_key": settings.GROQ_API_KEY,
            "label": "Default",
        })

    return pool


# Rate limit retry settings
MAX_RETRIES = 3
RETRY_BASE_DELAY = 5  # seconds

# Round-robin counter
_call_counter = 0


def _parse_retry_after(error_str: str) -> float | None:
    """Extract the suggested wait time from a rate limit error message."""
    match = re.search(r"try again in (\d+\.?\d*)s", error_str.lower())
    if match:
        return float(match.group(1))
    return None


async def _call_single_provider(
    provider: dict, kwargs: dict, retries: int = MAX_RETRIES
) -> dict:
    """Try a single provider with exponential backoff retry for rate limits."""
    call_kwargs = {**kwargs, "model": provider["model"]}
    if provider.get("api_key"):
        call_kwargs["api_key"] = provider["api_key"]
    if provider.get("api_base"):
        call_kwargs["api_base"] = provider["api_base"]

    last_error = None
    for attempt in range(retries):
        try:
            response = await litellm.acompletion(**call_kwargs)
            if attempt > 0:
                logger.info(f"[{provider['label']}] Succeeded on retry {attempt + 1}")
            return response
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            is_rate_limit = "429" in error_str or "rate" in error_str or "too many" in error_str
            # Daily limits won't reset soon — fail immediately, try next provider
            is_daily_limit = "per day" in error_str or "tpd" in error_str

            if is_daily_limit:
                logger.warning(f"[{provider['label']}] Daily limit hit — skipping to next provider")
                break
            elif is_rate_limit and attempt < retries - 1:
                suggested = _parse_retry_after(str(e))
                delay = suggested if suggested else RETRY_BASE_DELAY * (2 ** attempt)
                delay = min(delay, 45)  # Cap at 45s
                logger.warning(
                    f"[{provider['label']}] Rate limited (attempt {attempt + 1}/{retries}). "
                    f"Waiting {delay:.1f}s..."
                )
                await asyncio.sleep(delay)
                continue
            elif not is_rate_limit:
                break  # Non-rate-limit error — don't retry, try next provider

    raise last_error


async def call_llm(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0.2,
    max_tokens: int = 700,
    model: str | None = None,
) -> dict:
    """
    Call the LLM via LiteLLM with multi-provider rotation.

    Distributes calls across Groq, Cerebras, and OpenRouter in round-robin
    to avoid hitting any single provider's free tier rate limits.
    All providers serve the same Llama 3.3 70B model — identical output quality.

    If a specific model is requested (e.g., for agents needing a particular model),
    it will be used directly without rotation.
    """
    global _call_counter, PROVIDER_POOL

    # Build pool on first call (lazy init after settings are loaded)
    if not PROVIDER_POOL:
        PROVIDER_POOL = _build_provider_pool()
        logger.info(
            f"[LLM] Provider pool initialized: {[p['label'] for p in PROVIDER_POOL]}"
        )

    kwargs = {
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    # If a specific model is requested, use it directly (bypass rotation)
    if model:
        kwargs["model"] = model
        try:
            return await litellm.acompletion(**kwargs)
        except Exception:
            pass  # Fall through to rotation

    # Round-robin: try each provider starting from the next in rotation
    pool_size = len(PROVIDER_POOL)
    start_idx = _call_counter % pool_size
    _call_counter += 1

    errors = []
    for offset in range(pool_size):
        idx = (start_idx + offset) % pool_size
        provider = PROVIDER_POOL[idx]

        try:
            logger.debug(f"[LLM] Using {provider['label']} (slot {idx})")
            response = await _call_single_provider(provider, kwargs, retries=2)
            return response
        except Exception as e:
            errors.append((provider["label"], e))
            logger.warning(f"[LLM] {provider['label']} failed: {e}")
            # Small delay before trying next provider
            if offset < pool_size - 1:
                await asyncio.sleep(3)

    # All providers failed — do one final retry on the first provider with longer waits
    logger.error(
        f"[LLM] All {pool_size} providers failed. Final retry on {PROVIDER_POOL[0]['label']}..."
    )
    await asyncio.sleep(15)  # Let rate limits Cool down

    try:
        return await _call_single_provider(PROVIDER_POOL[0], kwargs, retries=3)
    except Exception as final_err:
        logger.error(f"[LLM] All providers exhausted. Last error: {final_err}")
        # Raise the first error for better debugging
        raise errors[0][1] if errors else final_err
