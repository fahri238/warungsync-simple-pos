const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production";

// ================= VERIFY TOKEN MIDDLEWARE =================
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token sudah kadaluarsa",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    res.status(401).json({
      success: false,
      message: "Gagal verifikasi token",
      error: error.message,
    });
  }
};

// ================= REQUIRE ROLE MIDDLEWARE =================
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User tidak diauthentikasi",
        });
      }

      if (!allowedRoles.includes(req.user.peran)) {
        return res.status(403).json({
          success: false,
          message: "Anda tidak memiliki akses ke resource ini",
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking role",
        error: error.message,
      });
    }
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
