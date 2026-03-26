import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import 'add_edit_barber_screen.dart';

class BarberListScreen extends StatefulWidget {
  const BarberListScreen({super.key});

  @override
  State<BarberListScreen> createState() => _BarberListScreenState();
}

class _BarberListScreenState extends State<BarberListScreen> {
  List<Barber> _barbers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBarbers();
  }

  Future<void> _fetchBarbers() async {
    try {
      final barbers = await SupabaseService.getBarbers();
      if (mounted) {
        setState(() {
          _barbers = barbers;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Daftar Barber', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const AddEditBarberScreen()),
          );
          if (result == true) _fetchBarbers();
        },
        backgroundColor: primaryColor,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add_rounded),
        label: const Text("TAMBAH BARBER", style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _barbers.isEmpty
          ? const Center(child: Text('Belum ada barber terdaftar', style: TextStyle(color: Colors.white38)))
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _barbers.length,
              itemBuilder: (context, index) {
                final barber = _barbers[index];
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Colors.white.withOpacity(0.05)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: primaryColor.withOpacity(0.1),
                        child: barber.avatar != null 
                          ? ClipOval(child: Image.network(barber.avatar!, fit: BoxFit.cover, width: 56, height: 56))
                          : Text(barber.name.substring(0, 1), style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 20)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(barber.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            Text(barber.specialization, style: TextStyle(color: primaryColor.withOpacity(0.7), fontSize: 12)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.star_rounded, color: Colors.amber, size: 14),
                                const SizedBox(width: 4),
                                Text("${barber.rating} (${barber.totalRatings} ratings)", style: const TextStyle(color: Colors.white38, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      PopupMenuButton<String>(
                        icon: const Icon(Icons.more_vert_rounded, color: Colors.white38),
                        onSelected: (value) async {
                          if (value == 'edit') {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => AddEditBarberScreen(barber: barber)),
                            );
                            if (result == true) _fetchBarbers();
                          } else if (value == 'delete') {
                            _confirmDelete(context, barber);
                          }
                        },
                        itemBuilder: (context) => [
                          const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18), SizedBox(width: 10), Text("Edit")])),
                          const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline_rounded, size: 18, color: Colors.redAccent), SizedBox(width: 10), Text("Hapus", style: TextStyle(color: Colors.redAccent))])),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  void _confirmDelete(BuildContext context, Barber barber) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text("Hapus Barber?"),
        content: Text("Apakah Anda yakin ingin menghapus ${barber.name} dari sistem?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("BATAL", style: TextStyle(color: Colors.white38))),
          TextButton(
            onPressed: () async {
              await SupabaseService.deleteBarber(barber.id);
              if (mounted) {
                Navigator.pop(context);
                _fetchBarbers();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Barber berhasil dihapus")));
              }
            }, 
            child: const Text("HAPUS", style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))
          ),
        ],
      ),
    );
  }
}
