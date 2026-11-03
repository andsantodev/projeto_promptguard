"""Thin OpenRouter client. Every model call goes through here."""

import httpx

from backend.config import settings


class ProviderError(Exception):
    """The provider failed in a way that is not a timeout."""


class ProviderTimeout(Exception):
    """The provider did not answer within the configured timeout."""


async def chat_completion(
    *,
    model: str,
    messages: list[dict[str, str]],
    response_format: dict[str, object] | None = None,
) -> str:
    payload: dict[str, object] = {"model": model, "messages": messages}

    if response_format is not None:
        payload["response_format"] = response_format

    try:
        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.TimeoutException as error:
        raise ProviderTimeout("O provedor de LLM não respondeu a tempo") from error
    except httpx.HTTPError as error:
        raise ProviderError("Falha de rede ao chamar o provedor de LLM") from error

    if response.status_code != 200:
        raise ProviderError(f"O provedor de LLM respondeu {response.status_code}")

    try:
        content = response.json()["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError) as error:
        raise ProviderError("Resposta do provedor em formato inesperado") from error

    # Some providers answer with a null content when a generation is blocked.
    # That is a valid (empty) answer from the target model, not a provider failure.
    if content is None:
        return ""

    if not isinstance(content, str):
        raise ProviderError("Resposta do provedor sem conteúdo textual")

    return content
