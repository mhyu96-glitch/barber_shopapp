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
    const primaryColor = Color(0xFFD4AF37); // Executive Gold
    const backgroundDark = Color(0xFF0D0D0D); // Deep Obsidian
    const cardColor = Color(0xFF1C1B1B);

    return MaterialApp(
      title: 'BarberPro Studio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        primaryColor: primaryColor,
        scaffoldBackgroundColor: backgroundDark,
        cardTheme: CardThemeData(
          color: cardColor,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: Colors.white.withOpacity(0.05))),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            fontFamily: 'Epilogue',
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: -0.5,
          ),
        ),
        textTheme: TextTheme(
          headlineLarge: const TextStyle(fontFamily: 'Epilogue', fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1.0),
          headlineMedium: const TextStyle(fontFamily: 'Epilogue', fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white),
          titleLarge: const TextStyle(fontFamily: 'Epilogue', fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white),
          bodyLarge: const TextStyle(fontFamily: 'Inter', color: Colors.white, fontSize: 16),
          bodyMedium: TextStyle(fontFamily: 'Inter', color: Colors.white.withOpacity(0.7), fontSize: 14),
          labelSmall: TextStyle(fontFamily: 'Inter', color: primaryColor, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5),
        ),
        colorScheme: ColorScheme.dark(
          primary: primaryColor,
          onPrimary: const Color(0xFF412D00),
          surface: cardColor,
          background: backgroundDark,
          error: Colors.redAccent,
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: backgroundDark,
          selectedItemColor: primaryColor,
          unselectedItemColor: Colors.white.withOpacity(0.3),
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 10, letterSpacing: 1.0),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 10, letterSpacing: 1.0),
          elevation: 0,
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
