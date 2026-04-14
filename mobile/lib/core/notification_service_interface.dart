abstract class NotificationService {
  Future<void> initialize();
  Future<void> showBookingNotification({
    required String customerName,
    required String serviceName,
    required String time,
  });
  Future<void> showGeneralNotification({
    required String title,
    required String body,
  });
}
