import 'notification_service_interface.dart';

class NotificationServiceImpl implements NotificationService {
  @override
  Future<void> initialize() async {
    print("Notifications not supported on web");
  }

  @override
  Future<void> showBookingNotification({
    required String customerName,
    required String serviceName,
    required String time,
  }) async {
    print("Web Notification: Booking for $customerName - $serviceName at $time");
  }

  @override
  Future<void> showGeneralNotification({
    required String title,
    required String body,
  }) async {
    print("Web Notification ($title): $body");
  }
}
