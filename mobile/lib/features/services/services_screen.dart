import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../widgets/atelier_card.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const goldColor = Color(0xFFD4AF37);
    const obsidianColor = Color(0xFF0D0D0D);

    return Scaffold(
      backgroundColor: obsidianColor,
      appBar: AppBar(
        title: const Text(
          'CATALOGUE D\'EXCELLENCE', 
          style: TextStyle(
            fontWeight: FontWeight.w900, 
            fontSize: 14, 
            letterSpacing: 3.0,
            color: Colors.white
          )
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: SupabaseService.getServices(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: goldColor));
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'COMMUNICATION ERROR: ${snapshot.error}', 
                style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 10)
              )
            );
          }
          
          final services = snapshot.data ?? [];
          if (services.isEmpty) {
            return Center(
              child: Text(
                'REGISTRY EMPTY', 
                style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2.0)
              )
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            itemCount: services.length,
            itemBuilder: (context, index) {
              final service = services[index];
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: AtelierCard(
                  padding: const EdgeInsets.all(24),
                  child: Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: goldColor.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: goldColor.withOpacity(0.1)),
                        ),
                        child: const Icon(Icons.content_cut_rounded, color: goldColor, size: 24),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              (service['name'] ?? 'Layanan').toString().toUpperCase(), 
                              style: const TextStyle(
                                color: Colors.white, 
                                fontSize: 16, 
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5
                              )
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                "${service['duration'] ?? 30} MINS SESSION", 
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.4), 
                                  fontSize: 8, 
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.0
                                )
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            "Rp",
                            style: TextStyle(
                              color: goldColor.withOpacity(0.6), 
                              fontSize: 9, 
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.0
                            ),
                          ),
                          Text(
                            "${service['price'] ?? 0}",
                            style: const TextStyle(
                              color: Colors.white, 
                              fontSize: 20, 
                              fontWeight: FontWeight.w900,
                              letterSpacing: -1.0
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
