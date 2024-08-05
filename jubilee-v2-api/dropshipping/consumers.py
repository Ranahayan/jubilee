import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from urllib.parse import parse_qs


class DropshippingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user_id = parse_qs(self.scope["query_string"].decode("utf8"))["user_id"][0]

        self.group_name = f"dropshipping_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_event(self, event):
        data = event["data"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps(data))
