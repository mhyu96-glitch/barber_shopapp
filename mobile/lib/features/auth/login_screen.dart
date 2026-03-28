import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../navigation/main_navigation.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() => _errorMessage = "Harap isi username dan password.");
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await SupabaseService.signIn(
        _usernameController.text.trim(),
        _passwordController.text.trim(),
      );

      if (response.user != null) {
        final profile = await SupabaseService.getUserProfile(response.user!.id);
        if (profile != null) {
          AppState.currentUserProfile.value = profile;
          AppState.currentBarberName.value = profile['full_name'] ?? 'Barber';
          
          // Multi-tenant: save context
          final sId = profile['shop_id'] as String?;
          AppState.shopId.value = sId;
          AppState.branchId.value = profile['branch_id'] as String?;
          
          if (sId != null) {
            final shopInfo = await SupabaseService.getShopInfo(sId);
            if (shopInfo != null && shopInfo['name'] != null) {
              AppState.shopName.value = shopInfo['name'];
            }
          }
          
          final roleStr = profile['role'] as String? ?? 'barber';
          AppState.currentRole.value = roleStr == 'admin' ? UserRole.admin : UserRole.barber;
          
          if (mounted) {
            if (AppState.isSuperAdmin.value) {
              Navigator.pushReplacementNamed(context, '/super-admin');
            } else {
              Navigator.pushReplacementNamed(context, '/home');
            }
          }
        } else {
          setState(() => _errorMessage = "Profil tidak ditemukan.");
        }
      }
    } catch (e) {
      setState(() => _errorMessage = "Email atau Password salah.");
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    
    return Scaffold(
      body: SingleChildScrollView(
        child: Container(
          padding: const EdgeInsets.all(32),
          height: MediaQuery.of(context).size.height,
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
                "Selamat Datang Kembali",
                style: TextStyle(color: Colors.white38, fontSize: 14),
              ),
              const SizedBox(height: 48),
              
              TextField(
                controller: _usernameController,
                keyboardType: TextInputType.text,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Username',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                  prefixIcon: Icon(Icons.person_outline_rounded, color: primaryColor, size: 20),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(vertical: 20),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline_rounded),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.05),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              ],
              
              const SizedBox(height: 32),
              
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 60),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  disabledBackgroundColor: primaryColor.withOpacity(0.5),
                ),
                child: _isLoading 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text("MASUK SEKARANG", style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
