import 'notification_service_interface.dart';
import 'notification_service_noop.dart'
    if (dart.library.io) 'notification_service_native.dart';

export 'notification_service_interface.dart';

final NotificationService notificationService = NotificationServiceImpl();
