import os.path
import requests
from urllib.parse import urlparse
from django.core.files import File as DjangoFile
from django.core.files.temp import NamedTemporaryFile
from file.models import File
from file.services import FileDirectUploadService


def extract_file_info(image_url):
    
    path = urlparse(image_url).path

    file_name = os.path.basename(path)
    file_base_name, file_extension = os.path.splitext(file_name)

    return {
        'file_name': file_name,
        'file_base_name': file_base_name,
        'file_extension': file_extension[1:],
    }


def create_file_from_url(url):
    img_info = extract_file_info(url)
    response = requests.get(url, stream=True)
    response.raise_for_status()

    # Create a temporary file to store the downloaded file
    with NamedTemporaryFile() as temp_file:
        for chunk in response.iter_content(chunk_size=8192):
            temp_file.write(chunk)

        temp_file.flush()

        django_file = DjangoFile(temp_file, name=img_info['file_base_name'])

        service = FileDirectUploadService(user=None)
        file_data = service.start(file_name=img_info['file_base_name'], file_type=img_info['file_extension'])

        file = File.objects.get(id=file_data.get('id'))

        service.upload_local(file=file, file_obj=django_file)

    return file
