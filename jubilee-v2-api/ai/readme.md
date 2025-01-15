# AI Manager Django App

This Django app abstracts AI-related APIs from various providers, such as OpenAI, into a unified service. The application supports different AI functionalities, including text generation, chat, image generation, text-to-speech, speech-to-text, and vector operations, with the ability to store embeddings using repositories like Pinecone.

## Features

- **Unified AI Service**: Integrates multiple AI providers under a single service interface.
- **Provider Management**: Dynamically manages different AI providers to handle requests.
- **Embeddings Storage**: Supports storing and searching embeddings using repositories.
- **Persistence**: Optionally persists generated content like images and audio files.


## Usage

### AIManager Class

The `AIManager` class is the main interface for interacting with different AI providers.

#### Initialization

By default, `AIManager` uses `OpenAIProvider`. You can specify additional providers if needed.

```python
from ai.manager import AIManager

ai_manager = AIManager()
```

### Aditional providers

You can add more providers and also they will work as a fallback

```python
from ai.manager import AIManager
from ai.providers import OpenAIProvider, AnthropicProvider

openai = OpenAIProvider()
anthropic = AnthropicProvider()

ai_manager = AIManager(providers=[openai, anthropic])
```

### Embeddings repositories

You can change the default store repository for embeddings which is Pinecone

```python
from ai.manager import AIManager
from ai.providers import OpenAIProvider
from ai.repositories import OtherRepository

other_repo = OtherRepository()
openai = OpenAIProvider(repository=other_repo)

ai_manager = AIManager(providers=[openai])
```

#### Text Generation

Generate text based on input messages.

```python
input_messages = [("Human", "Hello, how are you?")]
response = ai_manager.text(input=input_messages)
print(response.content)
```

#### Chat

Engage in a chat conversation.

```python
chat_messages = [("Human", "Tell me a joke.")]
response = ai_manager.chat(input=chat_messages)
print(response.content)
```

#### Image Generation

Generate an image based on input text.

```python
image_url = ai_manager.image(input='A beautiful sunset over the mountains')
print(image_url)
```

#### Text-to-Speech

Convert text to speech and optionally persist the audio file.

```python
audio_url = ai_manager.text_to_speech(input='Hello, this is a test.')
print(audio_url)
```

#### Speech-to-Text

Convert speech from an audio file to text.

```python
with open('path_to_audio_file', 'rb') as f:
    file = BytesIO(f.read())

transcript = ai_manager.speech_to_text(file=file)
print(transcript)
```

#### Vectorization

Vectorize a list of texts for embedding storage.

```python
texts = ['Hello world', 'How are you?']
vectors = ai_manager.vectorize(input=texts)
print(vectors)
```

#### Vector Search

Search for similar vectors in a repository.

```python
namespace = 'example_namespace'
query_vector = [0.1, 0.2, 0.3] # Example vector
results = ai_manager.vector_search(namespace=namespace, vector=query_vector)
print(results)
```

## Extending AI Providers

To add a new AI provider create a new provider class that inherits from `ProviderInterface` and implement the required methods.

## Extending Embeddings Repositories

To add a new repository create a new repository class that inherits from `RepositoryInterface` and implement the required methods.

