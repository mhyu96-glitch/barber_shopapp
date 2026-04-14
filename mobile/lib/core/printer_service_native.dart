import 'dart:typed_data';
import 'package:flutter_thermal_printer/flutter_thermal_printer.dart';
import 'package:flutter_thermal_printer/utils/printer.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:intl/intl.dart';
import 'package:image/image.dart' as img;
import 'dart:io';
import 'printer_service_interface.dart';

class PrinterServiceImpl implements PrinterService {
  final _printerManager = FlutterThermalPrinter.instance;

  // Scan for available Bluetooth and USB devices
  @override
  Stream<List<Printer>> get devicesStream => _printerManager.devicesStream;

  @override
  Future<void> startScan() async {
    // Request permissions for Android
    await [
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();

    await _printerManager.getPrinters();
  }

  @override
  Future<void> stopScan() async {
    // The library handles scan stopping usually, but we can call getPrinters again to refresh
  }

  @override
  Future<bool> connect(dynamic printer) async {
    if (printer is Printer) {
      return await _printerManager.connect(printer);
    }
    return false;
  }

  @override
  Future<void> disconnect(dynamic printer) async {
    if (printer is Printer) {
      await _printerManager.disconnect(printer);
    }
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
    if (printer is! Printer) return {'success': false, 'message': 'Invalid Printer'};
    
    try {
      final profile = await CapabilityProfile.load();
      final generator = Generator(PaperSize.mm58, profile);
      List<int> bytes = [];

      // Logo
      if (logoPath != null && logoPath.isNotEmpty) {
        try {
          final File file = File(logoPath);
          if (await file.exists()) {
            final Uint8List imageBytes = await file.readAsBytes();
            final img.Image? image = img.decodeImage(imageBytes);
            if (image != null) {
              final img.Image resized = img.copyResize(image, width: 200);
              bytes += generator.image(resized);
              bytes += generator.feed(1);
            }
          }
        } catch (e) {
          print("Error printing logo: $e");
          // Continue printing without logo
        }
      }

      // Header
      if (customHeader != null && customHeader.isNotEmpty) {
        bytes += generator.text(customHeader, styles: const PosStyles(align: PosAlign.center, bold: true));
      } else {
        bytes += generator.text(shopName, styles: const PosStyles(align: PosAlign.center, bold: true));
      }
      
      bytes += generator.text('BUKTI PEMBAYARAN', styles: const PosStyles(align: PosAlign.center));
      bytes += generator.feed(1);
      bytes += generator.hr();

      // Details
      final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
      bytes += generator.text('Tanggal: ${dateFormat.format(date)}');
      bytes += generator.text('Pelanggan: $customerName');
      bytes += generator.hr();

      // Items
      bytes += generator.row([
        PosColumn(text: serviceName, width: 8),
        PosColumn(text: 'Rp ${price.toInt()}', width: 4, styles: const PosStyles(align: PosAlign.right)),
      ]);
      bytes += generator.hr();

      // Total
      bytes += generator.row([
        PosColumn(text: 'TOTAL', width: 6, styles: const PosStyles(bold: true)),
        PosColumn(text: 'Rp ${price.toInt()}', width: 6, styles: const PosStyles(align: PosAlign.right, bold: true)),
      ]);

      // Footer
      bytes += generator.feed(2);
      if (customFooter != null && customFooter.isNotEmpty) {
        final lines = customFooter.split('\n');
        for (var line in lines) {
          bytes += generator.text(line, styles: const PosStyles(align: PosAlign.center));
        }
      } else {
        bytes += generator.text('Terima Kasih!', styles: const PosStyles(align: PosAlign.center, bold: true));
        bytes += generator.text('Silakan Datang Kembali', styles: const PosStyles(align: PosAlign.center));
      }
      
      bytes += generator.feed(3);
      bytes += generator.cut();

      await _printerManager.printData(printer, Uint8List.fromList(bytes));
      return {'success': true, 'message': 'Struk berhasil dicetak'};
    } catch (e) {
      print("Print error: $e");
      return {'success': false, 'message': 'Gagal mencetak: $e'};
    }
  }
}
