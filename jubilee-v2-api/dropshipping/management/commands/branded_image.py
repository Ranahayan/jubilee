from django.core.management.base import BaseCommand, CommandError
from dropshipping.image_utils import generate_branded_image
from authentication.models import CustomUser
from dropshipping.models import ProductVariant, BrandType

class Command(BaseCommand):
  help = 'Generates a branded image for a given user and variant'

  def add_arguments(self, parser):
    parser.add_argument('user_id', type=int, help='The ID of the user')
    parser.add_argument('variant_id', type=int, help='The ID of the variant')

  def handle(self, *args, **options):
    user_id = options['user_id']
    variant_id = options['variant_id']

    user = CustomUser.objects.get(pk=user_id)
    variant = ProductVariant.objects.get(pk=variant_id)

    if variant.image is None:
      raise CommandError('Variant does not have an image')
    
    self.stdout.write(self.style.WARNING('Generating branded image for user ID "%s" and variant ID "%s"' % (user.name, variant.get_composed_title())))
    is_render_logo = variant.product.branding_type == BrandType.BRAND_LOGO
    self.stdout.write(self.style.WARNING('Rendering logo: %s' % is_render_logo))
    image = generate_branded_image(user, variant.image, variant.brand_settings, "#ba82e8", is_render_logo, scale_factor=3)
    thumbnail = generate_branded_image(user, variant.image, variant.brand_settings, "#ba82e8", is_render_logo, scale_factor=1, is_transparent=True)

    self.stdout.write(self.style.SUCCESS(image.url))
    self.stdout.write(self.style.SUCCESS(thumbnail.url))

    self.stdout.write(self.style.SUCCESS('Successfully generated image for user ID "%s" and variant ID "%s"' % (user_id, variant_id)))
