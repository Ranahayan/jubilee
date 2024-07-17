from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from file.models import File
from authentication.models import Shop
from dropshipping.models import DropshipSettings
import requests
from file.services import upload_file
import uuid
from django.conf import settings
import os
import re
from cairosvg import svg2png
from rembg import remove as remove_bg
from django.db.models import Q

def is_valid_hex_color(color):
    match = re.search("^#(?:[0-9a-fA-F]{3}){1,2}$", color)
    return bool(match)

def create_thumbnail(image_content, thumbnail_size=(128, 128), quality=85):
    """
      Creates a thumbnail of an image from its bytes content.
      :param image_content: Image content as bytes.
      :param thumbnail_size: Desired size of the thumbnail as a tuple (width, height).
      :return: Thumbnail as a blob (bytes) ready to be used.
    """
    if isinstance(image_content, bytes):
        image = Image.open(BytesIO(image_content))
    elif isinstance(image_content, Image.Image):
        image = image_content
    else:
        raise ValueError("Unsupported image format")

    # Keeping the image in PNG format to preserve transparency with RGBA mode
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    image.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)

    output_io = BytesIO()
    image.save(output_io, format='PNG', quality=quality)
    output_io.seek(0)

    return output_io.getvalue()

def optimize_image(image_content, max_width=1920, max_height=1080, quality=85):
    """
      Reduces size and optimizes the image for a smaller file size while maintaining a balance in quality.
      :param image_content: Image content as bytes.
      :param max_width: Maximum desired width for the optimized image.
      :param max_height: Maximum desired height for the optimized image.
      :param quality: Quality of the optimized image (affects file size).
      :return: Optimized image as a blob (bytes), in PNG format with RGBA mode.
    """
    if isinstance(image_content, bytes):
        image = Image.open(BytesIO(image_content))
    elif isinstance(image_content, Image.Image):
        image = image_content
    else:
        raise ValueError("Unsupported image format")
    
    # Resize the image while maintaining aspect ratio
    original_width, original_height = image.size
    ratio = min(max_width / original_width, max_height / original_height)
    new_size = (int(original_width * ratio), int(original_height * ratio))
    image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    output_io = BytesIO()
    # Keeping the image in PNG format to preserve transparency with RGBA mode
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    image.save(output_io, format='PNG', quality=quality, optimize=True)
    output_io.seek(0)
    
    return output_io.getvalue()

def download_image(url):
    """
      Downloads an image from a given URL and returns its content as bytes.
      :param url: URL of the image to download.
      :return: Image content as bytes.
    """
    response = requests.get(url)
    response.raise_for_status()
    content_type = response.headers['Content-Type']

    if content_type == 'image/svg+xml':
        png_content = svg2png(bytestring=response.content)
        return Image.open(BytesIO(png_content))
    else:
        return Image.open(BytesIO(response.content))

def resize_image_contain(image, desired_width, desired_height):
    if desired_width == 0 or desired_height == 0:
        raise ValueError("Invalid dimensions for resizing the image")

    desired_width = int(desired_width)
    desired_height = int(desired_height)

    original_width, original_height = image.size
    text_aspect_ratio = original_width / original_height
    desired_aspect_ratio = desired_width / desired_height

    if text_aspect_ratio > desired_aspect_ratio:
        new_width = desired_width
        new_height = int(desired_width / text_aspect_ratio)
    else:
        new_height = desired_height
        new_width = int(desired_height * text_aspect_ratio)

    resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    final_image_with_desired_dimensions = Image.new('RGBA', (desired_width, desired_height), (0, 0, 0, 0))

    x_position = (desired_width - new_width) // 2
    y_position = (desired_height - new_height) // 2

    final_image_with_desired_dimensions.paste(resized_image, (x_position, y_position))
    return final_image_with_desired_dimensions

def get_font_address(font_family):
    fonts = {
        "Roboto": "roboto.ttf",
        "Montserrat": "montserrat.ttf",
        "Lato": "lato.ttf",
        "Oswald": "oswald.ttf",
        "Nunito": "nunito.ttf",
        "Merriweather": "merriweather.ttf",
        "Pacifico": "pacifico.ttf",
        "Raleway": "raleway.ttf",
        "Open Sans": "open-sans.ttf",
        "Sniglet": "sniglet.ttf",
        "Cabin": "cabin.ttf",
        "Abril Fatface": "abril-fatface.ttf",
        "Special Elite": "special-elite.ttf",
        "Six Caps": "six-caps.ttf",
        "Josefin Slab": "josefin-slab.ttf",
        "Homemade Apple": "homemade-apple.ttf",
        "Playfair Display": "playfair-display.ttf",
        "Permanent Marker": "permanent-marker.ttf",
        "Roboto Condensed": "roboto-condensed.ttf",
        "Safira March": "safira-march.otf",
    }

    font_name = fonts.get(font_family, "roboto.ttf")
    return os.path.join(settings.BASE_DIR, 'dropshipping', 'fonts', font_name)

def generate_text_image(text, font_color, font_family):
    if text is None or text == "":
        return None

    font_path = get_font_address(font_family)
    font_size = 60
    font = ImageFont.truetype(font_path, font_size)

    temp_image = Image.new('RGB', (1, 1))
    draw = ImageDraw.Draw(temp_image)
    _, _, text_width, text_height = draw.textbbox((0, 0), text=text, font=font)

    final_image = Image.new('RGBA', (text_width, text_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(final_image)
    draw.text((0, 0), text, fill=font_color, font=font)

    return final_image

def calculate_pivot(x, y, width, height):
    pivot_x = x + width / 2
    pivot_y = y + height / 2
    return pivot_x, pivot_y

def generate_branded_image(user, image_file, brand_settings, bg_color=None, is_render_logo=False, scale_factor=2, is_transparent=False):
    try:
        shop = Shop.objects.get_by_user_id(user.id)
        dropship_settings = DropshipSettings.objects.filter(
            Q(shop=shop) | Q(user=user)
        ).first()
    except Shop.DoesNotExist:
        dropship_settings = DropshipSettings.objects.filter(user=user).first()

    if dropship_settings is None:
        return None

    logo = dropship_settings.brand_logo
    font_family = dropship_settings.font_family

    if bg_color is None:
        product_background_color = dropship_settings.products_background_color
        if product_background_color is None or not is_valid_hex_color(product_background_color):
            bg_color = '#EEF2F6'
        else:
            bg_color = product_background_color

    # Convert the color to a hex string if it is not
    if isinstance(bg_color, str):
        if not bg_color.startswith('#'):
            bg_color = f'#{bg_color}'

    # Change the scale factor
    canvas_size = (555 * scale_factor, 555 * scale_factor)
    brand_settings_x = brand_settings.x * scale_factor
    brand_settings_y = brand_settings.y * scale_factor
    brand_settings_width = brand_settings.width * scale_factor
    brand_settings_height = brand_settings.height * scale_factor

    bg_img_file = File.objects.get(pk=image_file.id)
    bg_img = download_image(bg_img_file.url)
    bg_img = bg_img.convert('RGBA')
    bg_img = resize_image_contain(bg_img, canvas_size[0], canvas_size[1])
    brand_image = None

    try:
        if is_render_logo:
            if logo is not None:
                logo = File.objects.get(pk=logo.id)
                logo = download_image(logo.url)
                logo = logo.convert('RGBA')
                brand_image = resize_image_contain(logo, brand_settings_width, brand_settings_height)
            else:
                brand_image = None
        else:
            font_image = generate_text_image(dropship_settings.brand_name, brand_settings.text_color, font_family)
            if font_image is not None and font_image.size[0] > 0:
                brand_image = resize_image_contain(font_image, brand_settings_width, brand_settings_height)
            else:
                brand_image = None
    except Exception:
        brand_image = None

    # Create a new image with the background color
    if is_transparent:
        bg_color = (255, 255, 255, 0)

    image = Image.new('RGBA', bg_img.size, bg_color)
    image.paste(bg_img, (0, 0), bg_img)

    if brand_image is not None:
        # Get the pivot point for the brand
        pivot_x, pivot_y = calculate_pivot(brand_settings_x, brand_settings_y, brand_settings_width, brand_settings_height)

        rotation = brand_settings.rotation
        rotation = rotation * -1
        rotated_brand_image = brand_image.rotate(rotation, expand=1, resample=Image.Resampling.BICUBIC)

        brand_x = pivot_x - (rotated_brand_image.width / 2)
        brand_y = pivot_y - (rotated_brand_image.height / 2)

        image.paste(rotated_brand_image, (int(brand_x), int(brand_y)), rotated_brand_image)

    image_final = BytesIO()
    image.save(image_final, format='PNG')
    image_final.seek(0)

    file_name = f'branded_image_{uuid.uuid4()}.png'
    file = upload_file(file_obj=image_final.getvalue(), file_name=file_name, user=None)
    return file


def remove_image_background(image_content):
    """
        Removes the background from an image.
    """
    is_byte = isinstance(image_content, bytes)
    is_img = isinstance(image_content, Image.Image)

    if is_byte:
        image = Image.open(BytesIO(image_content))
    elif is_img:
        image = image_content
    else:
        raise ValueError("Unsupported image format")
    
    img_without_bg = remove_bg(image)

    if is_byte:
        output_io = BytesIO()
        img_without_bg.save(output_io, format='PNG')
        output_io.seek(0)
        return output_io.getvalue()
    else:
        return img_without_bg
