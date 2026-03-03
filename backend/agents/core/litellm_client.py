# Shared LiteLLM client singleton — replaces anthropic_client.py
import logging
import litellm
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure LiteLLM
litellm.drop_params = True  # Drop unsupported params instead of erroring


async def call_llm(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1000,
    model: str | None = None,
) -> dict:
    """
    Call the LLM via LiteLLM. Uses Groq by default, falls back to Ollama.

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

    try:
        response = await litellm.acompletion(**kwargs)
        return response
    except Exception as e:
        logger.warning(f"Primary LLM ({target_model}) failed: {e}. Trying fallback...")
        # Fallback to Ollama local model
        kwargs["model"] = f"ollama/{settings.OLLAMA_BASE_URL.rstrip('/')}/qwen2.5-coder:32b"
        try:
            kwargs["model"] = "ollama/qwen2.5-coder:32b"
            response = await litellm.acompletion(**kwargs)
            return response
        except Exception as fallback_err:
            logger.error(f"Fallback LLM also failed: {fallback_err}")
            raise
