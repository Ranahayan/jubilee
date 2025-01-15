from django.contrib import admin
from core.admin import secure_admin_site, SecureModelAdmin
from ai.models import Model, Generation


class ModelAdmin(SecureModelAdmin):
    list_display = ['name', 'model_type', 'provider', 'is_active', 'created_at', 'updated_at']
    list_filter = ['model_type', 'provider', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('model_type', 'provider', 'name', 'is_active', 'default_options', 'pricing')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

class GenerationAdmin(SecureModelAdmin):
    list_display = ['model', 'input_file', 'output_file', 'created_at', 'updated_at']
    list_filter = ['model']
    search_fields = ['input_file__name', 'output_file__name']
    readonly_fields = ['created_at', 'updated_at', 'input_file', 'output_file']
    fieldsets = (
        (None, {
            'fields': ('model', 'input_file', 'output_file', 'input_data', 'output_data', 'options', 'external_id', 'cost')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


# AI models are not needed in Jubilee admin API

