const db = require("../config/db");
const crypto = require("crypto");

const mapStore = (row) => ({
  id: row.id,
  name: row.nama,
  slug: row.slug,
  ownerId: row.id_pemilik,
  description: row.deskripsi,
  address: row.alamat,
  village: row.desa,
  latitude: row.latitude != null ? Number(row.latitude) : null,
  longitude: row.longitude != null ? Number(row.longitude) : null,
  phone: row.no_hp,
  logoUrl: row.url_logo,
  deliveryEnabled: !!row.delivery_aktif,
  pickupEnabled: !!row.pickup_aktif,
  isActive: !!row.is_active,
  createdAt: row.tanggal_dibuat,
});

// Public: list semua toko aktif (untuk halaman Pilih Toko)
const getStores = async (req, res) => {
  try {
    const { village, active } = req.query;
    const where = [];
    const params = [];

    if (active !== "all") {
      where.push("is_active = 1");
    }
    if (village) {
      where.push("desa = ?");
      params.push(village);
    }

    const sql = `SELECT * FROM toko ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY nama ASC`;
    const [rows] = await db.query(sql, params);
    res.status(200).json({ success: true, data: rows.map(mapStore) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar toko", error: error.message });
  }
};

const getStoreById = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM toko WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Toko tidak ditemukan" });
    }
    res.status(200).json({ success: true, data: mapStore(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data toko", error: error.message });
  }
};

const getStoreBySlug = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM toko WHERE slug = ?", [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Toko tidak ditemukan" });
    }
    res.status(200).json({ success: true, data: mapStore(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data toko", error: error.message });
  }
};

// Super admin only
const createStore = async (req, res) => {
  if (req.user?.peran !== "super_admin") {
    return res.status(403).json({ success: false, message: "Hanya super admin yang boleh membuat toko" });
  }

  const { name, slug, ownerId, description, address, village, latitude, longitude, phone, logoUrl, deliveryEnabled = true, pickupEnabled = true } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, message: "Nama dan slug toko wajib diisi" });
  }

  try {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO toko (id, nama, slug, id_pemilik, deskripsi, alamat, desa, latitude, longitude, no_hp, url_logo, delivery_aktif, pickup_aktif, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, name, slug, ownerId || null, description || null, address || null, village || null,
       latitude || null, longitude || null, phone || null, logoUrl || null,
       deliveryEnabled ? 1 : 0, pickupEnabled ? 1 : 0],
    );

    // Jika ownerId di-set, update peran user jadi admin & assign id_toko
    if (ownerId) {
      await db.query("UPDATE pengguna SET id_toko = ?, peran = 'admin' WHERE id = ?", [id, ownerId]);
    }

    const [rows] = await db.query("SELECT * FROM toko WHERE id = ?", [id]);
    res.status(201).json({ success: true, data: mapStore(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal membuat toko", error: error.message });
  }
};

const updateStore = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  // Super admin OR admin toko itu sendiri
  if (user?.peran !== "super_admin" && !(user?.peran === "admin" && user?.id_toko === id)) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }

  const { name, description, address, village, latitude, longitude, phone, logoUrl, deliveryEnabled, pickupEnabled, isActive } = req.body;
  const updates = [];
  const params = [];
  const set = (col, val) => { if (val !== undefined) { updates.push(`${col} = ?`); params.push(val); } };
  set("nama", name);
  set("deskripsi", description);
  set("alamat", address);
  set("desa", village);
  set("latitude", latitude);
  set("longitude", longitude);
  set("no_hp", phone);
  set("url_logo", logoUrl);
  if (deliveryEnabled !== undefined) { updates.push("delivery_aktif = ?"); params.push(deliveryEnabled ? 1 : 0); }
  if (pickupEnabled !== undefined) { updates.push("pickup_aktif = ?"); params.push(pickupEnabled ? 1 : 0); }
  if (isActive !== undefined && user.peran === "super_admin") { updates.push("is_active = ?"); params.push(isActive ? 1 : 0); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "Tidak ada field yang diubah" });
  }

  params.push(id);
  try {
    await db.query(`UPDATE toko SET ${updates.join(", ")} WHERE id = ?`, params);
    const [rows] = await db.query("SELECT * FROM toko WHERE id = ?", [id]);
    res.status(200).json({ success: true, data: mapStore(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui toko", error: error.message });
  }
};

// Tarif pengiriman per toko
const getShippingRates = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, id_toko, desa, ongkir, is_active FROM tarif_pengiriman WHERE id_toko = ? ORDER BY desa ASC",
      [req.params.id],
    );
    res.status(200).json({
      success: true,
      data: rows.map((r) => ({ id: r.id, storeId: r.id_toko, village: r.desa, fee: Number(r.ongkir), isActive: !!r.is_active })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil tarif", error: error.message });
  }
};

const upsertShippingRate = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  if (user?.peran !== "super_admin" && !(user?.peran === "admin" && user?.id_toko === id)) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  const { village, fee } = req.body;
  if (!village || fee == null) {
    return res.status(400).json({ success: false, message: "Desa dan ongkir wajib diisi" });
  }
  try {
    await db.query(
      `INSERT INTO tarif_pengiriman (id, id_toko, desa, ongkir)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ongkir = VALUES(ongkir), is_active = 1`,
      [crypto.randomUUID(), id, village, fee],
    );
    res.status(200).json({ success: true, message: "Tarif tersimpan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menyimpan tarif", error: error.message });
  }
};

module.exports = {
  getStores,
  getStoreById,
  getStoreBySlug,
  createStore,
  updateStore,
  getShippingRates,
  upsertShippingRate,
};
