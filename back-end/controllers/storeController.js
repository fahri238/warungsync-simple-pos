const db = require("../config/db");
const crypto = require("crypto");

const DEFAULT_STORE = {
  id: "store-mama-eva",
  name: "Warung Mama Eva",
  address: "Kecamatan Montallat, Kalimantan Selatan",
  latitude: -2.1234567,
  longitude: 115.1234567,
};

const mapStoreRow = (row) => ({
  id: row.id,
  name: row.nama,
  address: row.alamat,
  latitude: row.latitude != null ? Number(row.latitude) : null,
  longitude: row.longitude != null ? Number(row.longitude) : null,
});

const getStores = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nama, alamat, latitude, longitude FROM toko ORDER BY nama ASC",
    );
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [DEFAULT_STORE],
        message: "Menggunakan data toko default (jalankan migration_multi_tenant.sql)",
      });
    }
    res.status(200).json({
      success: true,
      data: rows.map(mapStoreRow),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: [DEFAULT_STORE],
      message: "Tabel toko belum tersedia — jalankan database/migration_multi_tenant.sql",
    });
  }
};

const getStoreById = async (req, res) => {
  const { id } = req.params;
  if (id === DEFAULT_STORE.id) {
    return res.status(200).json({ success: true, data: DEFAULT_STORE });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, nama, alamat, latitude, longitude FROM toko WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Toko tidak ditemukan",
      });
    }
    res.status(200).json({ success: true, data: mapStoreRow(rows[0]) });
  } catch (error) {
    if (id === DEFAULT_STORE.id) {
      return res.status(200).json({ success: true, data: DEFAULT_STORE });
    }
    res.status(404).json({
      success: false,
      message: "Toko tidak ditemukan",
    });
  }
};

const getShippingRates = async (req, res) => {
  const { storeId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT id, id_toko, nama_desa, tarif FROM tarif_pengiriman WHERE id_toko = ? ORDER BY nama_desa ASC",
      [storeId],
    );
    res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        storeId: r.id_toko,
        villageName: r.nama_desa,
        rate: Number(r.tarif),
      })),
    });
  } catch (error) {
    const fallback = [
      { id: "rate-1", storeId, villageName: "Montallat Tengah", rate: 5000 },
      { id: "rate-2", storeId, villageName: "Montallat Utara", rate: 7000 },
      { id: "rate-3", storeId, villageName: "Montallat Selatan", rate: 8000 },
      { id: "rate-4", storeId, villageName: "Luar Kecamatan", rate: 15000 },
    ];
    res.status(200).json({
      success: true,
      data: fallback,
      message: "Tarif default (migration belum dijalankan)",
    });
  }
};

const createStore = async (req, res) => {
  const { name, address, latitude, longitude } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Nama toko wajib diisi",
    });
  }

  const id = crypto.randomUUID();
  try {
    await db.query(
      "INSERT INTO toko (id, nama, alamat, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
      [id, name.trim(), address || null, latitude ?? null, longitude ?? null],
    );
    res.status(201).json({
      success: true,
      data: {
        id,
        name: name.trim(),
        address: address || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mendaftarkan toko",
      error: error.message,
    });
  }
};

module.exports = {
  getStores,
  getStoreById,
  getShippingRates,
  createStore,
};
