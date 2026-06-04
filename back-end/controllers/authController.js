const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";
const JWT_EXPIRY = "24h";

const VALID_ROLES = ["super_admin", "admin", "pelanggan", "kurir"];

// ================= REGISTER =================
const register = async (req, res) => {
  const { nama, email, kata_sandi, no_hp, peran = "pelanggan", alamat, id_toko } = req.body;

  try {
    if (!nama || !email || !kata_sandi || !no_hp) {
      return res.status(400).json({ success: false, message: "Field wajib (nama, email, kata sandi, no_hp)" });
    }

    const [existingUser] = await db.query("SELECT id FROM pengguna WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ success: false, message: "Email sudah terdaftar" });
    }

    if (!VALID_ROLES.includes(peran)) {
      return res.status(400).json({ success: false, message: "Peran tidak valid" });
    }
    // Hanya super_admin yang boleh register lewat endpoint internal, blok publik
    if (peran === "super_admin") {
      return res.status(403).json({ success: false, message: "Tidak boleh register sebagai super admin" });
    }

    const hashedPassword = await bcrypt.hash(kata_sandi, 10);
    const userId = crypto.randomUUID();

    await db.query(
      "INSERT INTO pengguna (id, nama, email, kata_sandi, no_hp, peran, id_toko, alamat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, nama, email, hashedPassword, no_hp, peran, id_toko || null, alamat || null],
    );

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login.",
      data: { id: userId, nama, email, peran, id_toko: id_toko || null },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, message: "Gagal mendaftar pengguna", error: error.message });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  const { email, kata_sandi } = req.body;

  try {
    if (!email || !kata_sandi) {
      return res.status(400).json({ success: false, message: "Email dan kata sandi wajib diisi" });
    }

    const [users] = await db.query("SELECT * FROM pengguna WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Email atau kata sandi salah" });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(kata_sandi, user.kata_sandi);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Email atau kata sandi salah" });
    }

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

    try {
      await db.query("UPDATE pengguna SET last_login = NOW() WHERE id = ?", [user.id]);
    } catch (e) { /* ignore */ }

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
    res.status(500).json({ success: false, message: "Gagal login", error: error.message });
  }
};

// ================= GET CURRENT USER =================
const getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, nama, email, peran, no_hp, alamat, id_toko FROM pengguna WHERE id = ?",
      [req.user.id],
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
    res.status(200).json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data user", error: error.message });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  const { nama, no_hp, alamat } = req.body;
  const userId = req.user.id;

  try {
    if (!nama && !no_hp && !alamat) {
      return res.status(400).json({ success: false, message: "Minimal satu field harus diubah" });
    }
    const updates = [];
    const values = [];
    if (nama)       { updates.push("nama = ?");   values.push(nama); }
    if (no_hp)      { updates.push("no_hp = ?");  values.push(no_hp); }
    if (alamat !== undefined) { updates.push("alamat = ?"); values.push(alamat); }
    values.push(userId);

    await db.query(`UPDATE pengguna SET ${updates.join(", ")} WHERE id = ?`, values);
    const [users] = await db.query(
      "SELECT id, nama, email, peran, no_hp, alamat, id_toko FROM pengguna WHERE id = ?",
      [userId],
    );
    res.status(200).json({ success: true, message: "Profil berhasil diperbarui", data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui profil", error: error.message });
  }
};

const getUsers = async (req, res) => {
  const { role, storeId } = req.query;
  try {
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Peran tidak valid" });
    }
    const params = [];
    const where = [];
    if (role)    { where.push("peran = ?");   params.push(role); }
    if (storeId) { where.push("id_toko = ?"); params.push(storeId); }

    const query = `SELECT id, nama, email, peran, no_hp, alamat, id_toko FROM pengguna ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY nama ASC`;
    const [rows] = await db.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data pengguna", error: error.message });
  }
};

module.exports = { register, login, getCurrentUser, updateProfile, getUsers };
