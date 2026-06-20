const db = require("../config/db");
const crypto = require("crypto");

const assignCourier = async (req, res) => {
  const { orderId, courierId } = req.body;

  if (!orderId || !courierId) {
    return res.status(400).json({
      success: false,
      message: "orderId dan courierId wajib diisi",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.query(
      "SELECT id, tipe_pengiriman FROM pesanan WHERE id = ? FOR UPDATE",
      [orderId],
    );
    if (orderRows.length === 0) {
      throw new Error("Pesanan tidak ditemukan");
    }
    if (orderRows[0].tipe_pengiriman !== "delivery") {
      throw new Error("Pesanan ini bukan tipe delivery");
    }

    const [courierRows] = await connection.query(
      "SELECT id FROM pengguna WHERE id = ? AND peran = 'kurir'",
      [courierId],
    );
    if (courierRows.length === 0) {
      throw new Error("Kurir tidak valid");
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
        "INSERT INTO pengiriman (id, id_pesanan, id_kurir, alamat, status) VALUES (?, ?, ?, ?, 'diantar')",
        [crypto.randomUUID(), orderId, courierId, "-"],
      );
    }

    await connection.query(
      "UPDATE pesanan SET status = 'diantar', id_kurir = ? WHERE id = ?",
      [courierId, orderId],
    );

    await connection.commit();
    res.status(200).json({
      success: true,
      message: "Kurir berhasil ditugaskan",
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({
      success: false,
      message: error.message || "Gagal menugaskan kurir",
    });
  } finally {
    connection.release();
  }
};

const completeDelivery = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [deliveryRows] = await connection.query(
      "SELECT id, id_pesanan FROM pengiriman WHERE id = ? FOR UPDATE",
      [id],
    );
    if (deliveryRows.length === 0) {
      throw new Error("Data pengiriman tidak ditemukan");
    }

    const delivery = deliveryRows[0];
    await connection.query("UPDATE pengiriman SET status = 'selesai' WHERE id = ?", [
      id,
    ]);
    await connection.query("UPDATE pesanan SET status = 'selesai' WHERE id = ?", [
      delivery.id_pesanan,
    ]);

    await connection.commit();
    res.status(200).json({
      success: true,
      message: "Pengiriman berhasil diselesaikan",
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({
      success: false,
      message: error.message || "Gagal menyelesaikan pengiriman",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  assignCourier,
  completeDelivery,
};
