const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";
const JWT_EXPIRY = "24h";

// ================= REGISTER =================
const register = async (req, res) => {
  const {
    nama,
    email,
    kata_sandi,
    kontak,       // DISESUAIKAN: dari no_hp ke kontak
    peran = "pelanggan",
    alamat,
    store_id = null, // BARU: Untuk mengunci admin/kurir ke toko tertentu
  } = req.body;

  try {
    // Validate required fields
    if (!nama || !email || !kata_sandi || !kontak) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi (nama, email, kata sandi, kontak)",
      });
    }

    // DISESUAIKAN: Nama tabel menjadi 'users'
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // Validate role
    const validRoles = ["admin", "pelanggan", "kurir"];
    if (!validRoles.includes(peran)) {
      return res.status(400).json({
        success: false,
        message: "Peran tidak valid",
      });
    }

    // Validasi toko jika mendaftar sebagai admin atau kurir
    if ((peran === "admin" || peran === "kurir") && !store_id) {
      return res.status(400).json({
        success: false,
        message: "Admin dan Kurir wajib mencantumkan store_id (ID Toko)",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(kata_sandi, saltRounds);

    // DISESUAIKAN: Sesuai skripsi id menggunakan INT Auto Increment, tidak memakai UUID string lagi
    // Insert user into database
    const [result] = await db.query(
      "INSERT INTO users (store_id, nama, email, kata_sandi, kontak, peran, alamat) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [peran === "pelanggan" ? null : store_id, nama, email, hashedPassword, kontak, peran, alamat || null]
    );

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login.",
      data: {
        id: result.insertId,
        nama,
        email,
        peran,
        store_id: peran === "pelanggan" ? null : store_id,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
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
    // Validate required fields
    if (!email || !kata_sandi) {
      return res.status(400).json({
        success: false,
        message: "Email dan kata sandi wajib diisi",
      });
    }

    // DISESUAIKAN: Nama tabel menjadi 'users'
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau kata sandi salah",
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(kata_sandi, user.kata_sandi);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau kata sandi salah",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        peran: user.peran,
        store_id: user.store_id || null, // DISESUAIKAN: id_toko -> store_id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
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
          kontak: user.kontak,       // DISESUAIKAN: no_hp -> kontak
          alamat: user.alamat,
          store_id: user.store_id || null, // DISESUAIKAN: id_toko -> store_id
        },
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Gagal login",
      error: error.message,
    });
  }
};

// ================= GET CURRENT USER =================
const getCurrentUser = async (req, res) => {
  try {
    // DISESUAIKAN: tabel 'users', kolom 'kontak' dan 'store_id'
    const [users] = await db.query(
      "SELECT id, store_id, nama, email, peran, kontak, alamat FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
      error: error.message,
    });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  const { nama, kontak, alamat } = req.body; // DISESUAIKAN: no_hp -> kontak
  const userId = req.user.id;

  try {
    if (!nama && !kontak && !alamat) {
      return res.status(400).json({
        success: false,
        message: "Minimal ada satu field yang harus diubah",
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (nama) {
      updates.push("nama = ?");
      values.push(nama);
    }
    if (kontak) {
      updates.push("kontak = ?"); // DISESUAIKAN: no_hp -> kontak
      values.push(kontak);
    }
    if (alamat !== undefined) {
      updates.push("alamat = ?");
      values.push(alamat);
    }

    values.push(userId);

    // DISESUAIKAN: tabel 'users'
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(query, values);

    // Fetch updated user
    const [users] = await db.query(
      "SELECT id, store_id, nama, email, peran, kontak, alamat FROM users WHERE id = ?",
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: users[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui profil",
      error: error.message,
    });
  }
};

// ================= GET USERS BY STORE / ROLE =================
const getUsers = async (req, res) => {
  const { role } = req.query;
  const loggedInUserStoreId = req.user.store_id; // Diambil dari token JWT kasir/admin yang sedang login
  const validRoles = ["admin", "pelanggan", "kurir"];

  try {
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Peran tidak valid",
      });
    }

    const params = [];
    // DISESUAIKAN: tabel 'users', kolom 'kontak' dan 'store_id'
    let query = "SELECT id, store_id, nama, email, peran, kontak, alamat FROM users WHERE 1=1";
    
    // ATURAN MULTI-TENANT: Jika yang memanggil adalah Admin Toko, batasi agar hanya bisa melihat pengguna/kurir di tokonya saja
    if (req.user.peran === "admin") {
      query += " AND store_id = ?";
      params.push(loggedInUserStoreId);
    }

    if (role) {
      query += " AND peran = ?";
      params.push(role);
    }
    
    query += " ORDER BY nama ASC";

    const [rows] = await db.query(query, params);
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
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