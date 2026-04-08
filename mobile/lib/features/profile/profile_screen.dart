import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import '../../widgets/atelier_card.dart';
import '../../widgets/atelier_button.dart';
import 'barber_list_screen.dart';
import 'add_edit_barber_screen.dart';
import '../services/services_screen.dart';
import '../dashboard/reports_screen.dart';
import 'settings_detail_screen.dart';
import '../settings/printer_settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _avatarUrl;
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profile = AppState.currentUserProfile.value;
    if (profile != null) {
      setState(() {
        _avatarUrl = profile['avatar'];
      });
    }
  }

  Future<void> _pickAndUploadImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (image == null) return;

    setState(() => _isUploading = true);

    try {
      final bytes = await image.readAsBytes();
      final role = AppState.currentRole.value;
      final userName = role == UserRole.admin ? 'admin' : AppState.currentBarberName.value;
      final fileName = "avatar_${userName}_${DateTime.now().millisecondsSinceEpoch}.jpg";
      
      final url = await SupabaseService.uploadAvatar(fileName, bytes);
      if (url != null) {
        if (role == UserRole.barber) {
          await SupabaseService.updateBarberAvatar(AppState.currentBarberName.value, url);
        } else if (role == UserRole.customer) {
          final customers = await SupabaseService.getCustomers();
          if (customers.isNotEmpty) {
            await SupabaseService.updateCustomerAvatar(customers.first['id'], url);
          }
        }
        
        if (mounted) {
          setState(() {
            _avatarUrl = url;
            _isUploading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Profile updated successfully")));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Upload failed: $e"), backgroundColor: Colors.redAccent));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final gold = const Color(0xFFD4AF37);
    final backgroundDark = const Color(0xFF0D0D0D);
    final role = AppState.currentRole.value;
    final isAdmin = role == UserRole.admin;

    return Scaffold(
      backgroundColor: backgroundDark,
      body: SafeArea(
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // --- Elaborate Header ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "MEMBER PROFILE",
                      style: TextStyle(fontFamily: 'Epilogue', fontSize: 10, fontWeight: FontWeight.w900, color: gold.withOpacity(0.5), letterSpacing: 2.5),
                    ),
                    IconButton(
                      icon: Icon(Icons.settings_outlined, color: Colors.white.withOpacity(0.3), size: 20),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),

            // --- Premium Profile Showcase ---
            SliverToBoxAdapter(
              child: Column(
                children: [
                   Stack(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: gold.withOpacity(0.2), width: 1),
                        ),
                        child: CircleAvatar(
                          radius: 70,
                          backgroundColor: Colors.white.withOpacity(0.02),
                          backgroundImage: _avatarUrl != null 
                            ? NetworkImage(_avatarUrl!) 
                            : NetworkImage(isAdmin 
                                ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400' 
                                : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'),
                        ),
                      ),
                      if (_isUploading)
                        const Positioned.fill(
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: _isUploading ? null : _pickAndUploadImage,
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: gold,
                              shape: BoxShape.circle,
                              border: Border.all(color: backgroundDark, width: 3),
                              boxShadow: [BoxShadow(color: gold.withOpacity(0.3), blurRadius: 10)],
                            ),
                            child: const Icon(Icons.camera_alt_rounded, color: Colors.black, size: 18),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    role == UserRole.admin ? "ADMINISTRATOR" : (role == UserRole.barber ? AppState.currentBarberName.value.toUpperCase() : "JOHN DOE"),
                    style: const TextStyle(fontFamily: 'Epilogue', color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: gold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: gold.withOpacity(0.2)),
                    ),
                    child: Text(
                      role == UserRole.admin 
                        ? "ELITE OWNER" 
                        : (role == UserRole.barber 
                            ? "SENIOR BARBER" 
                            : "GOLD MEMBER"),
                      style: TextStyle(color: gold, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.0),
                    ),
                  ),
                ],
              ),
            ),

            // --- Action Cards ---
            if (isAdmin) 
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                  child: Column(
                    children: [
                      _buildAtelierAdminAction(context, Icons.person_add_alt_1_rounded, "RECRUIT NEW BARBER", gold, () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const AddEditBarberScreen()));
                      }),
                      const SizedBox(height: 16),
                      _buildAtelierAdminAction(context, Icons.content_cut_rounded, "SERVICE CATALOG", Colors.blueAccent, () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const ServicesScreen()));
                      }),
                    ],
                  ),
                ),
              )
            else 
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
                  child: Row(
                    children: [
                      _buildAtelierStatCard("24", "TOTAL SESSIONS", gold),
                      const SizedBox(width: 16),
                      _buildAtelierStatCard("1,250", "LOYALTY XP", gold),
                    ],
                  ),
                ),
              ),

            // --- Menu Registry ---
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 12),
                  Text(
                    "REGISTRY & DEPLOYMENT", 
                    style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2.0)
                  ),
                  const SizedBox(height: 20),
                  if (isAdmin) ...[
                    _buildAtelierMenuItem(context, Icons.analytics_outlined, "ANALYTICS COMMAND", gold, onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const ReportsScreen()));
                    }),
                    _buildAtelierMenuItem(context, Icons.people_outline_rounded, "COMMAND ROSTER", gold, onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const BarberListScreen()));
                    }),
                  ] else ...[
                    _buildAtelierMenuItem(context, Icons.calendar_month, "HISTORY LOG", gold),
                    _buildAtelierMenuItem(context, Icons.payments_outlined, "VAULT SETTINGS", gold),
                  ],
                  _buildAtelierMenuItem(context, Icons.print_rounded, "PRINTER PROTOCOL", gold, onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const PrinterSettingsScreen()));
                  }),
                  _buildAtelierMenuItem(context, Icons.notifications_none_rounded, "COMMUNICATION HUB", gold, badge: "2"),
                  const SizedBox(height: 40),
                  _buildAtelierLogoutButton(context),
                  const SizedBox(height: 120),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAtelierAdminAction(BuildContext context, IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: AtelierCard(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 20),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
            const Spacer(),
            Icon(Icons.add_rounded, color: Colors.white.withOpacity(0.1)),
          ],
        ),
      ),
    );
  }

  Widget _buildAtelierStatCard(String value, String label, Color gold) {
    return Expanded(
      child: AtelierCard(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1.0)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: gold.withOpacity(0.5), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
          ],
        ),
      ),
    );
  }

  Widget _buildAtelierMenuItem(BuildContext context, IconData icon, String title, Color gold, {String? badge, VoidCallback? onTap}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AtelierCard(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: ListTile(
          onTap: onTap ?? () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => SettingsDetailScreen(title: title, icon: icon)));
          },
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: gold.withOpacity(0.05), shape: BoxShape.circle),
            child: Icon(icon, color: gold, size: 18),
          ),
          title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.0)),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: gold, borderRadius: BorderRadius.circular(20)),
                  child: Text(badge, style: const TextStyle(color: Colors.black, fontSize: 10, fontWeight: FontWeight.w900)),
                ),
              const SizedBox(width: 12),
              Icon(Icons.chevron_right_rounded, color: Colors.white.withOpacity(0.1), size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAtelierLogoutButton(BuildContext context) {
    return AtelierButton(
      label: "TERMINATE SESSION",
      isSecondary: true,
      onPressed: () async {
        await SupabaseService.signOut();
        AppState.currentUserProfile.value = null;
        if (context.mounted) {
          Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
        }
      },
    );
  }
}
