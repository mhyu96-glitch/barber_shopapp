import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import 'book_appointment_screen.dart';

class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;
    final isAdmin = AppState.isAdmin();
    
    return Scaffold(
      backgroundColor: backgroundDark,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // --- Header ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.calendar_month_rounded, color: primaryColor, size: 32),
                        const SizedBox(width: 12),
                        Text(
                          isAdmin ? 'Daftar Janji' : 'Jadwal Anda',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const BookAppointmentScreen()),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: primaryColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.add, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // --- Calendar Section ---
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildNavButton(Icons.chevron_left),
                        const Text(
                          "Maret 2026",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        _buildNavButton(Icons.chevron_right),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _buildCalendarGrid(primaryColor),
                  ],
                ),
              ),
            ),

            // --- List Header ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Jadwal Hari Ini",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    StreamBuilder<List<Appointment>>(
                      stream: SupabaseService.getAppointmentsStream(),
                      builder: (context, snapshot) {
                        final count = snapshot.data?.length ?? 0;
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            "$count Janji",
                            style: TextStyle(color: primaryColor, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        );
                      }
                    ),
                  ],
                ),
              ),
            ),

            // --- Appointment Cards from Supabase ---
            StreamBuilder<List<Appointment>>(
              stream: SupabaseService.getAppointmentsStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator()));
                }
                final appointments = snapshot.data ?? [];
                if (appointments.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(40.0),
                      child: Center(child: Text("Belum ada janji temu", style: TextStyle(color: Colors.white38))),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final apt = appointments[index];
                        return _buildAppointmentCard(
                          context,
                          appointment: apt,
                        );
                      },
                      childCount: appointments.length,
                    ),
                  ),
                );
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: isAdmin ? Padding(
        padding: const EdgeInsets.only(bottom: 20, right: 10),
        child: FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const BookAppointmentScreen()),
            );
          },
          backgroundColor: Colors.blue.shade600,
          icon: const Icon(Icons.add, color: Colors.white),
          label: const Text("Buat Janji Baru", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        ),
      ) : null,
    );
  }

  Widget _buildNavButton(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, color: Colors.white60, size: 20),
    );
  }

  Widget _buildCalendarGrid(Color primary) {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1);
    final lastDayOfMonth = DateTime(now.year, now.month + 1, 0);
    final daysInMonth = lastDayOfMonth.day;
    final firstWeekday = firstDayOfMonth.weekday % 7; // 0 for Sunday
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: days
              .map((day) => Text(
                    day,
                    style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold),
                  ))
              .toList(),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
          ),
          itemCount: daysInMonth + firstWeekday,
          itemBuilder: (context, index) {
            if (index < firstWeekday) return const SizedBox.shrink();
            
            final day = index - firstWeekday + 1;
            final isSelected = day == now.day;
            final isToday = day == now.day;
            
            return Container(
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected ? primary : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                boxShadow: isSelected ? [BoxShadow(color: primary.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))] : null,
                border: isToday && !isSelected ? Border.all(color: primary.withOpacity(0.5)) : null,
              ),
              child: Text(
                day.toString(),
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white,
                  fontWeight: isSelected || isToday ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildAppointmentCard(
    BuildContext context, {
    required Appointment appointment,
    double opacity = 1.0,
  }) {
    final isAdmin = AppState.isAdmin();
    final primaryColor = Theme.of(context).primaryColor;
    
    return Opacity(
      opacity: opacity,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Column(
              children: [
                Text(appointment.time, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                Text(appointment.status.toUpperCase(), style: TextStyle(fontSize: 8, color: appointment.status == 'confirmed' ? Colors.greenAccent : primaryColor, fontWeight: FontWeight.bold)),
              ],
            ),
            const VerticalDivider(width: 32, indent: 4, endIndent: 4),
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [primaryColor.withOpacity(0.2), primaryColor.withOpacity(0.05)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: primaryColor.withOpacity(0.1)),
              ),
              child: Center(
                child: Text(
                  appointment.customerName.isNotEmpty ? appointment.customerName.substring(0, 1).toUpperCase() : "?",
                  style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(appointment.customerName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  Text(appointment.serviceName, style: const TextStyle(color: Colors.white60, fontSize: 13)),
                ],
              ),
            ),
            if (isAdmin) 
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (appointment.status == 'done')
                    IconButton(
                      icon: const Icon(Icons.receipt_long_rounded, color: Colors.greenAccent, size: 20),
                      onPressed: () => _showReceiptDialog(context, appointment),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      tooltip: "Cetak Nota",
                    ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      _showStatusDialog(context, appointment);
                    },
                    child: const Text("UBAH", style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.w900, fontSize: 10)),
                  ),
                ],
              )
            else
              const Icon(Icons.more_vert, color: Colors.white38),
          ],
        ),
      ),
    );
  }

  void _showStatusDialog(BuildContext context, Appointment apt) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: Text("Ubah Status: ${apt.customerName}", style: const TextStyle(color: Colors.white, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _statusOption(context, apt.id, 'scheduled', 'Menunggu', Colors.orange),
            _statusOption(context, apt.id, 'confirmed', 'Konfirmasi', Colors.green),
            _statusOption(context, apt.id, 'done', 'Selesai', Colors.blue),
            _statusOption(context, apt.id, 'cancelled', 'Batal', Colors.red),
          ],
        ),
      ),
    );
  }

  Widget _statusOption(BuildContext context, String id, String status, String label, Color color) {
    return ListTile(
      title: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
      onTap: () async {
        await SupabaseService.updateAppointmentStatus(id, status);
        if (context.mounted) Navigator.pop(context);
      },
    );
  }

  void _showReceiptDialog(BuildContext context, Appointment apt) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 48),
            const SizedBox(height: 16),
            const Text("KWITANSI PEMBAYARAN", style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const Divider(height: 32, color: Colors.white12),
            _receiptRow("Layanan", apt.serviceName),
            _receiptRow("Pelanggan", apt.customerName),
            _receiptRow("Barber", apt.barberName),
            _receiptRow("Waktu", apt.time),
            const Divider(height: 32, color: Colors.white12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text("TOTAL", style: TextStyle(fontWeight: FontWeight.bold)),
                Text("Rp ${apt.paymentAmount}", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.greenAccent, fontSize: 18)),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  // Simulate sharing
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text("Kwitansi dikirim ke WhatsApp!"),
                      backgroundColor: Colors.green.shade700,
                    ),
                  );
                },
                icon: const Icon(Icons.share, size: 18),
                label: const Text("BAGIKAN NOTA"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _receiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white38, fontSize: 12)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildLunchBreak(Color primary) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: primary.withOpacity(0.2), height: 1, endIndent: 16)),
          Text(
            "ISTIRAHAT SIANG",
            style: TextStyle(color: primary, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2),
          ),
          Expanded(child: Divider(color: primary.withOpacity(0.2), height: 1, indent: 16)),
        ],
      ),
    );
  }
}
