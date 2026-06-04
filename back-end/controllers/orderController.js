const db = require("../config/db");
const crypto = require("crypto");

const ORDER_STATUS = {
  pending: "menunggu",
  processing: "diproses",
  ready: "siap diambil",
  delivering: "diantar",
  completed: "selesai",
};

const STATUS_TO_FRONTEND = {
  menunggu: "pending",
  diproses: "processing",
  "siap diambil": "ready",
  diantar: "delivering",
  selesai: "completed",
};

const normalizeStatus = (status) => {
  if (!status) return null;
  if (ORDER_STATUS[status]) return ORDER_STATUS[status];
  return Object.values(ORDER_STATUS).includes(status) ? status : null;
};

const getOrders = async (req, res) => {
  const { userId, type, storeId, channel } = req.query;
  try {
    const params = [];
    const where = [];

    if (userId)  { where.push("p.id_pengguna = ?"); params.push(userId); }
    if (storeId) { where.push("p.id_toko = ?");     params.push(storeId); }
    if (type && ["online", "pos"].includes(type)) {
      where.push("p.tipe_pesanan = ?"); params.push(type);
    }
    if (channel && ["online", "pos"].includes(channel)) {
      where.push("p.tipe_pesanan = ?"); params.push(channel);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT
        p.id, p.id_toko, p.id_pengguna, p.id_kurir,
        p.nama_pelanggan, p.no_hp_pelanggan,
        p.total_harga, p.ongkir, p.desa, p.delivery_lat, p.delivery_lng,
        p.status, p.tipe_pesanan, p.tipe_pengiriman, p.metode_pembayaran, p.tanggal_dibuat,
        t.nama AS nama_toko, t.slug AS slug_toko,
        pg.id AS delivery_id, pg.alamat AS alamat_pengiriman, pg.status AS status_pengiriman,
        ip.id AS item_id, ip.id_produk, ip.kuantitas, ip.harga,
        pr.nama AS nama_produk, pr.url_gambar, pr.deskripsi
      FROM pesanan p
      LEFT JOIN toko t ON t.id = p.id_toko
      LEFT JOIN pengiriman pg ON pg.id_pesanan = p.id
      LEFT JOIN item_pesanan ip ON ip.id_pesanan = p.id
      LEFT JOIN produk pr ON pr.id = ip.id_produk
      ${whereClause}
      ORDER BY p.tanggal_dibuat DESC
      `,
      params,
    );

    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: row.id,
          storeId: row.id_toko,
          storeName: row.nama_toko,
          storeSlug: row.slug_toko,
          userId: row.id_pengguna,
          courierId: row.id_kurir,
          customerName: row.nama_pelanggan,
          customerPhone: row.no_hp_pelanggan,
          total: Number(row.total_harga),
          shippingFee: Number(row.ongkir || 0),
          village: row.desa,
          deliveryLat: row.delivery_lat != null ? Number(row.delivery_lat) : null,
          deliveryLng: row.delivery_lng != null ? Number(row.delivery_lng) : null,
          status: STATUS_TO_FRONTEND[row.status] || "pending",
          paymentMethod: row.metode_pembayaran,
          type: row.tipe_pesanan,
          fulfillment: row.tipe_pengiriman,
          deliveryId: row.delivery_id || null,
          customerAddress: row.alamat_pengiriman || null,
          createdAt: row.tanggal_dibuat,
          items: [],
        });
      }

      if (row.item_id) {
        grouped.get(row.id).items.push({
          product: {
            id: row.id_produk,
            name: row.nama_produk,
            price: Number(row.harga),
            stock: 0,
            category: "",
            image: row.url_gambar || "",
            description: row.deskripsi || "",
          },
          quantity: row.kuantitas,
        });
      }
    }

    res.status(200).json({ success: true, data: Array.from(grouped.values()) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil pesanan", error: error.message });
  }
};

const createOrder = async (req, res) => {
  const {
    storeId,
    id_pengguna = null,
    nama_pelanggan,
    no_hp_pelanggan,
    alamat_pengiriman,
    desa,
    delivery_lat,
    delivery_lng,
    ongkir = 0,
    tipe_pesanan,
    tipe_pengiriman,
    metode_pembayaran,
    items,
    status,
  } = req.body;

  if (!storeId) {
    return res.status(400).json({ success: false, message: "storeId wajib diisi" });
  }
  if (!nama_pelanggan || !no_hp_pelanggan) {
    return res.status(400).json({ success: false, message: "Nama dan no HP pelanggan wajib" });
  }
  if (!["online", "pos"].includes(tipe_pesanan)) {
    return res.status(400).json({ success: false, message: "Tipe pesanan tidak valid" });
  }
  if (!["pickup", "delivery"].includes(tipe_pengiriman)) {
    return res.status(400).json({ success: false, message: "Tipe pengiriman tidak valid" });
  }
  if (tipe_pengiriman === "delivery" && !alamat_pengiriman) {
    return res.status(400).json({ success: false, message: "Alamat wajib untuk delivery" });
  }
  if (!["cash", "transfer"].includes(metode_pembayaran)) {
    return res.status(400).json({ success: false, message: "Metode pembayaran tidak valid" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Item pesanan kosong" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Pastikan toko ada & aktif
    const [storeRows] = await connection.query("SELECT id, delivery_aktif, pickup_aktif, is_active FROM toko WHERE id = ?", [storeId]);
    if (storeRows.length === 0 || !storeRows[0].is_active) {
      throw new Error("Toko tidak ditemukan atau tidak aktif");
    }
    if (tipe_pengiriman === "delivery" && !storeRows[0].delivery_aktif) {
      throw new Error("Toko ini tidak melayani delivery");
    }
    if (tipe_pengiriman === "pickup" && !storeRows[0].pickup_aktif) {
      throw new Error("Toko ini tidak melayani pickup");
    }

    const orderId = crypto.randomUUID();
    const resolvedStatus = normalizeStatus(status) || (tipe_pesanan === "pos" ? "selesai" : "menunggu");
    const source = tipe_pesanan === "pos" ? "pos" : "online";

    let totalHarga = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId = item.id_produk || item.productId || item.id;
      const qty = Number(item.kuantitas || item.quantity || 0);
      if (!productId || !qty || qty <= 0) throw new Error("Format item tidak valid");

      const [productRows] = await connection.query(
        "SELECT id, nama, harga, stok, id_toko FROM produk WHERE id = ? FOR UPDATE",
        [productId],
      );
      if (productRows.length === 0) throw new Error(`Produk tidak ditemukan: ${productId}`);
      const product = productRows[0];
      if (product.id_toko !== storeId) {
        throw new Error(`Produk ${product.nama} bukan milik toko ini`);
      }
      if (product.stok < qty) throw new Error(`Stok ${product.nama} tidak cukup`);

      const hargaSatuan = Number(product.harga);
      totalHarga += hargaSatuan * qty;
      normalizedItems.push({
        id: crypto.randomUUID(),
        id_produk: productId,
        nama_produk: product.nama,
        kuantitas: qty,
        harga: hargaSatuan,
      });
    }

    const grandTotal = totalHarga + Number(ongkir || 0);

    await connection.query(
      `INSERT INTO pesanan
       (id, id_toko, id_pengguna, nama_pelanggan, no_hp_pelanggan, total_harga, ongkir, desa, delivery_lat, delivery_lng,
        status, tipe_pesanan, tipe_pengiriman, metode_pembayaran)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, storeId, id_pengguna || null, nama_pelanggan, no_hp_pelanggan,
        grandTotal, Number(ongkir || 0), desa || null, delivery_lat || null, delivery_lng || null,
        resolvedStatus, tipe_pesanan, tipe_pengiriman, metode_pembayaran,
      ],
    );

    if (tipe_pengiriman === "delivery") {
      await connection.query(
        "INSERT INTO pengiriman (id, id_toko, id_pesanan, id_kurir, alamat, status) VALUES (?, ?, ?, ?, ?, ?)",
        [crypto.randomUUID(), storeId, orderId, null, alamat_pengiriman, "diantar"],
      );
    }

    for (const item of normalizedItems) {
      await connection.query(
        "INSERT INTO item_pesanan (id, id_toko, id_pesanan, id_produk, kuantitas, harga) VALUES (?, ?, ?, ?, ?, ?)",
        [item.id, storeId, orderId, item.id_produk, item.kuantitas, item.harga],
      );
      await connection.query("UPDATE produk SET stok = stok - ? WHERE id = ?", [item.kuantitas, item.id_produk]);
      await connection.query(
        "INSERT INTO riwayat_stok (id, id_toko, id_produk, nama_produk, jumlah_perubahan, alasan, sumber) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [crypto.randomUUID(), storeId, item.id_produk, item.nama_produk, -item.kuantitas, "Order", source],
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Pesanan berhasil dibuat",
      data: { id: orderId, total_harga: grandTotal, status: resolvedStatus, storeId },
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message || "Gagal membuat pesanan" });
  } finally {
    connection.release();
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, id_kurir = null } = req.body;
  const resolvedStatus = normalizeStatus(status);
  if (!resolvedStatus) {
    return res.status(400).json({ success: false, message: "Status tidak valid" });
  }
  try {
    const [existing] = await db.query("SELECT id FROM pesanan WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan" });
    }
    await db.query(
      "UPDATE pesanan SET status = ?, id_kurir = COALESCE(?, id_kurir) WHERE id = ?",
      [resolvedStatus, id_kurir, id],
    );
    res.status(200).json({ success: true, data: { id, status: resolvedStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal update status", error: error.message });
  }
};

// Analytics: revenue per channel (online vs pos) untuk satu toko
const getRevenueByChannel = async (req, res) => {
  const { storeId, from, to } = req.query;
  if (!storeId) return res.status(400).json({ success: false, message: "storeId wajib" });
  try {
    const params = [storeId];
    let dateWhere = "";
    if (from) { dateWhere += " AND tanggal_dibuat >= ?"; params.push(from); }
    if (to)   { dateWhere += " AND tanggal_dibuat <= ?"; params.push(to); }

    const [rows] = await db.query(
      `SELECT tipe_pesanan AS channel,
              DATE(tanggal_dibuat) AS tanggal,
              SUM(total_harga) AS revenue,
              COUNT(*) AS orders
       FROM pesanan
       WHERE id_toko = ? AND status = 'selesai' ${dateWhere}
       GROUP BY tipe_pesanan, DATE(tanggal_dibuat)
       ORDER BY tanggal ASC`,
      params,
    );
    res.status(200).json({
      success: true,
      data: rows.map((r) => ({ channel: r.channel, date: r.tanggal, revenue: Number(r.revenue), orders: r.orders })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil analytics", error: error.message });
  }
};

module.exports = { getOrders, createOrder, updateOrderStatus, getRevenueByChannel };
