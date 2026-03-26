import 'package:flutter/material.dart';

enum UserRole { admin, barber, customer }

class AppState {
  static final ValueNotifier<UserRole> currentRole = ValueNotifier(UserRole.admin);
  static final ValueNotifier<String> currentBarberName = ValueNotifier('Marcus');
  static final ValueNotifier<int> selectedIndex = ValueNotifier(0);
  
  static bool isAdmin() => currentRole.value == UserRole.admin;
}
