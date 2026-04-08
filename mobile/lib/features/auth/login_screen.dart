import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../widgets/atelier_card.dart';
import '../../widgets/atelier_button.dart';
import '../../widgets/atelier_text_field.dart';

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
        _passwordController.text,
      );

      if (response.user != null) {
        final profile = await SupabaseService.getUserProfile(response.user!.id);
        if (profile != null) {
          AppState.currentUserProfile.value = profile;
          AppState.currentBarberName.value = profile['full_name'] ?? 'Barber';
          
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
      if (e is AuthException) {
        setState(() => _errorMessage = "Login gagal: ${e.message}");
      } else {
        setState(() => _errorMessage = "Koneksi gagal atau error: ${e.toString()}");
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Elegant dark gradient background
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                  colors: [
                    Color(0xFF0D0D0D),
                    Color(0xFF131313),
                    Color(0xFF0D0D0D),
                  ],
                ),
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Brand Identity
                    const Text(
                      "BarberPro Studio",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Epilogue',
                        fontSize: 36,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1.5,
                        color: Color(0xFFD4AF37),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "THE PRIVATE ATELIER EXPERIENCE",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 3.0,
                        color: Colors.white.withOpacity(0.4),
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Authentication Interface
                    AtelierCard(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Welcome Back",
                            style: TextStyle(
                              fontFamily: 'Epilogue',
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Sign in to access your atelier workspace.",
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 14,
                              color: Colors.white.withOpacity(0.5),
                            ),
                          ),
                          const SizedBox(height: 40),
                          
                          AtelierTextField(
                            controller: _usernameController,
                            label: "Identity / Username",
                            hintText: "Enter your username",
                            prefixIcon: Icons.person_outline_rounded,
                          ),
                          const SizedBox(height: 24),
                          
                          AtelierTextField(
                            controller: _passwordController,
                            label: "Security Protocol",
                            hintText: "••••••••",
                            prefixIcon: Icons.lock_outline_rounded,
                            obscureText: true,
                          ),
                          
                          if (_errorMessage != null) ...[
                            const SizedBox(height: 24),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              decoration: BoxDecoration(
                                color: Colors.redAccent.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 18),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      _errorMessage!,
                                      style: const TextStyle(color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          
                          const SizedBox(height: 40),
                          
                          AtelierButton(
                            label: "Access Atelier",
                            onPressed: _handleLogin,
                            isLoading: _isLoading,
                            icon: Icons.chevron_right_rounded,
                          ),
                          
                          const SizedBox(height: 32),
                          
                          Center(
                            child: TextButton(
                              onPressed: () {},
                              child: RichText(
                                text: TextSpan(
                                  text: "New Operator? ",
                                  style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13),
                                  children: const [
                                    TextSpan(
                                      text: "CONTACT ADMIN",
                                      style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1.0),
                                    )
                                  ]
                                ),
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 60),
                    
                    Text(
                      "BARBERPRO STUDIO v2.5\nPRECISION IN EVERY CUT.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.5,
                        color: Colors.white.withOpacity(0.2),
                        height: 2.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
