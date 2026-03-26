import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../navigation/main_navigation.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  UserRole _selectedRole = UserRole.admin;
  String _selectedBarber = 'Marcus';

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    
    return Scaffold(
      body: Container(
        padding: const EdgeInsets.all(32),
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.content_cut_rounded, size: 80, color: primaryColor),
            ),
            const SizedBox(height: 32),
            const Text(
              "BARBERPRO STUDIO",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 2),
            ),
            const Text(
              "Pilih Akses Masuk",
              style: TextStyle(color: Colors.white38, fontSize: 14),
            ),
            const SizedBox(height: 48),
            
            // Role Selector
            Row(
              children: [
                Expanded(
                  child: _buildRoleButton(UserRole.admin, "Admin", Icons.admin_panel_settings_rounded),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildRoleButton(UserRole.barber, "Barber", Icons.content_cut_rounded),
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            if (_selectedRole == UserRole.barber) ...[
               const Text("Pilih Nama Barber", style: TextStyle(color: Colors.white60, fontSize: 12)),
               const SizedBox(height: 12),
               Container(
                 padding: const EdgeInsets.symmetric(horizontal: 16),
                 decoration: BoxDecoration(
                   color: Colors.white.withOpacity(0.05),
                   borderRadius: BorderRadius.circular(12),
                 ),
                 child: DropdownButton<String>(
                   value: _selectedBarber,
                   isExpanded: true,
                   underline: const SizedBox(),
                   dropdownColor: const Color(0xFF1A1A1A),
                   items: ['Marcus', 'Julian', 'Elias', 'Victor'].map((name) {
                     return DropdownMenuItem(value: name, child: Text(name));
                   }).toList(),
                   onChanged: (val) => setState(() => _selectedBarber = val!),
                 ),
               ),
               const SizedBox(height: 32),
            ],
            
            ElevatedButton(
              onPressed: () {
                AppState.currentRole.value = _selectedRole;
                AppState.currentBarberName.value = _selectedBarber;
                Navigator.pushReplacementNamed(context, '/home');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 60),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text("MASUK SEKARANG", style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleButton(UserRole role, String label, IconData icon) {
    bool isSelected = _selectedRole == role;
    final primaryColor = Theme.of(context).primaryColor;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = role),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor.withOpacity(0.1) : Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? primaryColor : Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? primaryColor : Colors.white38),
            const SizedBox(height: 10),
            Text(label, style: TextStyle(color: isSelected ? Colors.white : Colors.white38, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
