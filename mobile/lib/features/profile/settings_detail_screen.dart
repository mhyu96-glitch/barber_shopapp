import 'package:flutter/material.dart';

class SettingsDetailScreen extends StatelessWidget {
  final String title;
  final IconData icon;

  const SettingsDetailScreen({
    super.key,
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;
    final backgroundDark = Theme.of(context).scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: backgroundDark,
      appBar: AppBar(
        backgroundColor: backgroundDark,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: _buildContent(context, primaryColor),
    );
  }

  Widget _buildContent(BuildContext context, Color primaryColor) {
    if (title == "Janji Saya") {
      return _buildAppointmentsList(primaryColor);
    } else if (title == "Metode Pembayaran") {
      return _buildPaymentMethods(primaryColor);
    } else if (title == "Barber Favorit") {
      return _buildFavoriteBarbers(primaryColor);
    } else if (title == "Notifikasi") {
      return _buildNotificationsList(primaryColor);
    } else if (title == "Pengaturan Akun") {
      return _buildAccountSettings(primaryColor);
    }
    return Center(child: Text("Konten untuk $title segera hadir", style: const TextStyle(color: Colors.white60)));
  }

  Widget _buildAppointmentsList(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildAppointmentItem("23 Mar", "14:30", "Potong Rambut Eksekutif", "Marcus", "Mendatang", primary),
        _buildAppointmentItem("15 Mar", "10:00", "Classic Fade", "Julian", "Selesai", primary),
        _buildAppointmentItem("02 Mar", "16:15", "Beard Trim", "Elias", "Selesai", primary),
      ],
    );
  }

  Widget _buildAppointmentItem(String date, String time, String service, String barber, String status, Color primary) {
    bool isUpcoming = status == "Mendatang";
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(date.split(" ")[0], style: const TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
              Text(date.split(" ")[1], style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(service, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                Text("dengan $barber • $time", style: const TextStyle(color: Colors.white38, fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isUpcoming ? primary.withOpacity(0.1) : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              status,
              style: TextStyle(color: isUpcoming ? primary : Colors.white38, fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethods(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildCardItem("**** **** **** 4582", "VISA", "Primary", primary),
        _buildCardItem("**** **** **** 1099", "MASTERCARD", "", primary),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.add_rounded),
          label: const Text("TAMBAH KARTU BARU"),
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            foregroundColor: Colors.black,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
      ],
    );
  }

  Widget _buildCardItem(String number, String type, String status, Color primary) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.white.withOpacity(0.08), Colors.white.withOpacity(0.03)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(type, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 2)),
              if (status.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: primary, borderRadius: BorderRadius.circular(8)),
                  child: const Text("UTAMA", style: TextStyle(color: Colors.black, fontSize: 8, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 24),
          Text(number, style: const TextStyle(color: Colors.white, fontSize: 18, letterSpacing: 3)),
          const SizedBox(height: 12),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("NAME ON CARD", style: TextStyle(color: Colors.white24, fontSize: 8)),
              Text("EXPIRES", style: TextStyle(color: Colors.white24, fontSize: 8)),
            ],
          ),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("JOHN DOE", style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              Text("09/28", style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFavoriteBarbers(Color primary) {
    final favorites = [
      {'name': 'Marcus', 'role': 'Senior Barber', 'url': 'https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=100'},
      {'name': 'Julian', 'role': 'Master Stylist', 'url': 'https://images.unsplash.com/photo-1540569014015-19a7ee400e1a?w=100'},
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: favorites.length,
      itemBuilder: (context, index) {
        final b = favorites[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(16),
          ),
          child: ListTile(
            leading: CircleAvatar(backgroundImage: NetworkImage(b['url']!)),
            title: Text(b['name']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            subtitle: Text(b['role']!, style: const TextStyle(color: Colors.white38, fontSize: 12)),
            trailing: IconButton(
              icon: const Icon(Icons.favorite, color: Colors.redAccent),
              onPressed: () {},
            ),
          ),
        );
      },
    );
  }

  Widget _buildNotificationsList(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _buildNotificationItem("Sesi Anda dimulai dalam 1 jam!", "Jangan lupa hadir tepat waktu di studio.", "1 jam lalu", primary, true),
        _buildNotificationItem("Promo Spesial Maret", "Dapatkan diskon 20% untuk layanan Royal Shave.", "2 hari lalu", primary, false),
        _buildNotificationItem("Janji Dikonfirmasi", "Janji Anda dengan Marcus telah diverifikasi.", "3 hari lalu", primary, false),
      ],
    );
  }

  Widget _buildNotificationItem(String title, String body, String time, Color primary, bool isUnread) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isUnread ? primary.withOpacity(0.05) : Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isUnread ? primary.withOpacity(0.2) : Colors.white.withOpacity(0.03)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              if (isUnread) Container(width: 8, height: 8, decoration: BoxDecoration(color: primary, shape: BoxShape.circle)),
            ],
          ),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(color: Colors.white60, fontSize: 12)),
          const SizedBox(height: 8),
          Text(time, style: const TextStyle(color: Colors.white24, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildAccountSettings(Color primary) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField("Nama Lengkap", "Budi Santoso", primary),
          _buildTextField("Email", "budi.santoso@email.com", primary),
          _buildTextField("Nomor Telepon", "+62 812-3456-7890", primary),
          _buildTextField("Password", "********", primary, isPassword: true),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: primary,
              foregroundColor: Colors.black,
              minimumSize: const Size(double.infinity, 60),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text("SIMPAN PERUBAHAN", style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, String value, Color primary, {bool isPassword = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            obscureText: isPassword,
            controller: TextEditingController(text: value),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white.withOpacity(0.03),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: primary)),
            ),
          ),
        ],
      ),
    );
  }
}
