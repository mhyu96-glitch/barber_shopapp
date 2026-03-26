import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';

class AddEditBarberScreen extends StatefulWidget {
  final Barber? barber;
  const AddEditBarberScreen({super.key, this.barber});

  @override
  State<AddEditBarberScreen> createState() => _AddEditBarberScreenState();
}

class _AddEditBarberScreenState extends State<AddEditBarberScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _specializationController;
  late TextEditingController _bioController;
  late TextEditingController _workStartController;
  late TextEditingController _workEndController;
  
  String? _avatarUrl;
  bool _isSaving = false;
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.barber?.name ?? '');
    _phoneController = TextEditingController(text: widget.barber?.phone ?? '');
    _specializationController = TextEditingController(text: widget.barber?.specialization ?? '');
    _bioController = TextEditingController(text: widget.barber?.bio ?? '');
    _workStartController = TextEditingController(text: widget.barber?.workStart ?? '09:00');
    _workEndController = TextEditingController(text: widget.barber?.workEnd ?? '21:00');
    _avatarUrl = widget.barber?.avatar;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _specializationController.dispose();
    _bioController.dispose();
    _workStartController.dispose();
    _workEndController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (image == null) return;

    setState(() => _isUploading = true);

    try {
      final bytes = await image.readAsBytes();
      final fileName = "barber_${_nameController.text.isNotEmpty ? _nameController.text : 'new'}_${DateTime.now().millisecondsSinceEpoch}.jpg";
      
      final url = await SupabaseService.uploadAvatar(fileName, bytes);
      if (url != null) {
        if (mounted) {
          setState(() {
            _avatarUrl = url;
            _isUploading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Gagal mengunggah foto: $e"), backgroundColor: Colors.redAccent));
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final barberData = {
      'name': _nameController.text,
      'phone': _phoneController.text,
      'specialization': _specializationController.text,
      'bio': _bioController.text,
      'work_start': _workStartController.text,
      'work_end': _workEndController.text,
      'avatar': _avatarUrl,
    };

    try {
      if (widget.barber == null) {
        await SupabaseService.addBarber(barberData);
      } else {
        await SupabaseService.updateBarber(widget.barber!.id, barberData);
      }
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.barber == null ? "Barber berhasil ditambahkan" : "Barber berhasil diperbarui")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Gagal menyimpan data: $e"), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final isEdit = widget.barber != null;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(isEdit ? 'Edit Barber' : 'Tambah Barber Baru', style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: primaryColor.withOpacity(0.2), width: 4),
                      ),
                      child: CircleAvatar(
                        radius: 50,
                        backgroundColor: primaryColor.withOpacity(0.1),
                        backgroundImage: _avatarUrl != null ? NetworkImage(_avatarUrl!) : null,
                        child: _avatarUrl == null ? Icon(Icons.person_rounded, size: 50, color: primaryColor) : null,
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
                            border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 3),
                          ),
                          child: const Icon(Icons.camera_alt_rounded, color: Colors.black, size: 16),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              _buildTextField("Nama Lengkap", _nameController, Icons.person_rounded, "Contoh: Budi Santoso"),
              const SizedBox(height: 20),
              _buildTextField("Nomor WhatsApp", _phoneController, Icons.phone_android_rounded, "Contoh: 08123456789", keyboardType: TextInputType.phone),
              const SizedBox(height: 20),
              _buildTextField("Spesialisasi", _specializationController, Icons.auto_awesome_rounded, "Contoh: Fade, Pompadour, Beard Trim"),
              const SizedBox(height: 20),
              _buildTextField("Bio Singkat", _bioController, Icons.description_rounded, "Jelaskan pengalaman atau keahlian barber...", maxLines: 3),
              const SizedBox(height: 20),
              Row(
                children: [
                   Expanded(child: _buildTextField("Jam Mulai", _workStartController, Icons.access_time_rounded, "09:00", readOnly: true, onTap: () => _selectTime(_workStartController))),
                   const SizedBox(width: 16),
                   Expanded(child: _buildTextField("Jam Selesai", _workEndController, Icons.access_time_filled_rounded, "21:00", readOnly: true, onTap: () => _selectTime(_workEndController))),
                ],
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 0,
                  ),
                  child: _isSaving 
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : Text(isEdit ? "SIMPAN PERUBAHAN" : "TAMBAH BARBER", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, String hint, {TextInputType? keyboardType, int maxLines = 1, bool readOnly = false, VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
        const SizedBox(height: 10),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          readOnly: readOnly,
          onTap: onTap,
          validator: (value) => value == null || value.isEmpty ? "Harap isi bidang ini" : null,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
            prefixIcon: Icon(icon, color: Theme.of(context).primaryColor, size: 20),
            filled: true,
            fillColor: Colors.white.withOpacity(0.03),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.white.withOpacity(0.05))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Theme.of(context).primaryColor.withOpacity(0.5))),
            errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.redAccent)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }

  Future<void> _selectTime(TextEditingController controller) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(
        hour: int.parse(controller.text.split(":")[0]),
        minute: int.parse(controller.text.split(":")[1]),
      ),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: ColorScheme.dark(
              primary: Theme.of(context).primaryColor,
              onPrimary: Colors.black,
              surface: const Color(0xFF1A1A1A),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        controller.text = "${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}";
      });
    }
  }
}
