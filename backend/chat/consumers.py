import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import AdviceChatThread, AdviceChatMessage
from .serializers import AdviceChatMessageSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_{self.thread_id}'
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # Check if the user is part of the thread
        thread_exists = await self.check_thread_access()
        if not thread_exists:
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_text = text_data_json.get('message_text')
        
        if not message_text:
            return

        # Save message to DB
        message_data = await self.create_message(message_text)

        if message_data:
            if "error" in message_data:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': message_data["error"]
                }))
            else:
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_data
                    }
                )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))

    @database_sync_to_async
    def check_thread_access(self):
        try:
            role = getattr(self.user, "role", None)
            if role == "DOCTOR":
                return AdviceChatThread.objects.filter(id=self.thread_id, doctor__user=self.user).exists()
            elif role == "PATIENT":
                return AdviceChatThread.objects.filter(id=self.thread_id, patient__user=self.user).exists()
        except Exception:
            return False
        return False

    @database_sync_to_async
    def create_message(self, text):
        try:
            thread = AdviceChatThread.objects.get(id=self.thread_id)
            
            # Expiration logic
            if thread.status == AdviceChatThread.Status.CLOSED or (thread.expires_at and timezone.now() > thread.expires_at):
                if thread.status != AdviceChatThread.Status.CLOSED:
                    thread.status = AdviceChatThread.Status.CLOSED
                    thread.save(update_fields=["status"])
                return {"error": "Chat is closed or expired."}
                
            message = AdviceChatMessage.objects.create(
                thread=thread,
                sender_user=self.user,
                sender_role=self.user.role,
                message_text=text,
                is_read=False
            )
            thread.last_message_at = message.sent_at
            thread.save(update_fields=["last_message_at"])
            
            # Serialize for frontend
            serializer = AdviceChatMessageSerializer(message)
            return serializer.data
        except Exception as e:
            return None
