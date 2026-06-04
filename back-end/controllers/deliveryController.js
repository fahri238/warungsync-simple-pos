const db = require("../config/db");
const crypto = require("crypto");

const assignCourier = async (req, res) => {
  const { orderId, courierId } = req.body;
  if (!orderId || !courierId) {
    return res.status(400).json({ success: false, message: "orderId & courierId wajib" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.query(
      "SELECT id, id_toko, tipe_pengiriman FROM pesanan WHERE id = ? FOR UPDATE",
      [orderId],
    );
    if (orderRows.length === 0) throw new Error("Pesanan tidak ditemukan");
    if (orderRows[0].tipe_pengiriman !== "delivery") throw new Error("Pesanan ini bukan delivery");
    const storeId = orderRows[0].id_toko;

    // Kurir wajib terdaftar di toko yang sama
    const [courierRows] = await connection.query(
      "SELECT id, id_toko FROM pengguna WHERE id = ? AND peran = 'kurir'",
      [courierId],
    );
    if (courierRows.length === 0) throw new Error("Kurir tidak valid");
    if (courierRows[0].id_toko && courierRows[0].id_toko !== storeId) {
      throw new Error("Kurir bukan dari toko ini");
    }

    const [existing] = await connection.query(
      "SELECT id, alamat FROM pengiriman WHERE id_pesanan = ? FOR UPDATE",
      [orderId],
    );

    if (existing.length > 0) {
      await connection.query(
        "UPDATE pengiriman SET id_kurir = ?, status = 'diantar' WHERE id = ?",
        [courierId, existing[0].id],
      );
    } else {
      await connection.query(
        "INSERT INTO pengiriman (id, id_toko, id_pesanan, id_kurir, alamat, status) VALUES (?, ?, ?, ?, ?, 'diantar')",
        [crypto.randomUUID(), storeId, orderId, courierId, "-"],
      );
    }

    await connection.query(
      "UPDATE pesanan SET status = 'diantar', id_kurir = ? WHERE id = ?",
      [courierId, orderId],
    );

    await connection.commit();
    res.status(200).json({ success: true, message: "Kurir berhasil ditugaskan" });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message || "Gagal menugaskan kurir" });
  } finally {
    connection.release();
  }
};

const completeDelivery = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      "SELECT id, id_pesanan FROM pengiriman WHERE id = ? FOR UPDATE",
      [id],
    );
    if (rows.length === 0) throw new Error("Pengiriman tidak ditemukan");

    await connection.query("UPDATE pengiriman SET status = 'selesai' WHERE id = ?", [id]);
    await connection.query("UPDATE pesanan SET status = 'selesai' WHERE id = ?", [rows[0].id_pesanan]);

    await connection.commit();
    res.status(200).json({ success: true, message: "Pengiriman selesai" });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message || "Gagal selesaikan pengiriman" });
  } finally {
    connection.release();
  }
};

module.exports = { assignCourier, completeDelivery };
