import 'package:flutter/material.dart';
import '../../core/supabase_service.dart';
import '../../data/models.dart';
import 'booking_confirmed_screen.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  List<Map<String, dynamic>> _services = [];
  List<Barber> _barbers = [];
  
  Map<String, dynamic>? _selectedService;
  Barber? _selectedBarber;
  int _selectedDateIndex = 0;
  String? _selectedTime = '10:00';
  bool _isLoading = true;
  
  Color get primaryColor => Theme.of(context).primaryColor;
  Color get backgroundDark => Theme.of(context).scaffoldBackgroundColor;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final services = await SupabaseService.getServices();
      final barbers = await SupabaseService.getBarbers();
      setState(() {
        _services = services;
        _barbers = barbers;
        if (_services.isNotEmpty) _selectedService = _services.first;
        if (_barbers.isNotEmpty) _selectedBarber = _barbers.first;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading data: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmBooking() async {
    if (_selectedService == null || _selectedBarber == null || _selectedTime == null) return;

    setState(() => _isLoading = true);
    
    final date = DateTime.now().add(Duration(days: _selectedDateIndex));
    final dateStr = "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";

    final appointmentData = {
      'barber_id': _selectedBarber!.id,
      'service_id': _selectedService!['id'],
      'date': dateStr,
      'time': _selectedTime,
      'duration': _selectedService!['duration'] ?? 30,
      'price': _selectedService!['price'] ?? 0,
      'status': 'scheduled',
      'payment_status': 'unpaid',
    };

    try {
      await SupabaseService.addAppointment(appointmentData);
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const BookingConfirmedScreen()),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Gagal membuat janji: $e")),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: backgroundDark,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: backgroundDark,
      body: Column(
        children: [
          // --- Custom AppBar ---
          Container(
            padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 10, bottom: 10),
            decoration: BoxDecoration(
              color: backgroundDark,
              border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
                Expanded(
                  child: const Text(
                    'Buat Janji',
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
              padding: const EdgeInsets.symmetric(horizontal: 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 24, 20, 16),
                    child: Text(
                      'Pilih Layanan',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      children: _services.map((s) => _buildServiceRadio(s)).toList(),
                    ),
                  ),

                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 32, 20, 16),
                    child: Text(
                      'Pilih Barber',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  _buildPremiumBarberList(),

                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 32, 20, 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Pilih Tanggal', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('Maret 2026', style: TextStyle(color: primaryColor, fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  _buildPremiumDateScroller(),

                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 32, 20, 16),
                    child: Text(
                      'Waktu Tersedia',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _buildPremiumTimeGrid(),
                  ),
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),
      // --- Sticky Bottom CTA ---
      bottomSheet: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: backgroundDark.withOpacity(0.8),
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Total Harga", style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12)),
                  Text("Rp ${_selectedService?['price'] ?? 0}", style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(width: 24),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _confirmBooking,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _isLoading ? 'Memproses...' : 'Konfirmasi Janji', 
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)
                      ),
                      const SizedBox(width: 8),
                      if (!_isLoading) const Icon(Icons.event_available, color: Colors.white, size: 18),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildServiceRadio(Map<String, dynamic> service) {
    bool isSelected = _selectedService?['id'] == service['id'];
    return GestureDetector(
      onTap: () => setState(() => _selectedService = service),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor.withOpacity(0.05) : Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? primaryColor : Colors.white.withOpacity(0.05),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(service['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text("Rp ${service['price']} • ${service['duration']} menit", style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
                ],
              ),
            ),
            Radio<String>(
              value: service['id'],
              groupValue: _selectedService?['id'],
              onChanged: (val) => setState(() => _selectedService = service),
              activeColor: primaryColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumBarberList() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 20),
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: _barbers.map((b) {
          bool isSelected = _selectedBarber?.id == b.id;
          return GestureDetector(
            onTap: () => setState(() => _selectedBarber = b),
            child: Padding(
              padding: const EdgeInsets.only(right: 24),
              child: Opacity(
                opacity: isSelected ? 1.0 : 0.6,
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: isSelected ? primaryColor : Colors.transparent, width: 2),
                          ),
                          child: CircleAvatar(
                            backgroundImage: b.avatar != null && b.avatar!.isNotEmpty 
                                ? NetworkImage(b.avatar!) 
                                : const NetworkImage('https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=100'),
                          ),
                        ),
                        if (isSelected)
                          Positioned(
                            bottom: 2,
                            right: 2,
                            child: Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: Colors.greenAccent,
                                shape: BoxShape.circle,
                                border: Border.all(color: backgroundDark, width: 2),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(b.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text(b.specialization, style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPremiumDateScroller() {
    final now = DateTime.now();
    final dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(left: 20),
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: List.generate(30, (index) {
          final date = now.add(Duration(days: index));
          bool isSelected = _selectedDateIndex == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedDateIndex = index),
            child: Container(
              width: 72,
              height: 90,
              margin: const EdgeInsets.only(right: 12),
              decoration: BoxDecoration(
                color: isSelected ? primaryColor : Colors.white.withOpacity(0.03),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isSelected ? primaryColor : Colors.white.withOpacity(0.05)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(dayNames[date.weekday % 7], style: TextStyle(color: isSelected ? Colors.white.withOpacity(0.7) : Colors.white.withOpacity(0.3), fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(date.day.toString(), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                  if (isSelected)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildPremiumTimeGrid() {
    final times = ['09:00', '10:30', '11:15', '13:00', '14:30', '16:00', '17:30', '18:45', '20:00'];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 2.2,
      ),
      itemCount: times.length,
      itemBuilder: (context, index) {
        bool isSelected = _selectedTime == times[index];
        bool isLocked = times[index] == '17:30';
        return GestureDetector(
          onTap: isLocked ? null : () => setState(() => _selectedTime = times[index]),
          child: Container(
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSelected ? primaryColor : (isLocked ? Colors.white.withOpacity(0.01) : Colors.white.withOpacity(0.03)),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isSelected ? primaryColor : Colors.white.withOpacity(0.05)),
              boxShadow: isSelected ? [BoxShadow(color: primaryColor.withOpacity(0.3), blurRadius: 15, spreadRadius: 1)] : null,
            ),
            child: Text(
              times[index],
              style: TextStyle(
                color: isSelected ? Colors.white : (isLocked ? Colors.white.withOpacity(0.1) : Colors.white.withOpacity(0.7)),
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ),
        );
      },
    );
  }
}
