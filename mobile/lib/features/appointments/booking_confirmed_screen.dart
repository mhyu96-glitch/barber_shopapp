import 'package:flutter/material.dart';
import 'package:flutter_thermal_printer/flutter_thermal_printer.dart';
import 'package:flutter_thermal_printer/utils/printer.dart';
import 'package:intl/intl.dart';
import '../../core/printer_service.dart';
import '../../core/app_state.dart';

class BookingConfirmedScreen extends StatefulWidget {
  final String shopName;
  final String customerName;
  final String serviceName;
  final double price;
  final DateTime date;

  const BookingConfirmedScreen({
    super.key,
    required this.shopName,
    required this.customerName,
    required this.serviceName,
    required this.price,
    required this.date,
  });

  @override
  State<BookingConfirmedScreen> createState() => _BookingConfirmedScreenState();
}

class _BookingConfirmedScreenState extends State<BookingConfirmedScreen> {
  final PrinterService _printerService = PrinterService();
  Printer? _selectedPrinter;
  bool _isPrinting = false;

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: backgroundDark,
      body: SafeArea(
        child: Column(
          children: [
            // --- Header ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                    onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                  ),
                  const Expanded(
                    child: Text(
                      'Janji Dikonfirmasi',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 32),
                    // --- Success Visual (Layered Glow) ---
                    _buildPremiumSuccessVisual(primaryColor),

                    const SizedBox(height: 32),
                    const Text(
                      "Janji Berhasil Dibuat",
                      style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "Kursi Anda sudah siap. Kami telah mengirimkan konfirmasi dengan detail lengkap.",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 15, height: 1.5),
                    ),

                    const SizedBox(height: 40),
                    // --- Summary Card ---
                    _buildPremiumSummaryCard(primaryColor),

                    const SizedBox(height: 20),
                    // --- Printer Action (New!) ---
                    _buildPrinterAction(primaryColor),

                    const SizedBox(height: 20),
                    // --- Sync Action ---
                    _buildPremiumSyncAction(primaryColor),

                    const SizedBox(height: 20),
                    // --- Map Preview (Simulated) ---
                    _buildMapPreview(primaryColor),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),

            // --- Footer Button ---
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: backgroundDark,
                  minimumSize: const Size(double.infinity, 60),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text("Selesai", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrinterAction(Color primary) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: primary.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: primary.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(Icons.print_rounded, color: primary, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Cetak Struk", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                Text(
                  _selectedPrinter != null ? "Terhubung: ${_selectedPrinter!.name}" : "Printer belum dipilih",
                  style: TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: _isPrinting ? null : _handlePrint,
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isPrinting
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                : const Text("CETAK", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  void _handlePrint() async {
    if (_selectedPrinter == null) {
      _showPrinterSelectionDialog();
      return;
    }

    setState(() => _isPrinting = true);
    try {
      await _printerService.printReceipt(
        printer: _selectedPrinter!,
        shopName: widget.shopName,
        customerName: widget.customerName,
        serviceName: widget.serviceName,
        price: widget.price,
        date: widget.date,
        customHeader: AppState.printerHeader.value,
        customFooter: AppState.printerFooter.value,
        logoPath: AppState.printerLogoPath.value,
      );
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Berhasil mencetak struk")));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Gagal mencetak: $e")));
    } finally {
      setState(() => _isPrinting = false);
    }
  }

  void _showPrinterSelectionDialog() {
    _printerService.startScan();
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Pilih Printer Thermal",
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              StreamBuilder<List<Printer>>(
                stream: _printerService.devicesStream,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final devices = snapshot.data ?? [];
                  if (devices.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Text("Mencari perangkat...", style: TextStyle(color: Colors.white38)),
                    );
                  }
                  return ListView.builder(
                    shrinkWrap: true,
                    itemCount: devices.length,
                    itemBuilder: (context, index) {
                      final printer = devices[index];
                      return ListTile(
                        leading: const Icon(Icons.bluetooth, color: Colors.white54),
                        title: Text(printer.name ?? "Tanpa Nama", style: const TextStyle(color: Colors.white)),
                        subtitle: Text(printer.address ?? "", style: const TextStyle(color: Colors.white38)),
                        onTap: () async {
                          Navigator.pop(context);
                          final connected = await _printerService.connect(printer);
                          if (connected) {
                            setState(() => _selectedPrinter = printer);
                            _handlePrint();
                          } else {
                            ScaffoldMessenger.of(context)
                                .showSnackBar(const SnackBar(content: Text("Gagal terhubung ke printer")));
                          }
                        },
                      );
                    },
                  );
                },
              ),
              const SizedBox(height: 20),
              TextButton(onPressed: () => Navigator.pop(context), child: const Text("Batal"))
            ],
          ),
        );
      },
    );
  }

  Widget _buildPremiumSuccessVisual(Color primary) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 160,
          height: 160,
          decoration: BoxDecoration(color: primary.withOpacity(0.08), shape: BoxShape.circle),
        ),
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(color: primary.withOpacity(0.12), shape: BoxShape.circle),
        ),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: primary,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: primary.withOpacity(0.4), blurRadius: 30, spreadRadius: 5)],
          ),
          child: const Icon(Icons.check_rounded, color: Colors.black, size: 48, fontWeight: FontWeight.w900),
        ),
      ],
    );
  }

  Widget _buildPremiumSummaryCard(Color primary) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "RINGKASAN JANJI",
            style: TextStyle(
                color: Colors.white.withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5),
          ),
          const SizedBox(height: 24),
          _buildDetailRow(Icons.content_cut_rounded, "Layanan", widget.serviceName, primary),
          _buildDetailRow(Icons.person_outline_rounded, "Nama", widget.customerName, primary),
          _buildDetailRow(
              Icons.calendar_today_rounded, "Waktu", DateFormat('EEE, dd MMM • HH:mm').format(widget.date), primary),
          _buildDetailRow(Icons.location_on_outlined, "Outlet", widget.shopName, primary, isLast: true),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, Color primary, {bool isLast = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: primary, size: 18),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11, fontWeight: FontWeight.w500)),
                Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumSyncAction(Color primary) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: primary.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(Icons.event_note_rounded, color: primary, size: 24),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Tambah ke Kalender",
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                Text("Sinkronkan dengan jadwal Anda", style: TextStyle(color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text("SINKRON", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildMapPreview(Color primary) {
    return Container(
      height: 140,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        image: const DecorationImage(
          image: NetworkImage(
              'https://lh3.googleusercontent.com/aida-public/AB6AXuAR9tyN34dA9AcHKMAE3GIDoEqBgbTpBWHZev6ieLIq7ezdfJK6ucGV2AP-7TrB-eRBGeUybZsgDQAjrrTq_0Nwx9QUrKQMipDFlboHMGR59-z6Ne1sqWux8Szg6ZkDVHQY8ViTdwHmNiocllU6dRmmRx2nLYVGdNppD4tbVE4M3ZgUP-NjMBLdI_cxyoSRWjQNXxOj_8EBta6F5jF2dt5VeNVvtmMgE3UR2QD5n8ynO2mRlxmZcic2PJ1o44k_A79GaLVxF2GL4A'),
          fit: BoxFit.cover,
          opacity: 0.4,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          color: primary.withOpacity(0.1),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.location_on_rounded, color: primary, size: 40),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                child: const Text("Buka di Peta",
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
