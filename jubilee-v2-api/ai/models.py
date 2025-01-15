from django.db import models
from file.models import File


class ModelType(models.TextChoices):
    CHAT = 'chat', "chat"
    TEXT = 'text', "text"
    IMAGE = 'image', "image"
    VIDEO = 'video', "video"
    TTS = 'tts', "tts"
    STT = 'stt', "stt"
    EMBEDDINGS = 'embeddings', "embeddings"


class ModelProvider(models.TextChoices):
    OPENAI = 'openai', "openai"
    AWS = 'aws', "aws"
    ELEVENLABS = 'elevenlabs', "elevenlabs"
    ANTHROPIC = 'anthropic', "anthropic"


class Model(models.Model):
    model_type = models.CharField(max_length=255, choices=ModelType.choices)
    provider = models.CharField(max_length=255, choices=ModelProvider.choices)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    default_options = models.JSONField(default=dict)
    pricing = models.JSONField(default=dict)

    @classmethod
    def get_latest_by_type_and_provider(cls, model_type, provider):
        return cls.objects.filter(model_type=model_type, is_active=True, provider=provider).order_by('-created_at').first()


class Generation(models.Model):
    model = models.ForeignKey(Model, null=True, blank=True, related_name="generations", on_delete=models.SET_NULL)
    input_file = models.ForeignKey(File, null=True, blank=True, related_name="+", on_delete=models.SET_NULL)
    output_file = models.ForeignKey(File, null=True, blank=True, related_name="+", on_delete=models.SET_NULL)
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict)
    options = models.JSONField(null=True, blank=True)
    external_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cost = models.DecimalField(decimal_places=4, max_digits=10, null=True, blank=True)
