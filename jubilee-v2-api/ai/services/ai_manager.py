from io import BytesIO
from typing import List
from ai.models import Generation
from file.services import upload_file
from ai.utils import create_file_from_url
from ai.providers.openai import OpenAIProvider
from ai.providers.base import CantHandleRequest, TextOptions, Message, TTSOptions
from langchain_core.load.serializable import Serializable


class AIManager:
    def __init__(self, providers=None):
        self.providers = providers if providers else [OpenAIProvider()]
        self.last_generation = None

    def _try_provider_call(self, method: str, **args):
        provider = None
        for provider in self.providers:
            try:
                found_method = getattr(provider, method, None)
                if found_method:
                    provider=provider
                    response = found_method(**args)
                    break
            except CantHandleRequest as e:
                continue

        if not response or not provider:
            raise CantHandleRequest('No provider could handle the request')

        return response, provider

    def _serialize_input(self, input):
        if isinstance(input, list):
            return [self._serialize_input(i) for i in input]

        if isinstance(input, Serializable):
            return input.to_json()

        return input

    def text(self, input: List[Message], options: TextOptions = {}) -> Message:
        response, provider = self._try_provider_call(method='text', input=input, options=options)

        gen = Generation.objects.create(model=provider.get_model(),
                                        input_data=self._serialize_input(input),
                                        output_data=response,
                                        cost=provider.get_cost())

        self.last_generation = gen

        return response

    def chat(self, input: List[Message], options: TextOptions = {}) -> Message:
        response, provider = self._try_provider_call(method='chat', input=input, options=options)

        gen = Generation.objects.create(model=provider.get_model(),
                                        input_data=self._serialize_input(input),
                                        output_data=response,
                                        cost=provider.get_cost())

        self.last_generation = gen

        return response

    def image(self, input: str, persist=True, options={}):
        response, provider = self._try_provider_call(method='image', input=input, options=options)

        file = None
        if persist:
            file = create_file_from_url(response)

        gen = Generation.objects.create(model=provider.get_model(), input_data=input,
                                        output_file=file, cost=provider.get_cost())

        self.last_generation = gen

        return file.url if file else response

    def video(self, input: str, persist=True, options={}):
        raise NotImplementedError("video generation is not implemented yet")

    def text_to_speech(self, input: str, persist=True, options: TTSOptions = {}):
        response, provider = self._try_provider_call(method='text_to_speech', input=input, options=options)

        file = None
        if persist:
            file = upload_file(response.getvalue(), response.name, None)

        gen = Generation.objects.create(model=provider.get_model(), input_data=input,
                                        output_file=file, cost=provider.get_cost())

        self.last_generation = gen

        return file.url if file else response

    def speech_to_text(self, file: BytesIO, options={}):
        response, provider = self._try_provider_call(method='speech_to_text', file=file, options=options)

        gen = Generation.objects.create(model=provider.get_model(), output_data=response,
                                        cost=provider.get_cost())

        self.last_generation = gen

        return response

    def vectorize(self, input: List[str], options={}):
        response, provider = self._try_provider_call(method='vectorize', input=input, options=options)

        gen = Generation.objects.create(model=provider.get_model(), input_data=input,
                                        output_data=response, cost=provider.get_cost())

        self.last_generation = gen

        return response

    def vector_search(self, namespace, vector, options={}):
        for provider in self.providers:
            try:
                repository = provider.get_repository()
                response = repository.search(namespace, vector, options)
                break
            except Exception as e:
                continue

        return response

    def get_generation(self):
        if not self.last_generation:
            raise Exception('get_generation method should be called after a generate method call')

        return self.last_generation
