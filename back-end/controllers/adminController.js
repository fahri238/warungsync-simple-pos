const db = require("../config/db");
const bcrypt = require("bcryptjs");

const getDashboardStatsFull = async (req, res) => {
  try {
    const [stores] = await db.query("SELECT COUNT(*) as total FROM stores");
    const [owners] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE peran = 'owner'",
    );
    const [pelanggan] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE peran = 'pelanggan'",
    );
    const [kurir] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE peran = 'kurir'",
    );
    const [produk] = await db.query("SELECT COUNT(*) as total FROM products");
    const [pesanan] = await db.query(
      "SELECT COUNT(*) as total, SUM(komisi_sistem) as total_komisi FROM orders WHERE status = 'selesai'",
    );

    const [transaksiHarian] = await db.query(
      `SELECT DATE(tanggal_dibuat) as tanggal, COUNT(*) as jumlah_pesanan FROM orders WHERE tanggal_dibuat >= DATE(NOW()) - INTERVAL 7 DAY GROUP BY DATE(tanggal_dibuat) ORDER BY tanggal ASC`,
    );
    const chartTransaksi = transaksiHarian.map((item) => ({
      name: new Date(item.tanggal).toLocaleDateString("id-ID", {
        weekday: "short",
      }),
      total: item.jumlah_pesanan,
    }));

    const [penggunaBaru] = await db.query(
      `SELECT DATE(tanggal_dibuat) as tanggal, COUNT(*) as jumlah_user FROM users WHERE tanggal_dibuat >= DATE(NOW()) - INTERVAL 7 DAY GROUP BY DATE(tanggal_dibuat) ORDER BY tanggal ASC`,
    );
    const chartPengguna = penggunaBaru.map((item) => ({
      name: new Date(item.tanggal).toLocaleDateString("id-ID", {
        weekday: "short",
      }),
      total: item.jumlah_user,
    }));

    const [userTerbaru] = await db.query(
      `SELECT nama, peran, tanggal_dibuat FROM users ORDER BY tanggal_dibuat DESC, id DESC LIMIT 5`,
    );
    const aktivitasTerbaru = userTerbaru.map((user) => ({
      type: "register",
      pesan: `${user.nama} baru saja mendaftar sebagai ${user.peran.charAt(0).toUpperCase() + user.peran.slice(1)}`,
      waktu: new Date(user.tanggal_dibuat).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

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
          komisi: pesanan[0].total_komisi || 0,
        },
        chartTransaksi:
          chartTransaksi.length > 0
            ? chartTransaksi
            : [{ name: "Data Kosong", total: 0 }],
        chartPengguna:
          chartPengguna.length > 0
            ? chartPengguna
            : [{ name: "Data Kosong", total: 0 }],
        aktivitasTerbaru: aktivitasTerbaru,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal memuat data statistik sistem" });
  }
};

const getStores = async (req, res) => {
  try {
    const [stores] = await db.query("SELECT * FROM stores ORDER BY id DESC");
    res.status(200).json({ success: true, data: stores });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data toko" });
  }
};
const createStore = async (req, res) => {
  const { nama, kontak, alamat, latitude, longitude } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO stores (nama, kontak, alamat, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
      [nama, kontak, alamat, latitude || null, longitude || null],
    );
    res.status(201).json({
      success: true,
      message: "Toko berhasil ditambahkan",
      data: { id: result.insertId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menambah toko" });
  }
};
const updateStore = async (req, res) => {
  const { id } = req.params;
  const { nama, kontak, alamat, latitude, longitude } = req.body;
  try {
    await db.query(
      "UPDATE stores SET nama=?, kontak=?, alamat=?, latitude=?, longitude=? WHERE id=?",
      [nama, kontak, alamat, latitude || null, longitude || null, id],
    );
    res
      .status(200)
      .json({ success: true, message: "Data toko berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui toko" });
  }
};
const deleteStore = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM stores WHERE id=?", [id]);
    res.status(200).json({ success: true, message: "Toko berhasil dihapus" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus. Pastikan toko ini tidak memiliki produk.",
    });
  }
};
const toggleStoreStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query("UPDATE stores SET status=? WHERE id=?", [status, id]);
    res.status(200).json({
      success: true,
      message: `Toko berhasil di${status === "aktif" ? "aktifkan" : "nonaktifkan"}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengubah status toko" });
  }
};

// ================= KELOLA PENGGUNA =================
const getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.store_id, u.nama, u.email, u.kontak, u.peran, u.status, u.tanggal_dibuat, u.is_approved, u.nik, u.tipe_kendaraan, u.plat_nomor, u.foto_ktp, 
             s.nama as nama_toko, s.alamat as alamat_toko, s.kategori_toko, s.foto_warung, s.latitude, s.longitude
      FROM users u LEFT JOIN stores s ON u.store_id = s.id ORDER BY u.id DESC
    `);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data pengguna" });
  }
};
const createUser = async (req, res) => {
  // PERBAIKAN: Menangkap latitude dan longitude dari frontend
  const {
    nama,
    email,
    kata_sandi,
    kontak,
    peran,
    nama_toko,
    alamat_toko,
    nik,
    tipe_kendaraan,
    plat_nomor,
    store_id,
    latitude,
    longitude,
  } = req.body;
  const fotoKtp =
    req.files && req.files["foto_ktp"]
      ? req.files["foto_ktp"][0].filename
      : null;
  const fotoWarung =
    req.files && req.files["foto_warung"]
      ? req.files["foto_warung"][0].filename
      : null;

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0)
      return res
        .status(400)
        .json({ success: false, message: "Email sudah terdaftar" });

    const hashedPassword = await bcrypt.hash(kata_sandi, 10);
    let finalStoreId = store_id || null;

    if (peran === "owner") {
      // PERBAIKAN: Menyertakan koordinat saat membuat toko
      const [resStore] = await db.query(
        "INSERT INTO stores (nama, alamat, status, foto_warung, latitude, longitude) VALUES (?, ?, 'aktif', ?, ?, ?)",
        [
          nama_toko || "Toko " + nama,
          alamat_toko || "",
          fotoWarung,
          latitude || null,
          longitude || null,
        ],
      );
      finalStoreId = resStore.insertId;
    }

    const [result] = await db.query(
      "INSERT INTO users (store_id, nama, email, kata_sandi, kontak, peran, is_approved, status, nik, tipe_kendaraan, plat_nomor, foto_ktp) VALUES (?, ?, ?, ?, ?, ?, 1, 'aktif', ?, ?, ?, ?)",
      [
        finalStoreId,
        nama,
        email,
        hashedPassword,
        kontak,
        peran,
        nik || null,
        tipe_kendaraan || null,
        plat_nomor || null,
        fotoKtp,
      ],
    );

    res
      .status(201)
      .json({ success: true, message: "Pengguna berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menambah pengguna",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  let {
    nama,
    email,
    kata_sandi,
    kontak,
    peran,
    nama_toko,
    alamat_toko,
    nik,
    tipe_kendaraan,
    plat_nomor,
    store_id,
    latitude,
    longitude,
  } = req.body;

  if (req.user && req.user.id === parseInt(id)) peran = "admin";

  const fotoKtp =
    req.files && req.files["foto_ktp"]
      ? req.files["foto_ktp"][0].filename
      : null;
  const fotoWarung =
    req.files && req.files["foto_warung"]
      ? req.files["foto_warung"][0].filename
      : null;

  try {
    // 1. Ambil store_id lama dari database agar tidak tertimpa menjadi null
    const [existingUser] = await db.query(
      "SELECT store_id FROM users WHERE id=?",
      [id],
    );
    const currentStoreId = existingUser[0]?.store_id;

    // KUNCI PERBAIKAN: Jika dia Kurir, pakai store_id dari form. Jika Owner/lainnya, pertahankan yang lama.
    let finalStoreId = currentStoreId;
    if (peran === "kurir") finalStoreId = store_id || currentStoreId;

    if (kata_sandi && kata_sandi.trim() !== "") {
      const hashedPassword = await bcrypt.hash(kata_sandi, 10);
      await db.query("UPDATE users SET kata_sandi=? WHERE id=?", [
        hashedPassword,
        id,
      ]);
    }

    // 2. Update dengan finalStoreId yang aman
    await db.query(
      "UPDATE users SET nama=?, email=?, kontak=?, peran=?, nik=?, tipe_kendaraan=?, plat_nomor=?, store_id=? WHERE id=?",
      [
        nama,
        email,
        kontak,
        peran,
        nik || null,
        tipe_kendaraan || null,
        plat_nomor || null,
        finalStoreId,
        id,
      ],
    );

    if (fotoKtp)
      await db.query("UPDATE users SET foto_ktp=? WHERE id=?", [fotoKtp, id]);

    if (peran === "owner" && finalStoreId) {
      await db.query(
        "UPDATE stores SET nama=?, alamat=?, latitude=?, longitude=? WHERE id=?",
        [
          nama_toko,
          alamat_toko,
          latitude || null,
          longitude || null,
          finalStoreId,
        ],
      );
      if (fotoWarung)
        await db.query("UPDATE stores SET foto_warung=? WHERE id=?", [
          fotoWarung,
          finalStoreId,
        ]);
    }

    res
      .status(200)
      .json({ success: true, message: "Data pengguna berhasil diperbarui" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(400)
        .json({
          success: false,
          message: "Email sudah digunakan oleh akun lain",
        });
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui pengguna" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (req.user && req.user.id === parseInt(id))
    return res.status(403).json({
      success: false,
      message:
        "Tindakan ditolak: Anda tidak dapat menghapus akun Anda sendiri!",
    });
  try {
    await db.query("DELETE FROM users WHERE id=?", [id]);
    res
      .status(200)
      .json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus pengguna. (Terkait transaksi)",
    });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (req.user && req.user.id === parseInt(id))
    return res
      .status(403)
      .json({ success: false, message: "Tindakan ditolak!" });
  try {
    await db.query("UPDATE users SET status=? WHERE id=?", [status, id]);
    res.status(200).json({
      success: true,
      message: `Akun berhasil di${status === "aktif" ? "aktifkan" : "nonaktifkan"}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengubah status pengguna" });
  }
};

const approveCourierByAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE users SET is_approved = 1, status = 'aktif' WHERE id = ?",
      [id],
    );
    res
      .status(200)
      .json({ success: true, message: "Kurir berhasil disetujui oleh Admin" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menyetujui kurir" });
  }
};

const getAdminBankAccounts = async (req, res) => {
  const { storeId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM bank_accounts WHERE store_id = ?",
      [storeId],
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data rekening" });
  }
};

const addAdminBankAccount = async (req, res) => {
  const { storeId } = req.params;
  const { bank_name, account_number, account_name } = req.body;
  try {
    await db.query(
      "INSERT INTO bank_accounts (store_id, bank_name, account_number, account_name) VALUES (?, ?, ?, ?)",
      [storeId, bank_name, account_number, account_name],
    );
    res.status(201).json({
      success: true,
      message: "Rekening berhasil ditambahkan oleh Admin",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menambahkan rekening" });
  }
};

const deleteAdminBankAccount = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM bank_accounts WHERE id = ?", [id]);
    res
      .status(200)
      .json({ success: true, message: "Rekening berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus rekening" });
  }
};

const getReports = async (req, res) => {
  /* ... Kode Laporan ... */ res.status(200).json({ success: true });
};
const getPendingOwners = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nama, u.email, u.kontak, u.foto_ktp, s.nama as nama_toko, s.alamat as alamat_toko FROM users u LEFT JOIN stores s ON u.store_id = s.id WHERE u.peran = 'owner' AND u.is_approved = 0 ORDER BY u.id DESC`,
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data verifikasi" });
  }
};
const manageOwnerStatus = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT store_id FROM users WHERE id = ?",
      [id],
    );
    const storeId = users[0]?.store_id;
    if (action === "approve") {
      await connection.query(
        "UPDATE users SET is_approved = 1, status = 'aktif' WHERE id = ?",
        [id],
      );
      if (storeId)
        await connection.query(
          "UPDATE stores SET status = 'aktif' WHERE id = ?",
          [storeId],
        );
      res
        .status(200)
        .json({ success: true, message: "Pemilik Toko disetujui!" });
    } else if (action === "reject") {
      await connection.query("DELETE FROM users WHERE id = ?", [id]);
      if (storeId)
        await connection.query("DELETE FROM stores WHERE id = ?", [storeId]);
      res.status(200).json({
        success: true,
        message: "Pendaftaran ditolak dan data dihapus",
      });
    }
    await connection.commit();
    connection.release();
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui status verifikasi" });
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
  getReports,
  getPendingOwners,
  manageOwnerStatus,
  approveCourierByAdmin,
  getAdminBankAccounts,
  addAdminBankAccount,
  deleteAdminBankAccount,
};
