from django.contrib import admin

from core.admin import secure_admin_site, SecureModelAdmin
from billing.actions import refund_suborder
from .models import DropshipSettings, Order, SubOrder, LineItem
from django.urls import reverse
from django.utils.html import format_html, escape
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.db.models import Case, When, BooleanField

class LineItemInline(admin.TabularInline):
    model = LineItem
    extra = 0
    fields = ['title', 'sku', 'quantity']
    readonly_fields = ['title', 'sku', 'quantity']

    def has_add_permission(self, request, obj=None):
        return False

class PaymentStatusFilter(admin.SimpleListFilter):
    title = _('payment status')
    parameter_name = 'payment_status'

    def lookups(self, request, model_admin):
        return (
            ('paid', _('Paid')),
            ('unpaid', _('Unpaid')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'paid':
            return queryset.filter(status='paid')
        if self.value() == 'unpaid':
            return queryset.filter(status='unpaid')
        
class ProcessedFilter(admin.SimpleListFilter):
    title = _('processed')
    parameter_name = 'processed'

    def lookups(self, request, model_admin):
        return (
            ('processed', _('Processed')),
            ('unprocessed', _('Unprocessed')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'processed':
            return queryset.filter(is_processed=True)
        if self.value() == 'unprocessed':
            return queryset.filter(is_processed=False)

class SubOrderAdmin(SecureModelAdmin):
    model = SubOrder
    inlines = [LineItemInline]
    list_filter = (PaymentStatusFilter, ProcessedFilter)
    search_fields = ['order__shop__url', 'order__shop__owner__email', 'supplier__name']
    readonly_fields = [
        'display_name', 'order', 'supplier', 'status', 'get_invoice',
        'total_cost_cents', 'shipping_cost_cents', 'checkout_at',
    ]
    list_display = ['display_name', 'shop_link', 'status', 'checkout_at', 'created_at']
    list_per_page = settings.LIST_PER_PAGE
    list_select_related = ['order', 'order__shop']
    actions = [refund_suborder]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(
            has_checkout_at=Case(
                When(checkout_at__isnull=True, then=False),
                default=True,
                output_field=BooleanField()
            )
        ).order_by('-has_checkout_at', '-checkout_at')

    fieldsets = (
        (None, {'fields': ('display_name', 'order', 'supplier', 'status', 'get_invoice')}),
        ('Costs', {'fields': ('total_cost_cents', 'shipping_cost_cents')}),
        ('Internal management', {'fields': ('is_processed', 'note')}),
        ('Tracking', {'fields': ('tracking_carrier', 'tracking_number', 'tracking_link')}),
        ('Stripe', {'fields': ['checkout_at']}),
    )

    def display_name(self, obj):
        return obj.__str__()

    display_name.short_description = 'Display name'

    def shop_link(self, obj):
        if obj.order.shop:
            return obj.order.shop.url
        return '-'

    def created_at(self, obj):
        return obj.order.created_at

    def has_add_permission(self, request):
        return False

    def get_invoice(self, obj):
        invoice_url = reverse('suborder-invoice', args=[obj.id])
        return format_html('<a href="{}" target="_blank">Invoice link</a>', invoice_url)

    get_invoice.short_description = 'Invoice link'

class OrderAdmin(SecureModelAdmin):
    search_fields = ['shop__url', 'shop__owner__email']
    list_per_page = settings.LIST_PER_PAGE
    list_select_related = ('shop', 'customer', 'shipping_address')
    list_display = ['order_display_name', 'order_type', 'shopify_order_name', 'checkout_at', 'suborders_table']
    ordering = ('-created_at',)
    readonly_fields = ['order_display_name', 'order_type', 'shopify_order_name', 'checkout_at', 'suborders_table']
    fields = ['order_display_name', 'order_type', 'shopify_order_name', 'checkout_at', 'suborders_table']

    def has_add_permission(self, request):
        return False

    def order_display_name(self, obj):
        return obj.__str__()

    order_display_name.short_description = 'Order'

    def suborders_table(self, obj):
        suborders = SubOrder.objects.filter(order=obj).select_related('supplier')
        table_html = '<table border="1"><tr><th>Supplier</th><th>Status</th><th>Link</th><th>Invoice</th></tr>'
        for suborder in suborders:
            url = reverse(
                'admin:%s_%s_change' % (suborder._meta.app_label, suborder._meta.model_name),
                args=[suborder.id],
            )
            invoice_url = reverse('suborder-invoice', args=[suborder.id])
            table_html += '<tr><td>{}</td><td>{}</td><td><a href="{}" target="_blank">View Sub Order</a></td><td><a href="{}" target="_blank">Open</a></td></tr>'.format(
                escape(suborder.supplier.name),
                escape(suborder.status),
                url,
                invoice_url,
            )
        table_html += '</table>'
        return format_html(table_html)

    suborders_table.short_description = 'Suborders'


secure_admin_site.register(Order, OrderAdmin)
secure_admin_site.register(SubOrder, SubOrderAdmin)
