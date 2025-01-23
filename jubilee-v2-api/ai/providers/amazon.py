import boto3
from io import BytesIO
from typing import List
from uuid import uuid4
from contextlib import closing
from django.conf import settings
from ai.models import Model, ModelType, ModelProvider
from ai.providers.base import ProviderInterface, CantHandleRequest


class AmazonProvider(ProviderInterface):
    def __init__(self, repository=None):
        self.polly = boto3.client(
            service_name="polly",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME,
        )
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

    def text_to_speech(self, input: str, options: dict):
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.AWS, model_type=ModelType.TTS)

        opts = { **model.default_options, **options}

        response = self.polly.synthesize_speech(Text=input, Engine=model.name, OutputFormat="mp3", VoiceId=opts["voice"])

        audio_file = BytesIO()

        with closing(response["AudioStream"]) as stream:
            audio_file.write(stream.read())

        self.last_model = model
        self.last_usage_cost = self._calculate_tts_pricing(model, len(input))

        audio_file.seek(0)
        audio_file.name = f"{uuid4()}.mp3"

        return audio_file

    def _calculate_tts_pricing(self, model: Model, input_size: int) -> float:
        cost_per_1k_characters = model.pricing.get('cost_per_1k_characters')

        if not cost_per_1k_characters:
            raise ValueError(f"Model pricing not supported for tts generation")

        total_price = (input_size / 1000) * cost_per_1k_characters

        return total_price

    def speech_to_text(self, file: BytesIO, options: dict):
        raise CantHandleRequest("speech_to_text method is not yet supported for ElevenLabs provider")

    def video(self, input: str, options: dict):
        raise CantHandleRequest("video method is not yet supported for ElevenLabs provider")

    def vectorize(self, input: List[str], options: dict):
        raise CantHandleRequest("vectorize method is not yet supported for ElevenLabs provider")

    def image(self, input: str, options: dict) -> str:
        raise CantHandleRequest("image method is not yet supported for ElevenLabs provider")

    def text(self, input: dict, options: dict):
        raise CantHandleRequest("text method is not yet supported for ElevenLabs provider")

    def chat(self, input: dict, options: dict):
        raise CantHandleRequest("chat method is not yet supported for ElevenLabs provider")
