import 'package:flutter/material.dart';

class BookingConfirmedScreen extends StatelessWidget {
  const BookingConfirmedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: backgroundDark,
      body: SafeArea(
        child: Column(
          children: [
            // --- Header ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                    onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                  ),
                    const Expanded(
                      child: Text(
                        'Janji Dikonfirmasi',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const SizedBox(height: 32),
                    // --- Success Visual (Layered Glow) ---
                    _buildPremiumSuccessVisual(primaryColor),
                    
                    const SizedBox(height: 32),
                    const Text(
                      "Janji Berhasil Dibuat",
                      style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "Kursi Anda sudah siap. Kami telah mengirimkan email konfirmasi dengan detail lengkap.",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 15, height: 1.5),
                    ),

                    const SizedBox(height: 48),
                    // --- Summary Card ---
                    _buildPremiumSummaryCard(primaryColor),

                    const SizedBox(height: 24),
                    // --- Sync Action ---
                    _buildPremiumSyncAction(primaryColor),

                    const SizedBox(height: 24),
                    // --- Map Preview (Simulated) ---
                    _buildMapPreview(primaryColor),
                    
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),

            // --- Footer Button ---
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: backgroundDark,
                  minimumSize: const Size(double.infinity, 60),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text("Selesai", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumSuccessVisual(Color primary) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Multi-layered blurs
        Container(
          width: 160,
          height: 160,
          decoration: BoxDecoration(
            color: primary.withOpacity(0.08),
            shape: BoxShape.circle,
          ),
        ),
        Container(
          width: 120,
          height: 120,
          decoration: BoxDecoration(
            color: primary.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
        ),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: primary,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: primary.withOpacity(0.4), blurRadius: 30, spreadRadius: 5)
            ],
          ),
          child: const Icon(Icons.check_rounded, color: Colors.black, size: 48, fontWeight: FontWeight.w900),
        ),
      ],
    );
  }

  Widget _buildPremiumSummaryCard(Color primary) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "RINGKASAN JANJI",
            style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5),
          ),
          const SizedBox(height: 24),
          _buildDetailRow(Icons.content_cut_rounded, "Layanan", "Potong Rambut Premium", primary),
          _buildDetailRow(Icons.person_outline_rounded, "Barber", "Marcus Miller", primary),
          _buildDetailRow(Icons.calendar_today_rounded, "Tanggal & Waktu", "Sen, 23 Maret • 11:15", primary),
          _buildDetailRow(Icons.location_on_outlined, "Lokasi", "Jl. Mewah No. 123, Blok A", primary, isLast: true),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, Color primary, {bool isLast = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: primary, size: 18),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11, fontWeight: FontWeight.w500)),
                Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumSyncAction(Color primary) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: primary.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(Icons.event_note_rounded, color: primary, size: 24),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Tambah ke Kalender", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                Text("Sinkronkan dengan jadwal Anda", style: TextStyle(color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text("SINKRON", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildMapPreview(Color primary) {
    return Container(
      height: 140,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        image: const DecorationImage(
          image: NetworkImage('https://lh3.googleusercontent.com/aida-public/AB6AXuAR9tyN34dA9AcHKMAE3GIDoEqBgbTpBWHZev6ieLIq7ezdfJK6ucGV2AP-7TrB-eRBGeUybZsgDQAjrrTq_0Nwx9QUrKQMipDFlboHMGR59-z6Ne1sqWux8Szg6ZkDVHQY8ViTdwHmNiocllU6dRmmRx2nLYVGdNppD4tbVE4M3ZgUP-NjMBLdI_cxyoSRWjQNXxOj_8EBta6F5jF2dt5VeNVvtmMgE3UR2QD5n8ynO2mRlxmZcic2PJ1o44k_A79GaLVxF2GL4A'),
          fit: BoxFit.cover,
          opacity: 0.4,
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          color: primary.withOpacity(0.1),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.location_on_rounded, color: primary, size: 40),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                child: const Text("Buka di Peta", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
