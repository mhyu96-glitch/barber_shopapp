import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import '../../widgets/atelier_card.dart';
import '../../widgets/atelier_text_field.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  String _searchQuery = "";
  final _searchController = TextEditingController();
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
    final gold = const Color(0xFFD4AF37);
    
    final filteredCustomers = _allCustomers.where((c) {
      final q = _searchQuery.toLowerCase();
      return c.name.toLowerCase().contains(q) || (c.phone ?? '').contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        title: const Text('CLIENT REGISTRY', style: TextStyle(fontFamily: 'Epilogue', fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 2.0)),
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: AtelierTextField(
              controller: _searchController,
              label: "SEARCH REGISTRY",
              hintText: "Enter name or phone...",
              prefixIcon: Icons.search_rounded,
              onChanged: (v) {
                if (mounted) setState(() => _searchQuery = v);
              },
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
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), shape: BoxShape.circle),
                          child: Icon(Icons.person_search_rounded, size: 48, color: Colors.white.withOpacity(0.05)),
                        ),
                        const SizedBox(height: 24),
                        Text(_searchQuery.isEmpty ? "NO CLIENTS LOGGED" : "NO IDENTITY MATCHED", 
                             style: TextStyle(color: Colors.white.withOpacity(0.2), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: filteredCustomers.length,
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                    itemBuilder: (context, index) {
                      final customer = filteredCustomers[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: AtelierCard(
                          padding: const EdgeInsets.all(20),
                          child: Row(
                            children: [
                              Container(
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: gold.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: gold.withOpacity(0.1)),
                                ),
                                child: Center(
                                  child: Text(
                                    customer.name.isNotEmpty ? customer.name.substring(0, 1).toUpperCase() : 'P',
                                    style: TextStyle(color: gold, fontWeight: FontWeight.w900, fontSize: 20),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(customer.name.toUpperCase(), 
                                         style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: -0.5)),
                                    const SizedBox(height: 2),
                                    Text("${customer.phone ?? 'ANONYMOUS'} • ${customer.totalVisits} SESSIONS", 
                                         style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 11, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                              Icon(Icons.chevron_right_rounded, color: Colors.white.withOpacity(0.1), size: 20),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 20, right: 10),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              colors: [Color(0xFFFFD700), Color(0xFFD4AF37)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(color: gold.withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8)),
            ],
          ),
          child: FloatingActionButton(
            onPressed: () {},
            backgroundColor: Colors.transparent,
            elevation: 0,
            foregroundColor: const Color(0xFF412D00),
            child: const Icon(Icons.person_add_alt_1_rounded),
          ),
        ),
      ),
    );
  }
}
