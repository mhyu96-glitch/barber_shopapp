import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import '../../widgets/atelier_card.dart';
import '../../widgets/atelier_button.dart';
import '../../widgets/atelier_aura.dart';
import '../appointments/book_appointment_screen.dart';
import '../services/services_screen.dart';
import 'reports_screen.dart';
import 'dart:async';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic> _stats = {
    'revenue_today': 0.0,
    'total_done': 0,
    'total_customers': 0,
  };
  Attendance? _todayAttendance;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final isAdmin = AppState.isAdmin();
      final profile = AppState.currentUserProfile.value;
      final barberId = isAdmin ? null : profile?['id'];
      
      final stats = await SupabaseService.getDashboardStats(barberId: barberId);
      final attendance = !isAdmin ? await SupabaseService.getTodayAttendance(profile?['id'] ?? '') : null;
      
      if (mounted) {
        setState(() {
          _stats = stats;
          _todayAttendance = attendance;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error loading dashboard stats: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String get _formattedDate {
    final now = DateTime.now();
    final months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    final days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return "${days[now.weekday % 7]}, ${now.day} ${months[now.month - 1]} ${now.year} • WITA";
  }

  @override
  Widget build(BuildContext context) {
    final goldColor = const Color(0xFFD4AF37);
    final isAdmin = AppState.isAdmin();

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadStats,
        color: goldColor,
        backgroundColor: const Color(0xFF1C1B1B),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 160,
              floating: false,
              pinned: true,
              backgroundColor: const Color(0xFF0D0D0D),
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                title: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                     Text(
                       _formattedDate.toUpperCase(), 
                       style: TextStyle(fontSize: 9, color: goldColor.withOpacity(0.6), fontWeight: FontWeight.w900, letterSpacing: 2.0)
                     ),
                     const SizedBox(height: 2),
                     Text(
                       isAdmin ? "ATELIER COMMAND" : "BARBER WORKSPACE", 
                       style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1.0)
                     ),
                  ],
                ),
              ),
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: IconButton(
                    icon: Icon(Icons.notifications_none_rounded, color: goldColor.withOpacity(0.8)),
                    onPressed: () {},
                  ),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    
                    // --- Aura Real-time Tracking (NEW) ---
                    Center(
                      child: StreamBuilder<List<Appointment>>(
                        stream: SupabaseService.getAppointmentsStream(
                          barberId: isAdmin ? null : AppState.currentUserProfile.value?['id']
                        ),
                        builder: (context, snapshot) {
                          final appointments = snapshot.data ?? [];
                          final doneCount = appointments.where((a) => a.status == 'done').length;
                          final totalCount = appointments.length;
                          
                          double progress = 0.0;
                          String label = "0";
                          String subLabel = "QUEUE CLEAR";
                          
                          if (isAdmin) {
                            // Admin shows revenue progress vs a conceptual 10M daily goal
                            const double dailyGoal = 10000000;
                            progress = (_stats['revenue_today'] ?? 0.0) / dailyGoal;
                            label = "${(progress * 100).toInt()}%";
                            subLabel = "REVENUE TARGET";
                          } else {
                            // Barber shows task completion
                            progress = totalCount > 0 ? doneCount / totalCount : 0.0;
                            label = "$doneCount/$totalCount";
                            subLabel = "TASKS COMPLETED";
                          }

                          return AtelierAura(
                            progress: progress.clamp(0.0, 1.0),
                            label: label,
                            subLabel: subLabel,
                            size: 200,
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 32),
                    
                    // --- Revenue Analytics (Only for Admin) ---
                    if (isAdmin) _buildAtelierRevenueCard(goldColor),
                    
                    const SizedBox(height: 28),
                    
                    // --- Attendance Quick Action ---
                    _buildAtelierAttendanceCard(goldColor, isAdmin),
                    
                    const SizedBox(height: 40),
                    
                    // --- Quick Actions Grid ---
                    Text(
                      "OPERATIONAL CONTROLS", 
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.3), letterSpacing: 2.5)
                    ),
                    const SizedBox(height: 20),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildAtelierAction(Icons.add_task_rounded, "JANJI TEMU", goldColor, () {
                            Navigator.push(context, MaterialPageRoute(builder: (context) => const BookAppointmentScreen()));
                          }),
                          const SizedBox(width: 16),
                          _buildAtelierAction(Icons.person_outline_rounded, "PELANGGAN", Colors.blueAccent, () {
                            AppState.selectedIndex.value = 2;
                          }),
                          if (isAdmin) ...[
                            const SizedBox(width: 16),
                            _buildAtelierAction(Icons.grid_view_rounded, "LAYANAN", Colors.purpleAccent, () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const ServicesScreen()));
                            }),
                            const SizedBox(width: 16),
                            _buildAtelierAction(Icons.analytics_outlined, "LAPORAN", Colors.greenAccent, () {
                              Navigator.push(context, MaterialPageRoute(builder: (context) => const ReportsScreen()));
                            }),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 44),
                    
                    // --- Detailed Performance Metrics ---
                    Text(
                      "PERFORMANCE METRICS", 
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.3), letterSpacing: 2.5)
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(child: _buildMetricCard("COMPLETED", "${_stats['total_done']}", Icons.auto_awesome_rounded, goldColor)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildMetricCard("CLIENTS", "${_stats['total_customers']}", Icons.face_retouching_natural_rounded, Colors.blueAccent)),
                      ],
                    ),

                    const SizedBox(height: 44),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          isAdmin ? "GLOBAL QUEUE" : "PERSONAL QUEUE", 
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.3), letterSpacing: 2.5)
                        ),
                        TextButton(
                          onPressed: () => AppState.selectedIndex.value = 1,
                          child: Text("VIEW ALL", style: TextStyle(fontSize: 11, color: goldColor, fontWeight: FontWeight.w900, letterSpacing: 1.0))
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Real-time Queue list
                    StreamBuilder<List<Appointment>>(
                      stream: SupabaseService.getAppointmentsStream(
                        barberId: isAdmin ? null : AppState.currentUserProfile.value?['id']
                      ),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
                        }
                        final appointments = snapshot.data ?? [];
                        if (appointments.isEmpty) {
                          return AtelierCard(
                            padding: const EdgeInsets.all(32),
                            child: Center(
                              child: Text("NO ACTIVE APPOINTMENTS", style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5))
                            )
                          );
                        }
                        return Column(
                          children: appointments.take(5).map((apt) => _buildAtelierQueueItem(
                            context, 
                            apt.customerName, 
                            apt.time, 
                            apt.serviceName, 
                            apt.status == 'confirmed' || apt.status == 'done'
                          )).toList(),
                        );
                      },
                    ),
                    
                    const SizedBox(height: 120),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAtelierRevenueCard(Color gold) {
    return AtelierCard(
      gradient: LinearGradient(
        colors: [const Color(0xFF1C1B1B), const Color(0xFF131313).withOpacity(0.8)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "ESTIMATED DAILY REVENUE", 
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: gold.withOpacity(0.5), letterSpacing: 2.0)
              ),
              Icon(Icons.auto_graph_rounded, color: gold.withOpacity(0.3), size: 20),
            ],
          ),
          const SizedBox(height: 16),
          _isLoading 
            ? const SizedBox(height: 44, child: Center(child: CircularProgressIndicator(strokeWidth: 2)))
            : Text(
                "IDR ${NumberFormat("#,###", "id_ID").format(_stats['revenue_today'])}", 
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1.5)
              ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.greenAccent.withOpacity(0.05),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.greenAccent.withOpacity(0.1)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.arrow_upward_rounded, size: 14, color: Colors.greenAccent),
                const SizedBox(width: 6),
                const Text("+12.5%", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.greenAccent, letterSpacing: 0.5)),
                const SizedBox(width: 8),
                Text("vs last week", style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.3))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAtelierAttendanceCard(Color gold, bool isAdmin) {
    if (isAdmin) {
      return GestureDetector(
        onTap: () => Navigator.pushNamed(context, '/attendance-report'),
        child: AtelierGlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: gold.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(Icons.badge_outlined, color: gold, size: 22),
              ),
              const SizedBox(width: 20),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("STAFF ATTENDANCE", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: 1.0)),
                    SizedBox(height: 2),
                    Text("Monitor barber presence today", style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: gold.withOpacity(0.5)),
            ],
          ),
        ),
      );
    }

    final bool isCheckedIn = _todayAttendance != null;
    final bool isCheckedOut = _todayAttendance?.checkOut != null;
    
    String statusStr = "OFF DUTY";
    Color statusColor = Colors.white24;
    if (isCheckedIn) {
      statusStr = isCheckedOut ? "COMPLETED" : "ON DUTY";
      statusColor = isCheckedOut ? Colors.greenAccent : gold;
    }

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, '/attendance'),
      child: AtelierGlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.schedule_rounded, color: statusColor, size: 22),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("SHIFT STATUS", style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2.0)),
                  const SizedBox(height: 2),
                  Text(statusStr, style: TextStyle(color: statusColor, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: -0.5)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white10, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildAtelierAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          AtelierCard(
            width: 76,
            height: 76,
            padding: EdgeInsets.zero,
            color: color.withOpacity(0.05),
            border: Border.all(color: color.withOpacity(0.1)),
            child: Center(child: Icon(icon, color: color, size: 28)),
          ),
          const SizedBox(height: 12),
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1.0)),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color) {
    return AtelierCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 24),
          Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1.0)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.w800, letterSpacing: 2.0)),
        ],
      ),
    );
  }

  Widget _buildAtelierQueueItem(BuildContext context, String name, String time, String sub, bool isActive) {
    final gold = const Color(0xFFD4AF37);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AtelierCard(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: isActive ? gold : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  name.isNotEmpty ? name.substring(0, 1).toUpperCase() : "?",
                  style: TextStyle(color: isActive ? Colors.black : Colors.white38, fontWeight: FontWeight.w900, fontSize: 22),
                ),
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17, color: Colors.white, letterSpacing: -0.5)),
                  const SizedBox(height: 4),
                  Text(sub, style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(time, style: TextStyle(fontWeight: FontWeight.w900, color: gold, fontSize: 17, letterSpacing: -0.5)),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isActive ? Colors.greenAccent.withOpacity(0.1) : Colors.white10,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isActive ? "ACTIVE" : "PENDING",
                    style: TextStyle(fontSize: 8, color: isActive ? Colors.greenAccent : Colors.white24, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
