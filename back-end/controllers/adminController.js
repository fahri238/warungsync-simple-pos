const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getDashboardStatsFull = async (req, res) => {
  try {
    // 1. AMBIL TOTAL DATA DARI DATABASE MYSQL
    const [stores] = await db.query("SELECT COUNT(*) as total FROM stores");
    const [owners] = await db.query("SELECT COUNT(*) as total FROM users WHERE peran = 'owner'");
    const [pelanggan] = await db.query("SELECT COUNT(*) as total FROM users WHERE peran = 'pelanggan'");
    const [kurir] = await db.query("SELECT COUNT(*) as total FROM users WHERE peran = 'kurir'");
    const [produk] = await db.query("SELECT COUNT(*) as total FROM products");
    const [pesanan] = await db.query("SELECT COUNT(*) as total FROM orders");

    // 2. AMBIL DATA GRAFIK TRANSAKSI (7 Hari Terakhir)
    const [transaksiHarian] = await db.query(`
      SELECT DATE(tanggal_dibuat) as tanggal, COUNT(*) as jumlah_pesanan 
      FROM orders 
      WHERE tanggal_dibuat >= DATE(NOW()) - INTERVAL 7 DAY 
      GROUP BY DATE(tanggal_dibuat) 
      ORDER BY tanggal ASC
    `);

    // Format data transaksi agar sesuai dengan grafik di React (Recharts)
    const chartTransaksi = transaksiHarian.map(item => ({
      name: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
      total: item.jumlah_pesanan
    }));

    // 3. AMBIL DATA GRAFIK PERTUMBUHAN PENGGUNA (7 Hari Terakhir)
    const [penggunaBaru] = await db.query(`
      SELECT DATE(tanggal_dibuat) as tanggal, COUNT(*) as jumlah_user 
      FROM users 
      WHERE tanggal_dibuat >= DATE(NOW()) - INTERVAL 7 DAY 
      GROUP BY DATE(tanggal_dibuat) 
      ORDER BY tanggal ASC
    `);

    const chartPengguna = penggunaBaru.map(item => ({
      name: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short' }),
      total: item.jumlah_user
    }));

    // 4. AMBIL 5 AKTIVITAS REGISTRASI TERBARU
    const [userTerbaru] = await db.query(`
      SELECT nama, peran, tanggal_dibuat 
      FROM users 
      ORDER BY tanggal_dibuat DESC, id DESC 
      LIMIT 5
    `);

    const aktivitasTerbaru = userTerbaru.map(user => {
      // Format waktu (contoh: "05 Jul, 09:30")
      const waktu = new Date(user.tanggal_dibuat).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      
      // Kapitalisasi huruf pertama pada peran
      const peranKapital = user.peran.charAt(0).toUpperCase() + user.peran.slice(1);

      return {
        type: "register",
        pesan: `${user.nama} baru saja mendaftar sebagai ${peranKapital}`,
        waktu: waktu
      };
    });

    // KEMBALIKAN DATA KE REACT
    res.status(200).json({
      success: true,
      data: {
        totals: {
          tenant: stores[0].total || 0,
          owner: owners[0].total || 0,
          pelanggan: pelanggan[0].total || 0,
          kurir: kurir[0].total || 0,
          produk: produk[0].total || 0,
          pesanan: pesanan[0].total || 0,
        },
        chartTransaksi: chartTransaksi.length > 0 ? chartTransaksi : [
          { name: "Data Kosong", total: 0 }
        ],
        chartPengguna: chartPengguna.length > 0 ? chartPengguna : [
          { name: "Data Kosong", total: 0 }
        ],
        aktivitasTerbaru: aktivitasTerbaru
      }
    });

  } catch (error) {
    console.error("Error mengambil statistik admin:", error);
    res.status(500).json({ success: false, message: "Gagal memuat data statistik sistem" });
  }
};

// ================= KELOLA TOKO (TENANT) =================

// 1. Ambil Semua Data Toko
const getStores = async (req, res) => {
  try {
    const [stores] = await db.query("SELECT * FROM stores ORDER BY id DESC");
    res.status(200).json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data toko" });
  }
};

// 2. Tambah Toko Baru
const createStore = async (req, res) => {
  const { nama, kontak, alamat, latitude, longitude } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO stores (nama, kontak, alamat, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
      [nama, kontak, alamat, latitude || null, longitude || null]
    );
    res.status(201).json({ success: true, message: "Toko berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah toko" });
  }
};

// 3. Edit Data Toko
const updateStore = async (req, res) => {
  const { id } = req.params;
  const { nama, kontak, alamat, latitude, longitude } = req.body;
  try {
    await db.query(
      "UPDATE stores SET nama=?, kontak=?, alamat=?, latitude=?, longitude=? WHERE id=?",
      [nama, kontak, alamat, latitude || null, longitude || null, id]
    );
    res.status(200).json({ success: true, message: "Data toko berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui toko" });
  }
};

// 4. Hapus Toko
const deleteStore = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM stores WHERE id=?", [id]);
    res.status(200).json({ success: true, message: "Toko berhasil dihapus" });
  } catch (error) {
    // Error biasanya terjadi jika toko ini sudah punya produk/transaksi (Foreign Key constraint)
    res.status(500).json({ success: false, message: "Gagal menghapus. Pastikan toko ini tidak memiliki produk atau transaksi aktif." });
  }
};

// 5. Aktifkan / Nonaktifkan Toko
const toggleStoreStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Menerima 'aktif' atau 'nonaktif'
  try {
    await db.query("UPDATE stores SET status=? WHERE id=?", [status, id]);
    res.status(200).json({ success: true, message: `Toko berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengubah status toko" });
  }
};

// ================= KELOLA PENGGUNA (USERS) =================

// 1. Ambil Semua Data Pengguna (Tanpa password)
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, store_id, nama, email, kontak, peran, status, tanggal_dibuat FROM users ORDER BY id DESC"
    );
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data pengguna" });
  }
};

// 2. Tambah Pengguna Baru
const createUser = async (req, res) => {
  const { nama, email, kata_sandi, kontak, peran } = req.body;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(kata_sandi, saltRounds);
    
    const [result] = await db.query(
      "INSERT INTO users (nama, email, kata_sandi, kontak, peran) VALUES (?, ?, ?, ?, ?)",
      [nama, email, hashedPassword, kontak, peran]
    );
    res.status(201).json({ success: true, message: "Pengguna berhasil ditambahkan", data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
    }
    res.status(500).json({ success: false, message: "Gagal menambah pengguna" });
  }
};

// 3. Edit Data Pengguna
const updateUser = async (req, res) => {
  const { id } = req.params;
  let { nama, email, kata_sandi, kontak, peran } = req.body; // Ubah 'const' menjadi 'let' agar bisa dimodifikasi

  // PERLINDUNGAN BACKEND: Cegah admin mengubah jabatannya sendiri (Self-Demotion)
  if (req.user && req.user.id === parseInt(id)) {
    // Paksa peran tetap 'admin' terlepas dari apa pun yang dikirim oleh Frontend
    peran = 'admin';
  }

  try {
    // Jika admin mengisi kata sandi baru, kita enkripsi dan update
    if (kata_sandi && kata_sandi.trim() !== "") {
      const hashedPassword = await bcrypt.hash(kata_sandi, 10);
      await db.query(
        "UPDATE users SET nama=?, email=?, kata_sandi=?, kontak=?, peran=? WHERE id=?",
        [nama, email, hashedPassword, kontak, peran, id]
      );
    } else {
      // Jika kata sandi dikosongkan, update data lainnya saja
      await db.query(
        "UPDATE users SET nama=?, email=?, kontak=?, peran=? WHERE id=?",
        [nama, email, kontak, peran, id]
      );
    }
    res.status(200).json({ success: true, message: "Data pengguna berhasil diperbarui" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: "Email sudah digunakan oleh akun lain" });
    }
    res.status(500).json({ success: false, message: "Gagal memperbarui pengguna" });
  }
};

// 4. Hapus Pengguna
const deleteUser = async (req, res) => {
  const { id } = req.params;
  
  // PERLINDUNGAN BACKEND: Cegah admin menghapus dirinya sendiri
  if (req.user && req.user.id === parseInt(id)) {
    return res.status(403).json({ success: false, message: "Tindakan ditolak: Anda tidak dapat menghapus akun Anda sendiri!" });
  }

  try {
    await db.query("DELETE FROM users WHERE id=?", [id]);
    res.status(200).json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus. Pastikan pengguna ini tidak terkait dengan data transaksi." });
  }
};

// 5. Aktifkan / Nonaktifkan Pengguna
const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  // PERLINDUNGAN BACKEND: Cegah admin menonaktifkan dirinya sendiri
  if (req.user && req.user.id === parseInt(id)) {
    return res.status(403).json({ success: false, message: "Tindakan ditolak: Anda tidak dapat menonaktifkan akun Anda sendiri!" });
  }

  try {
    await db.query("UPDATE users SET status=? WHERE id=?", [status, id]);
    res.status(200).json({ success: true, message: `Akun berhasil di${status === 'aktif' ? 'aktifkan' : 'nonaktifkan'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengubah status pengguna" });
  }
};

// ================= LAPORAN GLOBAL =================

const getReports = async (req, res) => {
  const { period } = req.query;
  
  let dateFilter = "";
  let dateFilterUsers = "";

  // Logika Filter Periode SQL
  if (period === "hari_ini") {
    dateFilter = "AND DATE(tanggal_dibuat) = CURDATE()";
    dateFilterUsers = "WHERE DATE(tanggal_dibuat) = CURDATE()";
  } else if (period === "minggu_ini") {
    dateFilter = "AND tanggal_dibuat >= DATE(NOW()) - INTERVAL 7 DAY";
    dateFilterUsers = "WHERE tanggal_dibuat >= DATE(NOW()) - INTERVAL 7 DAY";
  } else if (period === "bulan_ini") {
    dateFilter = "AND MONTH(tanggal_dibuat) = MONTH(CURDATE()) AND YEAR(tanggal_dibuat) = YEAR(CURDATE())";
    dateFilterUsers = "WHERE MONTH(tanggal_dibuat) = MONTH(CURDATE()) AND YEAR(tanggal_dibuat) = YEAR(CURDATE())";
  }

  try {
    // 1. STATISTIK RINGKASAN
    const [omzetRes] = await db.query(`SELECT SUM(total_harga) as total FROM orders WHERE status = 'selesai' ${dateFilter}`);
    const [trxRes] = await db.query(`SELECT COUNT(*) as total FROM orders WHERE status = 'selesai' ${dateFilter}`);
    const [tokoAktifRes] = await db.query("SELECT COUNT(*) as total FROM stores WHERE status = 'aktif'");
    const [userBaruRes] = await db.query(`SELECT COUNT(*) as total FROM users ${dateFilterUsers}`);

    // 2. DATA TRANSAKSI
    // PERBAIKAN: Menambahkan o.tanggal_dibuat agar MySQL tidak ambigu saat melakukan JOIN
    const [transaksi] = await db.query(`
      SELECT o.id, o.tanggal_dibuat, o.total_harga, o.status,
             IFNULL(s.nama, 'Toko Tidak Diketahui') as nama_toko,
             IFNULL(u.nama, 'Pelanggan Umum') as nama_pelanggan
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1 ${dateFilter.replace(/tanggal_dibuat/g, 'o.tanggal_dibuat')}
      ORDER BY o.tanggal_dibuat DESC
    `);

    // 3. DATA PERFORMA TOKO
    const [toko] = await db.query(`
      SELECT s.id, s.nama,
             IFNULL(u.nama, 'Tanpa Owner') as nama_owner,
             COUNT(o.id) as total_pesanan,
             IFNULL(SUM(o.total_harga), 0) as omzet
      FROM stores s
      LEFT JOIN users u ON u.store_id = s.id AND u.peran = 'owner'
      LEFT JOIN orders o ON o.store_id = s.id AND o.status = 'selesai' ${dateFilter.replace(/tanggal_dibuat/g, 'o.tanggal_dibuat')}
      GROUP BY s.id
      ORDER BY omzet DESC
    `);

    // 4. DATA PENGGUNA
    const [pengguna] = await db.query(`
      SELECT id, nama, peran, tanggal_dibuat, status
      FROM users
      ${dateFilterUsers}
      ORDER BY tanggal_dibuat DESC
    `);

    // Kirim semua data ke Frontend
    res.status(200).json({
      success: true,
      data: {
        stats: {
          omzetTotal: omzetRes[0].total || 0,
          totalTransaksi: trxRes[0].total || 0,
          tokoAktif: tokoAktifRes[0].total || 0,
          penggunaBaru: userBaruRes[0].total || 0
        },
        transaksi,
        toko,
        pengguna
      }
    });

  } catch (error) {
    console.error("Error mengambil laporan:", error);
    res.status(500).json({ success: false, message: "Gagal memuat data laporan dari database" });
  }
};

module.exports = { 
  getDashboardStatsFull,
  getStores,
  createStore,
  updateStore,
  deleteStore,
  toggleStoreStatus,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getReports
};