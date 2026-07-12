const db = require("../config/db");

const ORDER_STATUS = {
  pending: "menunggu",
  processing: "diproses",
  ready: "siap_ambil",
  delivering: "diantar",
  completed: "selesai",
  menunggu: "menunggu",
  diproses: "diproses",
  siap_ambil: "siap_ambil",
  diantar: "diantar",
  selesai: "selesai",
};

const normalizeStatus = (status) => {
  if (!status) return null;
  const lowerStatus = status.toLowerCase();
  return ORDER_STATUS[lowerStatus] || null;
};

// ================= 1. AMBIL SEMUA PESANAN (GET) =================
const getOrders = async (req, res) => {
  const { userId, type, storeId } = req.query;

  try {
    const params = [];
    const where = [];

    if (userId) {
      where.push("o.id_pengguna = ?");
      params.push(userId);
    }

    if (type && ["online", "offline"].includes(type)) {
      where.push("o.tipe_pesanan = ?");
      params.push(type);
    }

    if (storeId) {
      where.push("o.store_id = ?");
      params.push(storeId);
    } else if (req.user?.store_id) {
      where.push("o.store_id = ?");
      params.push(req.user.store_id);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT
        o.id,
        o.id_pengguna,
        o.store_id,
        o.total_harga,
        o.komisi_sistem,
        o.status,
        o.tipe_pesanan,
        o.tipe_pengiriman,
        o.metode_pembayaran,
        o.tanggal_dibuat,
        u.nama AS nama_pelanggan,
        u.kontak AS no_hp_pelanggan,
        d.id AS delivery_id,
        d.id_kurir,
        d.alamat AS alamat_pengiriman,
        d.status AS status_pengiriman,
        oi.id AS item_id,
        oi.id_produk,
        oi.kuantitas,
        oi.harga,
        p.nama AS nama_produk,
        p.url_gambar
      FROM orders o
      LEFT JOIN users u ON o.id_pengguna = u.id
      LEFT JOIN deliveries d ON d.id_pesanan = o.id
      LEFT JOIN order_items oi ON oi.id_pesanan = o.id
      LEFT JOIN products p ON p.id = oi.id_produk
      ${whereClause}
      ORDER BY o.tanggal_dibuat DESC
      `,
      params,
    );

    const grouped = new Map();
    for (const row of rows) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: row.id,
          userId: row.id_pengguna,
          storeId: row.store_id,
          customerName: row.nama_pelanggan || "Pelanggan Umum",
          customerPhone: row.no_hp_pelanggan || "-",
          total: Number(row.total_harga),
          komisiSistem: Number(row.komisi_sistem),
          status: row.status,
          paymentMethod: row.metode_pembayaran,
          type: row.tipe_pesanan,
          fulfillment: row.tipe_pengiriman,
          deliveryId: row.delivery_id || null,
          courierId: row.id_kurir || null,
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
          },
          quantity: row.kuantitas,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: Array.from(grouped.values()),
    });
  } catch (error) {
    console.error("Error getOrders:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pesanan",
      error: error.message,
    });
  }
};

// ================= 2. BUAT PESANAN BARU (POST) =================
const createOrder = async (req, res) => {
  const {
    id_pengguna = null,
    storeId = null,
    alamat_pengiriman,
    tipe_pesanan,
    tipe_pengiriman,
    metode_pembayaran,
    latitude = null,
    longitude = null,
    items,
    status,
  } = req.body;

  const resolvedStoreId = storeId || req.user?.store_id || null;
  const currentUserId = id_pengguna || req.user?.id || null;

  if (!resolvedStoreId) {
    return res
      .status(400)
      .json({ success: false, message: "storeId (ID Toko) wajib ditentukan" });
  }

  if (!currentUserId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "id_pengguna (ID Pengguna) wajib ditentukan",
      });
  }

  if (!["online", "offline"].includes(tipe_pesanan)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Tipe pesanan tidak valid ('online'/'offline')",
      });
  }

  if (!["pickup", "kurir"].includes(tipe_pengiriman)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Tipe pengiriman tidak valid ('pickup'/'kurir')",
      });
  }

  if (tipe_pengiriman === "kurir" && !alamat_pengiriman) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Alamat pengiriman wajib diisi untuk kurir",
      });
  }

  if (!["tunai", "transfer"].includes(metode_pembayaran)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Metode pembayaran tidak valid ('tunai'/'transfer')",
      });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Item pesanan tidak boleh kosong" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const resolvedStatus =
      normalizeStatus(status) ||
      (tipe_pesanan === "offline" ? "selesai" : "menunggu");

    let totalHarga = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId =
        item.id_produk ||
        item.productId ||
        item.id ||
        (item.product && item.product.id);
      const qty = Number(item.kuantitas || item.quantity || 0);

      if (!productId || !qty || qty <= 0) {
        throw new Error(
          "Format item pesanan tidak valid (ID atau Kuantitas tidak ditemukan)",
        );
      }

      const [productRows] = await connection.query(
        "SELECT id, nama, harga, stok FROM products WHERE id = ? AND store_id = ? FOR UPDATE",
        [productId, resolvedStoreId],
      );

      if (productRows.length === 0) {
        throw new Error(
          `Produk dengan ID ${productId} tidak ditemukan di toko ini`,
        );
      }

      const product = productRows[0];
      if (product.stok < qty) {
        throw new Error(
          `Stok produk '${product.nama}' tidak mencukupi (Tersisa: ${product.stok})`,
        );
      }

      const hargaSatuan = Number(product.harga);
      totalHarga += hargaSatuan * qty;

      normalizedItems.push({
        id_produk: productId,
        kuantitas: qty,
        harga: hargaSatuan,
      });
    }

    // FITUR KOMISI: Admin mengambil 5% dari total penjualan kotor
    const komisiSistem = totalHarga * 0.05;

    // 1. Masukkan ke tabel 'orders' beserta data komisi
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
      (id_pengguna, store_id, total_harga, komisi_sistem, status, tipe_pesanan, tipe_pengiriman, metode_pembayaran, tanggal_dibuat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        currentUserId,
        resolvedStoreId,
        totalHarga,
        komisiSistem,
        resolvedStatus,
        tipe_pesanan,
        tipe_pengiriman,
        metode_pembayaran,
      ],
    );

    const insertedOrderId = orderResult.insertId;

    if (tipe_pengiriman === "kurir") {
      const [courierRows] = await connection.query(
        "SELECT id FROM users WHERE store_id = ? AND peran = 'kurir' LIMIT 1",
        [resolvedStoreId],
      );
      const assignedCourierId =
        courierRows.length > 0 ? courierRows[0].id : null;

      if (!assignedCourierId) {
        throw new Error(
          "Gagal membuat pesanan daring. Belum ada kurir yang terdaftar di warung ini.",
        );
      }

      await connection.query(
        `INSERT INTO deliveries (id_pesanan, id_kurir, alamat, destination_lat, destination_lng, status, tanggal_diperbarui) 
        VALUES (?, ?, ?, ?, ?, 'diantar', NOW())`,
        [
          insertedOrderId,
          assignedCourierId,
          alamat_pengiriman,
          latitude || 0,
          longitude || 0,
        ],
      );
    }

    for (const item of normalizedItems) {
      await connection.query(
        "INSERT INTO order_items (id_pesanan, id_produk, kuantitas, harga) VALUES (?, ?, ?, ?)",
        [insertedOrderId, item.id_produk, item.kuantitas, item.harga],
      );

      await connection.query(
        "UPDATE products SET stok = stok - ? WHERE id = ?",
        [item.kuantitas, item.id_produk],
      );

      const alasanLog =
        tipe_pesanan === "offline" ? "terjual_pos" : "terjual_online";

      await connection.query(
        "INSERT INTO stock_logs (id_produk, id_admin, jumlah_perubahan, alasan, tanggal_dibuat) VALUES (?, ?, ?, ?, NOW())",
        [
          item.id_produk,
          req.user?.id || currentUserId,
          -item.kuantitas,
          alasanLog,
        ],
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Pesanan berhasil disimpan ke database",
      data: {
        id: insertedOrderId,
        total_harga: totalHarga,
        komisi_sistem: komisiSistem,
        status: resolvedStatus,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error createOrder Transaction:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Gagal memproses pembuatan pesanan",
    });
  } finally {
    connection.release();
  }
};

// ================= 3. UPDATE STATUS PESANAN (PUT) =================
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const resolvedStatus = normalizeStatus(status);

  if (!resolvedStatus) {
    return res
      .status(400)
      .json({ success: false, message: "Status pesanan tidak valid" });
  }

  try {
    const [existing] = await db.query("SELECT id FROM orders WHERE id = ?", [
      id,
    ]);
    if (existing.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Pesanan tidak ditemukan" });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [
      resolvedStatus,
      id,
    ]);

    res.status(200).json({
      success: true,
      message: "Status pesanan berhasil diperbarui",
      data: { id: Number(id), status: resolvedStatus },
    });
  } catch (error) {
    console.error("Error updateOrderStatus:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui status pesanan",
      error: error.message,
    });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
};
