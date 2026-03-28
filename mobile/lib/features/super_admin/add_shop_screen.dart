import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';

class AddShopScreen extends StatefulWidget {
  const AddShopScreen({super.key});

  @override
  State<AddShopScreen> createState() => _AddShopScreenState();
}

class _AddShopScreenState extends State<AddShopScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _slugController = TextEditingController();
  final _phoneController = TextEditingController();
  final _adminUsernameController = TextEditingController();
  final _adminPasswordController = TextEditingController();
  
  String? _selectedPlanId;
  List<Map<String, dynamic>> _plans = [];
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadPlans();
    
    _nameController.addListener(() {
      final slug = _nameController.text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '-');
      _slugController.text = slug;
      _adminUsernameController.text = "admin_${slug.replaceAll('-', '_')}";
    });
  }

  Future<void> _loadPlans() async {
    try {
      final plans = await SupabaseService.getSubscriptionPlans();
      setState(() {
        _plans = plans;
        _isLoading = false;
        if (_plans.isNotEmpty) _selectedPlanId = _plans.first['id'].toString();
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPlanId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Pilih paket terlebih dahulu.")));
      return;
    }
    
    setState(() => _isSaving = true);
    try {
      // 1. Sign up admin user
      final authResponse = await SupabaseService.signUp(
        _adminUsernameController.text,
        _adminPasswordController.text,
        "Admin ${_nameController.text}",
        'admin'
      );
      
      final userId = authResponse.user?.id;
      if (userId == null) throw "Gagal membuat user admin.";

      // 2. Create Shop
      final newShop = await SupabaseService.createShop({
        'name': _nameController.text,
        'slug': _slugController.text,
        'phone': _phoneController.text,
        'status': 'trial',
        'owner_id': userId,
        'plan_id': _selectedPlanId,
      });

      // 3. Update Profile & Create Settings
      await SupabaseService.updateProfileShopId(userId, newShop['id']);
      await SupabaseService.createInitialSettings(newShop['id'], _nameController.text, _phoneController.text);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Tenant berhasil didaftarkan!")));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Gagal: $e"), backgroundColor: Colors.redAccent));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: backgroundDark,
      appBar: AppBar(
        backgroundColor: backgroundDark,
        title: const Text("Daftar Tenant Baru"),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle("INFORMASI TOKO"),
                  _buildTextField(_nameController, "Nama Barbershop", Icons.storefront_rounded),
                  _buildTextField(_slugController, "Slug (URL)", Icons.link_rounded, enabled: false),
                  _buildTextField(_phoneController, "Nomor WhatsApp", Icons.phone_android_rounded, keyboardType: TextInputType.phone),
                  
                  const SizedBox(height: 24),
                  _buildSectionTitle("PAKET BERLANGGANAN"),
                  _buildPlanDropdown(),
                  
                  const SizedBox(height: 24),
                  _buildSectionTitle("AKSES ADMIN"),
                  _buildTextField(_adminUsernameController, "Username Admin", Icons.person_rounded, enabled: false),
                  _buildTextField(_adminPasswordController, "Password Admin", Icons.lock_rounded, isPassword: true),
                  
                  const SizedBox(height: 48),
                  _buildSubmitButton(primaryColor),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(title, style: const TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {bool enabled = true, bool isPassword = false, TextInputType? keyboardType}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        obscureText: isPassword,
        keyboardType: keyboardType,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white24, fontSize: 13),
          prefixIcon: Icon(icon, color: Colors.white24, size: 20),
          filled: true,
          fillColor: Colors.white.withOpacity(0.02),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withOpacity(0.04))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white10)),
          disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withOpacity(0.01))),
          contentPadding: const EdgeInsets.symmetric(vertical: 20),
        ),
        validator: (value) => value == null || value.isEmpty ? "Harap diisi" : null,
      ),
    );
  }

  Widget _buildPlanDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedPlanId,
          isExpanded: true,
          dropdownColor: Theme.of(context).scaffoldBackgroundColor,
          icon: const Icon(Icons.arrow_drop_down_rounded, color: Colors.white24),
          items: _plans.map((p) => DropdownMenuItem(
            value: p['id'].toString(),
            child: Text(p['name'] ?? 'Paket', style: const TextStyle(color: Colors.white, fontSize: 14)),
          )).toList(),
          onChanged: (val) => setState(() => _selectedPlanId = val),
        ),
      ),
    );
  }

  Widget _buildSubmitButton(Color primaryColor) {
    return ElevatedButton(
      onPressed: _isSaving ? null : _handleSave,
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        minimumSize: const Size(double.infinity, 60),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        elevation: 0,
      ),
      child: _isSaving 
        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
        : const Text("DAFTARKAN TENANT", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
    );
  }
}
