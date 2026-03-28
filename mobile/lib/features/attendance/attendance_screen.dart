import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import 'dart:async';
import 'package:intl/intl.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> with TickerProviderStateMixin {
  Attendance? _todayAttendance;
  bool _isLoading = true;
  late DateTime _now;
  late Timer _timer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) setState(() => _now = DateTime.now());
    });

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _loadData();
  }

  @override
  void dispose() {
    _timer.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final profile = AppState.currentUserProfile.value;
    if (profile == null) return;

    try {
      final attendance = await SupabaseService.getTodayAttendance(profile['id']);
      if (mounted) {
        setState(() {
          _todayAttendance = attendance;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error loading attendance: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleCheckInOut() async {
    final profile = AppState.currentUserProfile.value;
    if (profile == null) return;

    setState(() => _isLoading = true);

    try {
      if (_todayAttendance == null) {
        await SupabaseService.checkIn(profile['id']);
      } else if (_todayAttendance!.checkOut == null) {
        await SupabaseService.checkOut(_todayAttendance!.id);
      }
      await _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_todayAttendance?.checkOut == null ? "Berhasil Check-in!" : "Berhasil Check-out!"),
            backgroundColor: Colors.greenAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      debugPrint("Error check in/out: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Gagal: $e"), backgroundColor: Colors.redAccent, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final scaffoldBg = Theme.of(context).scaffoldBackgroundColor;

    String statusText = "BELUM ABSEN";
    Color statusColor = Colors.white38;
    if (_todayAttendance != null) {
      if (_todayAttendance!.checkOut != null) {
        statusText = "SUDAH PULANG";
        statusColor = Colors.greenAccent;
      } else {
        statusText = "SUDAH MASUK";
        statusColor = primaryColor;
      }
    }

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        title: const Text("Presensi Kehadiran", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              children: [
                const SizedBox(height: 40),
                // Digital Clock
                _buildDigitalClock(primaryColor),
                
                const SizedBox(height: 12),
                Text(
                  DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(_now),
                  style: const TextStyle(color: Colors.white60, fontSize: 16),
                ),
                
                const Spacer(),
                
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: statusColor.withOpacity(0.2)),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(color: statusColor, fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 12),
                  ),
                ),
                
                const SizedBox(height: 40),
                
                // Main Action Button
                _buildAttendanceButton(primaryColor),
                
                const Spacer(),
                
                // Timeline / History Info
                if (_todayAttendance != null) _buildTodayDetails(primaryColor),
                
                const SizedBox(height: 60),
              ],
            ),
          ),
    );
  }

  Widget _buildDigitalClock(Color primary) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _clockSegment(DateFormat('HH').format(_now)),
        const Text(" : ", style: TextStyle(fontSize: 40, color: Colors.white24, fontWeight: FontWeight.bold)),
        _clockSegment(DateFormat('mm').format(_now)),
        const Text(" : ", style: TextStyle(fontSize: 40, color: Colors.white24, fontWeight: FontWeight.bold)),
        _clockSegment(DateFormat('ss').format(_now), fontSize: 32, isSmall: true),
      ],
    );
  }

  Widget _clockSegment(String text, {double fontSize = 64, bool isSmall = false}) {
    return Text(
      text,
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: FontWeight.w900,
        color: Colors.white,
        letterSpacing: -2,
      ),
    );
  }

  Widget _buildAttendanceButton(Color primary) {
    final bool isCheckedOut = _todayAttendance?.checkOut != null;
    final bool isCheckedIn = _todayAttendance != null && _todayAttendance!.checkOut == null;
    
    Color btnColor = isCheckedIn ? Colors.redAccent : primary;
    String btnLabel = isCheckedIn ? "TAP UNTUK PULANG" : "TAP UNTUK MASUK";
    IconData btnIcon = isCheckedIn ? Icons.logout_rounded : Icons.login_rounded;

    if (isCheckedOut) {
      return Container(
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          shape: BoxShape.circle,
        ),
        child: const Column(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 80),
            SizedBox(height: 16),
            Text("ABSENSI SELESAI", style: TextStyle(color: Colors.white38, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return ScaleTransition(
      scale: Tween(begin: 1.0, end: 1.05).animate(_pulseController),
      child: GestureDetector(
        onTap: _handleCheckInOut,
        child: Container(
          width: 240,
          height: 240,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: btnColor.withOpacity(0.1),
            border: Border.all(color: btnColor.withOpacity(0.3), width: 2),
            boxShadow: [
              BoxShadow(color: btnColor.withOpacity(0.2), blurRadius: 40, spreadRadius: 10),
            ],
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(btnIcon, color: btnColor, size: 64),
                const SizedBox(height: 16),
                Text(
                  btnLabel,
                  style: TextStyle(color: btnColor, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTodayDetails(Color primary) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _timeInfo("Masuk", _formatTime(_todayAttendance?.checkIn), primary),
          Container(width: 1, height: 40, color: Colors.white10),
          _timeInfo("Pulang", _formatTime(_todayAttendance?.checkOut), Colors.redAccent),
        ],
      ),
    );
  }

  Widget _timeInfo(String label, String time, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(time, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
      ],
    );
  }

  String _formatTime(String? iso) {
    if (iso == null) return "--:--";
    try {
      if (iso.contains('T')) {
        final dt = DateTime.parse(iso).toLocal();
        return DateFormat('HH:mm').format(dt);
      }
      // If it's already HH:mm:ss, return HH:mm
      return iso.length >= 5 ? iso.substring(0, 5) : iso;
    } catch (e) {
      debugPrint("Time parse error: $e");
      return "--:--";
    }
  }
}
