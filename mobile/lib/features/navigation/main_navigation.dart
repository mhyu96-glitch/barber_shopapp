import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../core/notification_service.dart';
import '../dashboard/dashboard_screen.dart';
import '../appointments/appointments_screen.dart';
import '../customers/customers_screen.dart';
import '../profile/profile_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  final List<Widget> _screens = [
    const DashboardScreen(),
    const AppointmentsScreen(),
    const CustomersScreen(),
    const ProfileScreen(),
  ];

  RealtimeChannel? _bookingChannel;

  @override
  void initState() {
    super.initState();
    _initNotifications();
    _subscribeToBookings();
  }

  Future<void> _initNotifications() async {
    await notificationService.initialize();
  }

  void _subscribeToBookings() {
    _bookingChannel = SupabaseService.subscribeToNewBookings((booking) {
      final customerName = booking['customer_name'] ?? 'Pelanggan';
      final serviceName = booking['service_name'] ?? 'Layanan';
      final time = booking['time'] ?? '';

      notificationService.showBookingNotification(
        customerName: customerName,
        serviceName: serviceName,
        time: time,
      );

      if (mounted) {
        final gold = const Color(0xFFD4AF37);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: gold.withOpacity(0.1), shape: BoxShape.circle),
                    child: Icon(Icons.notifications_active_rounded, color: gold, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('NEW APPOINTMENT',
                            style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, fontSize: 11, letterSpacing: 1.5)),
                        const SizedBox(height: 2),
                        Text('$customerName - $serviceName ($time)',
                            style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            backgroundColor: const Color(0xFF1C1B1B),
            elevation: 10,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: gold.withOpacity(0.1)),
            ),
            duration: const Duration(seconds: 6),
            action: SnackBarAction(
              label: 'VIEW',
              textColor: gold,
              onPressed: () {
                AppState.selectedIndex.value = 1;
              },
            ),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _bookingChannel?.unsubscribe();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gold = const Color(0xFFD4AF37);
    final backgroundDark = const Color(0xFF0D0D0D);

    return ValueListenableBuilder<int>(
      valueListenable: AppState.selectedIndex,
      builder: (context, selectedIndex, child) {
        return Scaffold(
          body: IndexedStack(
            index: selectedIndex,
            children: _screens,
          ),
          bottomNavigationBar: Container(
            height: 90 + MediaQuery.of(context).padding.bottom,
            decoration: BoxDecoration(
              color: backgroundDark,
              border: Border(
                top: BorderSide(
                  color: Colors.white.withOpacity(0.05),
                  width: 0.5,
                ),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.5),
                  blurRadius: 20,
                  offset: const Offset(0, -10),
                ),
              ],
            ),
            child: BottomNavigationBar(
              currentIndex: selectedIndex,
              onTap: (index) => AppState.selectedIndex.value = index,
              type: BottomNavigationBarType.fixed,
              backgroundColor: Colors.transparent,
              elevation: 0,
              selectedItemColor: gold,
              unselectedItemColor: Colors.white.withOpacity(0.2),
              selectedFontSize: 9,
              unselectedFontSize: 9,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 1.5),
              items: [
                _buildNavItem(Icons.grid_view_outlined, Icons.grid_view_rounded, 'COMMAND'),
                _buildNavItem(Icons.calendar_today_outlined, Icons.calendar_today_rounded, 'SCHEDULE'),
                _buildNavItem(Icons.people_outline_rounded, Icons.people_rounded, 'CLIENTS'),
                _buildNavItem(Icons.account_circle_outlined, Icons.account_circle_rounded, 'PROFILE'),
              ],
            ),
          ),
        );
      },
    );
  }

  BottomNavigationBarItem _buildNavItem(IconData icon, IconData activeIcon, String label) {
    return BottomNavigationBarItem(
      icon: Padding(
        padding: const EdgeInsets.only(bottom: 6, top: 12),
        child: Icon(icon, size: 22),
      ),
      activeIcon: Padding(
        padding: const EdgeInsets.only(bottom: 6, top: 12),
        child: Icon(activeIcon, size: 24),
      ),
      label: label,
    );
  }
}
