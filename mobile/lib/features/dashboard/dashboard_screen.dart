import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import '../appointments/book_appointment_screen.dart';
import '../services/services_screen.dart';
import 'reports_screen.dart';
import 'dart:async';

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
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final stats = await SupabaseService.getDashboardStats();
      if (mounted) {
        setState(() {
          _stats = stats;
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
    return "${days[now.weekday % 7]}, ${now.day} ${months[now.month - 1]} ${now.year}";
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final scaffoldBg = Theme.of(context).scaffoldBackgroundColor;
    final isAdmin = AppState.isAdmin();

    return Scaffold(
      backgroundColor: scaffoldBg,
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 140,
              floating: false,
              pinned: true,
              backgroundColor: scaffoldBg,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                title: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                     Text(_formattedDate, style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.4), letterSpacing: 0.5)),
                     Text(isAdmin ? "Dashboard Admin" : "Dashboard Barber", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.5)),
                  ],
                ),
              ),
              actions: [
                Container(
                  margin: const EdgeInsets.only(right: 20, top: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.notifications_rounded, size: 20, color: Colors.white70),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Belum ada notifikasi baru")),
                      );
                    },
                  ),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    
                    // --- Revenue Analytics Card (Only for Admin) ---
                    if (isAdmin) _buildPremiumRevenueCard(primaryColor),
                    
                    const SizedBox(height: 32),
                    
                    // --- Quick Actions ---
                    const Text("Aksi Cepat", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white70)),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildModernAction(context, Icons.add_circle_outline_rounded, "Janji", primaryColor, () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const BookAppointmentScreen()));
                        }),
                        _buildModernAction(context, Icons.person_add_rounded, "Pelanggan", Colors.blueAccent, () {
                          AppState.selectedIndex.value = 2;
                        }),
                        _buildModernAction(context, Icons.inventory_2_outlined, "Layanan", Colors.purpleAccent, () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const ServicesScreen()));
                        }),
                        _buildModernAction(context, Icons.analytics_outlined, "Laporan", Colors.greenAccent, () {
                          Navigator.push(context, MaterialPageRoute(builder: (context) => const ReportsScreen()));
                        }),
                      ],
                    ),

                    const SizedBox(height: 32),
                    
                    // --- Stats Grid ---
                    const Text("Statistik Performa", style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white70)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: _buildFrostedStat("Selesai", "${_stats['total_done']}", Icons.check_circle_rounded, primaryColor)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildFrostedStat("Pelanggan", "${_stats['total_customers']}", Icons.people_rounded, Colors.blueAccent)),
                      ],
                    ),

                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(isAdmin ? "Semua Antrian" : "Antrian Anda", style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white70)),
                        GestureDetector(
                          onTap: () {
                            AppState.selectedIndex.value = 1; // Tab Jadwal
                          },
                          child: Text("Lihat Semua", style: TextStyle(fontSize: 12, color: primaryColor, fontWeight: FontWeight.bold))
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Premium Queue List from Supabase Real-time
                    StreamBuilder<List<Appointment>>(
                      stream: SupabaseService.getAppointmentsStream(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red));
                        }
                        final appointments = snapshot.data ?? [];
                        if (appointments.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Center(child: Text("Belum ada antrian", style: TextStyle(color: Colors.white38))),
                          );
                        }
                        return Column(
                          children: appointments.take(5).map((apt) => _buildPremiumQueueItem(
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

  Widget _buildPremiumRevenueCard(Color primary) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 40, offset: const Offset(0, 20)),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("ESTIMASI PENDAPATAN HARI INI", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white.withOpacity(0.4), letterSpacing: 1.5)),
                        const SizedBox(height: 8),
                        _isLoading 
                          ? const SizedBox(height: 38, width: 38, child: CircularProgressIndicator(strokeWidth: 2))
                          : Text("Rp ${_stats['revenue_today'].toInt()}", style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(Icons.account_balance_wallet_rounded, color: primary, size: 24),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.greenAccent.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.trending_up, size: 14, color: Colors.greenAccent),
                          SizedBox(width: 6),
                          Text("+15.4%", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.greenAccent)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text("dari minggu lalu", style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.3))),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernAction(BuildContext context, IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: color.withOpacity(0.15)),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 10),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildFrostedStat(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 16),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.w600, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildPremiumQueueItem(BuildContext context, String name, String time, String sub, bool isInProcess) {
    final primaryColor = Theme.of(context).primaryColor;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isInProcess ? [primaryColor, primaryColor.withOpacity(0.7)] : [Colors.white10, Colors.white.withOpacity(0.05)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name.substring(0, 1) : "?",
                style: TextStyle(color: isInProcess ? Colors.black : Colors.white38, fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                const SizedBox(height: 2),
                Text(sub, style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.3))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(time, style: TextStyle(fontWeight: FontWeight.bold, color: primaryColor, fontSize: 15)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isInProcess ? Colors.greenAccent.withOpacity(0.1) : Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isInProcess ? "DALAM PROSES" : "MENUNGGU",
                  style: TextStyle(fontSize: 8, color: isInProcess ? Colors.greenAccent : Colors.white24, fontWeight: FontWeight.w900, letterSpacing: 1),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
