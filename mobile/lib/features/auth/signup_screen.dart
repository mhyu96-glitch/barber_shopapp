import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  String _selectedRole = 'barber';
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleSignUp() async {
    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty || _nameController.text.isEmpty) {
      setState(() => _errorMessage = "Harap isi semua bidang.");
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await SupabaseService.signUp(
        _usernameController.text.trim(),
        _passwordController.text,
        _nameController.text.trim(),
        _selectedRole,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Akun berhasil dibuat!")),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _errorMessage = "Gagal membuat akun: $e");
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
      appBar: AppBar(
        title: const Text("Buat Akun Baru", style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Daftarkan Barber atau Admin baru ke sistem.", style: TextStyle(color: Colors.white60)),
            const SizedBox(height: 32),
            TextField(
              controller: _nameController,
              decoration: _inputDecoration("Nama Lengkap", Icons.person_outline),
              style: const TextStyle(color: Colors.white),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _usernameController,
              decoration: _inputDecoration("Username", Icons.person_outline),
              style: const TextStyle(color: Colors.white),
              autocorrect: false,
              enableSuggestions: false,
              textCapitalization: TextCapitalization.none,
              keyboardType: TextInputType.visiblePassword,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: _inputDecoration("Password", Icons.lock_outline),
              style: const TextStyle(color: Colors.white),
              autocorrect: false,
              enableSuggestions: false,
            ),
            const SizedBox(height: 24),
            const Text("Role Pengguna", style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                _roleRadio('barber', 'Barber'),
                const SizedBox(width: 20),
                _roleRadio('admin', 'Admin'),
              ],
            ),
            const SizedBox(height: 48),
            if (_errorMessage != null) ...[
              Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent)),
              const SizedBox(height: 16),
            ],
            ElevatedButton(
              onPressed: _isLoading ? null : _handleSignUp,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 60),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isLoading 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                : const Text("DAFTARKAN SEKARANG", style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white60),
      prefixIcon: Icon(icon, color: Colors.white60),
      filled: true,
      fillColor: Colors.white.withOpacity(0.05),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
    );
  }

  Widget _roleRadio(String value, String label) {
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = value),
      child: Row(
        children: [
          Radio<String>(
            value: value,
            groupValue: _selectedRole,
            onChanged: (v) => setState(() => _selectedRole = v!),
            activeColor: Theme.of(context).primaryColor,
          ),
          Text(label, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }
}
