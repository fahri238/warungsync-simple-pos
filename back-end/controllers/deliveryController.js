const db = require("../config/db");

// ================= ASSIGN COURIER (TUGASKAN KURIR) =================
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

    // 1. Cek validitas pesanan di tabel 'orders' (sebelumnya 'pesanan')
    const [orderRows] = await connection.query(
      "SELECT id, tipe_pengiriman FROM orders WHERE id = ? FOR UPDATE",
      [orderId]
    );
    if (orderRows.length === 0) {
      throw new Error("Pesanan tidak ditemukan");
    }
    if (orderRows[0].tipe_pengiriman !== "kurir") { // Disesuaikan dengan ENUM skripsi: 'pickup' atau 'kurir'
      throw new Error("Pesanan ini bukan tipe pengantaran kurir");
    }

    // 2. Cek validitas kurir di tabel 'users' (sebelumnya 'pengguna')
    const [courierRows] = await connection.query(
      "SELECT id FROM users WHERE id = ? AND peran = 'kurir'",
      [courierId]
    );
    if (courierRows.length === 0) {
      throw new Error("Kurir tidak valid");
    }

    // 3. Cek data pengiriman di tabel 'deliveries' (sebelumnya 'pengiriman')
    const [existing] = await connection.query(
      "SELECT id, alamat FROM deliveries WHERE id_pesanan = ? FOR UPDATE",
      [orderId]
    );

    if (existing.length > 0) {
      // Jika data pengiriman sudah ada, perbarui kurir dan statusnya
      await connection.query(
        "UPDATE deliveries SET id_kurir = ?, status = 'diantar' WHERE id = ?",
        [courierId, existing[0].id]
      );
    } else {
      // Jika belum ada, buat baris pengiriman baru (ID Auto Increment, tidak pakai UUID string)
      await connection.query(
        "INSERT INTO deliveries (id_pesanan, id_kurir, alamat, destination_lat, destination_lng, status) VALUES (?, ?, ?, ?, ?, 'diantar')",
        [orderId, courierId, "-", 0.00000000, 0.00000000]
      );
    }

    // 4. Perbarui status pesanan utama menjadi 'diantar'
    // CATATAN: Kolom id_kurir di tabel orders dihapus karena relasi kurir dikunci di tabel 'deliveries' sesuai ERD skripsi Anda
    await connection.query(
      "UPDATE orders SET status = 'diantar' WHERE id = ?",
      [orderId]
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

// ================= COMPLETE DELIVERY (PENGIRIMAN SELESAI) =================
const completeDelivery = async (req, res) => {
  const { id } = req.params; // ID Pengiriman (deliveries.id)

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Cek validitas pengiriman di tabel 'deliveries'
    const [deliveryRows] = await connection.query(
      "SELECT id, id_pesanan FROM deliveries WHERE id = ? FOR UPDATE",
      [id]
    );
    if (deliveryRows.length === 0) {
      throw new Error("Data pengiriman tidak ditemukan");
    }

    const delivery = deliveryRows[0];
    
    // 2. Perbarui status pengiriman di tabel 'deliveries' menjadi 'selesai'
    await connection.query(
      "UPDATE deliveries SET status = 'selesai' WHERE id = ?", 
      [id]
    );
    
    // 3. Perbarui status pesanan di tabel 'orders' menjadi 'selesai'
    await connection.query(
      "UPDATE orders SET status = 'selesai' WHERE id = ?", 
      [delivery.id_pesanan]
    );

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