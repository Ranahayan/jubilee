import json
import hashlib
from functools import wraps
from rest_framework import status
from django.core.cache import cache
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


def cache_json_response(expire=60, cache_keys=None):
    """
    Decorator to cache responses based on query parameters if the response is JSON.
    
    :param expire: Cache expiration time in seconds.
    :param cache_keys: List of query parameters to use for the cache key.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            query_params = request.query_params.dict()
            if cache_keys:
                filtered_params = {k: query_params[k] for k in cache_keys if k in query_params}
            else:
                filtered_params = query_params

            cache_key = f"{self.__class__.__name__}:{func.__name__}:{hashlib.md5(json.dumps(filtered_params, sort_keys=True).encode()).hexdigest()}"
            cached_response = cache.get(cache_key)
            if cached_response:
                return Response(json.loads(cached_response), status=status.HTTP_200_OK)

            response = func(self, request, *args, **kwargs)

            try:
                cache.set(cache_key, json.dumps(response.data), expire)
                return response
            except (ValueError, TypeError) as e:
                logger.error(e)
                return response
        
        return wrapper
    return decorator
