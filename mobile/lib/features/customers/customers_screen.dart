import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';

class CustomersScreen extends StatelessWidget {
  const CustomersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    
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
              decoration: InputDecoration(
                hintText: 'Cari pelanggan...',
                hintStyle: const TextStyle(color: Colors.white38),
                prefixIcon: const Icon(Icons.search, color: Colors.white38),
                filled: true,
                fillColor: Colors.white.withOpacity(0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: SupabaseService.getCustomers(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final customers = snapshot.data ?? [];
                if (customers.isEmpty) {
                  return const Center(child: Text("Belum ada pelanggan", style: TextStyle(color: Colors.white38)));
                }
                return ListView.separated(
                  itemCount: customers.length,
                  separatorBuilder: (context, index) => Divider(color: Colors.white.withOpacity(0.05)),
                  itemBuilder: (context, index) {
                    final customer = customers[index];
                    return ListTile(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text("Detail pelanggan: ${customer['name']}")),
                        );
                      },
                      leading: CircleAvatar(
                        backgroundColor: primaryColor.withOpacity(0.1),
                        child: Text(
                          (customer['name'] as String? ?? 'P').substring(0, 1),
                          style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text(customer['name'] ?? 'Tanpa Nama', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      subtitle: Text("${customer['phone'] ?? '-'} • ${(customer['total_visits'] ?? 0)} Visit", style: const TextStyle(color: Colors.white38)),
                      trailing: const Icon(Icons.chevron_right, color: Colors.white24),
                    );
                  },
                );
              }
            ),
          ),
        ],
      ),
    );
  }
}
