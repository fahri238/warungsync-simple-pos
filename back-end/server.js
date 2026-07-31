const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt'); // Pastikan package ini sudah di-install (npm install bcrypt)
const db = require('./config/db');
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Mengizinkan frontend React (Vite) untuk mengakses API ini
app.use(express.json()); // Menerima data dalam format JSON

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const storeRoutes = require('./routes/storeRoutes');
const adminRoutes = require("./routes/adminRoutes");

app.use('/api/products', productRoutes);
app.use('/api/users', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/stores', storeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ==========================================
// FUNGSI INISIALISASI SUPER ADMIN OTOMATIS
// ==========================================
const initSuperAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminName = process.env.ADMIN_NAME || 'Super Admin';
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('⚠️ Kredensial Super Admin di .env belum diatur.');
            return;
        }

        // Cek apakah akun dengan email atau peran admin sudah ada di database
        const [rows] = await db.query('SELECT * FROM users WHERE email = ? OR peran = "admin"', [adminEmail]);
        
        if (rows.length === 0) {
            // Jika belum ada, hash password dan buat akun baru
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);
            
            // Catatan: Sesuaikan nama kolom (nama, email, password, dll) dengan struktur tabel Anda
            await db.query(
                'INSERT INTO users (nama, email, password, peran, status) VALUES (?, ?, ?, "admin", "aktif")',
                [adminName, adminEmail, hashedPassword]
            );
            console.log('✅ Akun Super Admin berhasil diinisialisasi dari .env!');
        } else {
            console.log('ℹ️ Akun Super Admin sudah tersedia di database.');
        }
    } catch (error) {
        console.error('❌ Gagal menginisialisasi Super Admin:', error.message);
    }
};

// Route Test Koneksi
app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.status(200).json({ 
            message: "Backend WarungSync berjalan lancar! 🚀", 
            db_status: "Terhubung" 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Gagal terhubung ke Database ❌", 
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    
    // Jalankan pengecekan Super Admin setiap kali server menyala
    await initSuperAdmin();
});