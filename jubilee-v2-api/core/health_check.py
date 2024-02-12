from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@api_view(('GET',))
def health_check(request):
    return Response(status=200)