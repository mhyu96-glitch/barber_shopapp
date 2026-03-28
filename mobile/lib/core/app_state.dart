import 'package:flutter/material.dart';

enum UserRole { admin, barber, customer }

class AppState {
  static final ValueNotifier<UserRole> currentRole = ValueNotifier(UserRole.admin);
  static final ValueNotifier<String> currentBarberName = ValueNotifier('Marcus');
  static final ValueNotifier<int> selectedIndex = ValueNotifier(0);
  static final ValueNotifier<Map<String, dynamic>?> currentUserProfile = ValueNotifier(null);
  
  // Multi-tenant
  static final ValueNotifier<String?> shopId = ValueNotifier(null);
  static final ValueNotifier<String?> branchId = ValueNotifier(null);
  static final ValueNotifier<String> shopName = ValueNotifier('BarberPro Studio');
  static final ValueNotifier<bool> isSuperAdmin = ValueNotifier(false);
  
  // Printer Settings
  static final ValueNotifier<String?> printerName = ValueNotifier(null);
  static final ValueNotifier<String?> printerAddress = ValueNotifier(null);
  static final ValueNotifier<String> printerHeader = ValueNotifier("BARBERPRO STUDIO");
  static final ValueNotifier<String> printerFooter = ValueNotifier("Terima Kasih!\nSilakan Datang Kembali");
  static final ValueNotifier<String?> printerLogoPath = ValueNotifier(null);
  
  static bool isAdmin() => currentRole.value == UserRole.admin;
  static bool isAuthenticated() => currentUserProfile.value != null;
}
