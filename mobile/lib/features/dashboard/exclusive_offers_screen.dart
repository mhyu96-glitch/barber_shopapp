import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import '../../widgets/atelier_card.dart';

class ExclusiveOffersScreen extends StatefulWidget {
  const ExclusiveOffersScreen({super.key});

  @override
  State<ExclusiveOffersScreen> createState() => _ExclusiveOffersScreenState();
}

class _ExclusiveOffersScreenState extends State<ExclusiveOffersScreen> {
  List<Promo> _promos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final data = await SupabaseService.getPromos();
      if (mounted) {
        setState(() {
          _promos = data.map((e) => Promo.fromMap(e)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final goldColor = const Color(0xFFD4AF37);

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: BackButton(color: goldColor),
        title: Text(
          "EXCLUSIVE OFFERS",
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            letterSpacing: 2.0,
          ),
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: goldColor))
          : _promos.isEmpty
              ? Center(
                  child: Text("NO ACTIVE OFFERS",
                      style: TextStyle(color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.w800, letterSpacing: 2.0)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: _promos.length,
                  itemBuilder: (context, index) {
                    final promo = _promos[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      child: AtelierGlassCard(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: goldColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: goldColor.withOpacity(0.3)),
                                  ),
                                  child: Icon(Icons.local_offer_rounded, color: goldColor, size: 28),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        promo.title,
                                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        promo.type == 'percentage' ? '${promo.discount}% OFF' : 'Rp ${promo.discount} OFF',
                                        style: TextStyle(fontSize: 14, color: goldColor, fontWeight: FontWeight.w900, letterSpacing: 1.0),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (promo.description != null && promo.description!.isNotEmpty) ...[
                              const SizedBox(height: 20),
                              Text(
                                promo.description!,
                                style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14, height: 1.5),
                              ),
                            ],
                            const SizedBox(height: 24),
                            if (promo.code != null && promo.code!.isNotEmpty)
                              InkWell(
                                onTap: () {
                                  Clipboard.setData(ClipboardData(text: promo.code!));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text("Code ${promo.code} copied to clipboard", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w700)),
                                      backgroundColor: goldColor,
                                      behavior: SnackBarBehavior.floating,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                },
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: goldColor, width: 1.5),
                                    borderRadius: BorderRadius.circular(12),
                                    color: goldColor.withOpacity(0.05),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text("PROMO CODE", style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.5), fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                                          const SizedBox(height: 4),
                                          Text(promo.code!, style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2.0)),
                                        ],
                                      ),
                                      Icon(Icons.copy_rounded, color: goldColor),
                                    ],
                                  ),
                                ),
                              )
                            else
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                decoration: BoxDecoration(
                                  border: Border.all(color: goldColor, width: 1.5),
                                  borderRadius: BorderRadius.circular(12),
                                  color: goldColor.withOpacity(0.05),
                                ),
                                child: const Center(
                                  child: Text("AUTOMATICALLY APPLIED", style: TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
