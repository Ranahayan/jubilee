from abc import ABC, abstractmethod
from io import BytesIO
from typing import List, Tuple, Literal, TypedDict, Dict, Any


class CantHandleRequest(Exception):
    pass

Message = Tuple[Literal["human", "system"], str]

class TextOptions(TypedDict, total=False):
    temperature: float
    max_tokens: int
    max_retries: int
    json_output: bool
    top_p: float

TEXT_OPTIONS_FIELDS = list(TextOptions.__annotations__.keys())

class TTSOptions(TypedDict, total=False):
    voice: str

class ProviderInterface(ABC):
    @abstractmethod
    def get_cost(self):
        pass

    @abstractmethod
    def get_model(self):
        pass

    @abstractmethod
    def get_repository(self):
        pass

    @abstractmethod
    def image(self, input: str, options: dict):
        pass

    @abstractmethod
    def video(self, input: str, options: dict):
        pass

    @abstractmethod
    def vectorize(self, input: List[str], options: dict):
        pass

    @abstractmethod
    def text(self, input: List[Message], options: TextOptions):
        pass

    @abstractmethod
    def chat(self, input: List[Message], options: TextOptions):
        pass

    @abstractmethod
    def text_to_speech(self, input: str, options: TTSOptions):
        pass

    @abstractmethod
    def speech_to_text(self, input: BytesIO, options: dict):
        pass
