abstract class PrinterService {
  Stream<List<dynamic>> get devicesStream;
  Future<void> startScan();
  Future<void> stopScan();
  Future<bool> connect(dynamic printer);
  Future<void> disconnect(dynamic printer);
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
  });
}
