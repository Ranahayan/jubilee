from __future__ import annotations

import os
import tempfile
from typing import List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont

from .fetch_data import TrendPoint


def _draw_line_chart(
    trend: List[TrendPoint],
    key_started: str,
    key_converted: str,
    provider_name: str,
    output_path: str,
) -> bool:

    if not trend:
        return False
    
    try:
        all_values = [p[key_started] for p in trend] + [p[key_converted] for p in trend]
        max_value = max(all_values) if all_values else 1
        if max_value <= 0:
            max_value = 1
        
        width = 600
        height = 350
        padding_left = 60
        padding_right = 24
        padding_top = 40
        padding_bottom = 60
        
        chart_width = width - padding_left - padding_right
        chart_height = height - padding_top - padding_bottom
        
        img = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
            label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 10)
            value_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 9)
        except:
            try:
                title_font = ImageFont.truetype("arial.ttf", 14)
                label_font = ImageFont.truetype("arial.ttf", 10)
                value_font = ImageFont.truetype("arial.ttf", 9)
            except:
                title_font = ImageFont.load_default()
                label_font = ImageFont.load_default()
                value_font = ImageFont.load_default()
        
        title_text = f"Daily Trials & Conversions – {provider_name}"
        draw.text((padding_left, 10), title_text, fill='#111827', font=title_font)
        
        y_axis_x = padding_left
        x_axis_y = padding_top + chart_height
        
        draw.line([(y_axis_x, padding_top), (y_axis_x, x_axis_y)], fill='#e5e7eb', width=1)
        draw.line([(y_axis_x, x_axis_y), (width - padding_right, x_axis_y)], fill='#e5e7eb', width=1)

        legend_items = [
            ("Trials started", "#3b82f6"), 
            ("Trials converted", "#10b981"),
        ]
        legend_padding = 10
        legend_spacing_y = 16
        legend_line_length = 18

        legend_width = 0
        for label, _color in legend_items:
            bbox = draw.textbbox((0, 0), label, font=label_font)
            legend_width = max(legend_width, legend_line_length + 6 + (bbox[2] - bbox[0]))

        legend_x = width - padding_right - legend_width
        legend_y = 10

        for idx, (label, color) in enumerate(legend_items):
            y = legend_y + idx * legend_spacing_y
            line_y = y + 6
            draw.line(
                [(legend_x, line_y), (legend_x + legend_line_length, line_y)],
                fill=color,
                width=2,
            )
            draw.text(
                (legend_x + legend_line_length + 6, y),
                label,
                fill="#4b5563",
                font=label_font,
            )
        
        n = len(trend)
        x_step = chart_width / max(n - 1, 1) if n > 1 else 0
        
        started_points = []
        converted_points = []
        
        for i, point in enumerate(trend):
            x = padding_left + (i * x_step) if n > 1 else padding_left + (chart_width / 2)
            
            started_val = point[key_started]
            converted_val = point[key_converted]
            
            started_y = padding_top + (chart_height - (started_val / max_value) * chart_height)
            converted_y = padding_top + (chart_height - (converted_val / max_value) * chart_height)
            
            started_points.append((x, started_y, started_val))
            converted_points.append((x, converted_y, converted_val))
        
        if len(started_points) > 1:
            for i in range(len(started_points) - 1):
                x1, y1, _ = started_points[i]
                x2, y2, _ = started_points[i + 1]
                draw.line([(x1, y1), (x2, y2)], fill='#3b82f6', width=2)
        
        if len(converted_points) > 1:
            for i in range(len(converted_points) - 1):
                x1, y1, _ = converted_points[i]
                x2, y2, _ = converted_points[i + 1]
                draw.line([(x1, y1), (x2, y2)], fill='#10b981', width=2)
        
        for x, y, val in started_points:
            draw.ellipse([x - 4, y - 4, x + 4, y + 4], fill='#3b82f6', outline='#3b82f6')
            text_bbox = draw.textbbox((0, 0), str(val), font=value_font)
            text_width = text_bbox[2] - text_bbox[0]
            draw.text((x - text_width / 2, y - 18), str(val), fill='#3b82f6', font=value_font)
        
        for x, y, val in converted_points:
            draw.ellipse([x - 4, y - 4, x + 4, y + 4], fill='#10b981', outline='#10b981')
            text_bbox = draw.textbbox((0, 0), str(val), font=value_font)
            text_width = text_bbox[2] - text_bbox[0]
            draw.text((x - text_width / 2, y - 18), str(val), fill='#10b981', font=value_font)
        
        for i, point in enumerate(trend):
            x = padding_left + (i * x_step) if n > 1 else padding_left + (chart_width / 2)
            date_str = point["date"][5:]
            text_bbox = draw.textbbox((0, 0), date_str, font=label_font)
            text_width = text_bbox[2] - text_bbox[0]
            draw.text((x - text_width / 2, x_axis_y + 8), date_str, fill='#4b5563', font=label_font)
        
        text_bbox_0 = draw.textbbox((0, 0), "0", font=label_font)
        text_width_0 = text_bbox_0[2] - text_bbox_0[0]
        draw.text((y_axis_x - 15 - text_width_0, x_axis_y - 5), "0", fill='#6b7280', font=label_font)
        
        text_bbox_max = draw.textbbox((0, 0), str(max_value), font=label_font)
        text_width_max = text_bbox_max[2] - text_bbox_max[0]
        draw.text((y_axis_x - 15 - text_width_max, padding_top - 5), str(max_value), fill='#6b7280', font=label_font)
        
        date_text_bbox = draw.textbbox((0, 0), "Date", font=label_font)
        date_text_width = date_text_bbox[2] - date_text_bbox[0]
        draw.text((width / 2 - date_text_width / 2, height - 25), "Date", fill='#6b7280', font=label_font)
        
        img.save(output_path, 'PNG')
        return True
        
    except Exception as e:
        print(f"Error drawing chart: {e}")
        return False


def generate_chart_images(
    trend: List[TrendPoint],
    reference_date_str: str,
) -> Tuple[Optional[str], Optional[str]]:

    if not trend:
        return None, None
    
    stripe_image_path = None
    shopify_image_path = None
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
            stripe_image_path = tmp_file.name
        
        if not _draw_line_chart(
            trend=trend,
            key_started="stripe_trials_started",
            key_converted="stripe_trials_converted",
            provider_name="Stripe",
            output_path=stripe_image_path,
        ):
            stripe_image_path = None
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
            shopify_image_path = tmp_file.name
        
        if not _draw_line_chart(
            trend=trend,
            key_started="shopify_trials_started",
            key_converted="shopify_trials_converted",
            provider_name="Shopify Billing",
            output_path=shopify_image_path,
        ):
            shopify_image_path = None
            if stripe_image_path:
                try:
                    os.remove(stripe_image_path)
                except OSError:
                    pass
    
    except Exception as e:
        if stripe_image_path:
            try:
                os.remove(stripe_image_path)
            except OSError:
                pass
        if shopify_image_path:
            try:
                os.remove(shopify_image_path)
            except OSError:
                pass
        print(f"Error generating chart images: {e}")
        return None, None
    
    return stripe_image_path, shopify_image_path
