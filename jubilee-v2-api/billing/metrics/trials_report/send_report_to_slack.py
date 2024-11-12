from __future__ import annotations

import os
from typing import Optional

from django.conf import settings
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from PIL import Image


def send_pdf_report_to_slack(pdf_file_path: Optional[str]) -> None:
    if not pdf_file_path or not os.path.exists(pdf_file_path):
        return

    slack_token = getattr(settings, "SLACK_BOT_TOKEN_KPI", None)
    channel_id = getattr(settings, "KPI_TRIALS_SLACK_CHANNEL_ID", None)

    if not slack_token or not channel_id:
        return

    client = WebClient(token=slack_token)

    try:
        client.files_upload_v2(
            channel=channel_id,
            file=pdf_file_path,
            filename=os.path.basename(pdf_file_path),
            title="KPI Report - Trials & Conversions",
            initial_comment="KPI Report - Trials & Conversions",
        )
    except SlackApiError:
        pass
    finally:
        try:
            os.remove(pdf_file_path)
        except OSError:
            pass


def _combine_chart_images(
    stripe_image_path: Optional[str],
    shopify_image_path: Optional[str],
) -> Optional[str]:
    images = []
    for path in (stripe_image_path, shopify_image_path):
        if path and os.path.exists(path):
            try:
                images.append(Image.open(path))
            except Exception:
                continue

    if not images:
        return None

    widths, heights = zip(*(img.size for img in images))
    max_width = max(widths)
    total_height = sum(heights)

    combined = Image.new("RGB", (max_width, total_height), color="white")
    y_offset = 0
    for img in images:
        x_offset = (max_width - img.size[0]) // 2
        combined.paste(img, (x_offset, y_offset))
        y_offset += img.size[1]

    base_dir = None
    for path in (stripe_image_path, shopify_image_path):
        if path:
            base_dir = os.path.dirname(path)
            break
    if not base_dir:
        base_dir = "."

    combined_path = os.path.join(base_dir, "trials_kpi_combined.png")
    combined.save(combined_path, "PNG")
    return combined_path


def send_chart_images_to_slack(
    stripe_image_path: Optional[str],
    shopify_image_path: Optional[str],
    reference_date_str: str,
) -> None:

    slack_token = getattr(settings, "SLACK_BOT_TOKEN_KPI", None)
    channel_id = getattr(settings, "KPI_TRIALS_SLACK_CHANNEL_ID", None)

    if not slack_token or not channel_id:
        return

    combined_path = _combine_chart_images(stripe_image_path, shopify_image_path)
    if not combined_path or not os.path.exists(combined_path):
        # Nothing to send
        return

    client = WebClient(token=slack_token)
    message_text = f"Jubilee – Trials & Conversions KPI ({reference_date_str})"

    try:
        client.files_upload_v2(
            channel=channel_id,
            file=combined_path,
            filename=os.path.basename(combined_path),
            title="Jubilee - Trials & Conversions - Stripe & Shopify",
            initial_comment=message_text,
        )
    except SlackApiError:
        pass
    finally:
        for path in (stripe_image_path, shopify_image_path, combined_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    continue
