from io import BytesIO
from typing import List
from uuid import uuid4
from django.conf import settings
from elevenlabs import VoiceSettings
from elevenlabs.client import ElevenLabs
from ai.models import Model, ModelType, ModelProvider
from ai.providers.base import ProviderInterface, CantHandleRequest


class ElevenLabsProvider(ProviderInterface):
    def __init__(self, repository=None):
        self.client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
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
        model = Model.get_latest_by_type_and_provider(provider=ModelProvider.ELEVENLABS, model_type=ModelType.TTS)

        opts = { **model.default_options, **options}

        response = self.client.text_to_speech.convert(
            voice_id=opts["voice"],
            optimize_streaming_latency="0",
            output_format="mp3_22050_32",
            text=input,
            model_id=model.name,
            voice_settings=VoiceSettings(
                stability=0.0,
                similarity_boost=1.0,
                style=0.0,
                use_speaker_boost=True,
            ),
        )

        self.last_model = model
        self.last_usage_cost = self._calculate_tts_pricing(model, len(input))

        audio_file = BytesIO()

        for chunk in response:
            if chunk:
                audio_file.write(chunk)

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
