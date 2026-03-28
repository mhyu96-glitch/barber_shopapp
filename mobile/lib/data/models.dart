class Barber {
  final String id;
  final String name;
  final String specialization;
  final double rating;
  final int totalRatings;
  final String? phone;
  final List<int> workDays;
  final String? workStart;
  final String? workEnd;
  final String? avatar;
  final String? bio;

  Barber({
    required this.id,
    required this.name,
    required this.specialization,
    this.rating = 0.0,
    this.totalRatings = 0,
    this.phone,
    this.workDays = const [1, 2, 3, 4, 5, 6],
    this.workStart,
    this.workEnd,
    this.avatar,
    this.bio,
  });

  factory Barber.fromMap(Map<String, dynamic> map) {
    return Barber(
      id: map['id'],
      name: map['name'],
      specialization: map['specialization'] ?? '',
      rating: (map['rating'] ?? 0.0).toDouble(),
      totalRatings: map['total_ratings'] ?? 0,
      phone: map['phone'],
      workDays: List<int>.from(map['work_days'] ?? [1, 2, 3, 4, 5, 6]),
      workStart: map['work_start'],
      workEnd: map['work_end'],
      avatar: map['avatar'],
      bio: map['bio'],
    );
  }
}

class Appointment {
  final String id;
  final String? customerId;
  final String? barberId;
  final String? serviceId;
  final String customerName;
  final String serviceName;
  final String barberName;
  final String date;
  final String time;
  final String status; // 'scheduled', 'confirmed', 'done', 'cancelled'
  final String paymentStatus;
  final int paymentAmount;

  Appointment({
    required this.id,
    this.customerId,
    this.barberId,
    this.serviceId,
    required this.customerName,
    required this.serviceName,
    required this.barberName,
    required this.date,
    required this.time,
    this.status = 'scheduled',
    this.paymentStatus = 'unpaid',
    this.paymentAmount = 0,
  });

  factory Appointment.fromMap(Map<String, dynamic> map) {
    return Appointment(
      id: map['id'],
      customerId: map['customer_id'],
      barberId: map['barber_id'],
      serviceId: map['service_id'],
      customerName: map['customer_name'] ?? 'Tamu',
      serviceName: map['service_name'] ?? 'Potong Rambut',
      barberName: map['barber_name'] ?? '-',
      date: map['date'] ?? '',
      time: map['time'] ?? '',
      status: map['status'] ?? 'scheduled',
      paymentStatus: map['payment_status'] ?? 'unpaid',
      paymentAmount: (map['payment_amount'] ?? 0).toInt(),
    );
  }
}
class Customer {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? avatar;
  final int totalVisits;

  Customer({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.avatar,
    this.totalVisits = 0,
  });

  factory Customer.fromMap(Map<String, dynamic> map) {
    return Customer(
      id: map['id'],
      name: map['name'] ?? '',
      phone: map['phone'],
      email: map['email'],
      avatar: map['avatar'],
      totalVisits: map['total_visits'] ?? 0,
    );
  }
}

class Attendance {
  final String id;
  final String profileId;
  final String date;
  final String? checkIn;
  final String? checkOut;
  final String status;
  final String? notes;

  Attendance({
    required this.id,
    required this.profileId,
    required this.date,
    this.checkIn,
    this.checkOut,
    this.status = 'present',
    this.notes,
  });

  factory Attendance.fromMap(Map<String, dynamic> map) {
    return Attendance(
      id: map['id'],
      profileId: map['profile_id'],
      date: map['date'] ?? '',
      checkIn: map['check_in'],
      checkOut: map['check_out'],
      status: map['status'] ?? 'present',
      notes: map['notes'],
    );
  }
}
