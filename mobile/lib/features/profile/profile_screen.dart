import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import '../../core/app_state.dart';
import '../../core/supabase_service.dart';
import 'barber_list_screen.dart';
import 'add_edit_barber_screen.dart';
import '../services/services_screen.dart';
import '../dashboard/reports_screen.dart';
import 'settings_detail_screen.dart';

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
    final role = AppState.currentRole.value;
    final name = AppState.currentBarberName.value; // For barbers, we identify by name
    
    try {
      if (role == UserRole.admin) {
        // Mock admin data for now
        _avatarUrl = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200';
      } else if (role == UserRole.barber) {
        final barbers = await SupabaseService.getBarbers();
        final current = barbers.firstWhere((b) => b.name == name, orElse: () => barbers.first);
        _avatarUrl = current.avatar;
      } else if (role == UserRole.customer) {
        // Assume the first customer is the logged-in one for demo purposes
        final customers = await SupabaseService.getCustomers();
        if (customers.isNotEmpty) {
          _avatarUrl = customers.first['avatar'];
        }
      }
      
      if (mounted) setState(() {});
    } catch (e) {
      print("Error loading profile: $e");
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
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Foto profil berhasil diperbarui")));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Gagal mengunggah foto: $e"), backgroundColor: Colors.redAccent));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;
    final role = AppState.currentRole.value;
    final isAdmin = role == UserRole.admin;

    return Scaffold(
      backgroundColor: backgroundDark,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // --- Header ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(width: 40),
                    Text(
                      role == UserRole.admin ? 'Profil Admin' : (role == UserRole.barber ? 'Profil Barber' : 'Profil Pelanggan'),
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings_outlined, color: Colors.white),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),

            // --- Profile Info ---
            SliverToBoxAdapter(
              child: Column(
                children: [
                   Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: primaryColor.withOpacity(0.2), width: 4),
                        ),
                        child: CircleAvatar(
                          radius: 64,
                          backgroundColor: primaryColor.withOpacity(0.1),
                          backgroundImage: _avatarUrl != null 
                            ? NetworkImage(_avatarUrl!) 
                            : NetworkImage(isAdmin 
                                ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200' 
                                : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200'),
                        ),
                      ),
                      if (_isUploading)
                        const Positioned.fill(
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: _isUploading ? null : _pickAndUploadImage,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: primaryColor,
                              shape: BoxShape.circle,
                              border: Border.all(color: backgroundDark, width: 3),
                            ),
                            child: const Icon(Icons.camera_alt_rounded, color: Colors.black, size: 20),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(
                    role == UserRole.admin ? "Administrator" : (role == UserRole.barber ? AppState.currentBarberName.value : "John Doe"),
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  if (!isAdmin) Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.stars, color: primaryColor, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        "Anggota Gold",
                        style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  Text(
                    role == UserRole.admin ? "Owner BarberPro Studio" : (role == UserRole.barber ? "Barber Profesional" : "Anggota sejak Jan 2023"),
                    style: const TextStyle(color: Colors.white38, fontSize: 13),
                  ),
                ],
              ),
            ),

            // --- Admin Controls / Stats ---
            if (isAdmin) 
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildAdminAction(context, Icons.person_add_alt_1_rounded, "Tambah Barber Baru", primaryColor, () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const AddEditBarberScreen()));
                      }),
                      const SizedBox(height: 12),
                      _buildAdminAction(context, Icons.content_cut_rounded, "Kelola Layanan", Colors.purpleAccent, () {
                        Navigator.push(context, MaterialPageRoute(builder: (context) => const ServicesScreen()));
                      }),
                    ],
                  ),
                ),
              )
            else 
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      _buildStatCard("24", "Total Kunjungan", primaryColor),
                      const SizedBox(width: 12),
                      _buildStatCard("1,250", "Poin Loyalitas", primaryColor),
                    ],
                  ),
                ),
              ),

            // --- Upcoming Appointment (Only for Customer) ---
            if (!isAdmin) SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Janji Mendatang", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: primaryColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Column(
                              children: [
                                Text("Mar", style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                                Text("23", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text("Potong Rambut Eksekutif", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                Text("dengan Marcus pukul 14:30", style: TextStyle(color: Colors.white60, fontSize: 13)),
                              ],
                            ),
                          ),
                          Icon(Icons.calendar_month_rounded, color: primaryColor),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // --- Settings Menu ---
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 12),
                  Text(isAdmin ? "Manajemen Sistem" : "Pengaturan", style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (isAdmin) ...[
                    _buildMenuItem(context, Icons.analytics_outlined, "Laporan Keuangan", primaryColor, onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const ReportsScreen()));
                    }),
                    _buildMenuItem(context, Icons.people_outline_rounded, "Daftar Barber", primaryColor, onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (context) => const BarberListScreen()));
                    }),
                    _buildMenuItem(context, Icons.history_rounded, "Log Aktivitas", primaryColor),
                  ] else ...[
                    _buildMenuItem(context, Icons.calendar_month, "Janji Saya", primaryColor),
                    _buildMenuItem(context, Icons.payments, "Metode Pembayaran", primaryColor),
                    _buildMenuItem(context, Icons.content_cut, "Barber Favorit", primaryColor),
                  ],
                  _buildMenuItem(context, Icons.notifications, "Notifikasi", primaryColor, badge: "2"),
                  _buildMenuItem(context, Icons.manage_accounts, "Pengaturan Akun", primaryColor),
                  const SizedBox(height: 24),
                  _buildLogoutButton(context),
                  const SizedBox(height: 100),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminAction(BuildContext context, IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 20),
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const Spacer(),
            const Icon(Icons.add_rounded, color: Colors.white24),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String value, String label, Color primary) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: primary.withOpacity(0.1)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: primary, fontSize: 24, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String title, Color primary, {String? badge, VoidCallback? onTap}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListTile(
        onTap: onTap ?? () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SettingsDetailScreen(title: title, icon: icon),
            ),
          );
        },
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: primary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: primary, size: 20),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(10)),
                child: Text(badge, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: Colors.white24),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: () {
        Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
      },
      icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
      label: const Text("KELUAR AKUN", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white.withOpacity(0.05),
        minimumSize: const Size(double.infinity, 60),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: Colors.redAccent.withOpacity(0.2)),
        ),
      ),
    );
  }
}
