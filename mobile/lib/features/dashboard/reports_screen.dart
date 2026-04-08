import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../widgets/atelier_card.dart';
import '../../widgets/atelier_button.dart';
import 'package:intl/intl.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gold = const Color(0xFFD4AF37);
    
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        title: const Text('ANALYTICS COMMAND', style: TextStyle(fontFamily: 'Epilogue', fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 2.0)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.share_outlined, color: gold.withOpacity(0.8), size: 20),
            onPressed: () {},
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: SupabaseService.getDashboardStats(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final stats = snapshot.data ?? {'revenue_today': 0.0, 'total_done': 0, 'total_customers': 0};
          
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildReportCard("DAILY REVENUE", "IDR ${NumberFormat("#,###", "id_ID").format(stats['revenue_today'])}", Icons.payments_rounded, gold),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: _buildReportCard("COMPLETED", "${stats['total_done']}", Icons.auto_awesome_rounded, Colors.greenAccent)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildReportCard("TOTAL CLIENTS", "${stats['total_customers']}", Icons.people_rounded, Colors.blueAccent)),
                  ],
                ),
                
                const SizedBox(height: 48),
                Text(
                  "FINANCIAL PROJECTION", 
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.3), letterSpacing: 2.5)
                ),
                const SizedBox(height: 24),
                AtelierCard(
                  height: 240,
                  width: double.infinity,
                  color: const Color(0xFF1C1B1B).withOpacity(0.5),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), shape: BoxShape.circle),
                          child: Icon(Icons.analytics_outlined, color: Colors.white.withOpacity(0.05), size: 48),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          "DATA AGGREGATION IN PROGRESS", 
                          style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.5)
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Projections will manifest as more sessions are logged.", 
                          style: TextStyle(color: Colors.white.withOpacity(0.1), fontSize: 11, fontWeight: FontWeight.w500)
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  child: AtelierButton(
                    label: "EXPORT AUDIT DATA",
                    isSecondary: true,
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildReportCard(String title, String value, IconData icon, Color color) {
    return AtelierCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 20),
          Text(
            title, 
            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.5)
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value, 
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1.0)
            ),
          ),
        ],
      ),
    );
  }
}
