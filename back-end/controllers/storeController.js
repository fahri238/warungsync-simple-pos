const db = require("../config/db");

// ================= 1. AMBIL SEMUA TOKO =================
const getStores = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nama AS name, alamat AS address, latitude, longitude, kontak FROM stores ORDER BY nama ASC"
    );
    
    // Pastikan tipe data decimal dari database dikonversi dengan aman ke Number
    const formattedRows = rows.map((r) => ({
      ...r,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedRows,
    });
  } catch (error) {
    console.error("Error getStores:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data toko",
      error: error.message,
    });
  }
};

// ================= 2. AMBIL DETAIL SATU TOKO =================
const getStoreById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT id, nama AS name, alamat AS address, latitude, longitude, kontak FROM stores WHERE id = ?",
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Toko tidak ditemukan",
      });
    }

    const store = rows[0];
    store.latitude = store.latitude !== null ? Number(store.latitude) : null;
    store.longitude = store.longitude !== null ? Number(store.longitude) : null;

    res.status(200).json({ success: true, data: store });
  } catch (error) {
    console.error("Error getStoreById:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan internal server",
      error: error.message,
    });
  }
};

// ================= 3. AMBIL TARIF ONGKIR =================
const getShippingRates = async (req, res) => {
  const { storeId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT id, store_id AS storeId, nama_desa AS villageName, tarif AS rate FROM shipping_rates WHERE store_id = ? ORDER BY nama_desa ASC",
      [storeId]
    );
    
    const formattedRows = rows.map((r) => ({
      ...r,
      rate: Number(r.rate),
    }));

    res.status(200).json({
      success: true,
      data: formattedRows,
    });
  } catch (error) {
    console.error("Error getShippingRates:", error);
    
    // Fallback Darurat: Jika tabel shipping_rates kosong/belum diisi, 
    // berikan data dummy agar halaman Checkout Pelanggan tidak crash.
    const fallback = [
      { id: 1, storeId: Number(storeId), villageName: "Montallat Tengah", rate: 5000 },
      { id: 2, storeId: Number(storeId), villageName: "Montallat Utara", rate: 7000 },
      { id: 3, storeId: Number(storeId), villageName: "Montallat Selatan", rate: 8000 },
      { id: 4, storeId: Number(storeId), villageName: "Luar Kecamatan", rate: 15000 },
    ];
    
    res.status(200).json({
      success: true,
      data: fallback,
      message: "Menggunakan tarif default sementara",
    });
  }
};

// ================= 4. BUAT TOKO BARU =================
const createStore = async (req, res) => {
  const { name, address, latitude, longitude, kontak } = req.body;
  
  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Nama toko wajib diisi",
    });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO stores (nama, alamat, latitude, longitude, kontak) VALUES (?, ?, ?, ?, ?)",
      [name.trim(), address || null, latitude ?? null, longitude ?? null, kontak || null]
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name: name.trim(),
        address: address || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        kontak: kontak || null,
      },
      message: "Toko berhasil didaftarkan",
    });
  } catch (error) {
    console.error("Error createStore:", error);
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