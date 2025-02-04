from abc import ABC, abstractmethod


class RepositoryInterface(ABC):
    @abstractmethod
    def get_dimension(self) -> int:
        pass

    @abstractmethod
    def search(self, embedding, options: dict):
        pass
