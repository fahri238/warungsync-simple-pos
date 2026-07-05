const db = require("../config/db");

// 1. Ambil Notifikasi
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Ambil notif yang ditujukan untuk ID user ini ATAU untuk rolenya
    const [notifs] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? OR role = ? 
       ORDER BY created_at DESC LIMIT 20`,
      [userId, role]
    );

    // Format data agar cocok dengan struktur React frontend kita
    const formattedData = notifs.map(n => ({
      id: n.id,
      title: n.title,
      desc: n.message,
      time: n.created_at, // Akan kita format "waktu lalu" di Frontend
      unread: n.is_read === 0
    }));

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Gagal ambil notif:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil notifikasi" });
  }
};

// 2. Tandai Semua Dibaca
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    await db.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ? OR role = ?`,
      [userId, role]
    );
    
    res.status(200).json({ success: true, message: "Semua notifikasi ditandai dibaca" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal update notifikasi" });
  }
};

module.exports = { getNotifications, markAllAsRead };