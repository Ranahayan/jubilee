from rest_framework import serializers

class ShopifyImageSerializer(serializers.Serializer):
    src = serializers.CharField()


class ShopifyProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    body_html = serializers.CharField()
    vendor = serializers.CharField()
    image = ShopifyImageSerializer()