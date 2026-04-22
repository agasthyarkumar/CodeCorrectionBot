from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, mode: str) -> str:
        ...
