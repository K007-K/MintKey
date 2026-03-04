# Agentic loop — reason → tool call → observe → repeat (max 3 iterations)
import logging
import json
from typing import Optional
from agents.core.litellm_client import call_llm

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 3


async def run_agent_loop(
    system_prompt: str,
    user_message: str,
    tools: Optional[list[dict]] = None,
    tool_executor=None,
    temperature: float = 0.2,
    max_tokens: int = 2000,
    agent_name: str = "agent",
) -> str:
    """
    Core agentic loop using LiteLLM (OpenAI-compatible format).

    Pattern:
    1. Send system prompt + user message to LLM
    2. If finish_reason == "stop" → done, return message.content
    3. If finish_reason == "tool_calls" → execute tools, append results, loop
    4. Max 3 iterations to control cost

    Args:
        system_prompt: Agent's role/instructions
        user_message: The data to analyze
        tools: OpenAI-style tool definitions [{type: "function", function: {...}}]
        tool_executor: async function(tool_name, args) → result string
        temperature: LLM temperature
        max_tokens: Max tokens per response
        agent_name: For logging

    Returns:
        Final text response from the agent
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    for iteration in range(MAX_ITERATIONS):
        logger.info(f"[{agent_name}] Iteration {iteration + 1}/{MAX_ITERATIONS}")

        try:
            response = await call_llm(
                messages=messages,
                tools=tools,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except Exception as e:
            logger.error(f"[{agent_name}] LLM call failed: {e}")
            return json.dumps({"error": f"LLM call failed: {str(e)}"})

        choice = response.choices[0]
        message = choice.message
        finish_reason = choice.finish_reason

        logger.info(f"[{agent_name}] finish_reason={finish_reason}")

        # Case 1: Agent is done — return the content
        if finish_reason == "stop" or finish_reason is None:
            content = message.content or ""
            logger.info(f"[{agent_name}] Done after {iteration + 1} iteration(s)")
            return content

        # Case 2: Agent wants to call tools
        if finish_reason == "tool_calls" and message.tool_calls:
            # Append the assistant message with tool_calls
            messages.append({
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in message.tool_calls
                ],
            })

            # Execute each tool call
            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                try:
                    tool_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    tool_args = {}

                logger.info(f"[{agent_name}] Tool call: {tool_name}({list(tool_args.keys())})")

                # Execute through tool_executor
                if tool_executor:
                    try:
                        result = await tool_executor(tool_name, tool_args)
                    except Exception as e:
                        result = json.dumps({"error": f"Tool execution failed: {str(e)}"})
                        logger.error(f"[{agent_name}] Tool {tool_name} failed: {e}")
                else:
                    result = json.dumps({"error": f"No tool executor for {tool_name}"})

                # Append tool result
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result if isinstance(result, str) else json.dumps(result),
                })

            continue  # Loop back for next LLM call

        # Unexpected finish_reason
        logger.warning(f"[{agent_name}] Unexpected finish: {finish_reason}")
        return message.content or json.dumps({"error": "Unexpected response"})

    # Exhausted iterations
    logger.warning(f"[{agent_name}] Max iterations ({MAX_ITERATIONS}) reached")
    # Return whatever we have from the last message
    if messages and messages[-1].get("role") == "tool":
        return json.dumps({"warning": "Agent exhausted iterations", "partial": True})

    return messages[-1].get("content", "") if messages else ""
