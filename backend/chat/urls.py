from django.urls import path

from .views import (
    AdviceChatMessageCreateView,
    AdviceChatThreadListCreateView,
    AdviceChatThreadStatusView,
    DoctorChatSlotListView,
    AdviceChatMessageUploadView,
    ChatCryptoKeysView
)

urlpatterns = [
	path("threads/", AdviceChatThreadListCreateView.as_view(), name="chat-thread-list-create"),
	path("threads/<int:thread_id>/messages/", AdviceChatMessageCreateView.as_view(), name="chat-message-create"),
	path("threads/<int:thread_id>/messages/upload/", AdviceChatMessageUploadView.as_view(), name="chat-message-upload"),
	path("threads/<int:thread_id>/status/", AdviceChatThreadStatusView.as_view(), name="chat-thread-status"),
	path("slots/doctor/<int:doctor_id>/", DoctorChatSlotListView.as_view(), name="doctor-chat-slots"),
	path("keys/me/", ChatCryptoKeysView.as_view(), name="chat-crypto-keys"),
]
