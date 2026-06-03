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
  const { userId, type } = req.query;

  try {
    const params = [];
    const where = [];

    if (userId) {
      where.push("p.id_pengguna = ?");
      params.push(userId);
    }

    if (type && ["online", "pos"].includes(type)) {
      where.push("p.tipe_pesanan = ?");
      params.push(type);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.id_pengguna,
        p.id_kurir,
        p.nama_pelanggan,
        p.no_hp_pelanggan,
        p.total_harga,
        p.status,
        p.tipe_pesanan,
        p.tipe_pengiriman,
        p.metode_pembayaran,
        p.tanggal_dibuat,
        pg.id AS delivery_id,
        pg.alamat AS alamat_pengiriman,
        pg.status AS status_pengiriman,
        ip.id AS item_id,
        ip.id_produk,
        ip.kuantitas,
        ip.harga,
        pr.nama AS nama_produk,
        pr.url_gambar,
        pr.deskripsi
      FROM pesanan p
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
          userId: row.id_pengguna,
          courierId: row.id_kurir,
          customerName: row.nama_pelanggan,
          customerPhone: row.no_hp_pelanggan,
          total: Number(row.total_harga),
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

    res.status(200).json({
      success: true,
      data: Array.from(grouped.values()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pesanan",
      error: error.message,
    });
  }
};

const createOrder = async (req, res) => {
  const {
    id_pengguna = null,
    nama_pelanggan,
    no_hp_pelanggan,
    alamat_pengiriman,
    tipe_pesanan,
    tipe_pengiriman,
    metode_pembayaran,
    items,
    status,
  } = req.body;

  if (!nama_pelanggan || !no_hp_pelanggan) {
    return res.status(400).json({
      success: false,
      message: "Nama pelanggan dan nomor HP wajib diisi",
    });
  }

  if (!["online", "pos"].includes(tipe_pesanan)) {
    return res.status(400).json({
      success: false,
      message: "Tipe pesanan tidak valid",
    });
  }

  if (!["pickup", "delivery"].includes(tipe_pengiriman)) {
    return res.status(400).json({
      success: false,
      message: "Tipe pengiriman tidak valid",
    });
  }

  if (tipe_pengiriman === "delivery" && !alamat_pengiriman) {
    return res.status(400).json({
      success: false,
      message: "Alamat pengiriman wajib diisi untuk delivery",
    });
  }

  if (!["cash", "transfer"].includes(metode_pembayaran)) {
    return res.status(400).json({
      success: false,
      message: "Metode pembayaran tidak valid",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Item pesanan tidak boleh kosong",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const orderId = crypto.randomUUID();
    const resolvedStatus =
      normalizeStatus(status) || (tipe_pesanan === "pos" ? "selesai" : "menunggu");

    let totalHarga = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId = item.id_produk || item.productId || item.id;
      const qty = Number(item.kuantitas || item.quantity || 0);

      if (!productId || !qty || qty <= 0) {
        throw new Error("Format item pesanan tidak valid");
      }

      const [productRows] = await connection.query(
        "SELECT id, nama, harga, stok FROM produk WHERE id = ? FOR UPDATE",
        [productId],
      );

      if (productRows.length === 0) {
        throw new Error(`Produk tidak ditemukan: ${productId}`);
      }

      const product = productRows[0];
      if (product.stok < qty) {
        throw new Error(`Stok ${product.nama} tidak mencukupi`);
      }

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

    await connection.query(
      `INSERT INTO pesanan
      (id, id_pengguna, nama_pelanggan, no_hp_pelanggan, total_harga, status, tipe_pesanan, tipe_pengiriman, metode_pembayaran)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        id_pengguna || null,
        nama_pelanggan,
        no_hp_pelanggan,
        totalHarga,
        resolvedStatus,
        tipe_pesanan,
        tipe_pengiriman,
        metode_pembayaran,
      ],
    );

    if (tipe_pengiriman === "delivery") {
      await connection.query(
        "INSERT INTO pengiriman (id, id_pesanan, id_kurir, alamat, status) VALUES (?, ?, ?, ?, ?)",
        [crypto.randomUUID(), orderId, null, alamat_pengiriman, "diantar"],
      );
    }

    for (const item of normalizedItems) {
      await connection.query(
        "INSERT INTO item_pesanan (id, id_pesanan, id_produk, kuantitas, harga) VALUES (?, ?, ?, ?, ?)",
        [item.id, orderId, item.id_produk, item.kuantitas, item.harga],
      );

      await connection.query(
        "UPDATE produk SET stok = stok - ? WHERE id = ?",
        [item.kuantitas, item.id_produk],
      );

      await connection.query(
        "INSERT INTO riwayat_stok (id, id_produk, nama_produk, jumlah_perubahan, alasan) VALUES (?, ?, ?, ?, ?)",
        [
          crypto.randomUUID(),
          item.id_produk,
          item.nama_produk,
          -item.kuantitas,
          "Order",
        ],
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Pesanan berhasil dibuat",
      data: {
        id: orderId,
        total_harga: totalHarga,
        status: resolvedStatus,
      },
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({
      success: false,
      message: error.message || "Gagal membuat pesanan",
    });
  } finally {
    connection.release();
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, id_kurir = null } = req.body;
  const resolvedStatus = normalizeStatus(status);

  if (!resolvedStatus) {
    return res.status(400).json({
      success: false,
      message: "Status pesanan tidak valid",
    });
  }

  try {
    const [existing] = await db.query("SELECT id FROM pesanan WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    await db.query(
      "UPDATE pesanan SET status = ?, id_kurir = COALESCE(?, id_kurir) WHERE id = ?",
      [resolvedStatus, id_kurir, id],
    );

    res.status(200).json({
      success: true,
      message: "Status pesanan berhasil diperbarui",
      data: { id, status: resolvedStatus },
    });
  } catch (error) {
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
