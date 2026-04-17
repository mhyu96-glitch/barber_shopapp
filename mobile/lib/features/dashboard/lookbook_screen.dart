import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import '../../widgets/atelier_card.dart';

class LookbookScreen extends StatefulWidget {
  const LookbookScreen({super.key});

  @override
  State<LookbookScreen> createState() => _LookbookScreenState();
}

class _LookbookScreenState extends State<LookbookScreen> {
  List<GalleryItem> _gallery = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final data = await SupabaseService.getGallery();
      if (mounted) {
        setState(() {
          _gallery = data.map((e) => GalleryItem.fromMap(e)).toList();
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
          "MASTERPIECE LOOKBOOK",
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
          : _gallery.isEmpty
              ? Center(
                  child: Text("NO STYLES AVAILABLE",
                      style: TextStyle(color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.w800, letterSpacing: 2.0)),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: _gallery.length,
                  itemBuilder: (context, index) {
                    final item = _gallery[index];
                    return GestureDetector(
                      onTap: () {
                        // View Full Screen Image
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                          image: item.imageUrl != null
                              ? DecorationImage(image: NetworkImage(item.imageUrl!), fit: BoxFit.cover)
                              : null,
                          color: const Color(0xFF1C1B1B),
                        ),
                        child: Stack(
                          children: [
                            if (item.imageUrl == null)
                              Center(
                                child: Icon(Icons.image_outlined, color: Colors.white.withOpacity(0.2), size: 40),
                              ),
                            Positioned(
                              bottom: 0,
                              left: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.bottomCenter,
                                    end: Alignment.topCenter,
                                    colors: [Colors.black.withOpacity(0.9), Colors.transparent],
                                  ),
                                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      (item.category ?? 'EXECUTIVE').toUpperCase(),
                                      style: TextStyle(fontSize: 9, color: goldColor, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                    ),
                                  ],
                                ),
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
