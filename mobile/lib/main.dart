import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/app_state.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/signup_screen.dart';
import 'features/attendance/attendance_screen.dart';
import 'features/dashboard/attendance_report_screen.dart';
import 'features/navigation/main_navigation.dart';
import 'features/super_admin/super_admin_dashboard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await initializeDateFormatting('id_ID', null);
  
  await Supabase.initialize(
    url: 'https://lottgkrtjwbyhxtjjkge.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdHRna3J0andieWh4dGpqa2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTQ2MTUsImV4cCI6MjA5MDA5MDYxNX0._675IGU-TOakpqrX0P3OCB68Ef0xY4jVdl_bRIaRuzw',
  );
  
  runApp(const BarberProApp());
}

class BarberProApp extends StatelessWidget {
  const BarberProApp({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFFFAB00); // Executive Amber
    const backgroundDark = Color(0xFF0D0D0D); // Deep Obsidian

    return MaterialApp(
      title: 'BarberPro Studio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: primaryColor,
        scaffoldBackgroundColor: backgroundDark,
        cardTheme: CardThemeData(
          color: Colors.white.withOpacity(0.05),
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Colors.white70),
        ),
        colorScheme: const ColorScheme.dark(
          primary: primaryColor,
          surface: backgroundDark,
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignUpScreen(),
        '/attendance': (context) => const AttendanceScreen(),
        '/attendance-report': (context) => const AttendanceReportScreen(),
        '/home': (context) => const MainNavigation(),
        '/super-admin': (context) => const SuperAdminDashboard(),
      },
    );
  }
}
