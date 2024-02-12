import requests
import json
from django.conf import settings


def send_notification(user: str, message_type: str, variables: dict):
    url = "https://notification.spocket.co/slack"
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': settings.NOTIFICATION_API_KEY,
    }
    data = {
        'user': user,
        'message_type': message_type,
        'variables': variables,
    }
    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code != 200:
        raise f"Failed to send notification: {response.content}"
