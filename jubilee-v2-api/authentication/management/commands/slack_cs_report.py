from django.conf import settings
import requests
from billing.permissions import create_token
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
import pdfkit
import tempfile
import os

class Command(BaseCommand):
    help = "Send the daily CS report to Slack"
    
    def get_domain(self, url):
        if "localhost" in url or "0.0.0.0" in url:
            return "Localhost"

        domain = url.split("//")[-1].split("/")[0]
        domain_parts = domain.split('.')

        if len(domain_parts) >= 2:
            return domain_parts[-2].capitalize()
        return domain_parts[0].capitalize()

    def generate_pdf(self, html_content):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            file_path = tmp_file.name

        options = {
            "enable-local-file-access": "",
            "page-size": "A4",
            "margin-top": "0.0in",
            "margin-right": "0.1in",
            "margin-bottom": "0.0in",
            "margin-left": "0.1in",
        }

        try:
            pdfkit.from_string(html_content, file_path, options=options)
            return file_path
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error generating PDF: {e}"))
            return None

    def upload_pdf_to_slack(self, file_path, client, title):
        channel_id = settings.CS_REPORT_SLACK_CHANNEL_ID

        try:
            response = client.files_upload(
                channels=channel_id,
                file=file_path,
                title=title,
                initial_comment=title,
            )
            if response["ok"]:
                self.stdout.write(self.style.SUCCESS("PDF successfully uploaded to Slack"))
            else:
                self.stdout.write(self.style.ERROR(f"Failed to upload PDF: {response['error']}"))
        except SlackApiError as e:
            self.stdout.write(self.style.ERROR(f"Error uploading PDF to Slack: {e.response['error']}"))

    def generate_table_html(self, table_data):
        header = [
            "User Name", 
            "Refund Count", 
            "Refund Amount", 
            "Downgrade Count", 
            "Downgrade Amount", 
            "Account Deletion Count", 
            "Extend Trial Count", 
            "Total Amount"
        ]

        html = "<table style='border-collapse: collapse; width: 100%;'>"
        
        html += "<thead><tr>"
        for col in header:
            html += f"<th style='border: 1px solid #cbcbcb; background-color: #f2f2f2; padding: 8px; text-align: center;'>{col}</th>"
        html += "</tr></thead>"
        
        total_row = {
            "name": "Total",
            "refund_count": 0,
            "refund_amount": 0.0,
            "downgrade_count": 0,
            "downgrade_amount": 0.0,
            "account_deletion_count": 0,
            "extend_trial_count": 0,
            "total_amount": 0.0
        }
        
        html += "<tbody>"
        
        for entry in table_data:
            html += "<tr>"
            html += f"<td>{entry['name']}</td>"
            html += f"<td>{entry['refund_count']}</td>"
            html += f"<td>${entry['refund_amount']}</td>"
            html += f"<td>{entry['downgrade_count']}</td>"
            html += f"<td>${entry['downgrade_amount']}</td>"
            html += f"<td>{entry['account_deletion_count']}</td>"
            html += f"<td>{entry['extend_trial_count']}</td>"
            html += f"<td>${entry['total_amount']}</td>"
            html += "</tr>"
            
            total_row['refund_count'] += entry['refund_count']
            total_row['refund_amount'] += float(entry['refund_amount'])
            total_row['downgrade_count'] += entry['downgrade_count']
            total_row['downgrade_amount'] += float(entry['downgrade_amount'])
            total_row['account_deletion_count'] += entry['account_deletion_count']
            total_row['extend_trial_count'] += entry['extend_trial_count']
            total_row['total_amount'] += float(entry['total_amount'])

        html += "<tr style='font-weight: bold;'>"
        html += f"<td>{total_row['name']}</td>"
        html += f"<td>{total_row['refund_count']}</td>"
        html += f"<td>${total_row['refund_amount']:.2f}</td>"
        html += f"<td>{total_row['downgrade_count']}</td>"
        html += f"<td>${total_row['downgrade_amount']:.2f}</td>"
        html += f"<td>{total_row['account_deletion_count']}</td>"
        html += f"<td>{total_row['extend_trial_count']}</td>"
        html += f"<td>${total_row['total_amount']:.2f}</td>"
        html += "</tr>"
        
        html += "</tbody></table>"
        
        return html

    def generate_html(self, tables):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        start_of_month = datetime(datetime.now().year, datetime.now().month, 1).strftime("%Y-%m-%d %H:%M:%S")
        return f"""
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    h1 {{
                        text-align: left;
                        font-size: 18px;
                    }}

                    h2 {{
                        text-align: left;
                        font-size: 12px;
                        opacity: 0.7;
                        font-weight: normal;
                        margin-bottom: 26px;
                    }}

                    h3 {{
                        text-align: left;
                        font-size: 14px;
                        margin-top: 30px;
                        margin-bottom: 20px;
                    }}

                    table {{
                        margin-left: auto;
                        margin-right: auto;
                        border-collapse: collapse;
                        width: 90%;
                        font-size: 12px;
                    }}

                    table td:first-child {{
                        white-space: nowrap;
                    }}

                    body {{
                        font-family: Arial, sans-serif;
                        padding: 20px 0;
                        font-size: 14px;
                    }}

                    table tr:last-child {{
                        font-weight: bold;
                        background-color: #f2f2f2;
                    }}

                    table td {{
                        border: 1px solid #cbcbcb;
                        padding: 8px;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <h1>Customer Service Actions Report</h1>
                <h2>{start_of_month} to {current_time}</h2>
                {tables}
            </body>
        </html>
        """

    def generate_report_by_server(self, server_url):
        request_url = f"{server_url}/billing/customer-service-report/"
        token = create_token()
        headers = {"Authorization": token}
        response = requests.get(request_url, headers=headers)

        if response.status_code != 200:
            self.stdout.write(self.style.ERROR("Failed to fetch data from the server"))
            return []
        
        self.stdout.write(self.style.SUCCESS(f"Successfully fetched data from the server: {server_url}"))
        table_data = response.json()
        return table_data

    def handle(self, *args, **kwargs):
        slack_bot_token = settings.SLACK_BOT_TOKEN
        channel_id = settings.CS_REPORT_SLACK_CHANNEL_ID

        if len(settings.CS_REPORT_SERVERS) == 0:
            return

        if not slack_bot_token or not channel_id:
            self.stdout.write(
                self.style.ERROR(
                    "Please set SLACK_BOT_TOKEN and CS_REPORT_SLACK_CHANNEL_ID in the settings file."
                )
            )
            return

        client = WebClient(token=slack_bot_token)

        users_data = {}

        for server_url in settings.CS_REPORT_SERVERS:
            users = self.generate_report_by_server(server_url)
            for user in users:
                user_name = user.get("name")
                
                if users_data.get(user_name) is None:
                    users_data[user_name] = {}

                for key in user:
                    if key == "name":
                        users_data[user_name][key] = user[key]
                        continue

                    if users_data[user_name].get(key) is None:
                        users_data[user_name][key] = float(user[key]) if isinstance(user[key], str) else user[key]
                    else:
                        value = float(user[key]) if isinstance(user[key], str) else user[key]
                        users_data[user_name][key] += value

        table_data = list(users_data.values())
        html_table = self.generate_html(self.generate_table_html(table_data))
        pdf_path = self.generate_pdf(html_table)

        if not pdf_path:
            self.stdout.write(self.style.ERROR("Failed to generate the PDF."))
            return

        try:
           self.upload_pdf_to_slack(pdf_path, client, title="Daily CS Actions Report")
        except SlackApiError as e:
            self.stdout.write(self.style.ERROR(f"Error sending message to Slack: {e.response['error']}"))

        try:
            os.remove(pdf_path)
            self.stdout.write(self.style.NOTICE("Temporary PDF file removed."))
        except OSError as e:
            self.stdout.write(self.style.ERROR(f"Error removing PDF file: {e}"))
