import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';

class ManageShopScreen extends StatefulWidget {
  final Map<String, dynamic> shop;
  const ManageShopScreen({super.key, required this.shop});

  @override
  State<ManageShopScreen> createState() => _ManageShopScreenState();
}

class _ManageShopScreenState extends State<ManageShopScreen> {
  late String _status;
  late String? _planId;
  List<Map<String, dynamic>> _plans = [];
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.shop['status'] ?? 'trial';
    _planId = widget.shop['plan_id'];
    _loadPlans();
  }

  Future<void> _loadPlans() async {
    try {
      final plans = await SupabaseService.getSubscriptionPlans();
      setState(() {
        _plans = plans;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading plans: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveChanges() async {
    setState(() => _isSaving = true);
    try {
      await SupabaseService.updateShopStatus(widget.shop['id'], _status, planId: _planId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Perubahan berhasil disimpan.")));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Gagal menyimpan: $e")));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Color get primaryColor => Theme.of(context).primaryColor;
  Color get backgroundDark => Theme.of(context).scaffoldBackgroundColor;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundDark,
      appBar: AppBar(
        backgroundColor: backgroundDark,
        title: const Text("Detail & Akses Toko"),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildShopInfoCard(),
                const SizedBox(height: 32),
                const Text("PENGATURAN AKSES", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                _buildStatusDropdown(),
                const SizedBox(height: 24),
                _buildPlanDropdown(),
                const SizedBox(height: 48),
                _buildSaveButton(),
              ],
            ),
          ),
    );
  }

  Widget _buildShopInfoCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: primaryColor.withOpacity(0.1),
            radius: 32,
            child: Text(widget.shop['name']?[0] ?? 'S', style: TextStyle(color: primaryColor, fontSize: 24, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.shop['name'] ?? 'Unnamed', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text("Daftar: ${widget.shop['created_at'].toString().split('T')[0]}", style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 12)),
                const SizedBox(height: 8),
                Text(widget.shop['phone'] ?? '-', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusDropdown() {
    final statusList = ['trial', 'active', 'expired', 'deactivated'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Status Akses", style: TextStyle(color: Colors.white38, fontSize: 12)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _status,
              isExpanded: true,
              dropdownColor: backgroundDark,
              items: statusList.map((s) => DropdownMenuItem(
                value: s,
                child: Text(s.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 14)),
              )).toList(),
              onChanged: (val) => setState(() => _status = val!),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlanDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Paket Berlangganan", style: TextStyle(color: Colors.white38, fontSize: 12)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.05)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _planId,
              isExpanded: true,
              hint: const Text("Pilih Paket", style: TextStyle(color: Colors.white24)),
              dropdownColor: backgroundDark,
              items: _plans.map((p) => DropdownMenuItem(
                value: p['id'].toString(),
                child: Text(p['name'], style: const TextStyle(color: Colors.white, fontSize: 14)),
              )).toList(),
              onChanged: (val) => setState(() => _planId = val),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSaveButton() {
    return ElevatedButton(
      onPressed: _isSaving ? null : _saveChanges,
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      child: _isSaving 
        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
        : const Text("SIMPAN PERUBAHAN", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
    );
  }
}
