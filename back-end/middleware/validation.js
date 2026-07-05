// Input validation functions for products and categories

const validateProduct = (req, res, next) => {
  const { name, price, category, stock, image, description } = req.body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nama produk harus diisi dan tidak boleh kosong" });
  }

  if (price === undefined || price === null || isNaN(price) || price <= 0) {
    return res
      .status(400)
      .json({ message: "Harga harus diisi dan harus lebih dari 0" });
  }

  if (!category || typeof category !== "string" || category.trim() === "") {
    return res.status(400).json({ message: "Kategori harus dipilih" });
  }

  // Optional: validate stock (default to 0 if not provided)
  if (stock !== undefined && stock !== null && (isNaN(stock) || stock < 0)) {
    return res
      .status(400)
      .json({ message: "Stok harus berupa angka non-negatif" });
  }

  next();
};

const validateCategory = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nama kategori harus diisi dan tidak boleh kosong" });
  }

  next();
};

// ================= AUTH VALIDATION =================

const validateRegistration = (req, res, next) => {
  // PERBAIKAN: Ubah no_hp menjadi kontak agar seragam dengan Controller
  const { nama, email, kata_sandi, kontak, peran } = req.body;

  if (!nama || typeof nama !== "string" || nama.trim() === "") {
    return res.status(400).json({ success: false, message: "Nama harus diisi" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Email tidak valid" });
  }

  if (!kata_sandi || typeof kata_sandi !== "string" || kata_sandi.length < 6) {
    return res.status(400).json({ success: false, message: "Kata sandi minimal 6 karakter" });
  }

  // PERBAIKAN: Validasi kontak, bukan no_hp
  if (!kontak || typeof kontak !== "string" || kontak.trim() === "") {
    return res.status(400).json({ success: false, message: "Nomor HP (Kontak) harus diisi" });
  }

  if (peran) {
    // PERBAIKAN: Tambahkan "owner" ke dalam daftar yang sah
    const validRoles = ["admin", "owner", "pelanggan", "kurir"];
    if (!validRoles.includes(peran)) {
      return res.status(400).json({ success: false, message: "Peran tidak valid" });
    }
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, kata_sandi } = req.body;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Email tidak valid"
    });
  }

  // Validate kata_sandi
  if (!kata_sandi || typeof kata_sandi !== "string" || kata_sandi.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi harus diisi"
    });
  }

  next();
};

module.exports = {
  validateProduct,
  validateCategory,
  validateRegistration,
  validateLogin
};

