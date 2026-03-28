import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/models.dart';
import 'app_state.dart';

class SupabaseService {
  static final client = Supabase.instance.client;

  // --- Auth & Profiles ---
  static String _formatUsernameToEmail(String username) {
    if (username.contains('@')) return username.trim();
    return "${username.trim().toLowerCase()}@barberpro.local";
  }

  static Future<AuthResponse> signIn(String username, String password) async {
    final email = _formatUsernameToEmail(username);
    return await client.auth.signInWithPassword(email: email, password: password);
  }

  static Future<AuthResponse> signUp(String username, String password, String fullName, String role) async {
    final email = _formatUsernameToEmail(username);
    final shopId = AppState.shopId.value;
    return await client.auth.signUp(
      email: email, 
      password: password,
      data: {
        'full_name': fullName, 
        'role': role, 
        'username': username.trim(),
        'shop_id': shopId,
      },
    );
  }

  static Future<void> signOut() async {
    await client.auth.signOut();
  }

  static Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    final response = await client.from('profiles').select().eq('id', userId).maybeSingle();
    final profile = response as Map<String, dynamic>?;
    if (profile != null) {
      AppState.isSuperAdmin.value = profile['is_super_admin'] ?? false;
    }
    return profile;
  }

  static Future<Map<String, dynamic>?> getShopInfo(String shopId) async {
    final response = await client.from('shops').select('name').eq('id', shopId).maybeSingle();
    return response as Map<String, dynamic>?;
  }

  // --- Barbers ---
  static Future<List<Barber>> getBarbers() async {
    final shopId = AppState.shopId.value;
    var query = client.from('barbers').select();
    if (shopId != null) query = query.eq('shop_id', shopId);
    final response = await query;
    return (response as List).map((json) => Barber.fromMap(json)).toList();
  }

  static Future<void> addBarber(Map<String, dynamic> barberData) async {
    final shopId = AppState.shopId.value;
    if (shopId != null) barberData['shop_id'] = shopId;
    await client.from('barbers').insert(barberData);
  }

  static Future<void> updateBarber(String id, Map<String, dynamic> barberData) async {
    final shopId = AppState.shopId.value;
    var query = client.from('barbers').update(barberData).eq('id', id);
    if (shopId != null) query = query.eq('shop_id', shopId);
    await query;
  }

  static Future<void> deleteBarber(String id) async {
    final shopId = AppState.shopId.value;
    var query = client.from('barbers').delete().eq('id', id);
    if (shopId != null) query = query.eq('shop_id', shopId);
    await query;
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
    final shopId = AppState.shopId.value;
    var query = client.from('customers').update({'avatar': avatarUrl}).eq('id', id);
    if (shopId != null) query = query.eq('shop_id', shopId);
    await query;
  }

  static Future<void> updateBarberAvatar(String name, String avatarUrl) async {
    final shopId = AppState.shopId.value;
    // In this app, we identify barbers by name in AppState for now
    var query = client.from('barbers').update({'avatar': avatarUrl}).eq('name', name);
    if (shopId != null) query = query.eq('shop_id', shopId);
    await query;
  }

  // --- Appointments ---
  static Future<List<Appointment>> getAppointments({String? status, String? barberId}) async {
    final shopId = AppState.shopId.value;
    var query = client.from('appointments').select('*, customers(name), barbers(name), services(name)');
    
    if (shopId != null) query = query.eq('shop_id', shopId);
    if (status != null) query = query.eq('status', status);
    if (barberId != null) query = query.eq('barber_id', barberId);
    
    final response = await query.order('date', ascending: true).order('time', ascending: true);
    return (response as List).map((json) => _mapAppointmentWithJoins(json)).toList();
  }

  static Stream<List<Appointment>> getAppointmentsStream({String? barberId}) {
    final shopId = AppState.shopId.value;
    
    // In supabase_flutter 2.x, stream() returns SupabaseStreamBuilder.
    // eq() and order() return builders. We only cast to Stream for asyncMap.
    dynamic builder = client.from('appointments').stream(primaryKey: ['id']);
    
    if (shopId != null) {
      builder = builder.eq('shop_id', shopId);
    }
    
    if (barberId != null) {
      builder = builder.eq('barber_id', barberId);
    }
    
    builder = builder.order('date', ascending: true);
    
    return (builder as Stream<List<Map<String, dynamic>>>)
        .asyncMap<List<Appointment>>((data) async {
      // Re-fetch with joins for full display data (Customer name, Barber name, Service name)
      final shopId = AppState.shopId.value;
      var query = client.from('appointments').select('*, customers(name), barbers(name), services(name)');
      
      if (shopId != null) query = query.eq('shop_id', shopId);
      if (barberId != null) query = query.eq('barber_id', barberId);
      
      final fullData = await query.order('date', ascending: true).order('time', ascending: true);
      return (fullData as List).map((json) => _mapAppointmentWithJoins(json)).toList();
    });
  }

  static Future<void> addAppointment(Map<String, dynamic> appointmentData) async {
    final shopId = AppState.shopId.value;
    final branchId = AppState.branchId.value;
    if (shopId != null) appointmentData['shop_id'] = shopId;
    if (branchId != null) appointmentData['branch_id'] = branchId;
    await client.from('appointments').insert(appointmentData);
  }

  static Future<void> updateAppointmentStatus(String id, String status) async {
    final shopId = AppState.shopId.value;
    var query = client.from('appointments').update({'status': status}).eq('id', id);
    if (shopId != null) query = query.eq('shop_id', shopId);
    await query;
    
    // If status is 'done', increment total_visits for the customer
    if (status == 'done') {
      try {
        var aptQuery = client.from('appointments').select('customer_id, shop_id').eq('id', id);
        if (shopId != null) aptQuery = aptQuery.eq('shop_id', shopId);
        final apt = await aptQuery.single();
        
        final customerId = apt['customer_id'];
        if (customerId != null) {
          var custQuery = client.from('customers').select('total_visits').eq('id', customerId);
          if (shopId != null) custQuery = custQuery.eq('shop_id', shopId);
          final customer = await custQuery.single();
          
          final currentVisits = (customer['total_visits'] ?? 0) as int;
          var updateCustQuery = client.from('customers').update({'total_visits': currentVisits + 1}).eq('id', customerId);
          if (shopId != null) updateCustQuery = updateCustQuery.eq('shop_id', shopId);
          await updateCustQuery;
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
    final shopId = AppState.shopId.value;
    var query = client.from('services').select();
    if (shopId != null) query = query.eq('shop_id', shopId);
    return await query;
  }

  // --- Customers ---
  static Future<List<Map<String, dynamic>>> getCustomers() async {
    final shopId = AppState.shopId.value;
    var query = client.from('customers').select();
    if (shopId != null) query = query.eq('shop_id', shopId);
    return await query.order('name', ascending: true);
  }

  // --- Dashboard Stats ---
  static Future<Map<String, dynamic>> getDashboardStats({String? barberId}) async {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final shopId = AppState.shopId.value;
    
    // Revenue today
    var revenueQuery = client.from('appointments').select('price').eq('date', todayStr).eq('status', 'done');
    if (shopId != null) revenueQuery = revenueQuery.eq('shop_id', shopId);
    if (barberId != null) revenueQuery = revenueQuery.eq('barber_id', barberId);
    final appointmentsToday = await revenueQuery;
    double revenueToday = (appointmentsToday as List).fold(0.0, (sum, item) => sum + (item['price'] ?? 0).toDouble());

    // Done appointments count
    var doneQuery = client.from('appointments').select('id').eq('status', 'done');
    if (shopId != null) doneQuery = doneQuery.eq('shop_id', shopId);
    if (barberId != null) doneQuery = doneQuery.eq('barber_id', barberId);
    final doneRes = await doneQuery;
    int totalDone = (doneRes as List).length;

    // Total customers count
    var customerQuery = client.from('customers').select('id');
    if (shopId != null) customerQuery = customerQuery.eq('shop_id', shopId);
    final customerRes = await customerQuery;
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

  /// Listen specifically for new portal bookings and trigger a notification callback
  static RealtimeChannel subscribeToNewBookings(
      void Function(Map<String, dynamic> booking) onNewBooking) {
    return client
        .channel('portal-bookings')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'appointments',
          callback: (payload) {
            final newRecord = payload.newRecord;
            if (newRecord['source'] == 'portal') {
              onNewBooking(newRecord);
            }
          },
        )
        .subscribe();
  }

  // --- Attendance ---
  static Future<Attendance?> getTodayAttendance(String profileId) async {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final shopId = AppState.shopId.value;
    
    var query = client.from('attendance').select().eq('profile_id', profileId).eq('date', todayStr);
    if (shopId != null) query = query.eq('shop_id', shopId);
    
    final response = await query.maybeSingle();
    return response != null ? Attendance.fromMap(response) : null;
  }

  static Future<void> checkIn(String profileId) async {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final shopId = AppState.shopId.value;
    
    await client.from('attendance').insert({
      'profile_id': profileId,
      'date': todayStr,
      'check_in': now.toIso8601String(),
      'status': 'present',
      'shop_id': shopId,
    });
  }

  static Future<void> checkOut(String id) async {
    final now = DateTime.now();
    final shopId = AppState.shopId.value;
    var query = client.from('attendance').update({
      'check_out': now.toIso8601String(),
    }).eq('id', id);
    if (shopId != null) query = query.eq('shop_id', shopId);
    await query;
  }

  static Future<List<Map<String, dynamic>>> getAllAttendanceToday() async {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final shopId = AppState.shopId.value;
    
    var query = client.from('attendance').select('*, profiles(full_name, role, username)').eq('date', todayStr);
    if (shopId != null) query = query.eq('shop_id', shopId);
    
    return await query;
  }

  // --- Super Admin Management ---
  static Future<List<Map<String, dynamic>>> getShops() async {
    // Requires is_super_admin = true (RLS enforced)
    return await client.from('shops').select('*, subscription_plans(name)');
  }

  static Future<List<Map<String, dynamic>>> getSubscriptionPlans() async {
    return await client.from('subscription_plans').select();
  }

  static Future<void> updateShopStatus(String shopId, String status, {String? planId}) async {
    final Map<String, dynamic> data = {'status': status};
    if (planId != null) data['plan_id'] = planId;
    await client.from('shops').update(data).eq('id', shopId);
  }

  static Future<void> addSubscription(Map<String, dynamic> subData) async {
    await client.from('subscriptions').insert(subData);
  }
}
