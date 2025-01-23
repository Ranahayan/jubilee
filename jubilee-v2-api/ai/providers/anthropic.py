from io import BytesIO
from typing import List
from django.conf import settings
from langchain_anthropic import ChatAnthropic
from ai.models import Model, ModelType, ModelProvider
from ai.providers.base import Message, ProviderInterface, CantHandleRequest, TextOptions, TTSOptions, TEXT_OPTIONS_FIELDS


ALLOWED_TEXT_PARAMS = [*TEXT_OPTIONS_FIELDS, 'top_k']

class AnthropicProvider(ProviderInterface):
    def __init__(self, repository=None):
        self.last_usage_cost = None
        self.last_model = None
        self.repository = repository

    def get_cost(self):
        if not self.last_usage_cost:
            raise Exception('get_cost method should be called after a generate method call')

        return self.last_usage_cost

    def get_model(self):
        if not self.last_model:
            raise Exception('get_model method should be called after a generate method call')

        return self.last_model

    def get_repository(self):
        return self.repository

    def text(self, input: List[Message], options: TextOptions):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.ANTHROPIC, model_type=ModelType.TEXT)

        return self._completions(model, input, options)

    def chat(self, input: List[Message], options: TextOptions):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.ANTHROPIC, model_type=ModelType.CHAT)

        return self._completions(model, input, options)

    def _completions(self, model, input, options):
        options = {**model.default_options, **options}
        options = {k: v for k, v in options.items() if k in ALLOWED_TEXT_PARAMS}
        json_output = options.pop('json_output', False)

        llm = ChatAnthropic(model=model.name, api_key=settings.ANTHROPIC_API_KEY, **options)

        if json_output:
            llm = llm.bind(response_format={"type": "json_object"})

        response = llm.invoke(input)

        self.last_model = model
        self.last_usage_cost = self._calculate_text_pricing(model, input_tokens=response.usage_metadata["input_tokens"],
                                                            output_tokens=response.usage_metadata["output_tokens"])

        return response.content

    def _calculate_text_pricing(self, model: Model, input_tokens: int, output_tokens: int) -> float:
        input_cost_per_1k_tokens = model.pricing.get('input_cost_per_1k_tokens')
        output_cost_per_1k_tokens = model.pricing.get('output_cost_per_1k_tokens')

        if not input_cost_per_1k_tokens and not output_cost_per_1k_tokens:
            raise ValueError(f"Model pricing not supported for text generation")

        total_price = (input_tokens / 1000) * input_cost_per_1k_tokens + (output_tokens / 1000) * output_cost_per_1k_tokens

        return total_price

    def text_to_speech(self, input: str, options: TTSOptions):
        raise CantHandleRequest("text_to_speech method is not yet supported for Anthropic provider")

    def speech_to_text(self, file: BytesIO, options: dict):
        raise CantHandleRequest("speech_to_text method is not yet supported for Anthropic provider")

    def video(self, input: str, options: dict):
        raise CantHandleRequest("video method is not yet supported for Anthropic provider")

    def vectorize(self, input: List[str], options: dict):
        raise CantHandleRequest("vectorize method is not yet supported for Anthropic provider")

    def image(self, input: str, options: dict) -> str:
        raise CantHandleRequest("image method is not yet supported for Anthropic provider")
