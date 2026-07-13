const db = require("../config/db");

// ================= 1. AMBIL SEMUA TOKO =================
const getStores = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nama AS name, alamat AS address, latitude, longitude, kontak FROM stores ORDER BY nama ASC",
    );

    const formattedRows = rows.map((r) => ({
      ...r,
      latitude: r.latitude !== null ? Number(r.latitude) : null,
      longitude: r.longitude !== null ? Number(r.longitude) : null,
    }));

    res.status(200).json({ success: true, data: formattedRows });
  } catch (error) {
    console.error("Error getStores:", error);
    res
      .status(500)
      .json({
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
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Toko tidak ditemukan" });
    }

    const store = rows[0];
    store.latitude = store.latitude !== null ? Number(store.latitude) : null;
    store.longitude = store.longitude !== null ? Number(store.longitude) : null;

    res.status(200).json({ success: true, data: store });
  } catch (error) {
    console.error("Error getStoreById:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan server",
        error: error.message,
      });
  }
};

// ================= 3. CRUD WILAYAH & ONGKIR =================
const getShippingRates = async (req, res) => {
  const { storeId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT id, store_id AS storeId, nama_desa AS villageName, tarif AS rate FROM shipping_rates WHERE store_id = ? ORDER BY nama_desa ASC",
      [storeId],
    );

    const formattedRows = rows.map((r) => ({ ...r, rate: Number(r.rate) }));
    res.status(200).json({ success: true, data: formattedRows });
  } catch (error) {
    console.error("Error getShippingRates:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal memuat tarif ongkir",
        error: error.message,
      });
  }
};

const addShippingRate = async (req, res) => {
  const { storeId } = req.params;
  const { villageName, rate } = req.body;

  try {
    await db.query(
      "INSERT INTO shipping_rates (store_id, nama_desa, tarif) VALUES (?, ?, ?)",
      [storeId, villageName, rate],
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Wilayah pengiriman berhasil ditambahkan",
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menambah wilayah",
        error: error.message,
      });
  }
};

const deleteShippingRate = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM shipping_rates WHERE id = ?", [id]);
    res
      .status(200)
      .json({ success: true, message: "Wilayah berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menghapus wilayah",
        error: error.message,
      });
  }
};

// ================= 4. BUAT TOKO BARU =================
const createStore = async (req, res) => {
  const { name, address, latitude, longitude, kontak } = req.body;

  if (!name?.trim())
    return res
      .status(400)
      .json({ success: false, message: "Nama toko wajib diisi" });

  try {
    const [result] = await db.query(
      "INSERT INTO stores (nama, alamat, latitude, longitude, kontak) VALUES (?, ?, ?, ?, ?)",
      [
        name.trim(),
        address || null,
        latitude ?? null,
        longitude ?? null,
        kontak || null,
      ],
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
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mendaftarkan toko",
        error: error.message,
      });
  }
};

// ================= 5. CRUD REKENING BANK =================
const getBankAccounts = async (req, res) => {
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
      .json({
        success: false,
        message: "Gagal memuat rekening bank",
        error: error.message,
      });
  }
};

const addBankAccount = async (req, res) => {
  const { storeId } = req.params;
  const { bank_name, account_number, account_name } = req.body;
  try {
    await db.query(
      "INSERT INTO bank_accounts (store_id, bank_name, account_number, account_name) VALUES (?, ?, ?, ?)",
      [storeId, bank_name, account_number, account_name],
    );
    res
      .status(201)
      .json({ success: true, message: "Rekening berhasil ditambahkan" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menambah rekening",
        error: error.message,
      });
  }
};

const deleteBankAccount = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM bank_accounts WHERE id = ?", [id]);
    res
      .status(200)
      .json({ success: true, message: "Rekening berhasil dihapus" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal menghapus rekening",
        error: error.message,
      });
  }
};

module.exports = {
  getStores,
  getStoreById,
  getShippingRates,
  addShippingRate,
  deleteShippingRate,
  createStore,
  getBankAccounts,
  addBankAccount,
  deleteBankAccount,
};
