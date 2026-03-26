import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/models.dart';

class SupabaseService {
  static final client = Supabase.instance.client;

  // --- Barbers ---
  static Future<List<Barber>> getBarbers() async {
    final response = await client.from('barbers').select();
    return (response as List).map((json) => Barber.fromMap(json)).toList();
  }

  static Future<void> addBarber(Map<String, dynamic> barberData) async {
    await client.from('barbers').insert(barberData);
  }

  static Future<void> updateBarber(String id, Map<String, dynamic> barberData) async {
    await client.from('barbers').update(barberData).eq('id', id);
  }

  static Future<void> deleteBarber(String id) async {
    await client.from('barbers').delete().eq('id', id);
  }

  // --- Storage & Avatars ---
  static Future<String?> uploadAvatar(String fileName, Uint8List fileBytes) async {
    try {
      final path = 'avatars/$fileName';
      await client.storage.from('avatars').uploadBinary(
        path, 
        fileBytes, 
        fileOptions: const FileOptions(upsert: true, contentType: 'image/jpeg')
      );
      return client.storage.from('avatars').getPublicUrl(path);
    } catch (e) {
      print("Error uploading: $e");
      return null;
    }
  }

  static Future<void> updateCustomerAvatar(String id, String avatarUrl) async {
    await client.from('customers').update({'avatar': avatarUrl}).eq('id', id);
  }

  static Future<void> updateBarberAvatar(String name, String avatarUrl) async {
    // In this app, we identify barbers by name in AppState for now
    await client.from('barbers').update({'avatar': avatarUrl}).eq('name', name);
  }

  // --- Appointments ---
  static Future<List<Appointment>> getAppointments({String? status}) async {
    var query = client.from('appointments').select('*, customers(name), barbers(name), services(name)');
    if (status != null) {
      query = query.eq('status', status);
    }
    final response = await query.order('date', ascending: true).order('time', ascending: true);
    return (response as List).map((json) => _mapAppointmentWithJoins(json)).toList();
  }

  static Stream<List<Appointment>> getAppointmentsStream() {
    // Note: stream doesn't support joins directly in the same way as select()
    // We'll use a broadcast stream that refreshes whenever there's a change
    return client
        .from('appointments')
        .stream(primaryKey: ['id'])
        .order('date', ascending: true)
        .asyncMap((data) async {
          // For real-time with names, we might need to fetch names separately or use a simpler model
          // For now, let's just fetch the full list with joins whenever the stream triggers
          final fullData = await client.from('appointments').select('*, customers(name), barbers(name), services(name)').order('date', ascending: true);
          return (fullData as List).map((json) => _mapAppointmentWithJoins(json)).toList();
        });
  }

  static Future<void> addAppointment(Map<String, dynamic> appointmentData) async {
    await client.from('appointments').insert(appointmentData);
  }

  static Future<void> updateAppointmentStatus(String id, String status) async {
    await client.from('appointments').update({'status': status}).eq('id', id);
    
    // If status is 'done', increment total_visits for the customer
    if (status == 'done') {
      try {
        final apt = await client.from('appointments').select('customer_id').eq('id', id).single();
        final customerId = apt['customer_id'];
        if (customerId != null) {
          final customer = await client.from('customers').select('total_visits').eq('id', customerId).single();
          final currentVisits = (customer['total_visits'] ?? 0) as int;
          await client.from('customers').update({'total_visits': currentVisits + 1}).eq('id', customerId);
        }
      } catch (e) {
        print("Error updating total_visits: $e");
      }
    }
  }

  static Appointment _mapAppointmentWithJoins(Map<String, dynamic> json) {
    // Extract names from joined tables
    final customerName = json['customers']?['name'] ?? 'Tamu';
    final barberName = json['barbers']?['name'] ?? '-';
    final serviceName = json['services']?['name'] ?? 'Potong Rambut';
    
    return Appointment.fromMap({
      ...json,
      'customer_name': customerName,
      'barber_name': barberName,
      'service_name': serviceName,
    });
  }

  // --- Services ---
  static Future<List<Map<String, dynamic>>> getServices() async {
    return await client.from('services').select();
  }

  // --- Customers ---
  static Future<List<Map<String, dynamic>>> getCustomers() async {
    return await client.from('customers').select().order('name', ascending: true);
  }

  // --- Dashboard Stats ---
  static Future<Map<String, dynamic>> getDashboardStats() async {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    
    // Revenue today
    final appointmentsToday = await client.from('appointments').select('price').eq('date', todayStr).eq('status', 'done');
    double revenueToday = (appointmentsToday as List).fold(0.0, (sum, item) => sum + (item['price'] ?? 0).toDouble());

    // Done appointments count
    final doneRes = await client.from('appointments').select('id').eq('status', 'done');
    int totalDone = (doneRes as List).length;

    // Total customers count
    final customerRes = await client.from('customers').select('id');
    int totalCustomers = (customerRes as List).length;

    return {
      'revenue_today': revenueToday,
      'total_done': totalDone,
      'total_customers': totalCustomers,
    };
  }

  // --- Real-time Subscription Helper ---
  static RealtimeChannel subscribeToChanges(String table, void Function() onUpdate) {
    return client
        .channel('public:$table')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: table,
          callback: (payload) {
            onUpdate();
          },
        )
        .subscribe();
  }
}
