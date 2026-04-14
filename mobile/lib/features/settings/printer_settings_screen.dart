import 'package:flutter/material.dart';
import '../../core/printer_service.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../core/app_state.dart';

class PrinterSettingsScreen extends StatefulWidget {
  const PrinterSettingsScreen({super.key});

  @override
  State<PrinterSettingsScreen> createState() => _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends State<PrinterSettingsScreen> {
  bool _isScanning = false;
  dynamic _connectedPrinter;

  @override
  void initState() {
    super.initState();
    _loadSavedPrinter();
  }

  Future<void> _loadSavedPrinter() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('printer_name');
    final address = prefs.getString('printer_address');
    final header = prefs.getString('printer_header');
    final footer = prefs.getString('printer_footer');
    final logo = prefs.getString('printer_logo_path');
    
    if (name != null) AppState.printerName.value = name;
    if (address != null) AppState.printerAddress.value = address;
    if (header != null) AppState.printerHeader.value = header;
    if (footer != null) AppState.printerFooter.value = footer;
    if (logo != null) AppState.printerLogoPath.value = logo;
  }

  Future<void> _saveHeaderFooter() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('printer_header', AppState.printerHeader.value);
    await prefs.setString('printer_footer', AppState.printerFooter.value);
    await prefs.setString('printer_logo_path', AppState.printerLogoPath.value ?? "");
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Pengaturan teks & logo disimpan")));
    }
  }

  Future<void> _pickLogo() async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        AppState.printerLogoPath.value = image.path;
      });
    }
  }

  Future<void> _savePrinter(dynamic printer) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('printer_name', printer.name ?? "Thermal Printer");
    await prefs.setString('printer_address', printer.address ?? "");
    
    AppState.printerName.value = printer.name;
    AppState.printerAddress.value = printer.address;
  }

  void _startScan() {
    setState(() => _isScanning = true);
    printerService.startScan();
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) setState(() => _isScanning = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: backgroundDark,
      appBar: AppBar(
        title: const Text("Pengaturan Printer", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (_isScanning)
            const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator(strokeWidth: 2)))
          else
            IconButton(icon: const Icon(Icons.refresh), onPressed: _startScan),
        ],
      ),
      body: Column(
        children: [
          // --- Current Active Printer ---
          ValueListenableBuilder<String?>(
            valueListenable: AppState.printerName,
            builder: (context, name, _) {
              return Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: primaryColor.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: primaryColor.withOpacity(0.1), shape: BoxShape.circle),
                      child: Icon(Icons.print_rounded, color: primaryColor, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Default Printer", style: TextStyle(color: Colors.white38, fontSize: 12)),
                          Text(name ?? "Belum Terhubung",
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          if (AppState.printerAddress.value != null)
                            Text(AppState.printerAddress.value!, style: const TextStyle(color: Colors.white24, fontSize: 11)),
                        ],
                      ),
                    ),
                    if (name != null)
                      ElevatedButton(
                        onPressed: _testPrint,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: Colors.black,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                        child: const Text("TEST", style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
              );
            },
          ),

          // --- Custom Header & Footer ---
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Kustomisasi Struk",
                      style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildTextField("Header (Nama Toko/Slogan)", AppState.printerHeader),
                  const SizedBox(height: 12),
                  _buildTextField("Footer (Pesan Penutup)", AppState.printerFooter, maxLines: 2),
                  const SizedBox(height: 16),
                  
                  // --- Logo Selector ---
                  const Text("Logo Toko (BMP/Gambar)", style: TextStyle(color: Colors.white60, fontSize: 11)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: AppState.printerLogoPath.value != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.file(File(AppState.printerLogoPath.value!), fit: BoxFit.cover),
                              )
                            : const Icon(Icons.image_outlined, color: Colors.white24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ElevatedButton.icon(
                              onPressed: _pickLogo,
                              icon: const Icon(Icons.photo_library_outlined, size: 16),
                              label: const Text("Pilih Logo", style: TextStyle(fontSize: 12)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white10,
                                foregroundColor: Colors.white70,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                            if (AppState.printerLogoPath.value != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  AppState.printerLogoPath.value!.split('/').last,
                                  style: const TextStyle(color: Colors.white38, fontSize: 10),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (AppState.printerLogoPath.value != null)
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                          onPressed: () => setState(() => AppState.printerLogoPath.value = null),
                        ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _saveHeaderFooter,
                      icon: const Icon(Icons.save, size: 18),
                      label: const Text("Simpan Teks & Logo"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor.withOpacity(0.1),
                        foregroundColor: primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text("Printer Terdeteksi", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                Spacer(),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // --- Device List ---
          Expanded(
            child: StreamBuilder<List<dynamic>>(
              stream: printerService.devicesStream,
              builder: (context, snapshot) {
                final devices = snapshot.data ?? [];
                if (devices.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.bluetooth_searching, size: 48, color: Colors.white.withOpacity(0.1)),
                        const SizedBox(height: 16),
                        const Text("Tekan refresh untuk mencari printer", style: TextStyle(color: Colors.white24)),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: devices.length,
                  itemBuilder: (context, index) {
                    final printer = devices[index];
                    final isCurrent = printer.address == AppState.printerAddress.value;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(16),
                        border: isCurrent ? Border.all(color: primaryColor.withOpacity(0.5)) : null,
                      ),
                      child: ListTile(
                        leading: Icon(Icons.print_outlined, color: isCurrent ? primaryColor : Colors.white38),
                        title: Text(printer.name ?? "Device ${index + 1}",
                            style: TextStyle(color: isCurrent ? primaryColor : Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Text(printer.address ?? "Bluetooth", style: const TextStyle(color: Colors.white24, fontSize: 11)),
                        trailing: ElevatedButton(
                          onPressed: () => _connectAndSave(printer),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isCurrent ? Colors.green.withOpacity(0.2) : primaryColor,
                            foregroundColor: isCurrent ? Colors.green : Colors.black,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: Text(isCurrent ? "CONNECTED" : "PILIH"),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _connectAndSave(dynamic printer) async {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Menghubungkan ke ${printer.name ?? 'Device'}...")));
    final connected = await printerService.connect(printer);
    if (connected) {
      await _savePrinter(printer);
      setState(() => _connectedPrinter = printer);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Printer berhasil disimpan sebagai default")));
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Gagal terhubung ke printer")));
      }
    }
  }

  Future<void> _testPrint() async {
    if (AppState.printerAddress.value == null) return;
    
    // For test print, we need a Printer object. 
    // We can try to reconnect if we don't have it in state, 
    // but usually in settings we have _connectedPrinter after selecting.
    
    if (_connectedPrinter == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Silakan pilih printer kembali untuk test print")));
      return;
    }

    try {
      await printerService.printReceipt(
        printer: _connectedPrinter!,
        shopName: "TEST PRINT BARBERPRO",
        customerName: "Tes Pelanggan",
        serviceName: "Tes Koneksi Printer",
        price: 0,
        date: DateTime.now(),
        customHeader: AppState.printerHeader.value,
        customFooter: AppState.printerFooter.value,
        logoPath: AppState.printerLogoPath.value,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Test print gagal: $e")));
    }
  }

  Widget _buildTextField(String label, ValueNotifier<String> notifier, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
        const SizedBox(height: 6),
        TextField(
          controller: TextEditingController(text: notifier.value),
          onChanged: (val) => notifier.value = val,
          maxLines: maxLines,
          style: const TextStyle(color: Colors.white, fontSize: 13),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white.withOpacity(0.05),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }
}
