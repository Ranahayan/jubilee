from django.db.models.signals import pre_save, post_save, post_delete, pre_delete
from django.dispatch import receiver
from .models import Product, ProductAsset, ProductVariant, SubOrder, ImportedVariant, BrandType, DropshipSettings, ImportedVariant, ImportedProduct
from .tasks import create_fulfillment_for_subOrder, trigger_product_update, trigger_product_asset_update, trigger_variant_update, trigger_variant_delete, generate_branded_image_for_variant
from django.core.cache import cache
from django.conf import settings

def save_previous_state(instance):
    """
        Save the previous state of the instance for later use
    """
    if instance.pk:
        state = instance.__class__.objects.get(pk=instance.pk)
        instance._previous_state = state
    else:
        instance._previous_state = None

def get_state_changes(instance, valid_fields):
    """
        Return a list of fields that changed
    """
    previous_state = instance._previous_state
    changes = []

    if previous_state is None:
        return []

    for field in instance._meta.fields:
        previous_value = getattr(previous_state, field.name)
        current_value = getattr(instance, field.name)

        if previous_value != current_value and field.name in valid_fields:
            changes.append(field.name)

    del instance._previous_state
    return changes

def generate_branded_image_for_variant_with_cooldown(imported_variant_id, countdown=0):
    if not imported_variant_id:
        return

    cache_key = f"generate-branded-image-for-imported-variant-{imported_variant_id}"

    if cache.get(cache_key):
        return

    cache.set(cache_key, "processing", timeout=settings.BRANDED_IMAGE_GENERATION_TTL)
    generate_branded_image_for_variant.apply_async(
        args=[imported_variant_id], 
        countdown=countdown
    )

@receiver(pre_save, sender=Product)
def store_previous_product_state(sender, instance, **kwargs):
    """
        Save the previous state of the product instance for later use
    """
    save_previous_state(instance)

@receiver(post_save, sender=Product)
def dispatch_product_update(sender, instance, **kwargs):
    """
        If the product changed, dispatch a task to update the product in Shopify
    """
    valid_fields = ["title", "description", "is_active"]
    changes = get_state_changes(instance, valid_fields)

    if changes:
        # Dispatch the task to update the product in Shopify
        if "is_active" in changes and not instance.is_active:
            trigger_product_update.delay(instance.id, changes, delete=True)
        else:
            trigger_product_update.delay(instance.id, changes)


@receiver(pre_delete, sender=Product)
def prevent_delete_active_product(sender, instance, **kwargs):
    if instance.is_active:
        raise Exception("It is not possible to delete an active product")

@receiver(post_save, sender=ProductAsset)
def dispatch_product_asset_update_task(sender, instance, created, **kwargs):
    """
        If the product asset changed, dispatch a task to update the product images in Shopify
    """
    if created:
        trigger_product_asset_update.delay(instance.product.id, instance.image.url)
    else:
        trigger_product_asset_update.delay(instance.product.id)

@receiver(post_delete, sender=ProductAsset)
def dispatch_product_asset_update_task_on_delete(sender, instance, **kwargs):
    """
        If a product asset was deleted, dispatch a task to update the product images in Shopify
    """
    trigger_product_asset_update.delay(instance.product.id)


@receiver(pre_save, sender=ProductVariant)
def store_previous_variant_state(sender, instance, **kwargs):
    """
        Save the previous state of the product variant instance for later use
    """
    save_previous_state(instance)

@receiver(post_save, sender=ProductVariant)
def dispatch_variant_update(sender, instance, created, **kwargs):
    """
        If the product variant changed, dispatch a task to update the product in Shopify
    """
    valid_fields = ["sku", "retail_price_cents", "weight", "selected_options", "image", "is_active"]
    changes = get_state_changes(instance, valid_fields)

    if changes or created:
        # Dispatch the task to update the variant in Shopify
        if "is_active" in changes and not instance.is_active:
            trigger_variant_delete.delay(instance.id)
        else:
            skip_media_update = not "image" in changes or (created and not instance.image)
            trigger_variant_update.delay(instance.id, skip_media_update)

@receiver(pre_delete, sender=ProductVariant)
def prevent_delete_active_variant(sender, instance, **kwargs):
    if instance.is_active and instance.product.is_active:
        raise Exception("It is not possible to delete an active variant")

@receiver(pre_save, sender=SubOrder)
def store_previous_suborder_state(sender, instance, **kwargs):
    """
        Save the previous state of the suborder instance for later use
    """
    save_previous_state(instance)

@receiver(post_save, sender=SubOrder)
def dispatch_suborder_update(sender, instance, created, **kwargs):
    """
        If the suborder changed, dispatch a task to update the fulfillment in Shopify
    """
    valid_fields = ["tracking_carrier", "tracking_number", "tracking_link"]
    changes = get_state_changes(instance, valid_fields)

    if changes and not created:
        create_fulfillment_for_subOrder.delay(instance.id)

@receiver(post_save, sender=ImportedVariant)
def dispatch_branded_image_update(sender, instance, created, **kwargs):
    """
        If the imported variant changed, dispatch a task to update the branded image
    """
    if created and instance.variant.product.branding_type != BrandType.UNBRANDED:
        generate_branded_image_for_variant_with_cooldown(instance.id)

@receiver(pre_save, sender=DropshipSettings)
def store_previous_dropship_settings_state(sender, instance, **kwargs):
    """
        Save the previous state of the dropship settings instance for later use
    """
    save_previous_state(instance)

@receiver(post_save, sender=DropshipSettings)
def dispatch_branded_image_update_on_settings_change(sender, instance, created, **kwargs):
    """
        If the dropship settings changed, dispatch a task to update the branded images for all variants
    """
    valid_fields = ["brand_name", "brand_logo", "font_family", "products_background_color"]
    changes = get_state_changes(instance, valid_fields)

    if not created and changes:
        imported_variants = ImportedVariant.objects.filter(
            imported_product__shop=instance.shop,
            variant__product__branding_type__in=[BrandType.BRAND_NAME, BrandType.BRAND_LOGO]
        )

        for i, variant in enumerate(imported_variants):
            generate_branded_image_for_variant_with_cooldown(variant.id, i * 10)


@receiver(pre_save, sender=ImportedProduct)
def store_previous_imported_product_state(sender, instance, **kwargs):
    """
        Save the previous state of the imported product instance for later use
    """
    save_previous_state(instance)

@receiver(post_save, sender=ImportedProduct)
def dispatch_branded_image_update_on_imported_product_change(sender, instance, created, **kwargs):
    """
        If the imported product changed, dispatch a task to update the branded images for all variants
    """
    valid_fields = ["background_color"]
    changes = get_state_changes(instance, valid_fields)

    if created:
        for variant in instance.product.variants.all():
            ImportedVariant.objects.create(
                imported_product=instance,
                variant= variant,
                retail_price_cents=variant.retail_price_cents
            )

    if not created and changes:
        imported_variants = ImportedVariant.objects.filter(
            imported_product=instance,
            variant__product__branding_type__in=[BrandType.BRAND_NAME, BrandType.BRAND_LOGO]
        )

        for i, imported_variant in enumerate(imported_variants):
            generate_branded_image_for_variant_with_cooldown(imported_variant.id, i * 10)
