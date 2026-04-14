import 'printer_service_interface.dart';

class PrinterServiceImpl implements PrinterService {
  @override
  Stream<List<dynamic>> get devicesStream => Stream.value([]);

  @override
  Future<void> startScan() async {
    print("Printing not supported on web");
  }

  @override
  Future<void> stopScan() async {
    print("Printing not supported on web");
  }

  @override
  Future<bool> connect(dynamic printer) async {
    return false;
  }

  @override
  Future<void> disconnect(dynamic printer) async {
    // do nothing
  }

  @override
  Future<Map<String, dynamic>> printReceipt({
    required dynamic printer,
    required String shopName,
    required String customerName,
    required String serviceName,
    required double price,
    required DateTime date,
    String? customHeader,
    String? customFooter,
    String? logoPath,
  }) async {
    return {'success': false, 'message': 'Fitur cetak tidak tersedia di Web/Simulator'};
  }
}
