import 'package:flutter/material.dart';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
        _passwordController.text,
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
      backgroundColor: const Color(0xFF131313),
      body: Stack(
        children: [
          // Background subtle texture simulation
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                  colors: [
                    Color(0xFF0E0E0E),
                    Color(0xFF131313),
                    Color(0x800E0E0E),
                  ],
                ),
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Brand Header
                    const Text(
                      "BarberPro Studio",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Epilogue',
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -1.0,
                        color: Color(0xFFD4AF37),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "THE PRIVATE ATELIER EXPERIENCE",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 2.0,
                        color: Color(0xFFD0C5AF),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Login Card
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1C1B1B),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black45,
                            blurRadius: 48,
                            offset: Offset(0, 24),
                          )
                        ],
                      ),
                      child: Column(
                        children: [
                          // Hero Image Section
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                            child: SizedBox(
                              height: 120,
                              width: double.infinity,
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  ColorFiltered(
                                    colorFilter: const ColorFilter.mode(Colors.grey, BlendMode.saturation),
                                    child: Image.network(
                                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEGX40XkCtazrNZ9Mx5YeBA7BB64tt8WqUi42O3x45Fdt3HxsGfdsEFBbEAq79FRGm1eyQ9oZVdna3o627PR1IcoydRAbh8vwO2iSFHmQimcXcwrAaIJkRbSmyugWFV9xR4rMtkbMBkDtcMjh77JIuPSa9ZusDDLqkL6o3i4z24eqaMQp9XHM8a27w9VAFIBSWytbhnZbdLWECoOKD2yMDEEuV9ZiGR0_-tmLCQXexTkPM35m6qPhe_Z2kIec3wOy1xKiEv1cWQ_M',
                                      fit: BoxFit.cover,
                                      opacity: const AlwaysStoppedAnimation(0.4),
                                      errorBuilder: (context, error, stackTrace) => Container(color: const Color(0xFF1C1B1B)),
                                    ),
                                  ),
                                  Container(
                                    decoration: const BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [Colors.transparent, Color(0xFF1C1B1B)],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          
                          // Form Content
                          Padding(
                            padding: const EdgeInsets.fromLTRB(32, 8, 32, 40),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "Welcome Back",
                                  style: TextStyle(
                                    fontFamily: 'Epilogue',
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFE5E2E1),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  "Sign in to your professional workspace.",
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFFD0C5AF),
                                  ),
                                ),
                                const SizedBox(height: 32),
                                
                                // Username
                                // Username
                                const Padding(
                                  padding: EdgeInsets.only(left: 4, bottom: 8),
                                  child: Text(
                                    "IDENTITY / USERNAME",
                                    style: TextStyle(
                                      fontFamily: 'Inter',
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 1.5,
                                      color: Color(0xFFD4AF37),
                                    ),
                                  ),
                                ),
                                TextField(
                                  controller: _usernameController,
                                  style: const TextStyle(color: Color(0xFFE5E2E1), fontWeight: FontWeight.bold),
                                  keyboardType: TextInputType.visiblePassword, // Disables most autocorrect
                                  autocorrect: false,
                                  enableSuggestions: false,
                                  textCapitalization: TextCapitalization.none,
                                  decoration: InputDecoration(
                                    hintText: 'Enter your username',
                                    hintStyle: const TextStyle(color: Colors.white10),
                                    prefixIcon: const Icon(Icons.person_outline_rounded, color: Color(0xFFD4AF37), size: 20),
                                    filled: true,
                                    fillColor: const Color(0xFF0E0E0E),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
                                    border: OutlineInputBorder(
                                      borderSide: const BorderSide(color: Color(0x3399907C)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderSide: const BorderSide(color: Color(0x3399907C)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),
                                
                                // Password
                                Padding(
                                  padding: const EdgeInsets.only(left: 4, bottom: 8, right: 4),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                        "SECURITY PROTOCOL",
                                        style: TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          letterSpacing: 1.5,
                                          color: Color(0xFFD4AF37),
                                        ),
                                      ),
                                      Text(
                                        "RECOVER ACCESS?",
                                        style: TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF99907C).withOpacity(0.6),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                TextField(
                                  controller: _passwordController,
                                  obscureText: true,
                                  autocorrect: false,
                                  enableSuggestions: false,
                                  textCapitalization: TextCapitalization.none,
                                  style: const TextStyle(color: Color(0xFFE5E2E1), letterSpacing: 3.0),
                                  decoration: InputDecoration(
                                    hintText: '••••••••',
                                    hintStyle: const TextStyle(color: Colors.white10, letterSpacing: 0),
                                    prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFFD4AF37), size: 20),
                                    filled: true,
                                    fillColor: const Color(0xFF0E0E0E),
                                    contentPadding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
                                    border: OutlineInputBorder(
                                      borderSide: const BorderSide(color: Color(0x3399907C)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderSide: const BorderSide(color: Color(0x3399907C)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 1.5),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                                
                                if (_errorMessage != null) ...[
                                  const SizedBox(height: 16),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: const Color(0x1AFFB4AB),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0x33FFB4AB)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.error_outline, color: Color(0xFFFFB4AB), size: 16),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _errorMessage!,
                                            style: const TextStyle(color: Color(0xFFFFB4AB), fontSize: 12, fontWeight: FontWeight.w500),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                                
                                const SizedBox(height: 32),
                                
                                // Submit Button
                                Container(
                                  width: double.infinity,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFFFFD700), Color(0xFFD4AF37)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFFD4AF37).withOpacity(0.35),
                                        blurRadius: 24,
                                        offset: const Offset(0, 8),
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: _isLoading ? null : _handleLogin,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    child: _isLoading
                                        ? const SizedBox(
                                            height: 24,
                                            width: 24,
                                            child: CircularProgressIndicator(strokeWidth: 3, color: Color(0xFF412D00)))
                                        : const Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                "ACCESS ATELIER",
                                                style: TextStyle(
                                                  fontFamily: 'Epilogue',
                                                  fontWeight: FontWeight.w900,
                                                  color: Color(0xFF412D00),
                                                  fontSize: 14,
                                                  letterSpacing: 2.0,
                                                ),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(Icons.chevron_right, color: Color(0xFF412D00)),
                                            ],
                                          ),
                                  ),
                                ),
                                
                                const SizedBox(height: 48),
                                const Divider(color: Color(0x1A99907C)),
                                const SizedBox(height: 32),
                                
                                Center(
                                  child: TextButton(
                                    onPressed: () {},
                                    child: RichText(
                                      text: const TextSpan(
                                        text: "New Operator? ",
                                        style: TextStyle(color: Color(0xFFD0C5AF), fontSize: 12),
                                        children: [
                                          TextSpan(
                                            text: "CONTACT ADMINISTRATION",
                                            style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5),
                                          )
                                        ]
                                      ),
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 48),
                    
                    // Footer
                    const Text(
                      "BARBERPRO STUDIO v2.4\n© 2024 THE PRIVATE ATELIER EXPERIENCE.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.0,
                        color: Color(0x4D99907C),
                        height: 2.0,
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
