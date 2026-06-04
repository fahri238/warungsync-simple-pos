const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";
const JWT_EXPIRY = "24h";

// ================= REGISTER =================
const register = async (req, res) => {
  const {
    nama,
    email,
    kata_sandi,
    no_hp,
    peran = "pelanggan",
    alamat,
  } = req.body;

  try {
    // Validate required fields
    if (!nama || !email || !kata_sandi || !no_hp) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi (nama, email, kata sandi, no_hp)",
      });
    }

    // Check if email already exists
    const [existingUser] = await db.query(
      "SELECT id FROM pengguna WHERE email = ?",
      [email],
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

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(kata_sandi, saltRounds);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Insert user into database
    await db.query(
      "INSERT INTO pengguna (id, nama, email, kata_sandi, no_hp, peran, alamat) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, nama, email, hashedPassword, no_hp, peran, alamat || null],
    );

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login.",
      data: {
        id: userId,
        nama,
        email,
        peran,
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

    // Find user by email
    const [users] = await db.query("SELECT * FROM pengguna WHERE email = ?", [
      email,
    ]);
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
        id_toko: user.id_toko || null,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY },
    );

    // Update last_login (optional - if your table has this field)
    try {
      await db.query("UPDATE pengguna SET last_login = NOW() WHERE id = ?", [
        user.id,
      ]);
    } catch (e) {
      // Ignore if last_login field doesn't exist
    }

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
          no_hp: user.no_hp,
          alamat: user.alamat,
          id_toko: user.id_toko || null,
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
    // User info comes from JWT middleware (req.user)
    const [users] = await db.query(
      "SELECT id, nama, email, peran, no_hp, alamat, id_toko FROM pengguna WHERE id = ?",
      [req.user.id],
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
  const { nama, no_hp, alamat } = req.body;
  const userId = req.user.id;

  try {
    // Validate at least one field is provided
    if (!nama && !no_hp && !alamat) {
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
    if (no_hp) {
      updates.push("no_hp = ?");
      values.push(no_hp);
    }
    if (alamat !== undefined) {
      updates.push("alamat = ?");
      values.push(alamat);
    }

    values.push(userId);

    const query = `UPDATE pengguna SET ${updates.join(", ")} WHERE id = ?`;
    await db.query(query, values);

    // Fetch updated user
    const [users] = await db.query(
      "SELECT id, nama, email, peran, no_hp, alamat, id_toko FROM pengguna WHERE id = ?",
      [userId],
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

const getUsers = async (req, res) => {
  const { role } = req.query;
  const validRoles = ["admin", "pelanggan", "kurir"];

  try {
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Peran tidak valid",
      });
    }

    const params = [];
    let query =
      "SELECT id, nama, email, peran, no_hp, alamat FROM pengguna";
    if (role) {
      query += " WHERE peran = ?";
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
