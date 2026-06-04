// Input validation functions for products and categories

const validateProduct = (req, res, next) => {
  const { name, price, category, stock } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Nama produk harus diisi dan tidak boleh kosong" });
  }
  if (price === undefined || price === null || isNaN(price) || price <= 0) {
    return res.status(400).json({ message: "Harga harus diisi dan harus lebih dari 0" });
  }
  if (!category || typeof category !== "string" || category.trim() === "") {
    return res.status(400).json({ message: "Kategori harus dipilih" });
  }
  if (stock !== undefined && stock !== null && (isNaN(stock) || stock < 0)) {
    return res.status(400).json({ message: "Stok harus berupa angka non-negatif" });
  }
  next();
};

const validateCategory = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Nama kategori harus diisi dan tidak boleh kosong" });
  }
  next();
};

const validateRegistration = (req, res, next) => {
  const { nama, email, kata_sandi, no_hp, peran } = req.body;

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
  if (!no_hp || typeof no_hp !== "string" || no_hp.trim() === "") {
    return res.status(400).json({ success: false, message: "Nomor HP harus diisi" });
  }
  if (peran) {
    const validRoles = ["super_admin", "admin", "pelanggan", "kurir"];
    if (!validRoles.includes(peran)) {
      return res.status(400).json({ success: false, message: "Peran tidak valid" });
    }
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, kata_sandi } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Email tidak valid" });
  }
  if (!kata_sandi || typeof kata_sandi !== "string" || kata_sandi.length === 0) {
    return res.status(400).json({ success: false, message: "Kata sandi harus diisi" });
  }
  next();
};

module.exports = {
  validateProduct,
  validateCategory,
  validateRegistration,
  validateLogin,
};
