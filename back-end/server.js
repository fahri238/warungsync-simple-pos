const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const productRoutes  = require('./routes/productRoutes');
const authRoutes     = require('./routes/authRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const storeRoutes    = require('./routes/storeRoutes');

app.use('/api/stores',     storeRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/users',      authRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/deliveries', deliveryRoutes);

app.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.status(200).json({
      message: "Backend Multi-Tenant Warung berjalan lancar! 🚀",
      db_status: "Terhubung",
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal terhubung ke Database ❌", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
