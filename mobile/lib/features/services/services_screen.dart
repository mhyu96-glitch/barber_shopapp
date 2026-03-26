import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Layanan & Harga', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: SupabaseService.getServices(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }
          
          final services = snapshot.data ?? [];
          if (services.isEmpty) {
            return const Center(child: Text('Belum ada layanan tersedia', style: TextStyle(color: Colors.white38)));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: services.length,
            itemBuilder: (context, index) {
              final service = services[index];
              final primaryColor = Theme.of(context).primaryColor;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.03),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(Icons.content_cut_rounded, color: primaryColor, size: 24),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(service['name'] ?? 'Layanan', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text("${service['duration'] ?? 30} menit", style: const TextStyle(color: Colors.white38, fontSize: 13)),
                        ],
                      ),
                    ),
                    Text(
                      "Rp ${service['price'] ?? 0}",
                      style: TextStyle(color: primaryColor, fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
