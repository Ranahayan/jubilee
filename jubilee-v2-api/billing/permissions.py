from django.utils import timezone
from rest_framework.permissions import BasePermission
import json
from cryptography.fernet import Fernet
import base64


secret_key = '4iyfxMehFRxM1qfZvZDnVFkkXngsjxYLKXws77RRzGc='
fernet = Fernet(secret_key)

def encrypt_token(data):
    """
    Encrypts the data using Fernet symmetric encryption
    """
    for key, value in data.items():
        if isinstance(value, timezone.datetime):
            data[key] = value.isoformat()

    data_str = json.dumps(data)
    encrypted_data = fernet.encrypt(data_str.encode())
    return encrypted_data.decode('utf-8')

def decrypt_token(encrypted_data):
    """
    Decrypts the data using Fernet symmetric encryption
    """
    decrypted_data = fernet.decrypt(encrypted_data.encode()).decode()
    data_dict = json.loads(decrypted_data)

    if 'expire_at' in data_dict:
        data_dict['expire_at'] = timezone.datetime.fromisoformat(data_dict['expire_at'])
    
    return data_dict

def is_valid_token(token):
    """
    Checks if the token is valid
    """
    try:
        data = decrypt_token(token)
        if data['expire_at'] < timezone.now():
            return False
        return True
    except Exception:
        return False
    
def create_token(data=None):
    """
    Creates a token with an expiration time
    """
    if data is None:
        data = {}
    data['expire_at'] = timezone.now() + timezone.timedelta(minutes=1)
    return encrypt_token(data)

class AllowOnlyServerPeerToPeer(BasePermission):
    def has_permission(self, request, view):
        token = request.headers.get('Authorization')
        return is_valid_token(token)
