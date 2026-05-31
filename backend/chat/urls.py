from django.urls import path

from .views import AdviceChatMessageCreateView, AdviceChatThreadListCreateView
from .views import AdviceChatMessageCreateView, AdviceChatThreadListCreateView, AdviceChatThreadStatusView

urlpatterns = [
	path("threads/", AdviceChatThreadListCreateView.as_view(), name="chat-thread-list-create"),
	path("threads/<int:thread_id>/messages/", AdviceChatMessageCreateView.as_view(), name="chat-message-create"),
	path("threads/<int:thread_id>/status/", AdviceChatThreadStatusView.as_view(), name="chat-thread-status"),
]
