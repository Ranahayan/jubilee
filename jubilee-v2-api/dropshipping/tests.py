from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from .models import Category, Supplier, Product, BrandType, ImportedProduct
from .serializers import CategorySerializer, ProductSerializer, ImportedProductSerializer
from authentication.models import CustomUser, Shop
from rest_framework_simplejwt.tokens import RefreshToken

def init_client(test):
    client = APIClient()
    user = CustomUser.objects.create_user(name='testuser', password='testpass', email='test@email.com')
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    test.client = client
    test.shop = Shop.objects.create(owner=user)

def seed_data(test):
    test.sport_category = Category.objects.create(name='Sport', is_active=True)
    test.soccer_category = Category.objects.create(name='Soccer', is_active=True, parent=test.sport_category)

    test.supplier = Supplier.objects.create(
        name='Sport Zone',
        email='contact@sportzone.com',
    )

    test.shoes_product = Product.objects.create(
        title='Running Shoes',
        description='Specialized shoes for long-distance running',
        sku='RUNSHOES01',
        supplier=test.supplier,
        category=test.sport_category,
        tags=['running','sports'],
        branding_type=BrandType.UNBRANDED,
    )

    test.soccer_ball_product = Product.objects.create(
        title='Soccer Ball',
        description='Official ball for professional soccer matches',
        sku='SOCCERBALL02',
        supplier=test.supplier,
        category=test.soccer_category,
        tags=['soccer', 'sports'],
        branding_type=BrandType.BRAND_LOGO,
        moq_quantity=3,
        is_premium=True,
    )

class CategoryListTests(TestCase):
    def setUp(self):
        init_client(self)
        self.category = Category.objects.create(name='Sport', is_active=True)

    def test_get_category_list(self):        
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        expected_data = CategorySerializer(Category.objects.filter(is_active=True), many=True).data
        self.assertEqual(data, expected_data)

class ProductListTests(TestCase):
    def setUp(self):
        init_client(self)
        seed_data(self)

    def test_get_product_list(self):
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(is_active=True).order_by('-created_at')
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

    def test_filter_products_by_premium_flag(self):
        url = reverse('product-list')
        url_with_param = f'{url}?is_premium=true'
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(is_premium=True).order_by('-created_at')
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

    def test_filter_products_by_branding_type(self):
        url = reverse('product-list')
        url_with_param = f'{url}?branding_type=brand_logo'
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(branding_type=BrandType.BRAND_LOGO).order_by('-created_at')
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

    def test_filter_products_by_category(self):
        url = reverse('product-list')
        url_with_param = f'{url}?category={self.soccer_category.id}'
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(category=self.soccer_category.id).order_by('-created_at')
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

    def test_filter_products_by_tags(self):
        url = reverse('product-list')
        url_with_param = f'{url}?tags=soccer'
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(tags__contains=['soccer']).order_by('-created_at')
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

    def test_filter_products_by_moq(self):
        url = reverse('product-list')
        url_with_param = f'{url}?is_moq=true'
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(moq_quantity__gt=1).order_by('-created_at')
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

    def test_invalid_page(self):
        url = reverse('product-list')
        url_with_param = f'{url}?page=2'
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_products_by_search_term(self):
        url = reverse('product-list')
        url_with_param = f'{url}?search_term=socer balll' # Keeping the term "socer balll" for testing purposes
        response = self.client.get(url_with_param)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = Product.objects.filter(title="Soccer Ball")
        self.assertEqual(data, ProductSerializer(expected_data, many=True).data)

class ImportedProductTests(TestCase):
    def setUp(self):
        init_client(self)
        seed_data(self)
        # Populate the test with one imported product
        ImportedProduct.objects.create(
            product=self.soccer_ball_product,
            shop=self.shop
        )

        # Creating an inactive product to test; this will not be returned in the list
        ImportedProduct.objects.create(
            product=self.soccer_ball_product,
            shop=self.shop,
            is_active=False
        )

    def test_import_products(self):
        url = reverse('imported-product-detail', args=[self.shoes_product.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_imported_product_list(self):
        url = reverse('imported-product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        expected_data = ImportedProduct.objects.filter(shop=self.shop, is_active=True).order_by('-created_at')
        self.assertEqual(data, ImportedProductSerializer(expected_data, many=True).data)

    def test_remove_imported_product(self):
        url = reverse('imported-product-detail', args=[self.soccer_ball_product.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)