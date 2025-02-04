from pinecone import Pinecone
from django.conf import settings
from ai.repositories.base import RepositoryInterface

#TODO: maybe create a database model for repositories
class PineconeRepository(RepositoryInterface):
    def __init__(self, index=settings.PINECONE_INDEX_NAME):
        self.client = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index = self._initialize_index(index)

    def _initialize_index(self, index_name):
        try:
            if index_name not in self.client.list_indexes().names():
                self.client.create_index(
                    index_name,
                    dimension=self.get_dimension(),
                )

            return self.client.Index(index_name)
        except Exception as e:
            return None

    def _get_default_options(self):
        return {
            "top_k": 8,
            "include_metadata": True,
            "include_values": False
        }

    def get_dimension(self):
        return 768

    def search(self, namespace, vector, options: dict):
        default_options = self._get_default_options()
        default_options.update(options)

        result = self.index.query(namespace=namespace, vector=vector, **default_options)

        return result.to_dict()["matches"]
