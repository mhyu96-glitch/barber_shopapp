import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../core/app_state.dart';
import 'manage_shop_screen.dart';
import 'add_shop_screen.dart';

class SuperAdminDashboard extends StatefulWidget {
  const SuperAdminDashboard({super.key});

  @override
  State<SuperAdminDashboard> createState() => _SuperAdminDashboardState();
}

class _SuperAdminDashboardState extends State<SuperAdminDashboard> {
  List<Map<String, dynamic>> _shops = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadShops();
  }

  Future<void> _loadShops() async {
    try {
      final shops = await SupabaseService.getShops();
      setState(() {
        _shops = shops;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading shops: $e");
      setState(() => _isLoading = false);
    }
  }

  Color get primaryColor => Theme.of(context).primaryColor;
  Color get backgroundDark => Theme.of(context).scaffoldBackgroundColor;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundDark,
      body: Column(
        children: [
          _buildHeader(),
          _buildStatsOverview(),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _buildShopList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const AddShopScreen()),
          );
          if (result == true) _loadShops();
        },
        backgroundColor: primaryColor,
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 30),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 20, left: 20, right: 20, bottom: 20),
      color: backgroundDark,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("PLATFORM MASTER", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              Text("Kelola semua tenant BarberPro", style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () async {
              await SupabaseService.signOut();
              if (mounted) Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatsOverview() {
    int activeShops = _shops.where((s) => s['status'] == 'active' || s['status'] == 'trial').length;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: primaryColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: primaryColor.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem("Total Toko", _shops.length.toString()),
          _buildStatItem("Toko Aktif", activeShops.toString()),
          _buildStatItem("Revenue Est.", "Rp 0"), // Future implementation
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
      ],
    );
  }

  Widget _buildShopList() {
    if (_shops.isEmpty) {
      return const Center(child: Text("Belum ada toko yang terdaftar."));
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      itemCount: _shops.length,
      itemBuilder: (context, index) {
        final shop = _shops[index];
        final status = shop['status'] ?? 'trial';
        final planName = shop['subscription_plans']?['name'] ?? 'No Plan';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: primaryColor.withOpacity(0.1),
                radius: 24,
                child: Text(shop['name']?[0] ?? 'S', style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(shop['name'] ?? 'Unnamed Shop', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(planName, style: TextStyle(color: primaryColor.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _getStatusBadge(status),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => ManageShopScreen(shop: shop)),
                      );
                      if (result == true) _loadShops();
                    },
                    child: Text("KELOLA", style: TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _getStatusBadge(String status) {
    Color color = Colors.grey;
    String label = status.toUpperCase();
    
    if (status == 'active') color = Colors.green;
    if (status == 'trial') color = Colors.blue;
    if (status == 'expired') color = Colors.orange;
    if (status == 'deactivated') color = Colors.red;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
    );
  }
}
