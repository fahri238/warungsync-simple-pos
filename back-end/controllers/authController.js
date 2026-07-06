const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";
const JWT_EXPIRY = "24h";

// ================= REGISTER =================
const register = async (req, res) => {
  const {
    nama,
    email,
    kata_sandi,
    kontak,
    peran = "pelanggan",
    alamat,
    store_id = null,
    nama_toko = null,
    nik = null,
    tipe_kendaraan = null,
    plat_nomor = null,
    // PERBAIKAN 1: Tangkap data titik peta dari frontend
    latitude = null,
    longitude = null,
  } = req.body;

  let connection;

  try {
    if (!nama || !email || !kata_sandi || !kontak) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Semua field wajib diisi (nama, email, kata sandi, kontak)",
        });
    }

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Email sudah terdaftar" });
    }

    const validRoles = ["admin", "owner", "pelanggan", "kurir"];
    if (!validRoles.includes(peran)) {
      return res
        .status(400)
        .json({ success: false, message: "Peran tidak valid" });
    }

    // VALIDASI LOGIKA TOKO
    if (peran === "kurir" && !store_id) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Kurir wajib mencantumkan ID Toko (store_id) tempat bekerja",
        });
    }

    if (peran === "owner" && !nama_toko) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Pemilik Toko wajib mencantumkan nama_toko",
        });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(kata_sandi, saltRounds);

    let finalStoreId = store_id;

    // MULAI TRANSAKSI DATABASE
    connection = await db.getConnection();
    await connection.beginTransaction();

    // JIKA YANG DAFTAR OWNER -> BUATKAN TOKO BARU DULU!
    if (peran === "owner") {
      // PERBAIKAN 2: Sesuaikan query dengan kolom riil di tabel stores Anda
      const [storeResult] = await connection.query(
        "INSERT INTO stores (nama, alamat, latitude, longitude, kontak) VALUES (?, ?, ?, ?, ?)",
        [nama_toko, alamat, latitude, longitude, kontak],
      );
      finalStoreId = storeResult.insertId; // Ambil ID toko yang baru saja terbuat
    }

    // SIMPAN USER KE DATABASE DENGAN FINAL STORE ID
    const [result] = await connection.query(
      "INSERT INTO users (store_id, nama, email, kata_sandi, kontak, peran, alamat, nik, tipe_kendaraan, plat_nomor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        finalStoreId,
        nama,
        email,
        hashedPassword,
        kontak,
        peran,
        alamat || null,
        nik,
        tipe_kendaraan,
        plat_nomor,
      ],
    );

    // KOMIT (SELESAIKAN) TRANSAKSI
    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login.",
      data: {
        id: result.insertId,
        nama,
        email,
        peran,
        store_id: finalStoreId,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback(); // Batalkan semua jika ada error
      connection.release();
    }
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mendaftar pengguna",
        error: error.message,
      });
  }
};

// ================= LOGIN =================

const login = async (req, res) => {
  const { email, kata_sandi } = req.body;

  try {
    if (!email || !kata_sandi) {
      return res
        .status(400)
        .json({ success: false, message: "Email dan kata sandi wajib diisi" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau kata sandi salah" });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(kata_sandi, user.kata_sandi);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau kata sandi salah" });
    }

    const token = jwt.sign(
      {
        id: user.id,

        nama: user.nama,

        email: user.email,

        peran: user.peran,

        store_id: user.store_id || null,
      },

      JWT_SECRET,

      { expiresIn: JWT_EXPIRY },
    );

    res.status(200).json({
      success: true,

      message: "Login berhasil",

      data: {
        token,

        user: {
          id: user.id,

          nama: user.nama,

          email: user.email,

          peran: user.peran,

          kontak: user.kontak,

          alamat: user.alamat,

          store_id: user.store_id || null,
        },
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Gagal login", error: error.message });
  }
};

// ================= GET CURRENT USER =================

const getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, store_id, nama, email, peran, kontak, alamat FROM users WHERE id = ?",

      [req.user.id],
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }

    res.status(200).json({ success: true, data: users[0] });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil data user",
        error: error.message,
      });
  }
};

// ================= UPDATE PROFILE =================

const updateProfile = async (req, res) => {
  const { nama, kontak, alamat } = req.body;

  const userId = req.user.id;

  try {
    if (!nama && !kontak && !alamat) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Minimal ada satu field yang harus diubah",
        });
    }

    const updates = [];

    const values = [];

    if (nama) {
      updates.push("nama = ?");
      values.push(nama);
    }

    if (kontak) {
      updates.push("kontak = ?");
      values.push(kontak);
    }

    if (alamat !== undefined) {
      updates.push("alamat = ?");
      values.push(alamat);
    }

    values.push(userId);

    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;

    await db.query(query, values);

    const [users] = await db.query(
      "SELECT id, store_id, nama, email, peran, kontak, alamat FROM users WHERE id = ?",

      [userId],
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Profil berhasil diperbarui",
        data: users[0],
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal memperbarui profil",
        error: error.message,
      });
  }
};

// ================= GET USERS BY STORE / ROLE =================

const getUsers = async (req, res) => {
  const { role } = req.query;

  const loggedInUserStoreId = req.user.store_id;

  const loggedInUserRole = req.user.peran;

  const validRoles = ["admin", "owner", "pelanggan", "kurir"];

  try {
    if (role && !validRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Peran tidak valid" });
    }

    const params = [];

    let query =
      "SELECT id, store_id, nama, email, peran, kontak, alamat FROM users WHERE 1=1";

    if (loggedInUserRole === "owner") {
      query += " AND store_id = ?";

      params.push(loggedInUserStoreId);
    }

    if (role) {
      query += " AND peran = ?";

      params.push(role);
    }

    query += " ORDER BY nama ASC";

    const [rows] = await db.query(query, params);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil data pengguna",
        error: error.message,
      });
  }
};

module.exports = {
  register,

  login,

  getCurrentUser,

  updateProfile,

  getUsers,
};
