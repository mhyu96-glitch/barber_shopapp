import 'printer_service_interface.dart';
import 'printer_service_noop.dart'
    if (dart.library.io) 'printer_service_native.dart';

export 'printer_service_interface.dart';

final PrinterService printerService = PrinterServiceImpl();
