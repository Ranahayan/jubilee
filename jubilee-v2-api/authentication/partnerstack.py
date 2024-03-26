import requests
from django.conf import settings


def send_conversion_request(xid, user_id, email, name, sub_ids):
    if not settings.PARTNERSTACK_SECRET_KEY:
        return
    url = 'https://partnerlinks.io/conversion/xid'
    headers = {
        'Authorization': f'Bearer {settings.PARTNERSTACK_SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    data = {
        "customer_key": settings.APP_NAME + "_" + user_id,
        "xid": xid,
        "email": email,
        "name": name,
        "sub_ids": sub_ids
    }

    response = requests.post(url, headers=headers, json=data)

    return response.json()