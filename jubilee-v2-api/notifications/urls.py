from django.urls import path
from .views import GetAllNotifications, MarkAllNotificationsReadView, MarkNotificationReadView

urlpatterns = [
    path('all/', GetAllNotifications.as_view(), name='all-notifications'),
    path('mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark-all-read'),
    path('mark-read/<int:pk>/', MarkNotificationReadView.as_view(), name='mark-read')
]