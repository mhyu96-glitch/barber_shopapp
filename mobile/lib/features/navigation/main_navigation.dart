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
    await NotificationService.initialize();
  }

  void _subscribeToBookings() {
    _bookingChannel = SupabaseService.subscribeToNewBookings((booking) {
      final customerName = booking['customer_name'] ?? 'Pelanggan';
      final serviceName = booking['service_name'] ?? 'Layanan';
      final time = booking['time'] ?? '';

      // Show native notification
      NotificationService.showBookingNotification(
        customerName: customerName,
        serviceName: serviceName,
        time: time,
      );

      // Show in-app SnackBar
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.notifications_active, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('📲 Booking Baru!',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('$customerName - $serviceName ($time)',
                          style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFFFFAB00),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'LIHAT',
              textColor: Colors.black,
              onPressed: () {
                AppState.selectedIndex.value = 1; // Go to Appointments tab
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
    return ValueListenableBuilder<int>(
      valueListenable: AppState.selectedIndex,
      builder: (context, selectedIndex, child) {
        return Scaffold(
          body: IndexedStack(
            index: selectedIndex,
            children: _screens,
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1), width: 0.5)),
            ),
            child: BottomNavigationBar(
              currentIndex: selectedIndex,
              onTap: (index) => AppState.selectedIndex.value = index,
              type: BottomNavigationBarType.fixed,
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              selectedItemColor: Theme.of(context).primaryColor,
              unselectedItemColor: Colors.white38,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 10),
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_outlined),
                  activeIcon: Icon(Icons.home_rounded),
                  label: 'BERANDA',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.calendar_month_outlined),
                  activeIcon: Icon(Icons.calendar_month_rounded),
                  label: 'JADWAL',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.group_outlined),
                  activeIcon: Icon(Icons.group_rounded),
                  label: 'PELANGGAN',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_outline_rounded),
                  activeIcon: Icon(Icons.person_rounded),
                  label: 'PROFIL',
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
