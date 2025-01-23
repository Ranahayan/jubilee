import tempfile
from io import BytesIO
from typing import List
from uuid import uuid4
from openai import OpenAI
from django.conf import settings
from langchain_openai import ChatOpenAI
from ai.repositories import PineconeRepository
from ai.models import Model, ModelType, ModelProvider
from ai.providers.base import TextOptions, Message, ProviderInterface, CantHandleRequest, TEXT_OPTIONS_FIELDS


ALLOWED_TEXT_PARAMS = [*TEXT_OPTIONS_FIELDS, 'frequency_penalty', 'presence_penalty']

class OpenAIProvider(ProviderInterface):
    def __init__(self, repository=None):
        self.open_ai = OpenAI(api_key=settings.OPEN_AI_KEY)
        self.last_usage_cost = None
        self.last_model = None
        if not repository and settings.PINECONE_API_KEY is not None:
            repository = PineconeRepository()
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

    def image(self, input: str, options: dict) -> str:
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.OPENAI, model_type=ModelType.IMAGE)

        options = {**model.default_options, **options}
        response = self.open_ai.images.generate(model=model.name, prompt=input, **options)

        self.last_usage_cost = self._calculate_image_pricing(model, options)
        self.last_model = model

        return response.data[0].url

    def text(self, input: List[Message], options: TextOptions):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.OPENAI, model_type=ModelType.TEXT)

        return self._completions(model, input, options)

    def chat(self, input: List[Message], options: TextOptions):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.OPENAI, model_type=ModelType.CHAT)

        return self._completions(model, input, options)

    def _completions(self, model, input, options):
        options = {**model.default_options, **options}
        options = {k: v for k, v in options.items() if k in ALLOWED_TEXT_PARAMS}
        json_output = options.pop('json_output', False)

        llm = ChatOpenAI(model=model.name, api_key=settings.OPEN_AI_KEY, **options)

        if json_output:
            llm = llm.bind(response_format={"type": "json_object"})

        response = llm.invoke(input)

        self.last_model = model
        self.last_usage_cost = self._calculate_text_pricing(model, input_tokens=response.usage_metadata["input_tokens"],
                                                            output_tokens=response.usage_metadata["output_tokens"])

        return response.content

    def text_to_speech(self, input: str, options: dict):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.OPENAI, model_type=ModelType.TTS)

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=True) as temp:
            options = {**model.default_options, **options}
            response = self.open_ai.audio.speech.create(model=model.name, input=input, **options)

            response.stream_to_file(temp.name)

            temp.seek(0)
            file_bytes = temp.read()

        self.last_model = model
        self.last_usage_cost = self._calculate_tts_pricing(model, len(input))

        audio_file = BytesIO(file_bytes)
        audio_file.name = f"{uuid4()}.mp3"

        return audio_file

    def speech_to_text(self, file: BytesIO, options: dict):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.OPENAI, model_type=ModelType.STT)

        options = {**model.default_options, **options}

        transcription = self.open_ai.audio.transcriptions.create(model=model.name, response_format="verbose_json", file=file, **options)

        self.last_model = model

        self.last_usage_cost = self._calculate_stt_pricing(model, transcription.duration)

        return {'text': transcription.text, "duration": transcription.duration, "segments": transcription.segments}

    def video(self, input: str, options: dict):
        raise CantHandleRequest("video method is not yet supported for OpenAI provider")

    def vectorize(self, input: List[str], options: dict):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.OPENAI, model_type=ModelType.EMBEDDINGS)
        dimension_limit = self.repository.get_dimension()
        options = {**model.default_options, **options, 'dimensions': dimension_limit}

        response = self.open_ai.embeddings.create(input=input, model=model.name, **options)

        self.last_model = model
        self.last_usage_cost = self._calculate_embeddings_pricing(model, response.usage.total_tokens)

        embeds = [embedding.embedding for embedding in response.data]

        return embeds

    def _calculate_image_pricing(self, model: Model, options: dict) -> float:
        quantity = options.get("n", 1)
        resolution = options.get("size", "1024x1024")
        quality = options.get("quality", None)

        resolution_key = f"{resolution.lower()}_{quality}" if quality else resolution.lower()

        if resolution_key not in model.pricing:
            raise ValueError(f"Unsupported resolution: {resolution}")

        price_per_image = model.pricing[resolution_key]
        total_price = price_per_image * quantity

        return total_price

    def _calculate_text_pricing(self, model: Model, input_tokens: int, output_tokens: int) -> float:
        input_cost_per_1k_tokens = model.pricing.get('input_cost_per_1k_tokens')
        output_cost_per_1k_tokens = model.pricing.get('output_cost_per_1k_tokens')

        if not input_cost_per_1k_tokens and not output_cost_per_1k_tokens:
            raise ValueError(f"Model pricing not supported for text generation")

        total_price = (input_tokens / 1000) * input_cost_per_1k_tokens + (output_tokens / 1000) * output_cost_per_1k_tokens

        return total_price

    def _calculate_tts_pricing(self, model: Model, input_size: int) -> float:
        cost_per_1k_characters = model.pricing.get('cost_per_1k_characters')

        if not cost_per_1k_characters:
            raise ValueError(f"Model pricing not supported for tts generation")

        total_price = (input_size / 1000) * cost_per_1k_characters

        return total_price

    def _calculate_stt_pricing(self, model: Model, seconds: int) -> float:
        cost_per_minute = model.pricing.get('cost_per_minute')

        if not cost_per_minute:
            raise ValueError(f"Model pricing not supported for stt generation")

        total_price = (seconds / 60) * cost_per_minute

        return total_price

    def _calculate_embeddings_pricing(self, model: Model, tokens: int) -> float:
        cost_per_1k_tokens = model.pricing.get('cost_per_1k_tokens')

        if not cost_per_1k_tokens:
            raise ValueError(f"Model pricing not supported for embeddings generation")

        total_price = (tokens / 1000) * cost_per_1k_tokens

        return total_price