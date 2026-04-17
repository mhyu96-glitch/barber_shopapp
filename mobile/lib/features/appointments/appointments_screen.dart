import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import '../../widgets/atelier_card.dart';
import '../../widgets/atelier_button.dart';
import 'book_appointment_screen.dart';
import 'package:intl/intl.dart';

class AppointmentsScreen extends StatelessWidget {
  const AppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gold = const Color(0xFFD4AF37);
    final backgroundDark = const Color(0xFF0D0D0D);
    final isAdmin = AppState.isAdmin();
    
    return Scaffold(
      backgroundColor: backgroundDark,
      body: SafeArea(
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // --- Elaborate Header ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "PRECISION PLANNING",
                          style: TextStyle(fontSize: 9, color: gold.withOpacity(0.5), fontWeight: FontWeight.w900, letterSpacing: 2.0),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isAdmin ? 'GLOBAL SCHEDULE' : 'YOUR SCHEDULE',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5),
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
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: gold.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: gold.withOpacity(0.2)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.add_rounded, color: gold, size: 18),
                            const SizedBox(width: 8),
                            Text("NEW", style: TextStyle(color: gold, fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // --- Premium Calendar Control ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: AtelierCard(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildAtelierNavButton(Icons.chevron_left_rounded, gold),
                          Text(
                            "APRIL 2026",
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: gold, letterSpacing: 2.0),
                          ),
                          _buildAtelierNavButton(Icons.chevron_right_rounded, gold),
                        ],
                      ),
                      const SizedBox(height: 28),
                      _buildAtelierCalendarGrid(gold),
                    ],
                  ),
                ),
              ),
            ),

            // --- List Controls Segment ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 44, 24, 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "TODAY'S APPOINTMENTS",
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.3), letterSpacing: 2.0),
                    ),
                    StreamBuilder<List<Appointment>>(
                      stream: SupabaseService.getAppointmentsStream(),
                      builder: (context, snapshot) {
                        final count = snapshot.data?.length ?? 0;
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            "$count SLOTS USED",
                            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.0),
                          ),
                        );
                      }
                    ),
                  ],
                ),
              ),
            ),

            // --- Elegant Appointment Stream ---
            StreamBuilder<List<Appointment>>(
              stream: SupabaseService.getAppointmentsStream(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator())));
                }
                final appointments = snapshot.data ?? [];
                if (appointments.isEmpty) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(40.0),
                      child: Center(
                        child: Text(
                          "NO RESERVATIONS FOUND", 
                          style: TextStyle(color: Colors.white.withOpacity(0.15), fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 2.0)
                        )
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final apt = appointments[index];
                        return _buildAtelierAppointmentCard(
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
            const SliverToBoxAdapter(child: SizedBox(height: 120)),
          ],
        ),
      ),
    );
  }

  Widget _buildAtelierNavButton(IconData icon, Color gold) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Icon(icon, color: gold, size: 20),
    );
  }

  Widget _buildAtelierCalendarGrid(Color gold) {
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1);
    final lastDayOfMonth = DateTime(now.year, now.month + 1, 0);
    final daysInMonth = lastDayOfMonth.day;
    final firstWeekday = firstDayOfMonth.weekday % 7;
    
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: days
              .map((day) => Text(
                    day,
                    style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 11, fontWeight: FontWeight.w900),
                  ))
              .toList(),
        ),
        const SizedBox(height: 20),
        GridView.builder(
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
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
                color: isSelected ? gold : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
                boxShadow: isSelected ? [BoxShadow(color: gold.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 6))] : null,
                border: isToday && !isSelected ? Border.all(color: gold.withOpacity(0.3)) : null,
              ),
              child: Text(
                day.toString(),
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white.withOpacity(isSelected || isToday ? 1.0 : 0.4),
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildAtelierAppointmentCard(
    BuildContext context, {
    required Appointment appointment,
  }) {
    final isAdmin = AppState.isAdmin();
    final gold = const Color(0xFFD4AF37);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AtelierCard(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Column(
              children: [
                Text('${appointment.time} WITA', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: -0.5)),
                const SizedBox(height: 4),
                Text(
                  appointment.status.toUpperCase(), 
                  style: TextStyle(fontSize: 8, color: appointment.status == 'confirmed' ? Colors.greenAccent : gold, fontWeight: FontWeight.w900, letterSpacing: 1.0)
                ),
              ],
            ),
            const SizedBox(width: 20),
            Container(width: 1, height: 40, color: Colors.white.withOpacity(0.05)),
            const SizedBox(width: 20),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: gold.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: gold.withOpacity(0.1)),
              ),
              child: Center(
                child: Text(
                  appointment.customerName.isNotEmpty ? appointment.customerName.substring(0, 1).toUpperCase() : "?",
                  style: TextStyle(color: gold, fontWeight: FontWeight.w900, fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(appointment.customerName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white, letterSpacing: -0.5)),
                  const SizedBox(height: 2),
                  Text(appointment.serviceName, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            if (isAdmin) 
              IconButton(
                icon: Icon(Icons.tune_rounded, color: gold.withOpacity(0.6), size: 18),
                onPressed: () => _showAtelierStatusDialog(context, appointment),
              )
            else
              const Icon(Icons.chevron_right_rounded, color: Colors.white12),
          ],
        ),
      ),
    );
  }

  void _showAtelierStatusDialog(BuildContext context, Appointment apt) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1C1B1B),
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: Colors.white.withOpacity(0.05))),
        title: Text(
          "PROTOCOL UPDATE: ${apt.customerName.toUpperCase()}", 
          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1.5)
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            _atelierStatusOption(context, apt.id, 'scheduled', 'PENDING', Colors.orangeAccent),
            _atelierStatusOption(context, apt.id, 'confirmed', 'CONFIRMED', Colors.greenAccent),
            _atelierStatusOption(context, apt.id, 'done', 'COMPLETED', Colors.blueAccent),
            _atelierStatusOption(context, apt.id, 'cancelled', 'CANCELLED', Colors.redAccent),
          ],
        ),
      ),
    );
  }

  Widget _atelierStatusOption(BuildContext context, String id, String status, String label, Color color) {
    return ListTile(
      visualDensity: VisualDensity.compact,
      title: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5)),
      trailing: Icon(Icons.circle, color: color.withOpacity(0.2), size: 12),
      onTap: () async {
        await SupabaseService.updateAppointmentStatus(id, status);
        if (context.mounted) Navigator.pop(context);
      },
    );
  }
}
