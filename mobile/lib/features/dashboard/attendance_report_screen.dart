import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import 'package:intl/intl.dart';

class AttendanceReportScreen extends StatefulWidget {
  const AttendanceReportScreen({super.key});

  @override
  State<AttendanceReportScreen> createState() => _AttendanceReportScreenState();
}

class _AttendanceReportScreenState extends State<AttendanceReportScreen> {
  List<Map<String, dynamic>> _reports = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    try {
      final data = await SupabaseService.getAllAttendanceToday();
      if (mounted) {
        setState(() {
          _reports = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error loading reports: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text("Laporan Kehadiran Hari Ini", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _reports.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.person_off_rounded, size: 64, color: Colors.white10),
                  const SizedBox(height: 16),
                  const Text("Belum ada yang absen hari ini", style: TextStyle(color: Colors.white38)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _reports.length,
              itemBuilder: (context, index) {
                final item = _reports[index];
                final profile = item['profiles'] as Map<String, dynamic>?;
                final name = profile?['full_name'] ?? profile?['username'] ?? 'Unknown';
                final role = profile?['role'] ?? 'barber';
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: primaryColor.withOpacity(0.1),
                        child: Text(name[0].toUpperCase(), style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text(role.toUpperCase(), style: TextStyle(color: Colors.white38, fontSize: 12, letterSpacing: 1)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          _timeLabel("Masuk", item['check_in'], primaryColor),
                          const SizedBox(height: 4),
                          _timeLabel("Pulang", item['check_out'], Colors.redAccent),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadReports,
        backgroundColor: primaryColor,
        foregroundColor: Colors.black,
        child: const Icon(Icons.refresh_rounded),
      ),
    );
  }

  Widget _timeLabel(String label, String? iso, Color color) {
    String timeStr = "--:--";
    if (iso != null) {
      try {
        if (iso.contains('T')) {
          final dt = DateTime.parse(iso).toLocal();
          timeStr = DateFormat('HH:mm').format(dt);
        } else {
          timeStr = iso.length >= 5 ? iso.substring(0, 5) : iso;
        }
      } catch (e) {
        timeStr = "--:--";
      }
    }
    
    return Row(
      children: [
        Text(label, style: const TextStyle(color: Colors.white24, fontSize: 10)),
        const SizedBox(width: 8),
        Text(timeStr, style: TextStyle(color: iso != null ? color : Colors.white10, fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}
