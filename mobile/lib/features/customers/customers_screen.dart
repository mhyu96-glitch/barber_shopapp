import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  String _searchQuery = "";
  List<Customer> _allCustomers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  Future<void> _fetchCustomers() async {
    try {
      final data = await SupabaseService.getCustomers();
      if (mounted) {
        setState(() {
          _allCustomers = data.map((e) => Customer.fromMap(e)).toList();
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
    
    final filteredCustomers = _allCustomers.where((c) {
      final q = _searchQuery.toLowerCase();
      return c.name.toLowerCase().contains(q) || (c.phone ?? '').contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Database Pelanggan', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              style: const TextStyle(color: Colors.white),
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Cari nama atau nomor HP...',
                hintStyle: const TextStyle(color: Colors.white38),
                prefixIcon: const Icon(Icons.search, color: Colors.white38),
                filled: true,
                fillColor: Colors.white.withOpacity(0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : filteredCustomers.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.person_search_rounded, size: 64, color: Colors.white10),
                        const SizedBox(height: 16),
                        Text(_searchQuery.isEmpty ? "Belum ada pelanggan" : "Pelanggan tidak ditemukan", style: const TextStyle(color: Colors.white38)),
                      ],
                    ),
                  )
                : ListView.separated(
                    itemCount: filteredCustomers.length,
                    padding: const EdgeInsets.only(bottom: 80),
                    separatorBuilder: (context, index) => Divider(color: Colors.white.withOpacity(0.05), height: 1),
                    itemBuilder: (context, index) {
                      final customer = filteredCustomers[index];
                      return ListTile(
                        onTap: () {
                          // TODO: Show detailed history
                        },
                        leading: CircleAvatar(
                          backgroundColor: primaryColor.withOpacity(0.1),
                          child: Text(
                            customer.name.isNotEmpty ? customer.name.substring(0, 1).toUpperCase() : 'P',
                            style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
                          ),
                        ),
                        title: Text(customer.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Text("${customer.phone ?? 'MEMBER'} • ${customer.totalVisits} Visit", style: const TextStyle(color: Colors.white38, fontSize: 12)),
                        trailing: const Icon(Icons.chevron_right, color: Colors.white24, size: 20),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Add customer dialog
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Fitur Tambah Pelanggan segera hadir")));
        },
        backgroundColor: primaryColor,
        foregroundColor: Colors.black,
        child: const Icon(Icons.person_add_alt_1_rounded),
      ),
    );
  }
}
