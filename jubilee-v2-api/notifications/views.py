from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from django.utils import timezone
from rest_framework import status
from .serializers import NotificationSerializer

class GetAllNotifications(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_time = timezone.now()

        notifications = Notification.objects.filter(
            user=request.user
        ).exclude(
            expires_at__isnull=False,
            expires_at__lt=current_time
        ).order_by('-created_at')
        
        notifications_list = list(notifications)
        notifications_sorted = sorted(notifications_list, key=lambda x: (x.is_pinned, x.created_at), reverse=True)
        serializer = NotificationSerializer(notifications_sorted, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
    
class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({"message": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if notification.user != request.user:
            return Response({"message": "You do not have permission to mark this notification as read."}, status=status.HTTP_403_FORBIDDEN)

        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)