-- =====================================================================
-- MULTI-TENANT MIGRATION — Warung Marketplace
-- Jalankan di MySQL via phpMyAdmin / CLI:
--   mysql -u root -p nama_database < back-end/migrations/001_multitenant.sql
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. TABEL BARU: stores (Toko)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS toko (
  id              VARCHAR(36)   NOT NULL PRIMARY KEY,
  nama            VARCHAR(150)  NOT NULL,
  slug            VARCHAR(160)  NOT NULL UNIQUE,
  id_pemilik     VARCHAR(36)   NULL,
  deskripsi       TEXT          NULL,
  alamat          TEXT          NULL,
  desa            VARCHAR(100)  NULL,
  latitude        DECIMAL(10,7) NULL,
  longitude       DECIMAL(10,7) NULL,
  no_hp           VARCHAR(20)   NULL,
  url_logo        VARCHAR(500)  NULL,
  delivery_aktif  TINYINT(1)    NOT NULL DEFAULT 1,
  pickup_aktif    TINYINT(1)    NOT NULL DEFAULT 1,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  tanggal_dibuat  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_diubah  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_toko_active (is_active),
  INDEX idx_toko_desa (desa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. TABEL BARU: tarif_pengiriman per (toko, desa)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarif_pengiriman (
  id          VARCHAR(36)    NOT NULL PRIMARY KEY,
  id_toko     VARCHAR(36)    NOT NULL,
  desa        VARCHAR(100)   NOT NULL,
  ongkir      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  is_active   TINYINT(1)     NOT NULL DEFAULT 1,
  tanggal_dibuat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tarif_toko_desa (id_toko, desa),
  CONSTRAINT fk_tarif_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. TABEL BARU: alamat_pelanggan (multi alamat dengan OSM lat/lng)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alamat_pelanggan (
  id          VARCHAR(36)    NOT NULL PRIMARY KEY,
  id_pengguna VARCHAR(36)    NOT NULL,
  label       VARCHAR(50)    NULL,
  alamat      TEXT           NOT NULL,
  desa        VARCHAR(100)   NULL,
  latitude    DECIMAL(10,7)  NULL,
  longitude   DECIMAL(10,7)  NULL,
  is_default  TINYINT(1)     NOT NULL DEFAULT 0,
  tanggal_dibuat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alamat_pengguna (id_pengguna),
  CONSTRAINT fk_alamat_pengguna FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. ALTER: pengguna — tambah store_id + super_admin role
-- ---------------------------------------------------------------------
ALTER TABLE pengguna
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER peran;

ALTER TABLE pengguna
  MODIFY COLUMN peran ENUM('super_admin','admin','pelanggan','kurir') NOT NULL DEFAULT 'pelanggan';

ALTER TABLE pengguna
  ADD CONSTRAINT fk_pengguna_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE SET NULL,
  ADD INDEX idx_pengguna_toko_peran (id_toko, peran);

-- ---------------------------------------------------------------------
-- 5. ALTER: kategori — scope per toko
-- ---------------------------------------------------------------------
ALTER TABLE kategori
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER id;

ALTER TABLE kategori
  ADD CONSTRAINT fk_kategori_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE,
  ADD INDEX idx_kategori_toko (id_toko);

-- (Hapus UNIQUE lama nama, ganti dengan UNIQUE per toko + nama)
-- ALTER TABLE kategori DROP INDEX nama;  -- uncomment jika ada UNIQUE pada `nama`
ALTER TABLE kategori
  ADD UNIQUE KEY uq_kategori_toko_nama (id_toko, nama);

-- ---------------------------------------------------------------------
-- 6. ALTER: produk — scope per toko + barcode + min_stock
-- ---------------------------------------------------------------------
ALTER TABLE produk
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER id,
  ADD COLUMN barcode VARCHAR(64) NULL AFTER deskripsi,
  ADD COLUMN stok_minimum INT NOT NULL DEFAULT 5 AFTER stok;

ALTER TABLE produk
  ADD CONSTRAINT fk_produk_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE,
  ADD INDEX idx_produk_toko_kategori (id_toko, id_kategori),
  ADD INDEX idx_produk_toko_stok (id_toko, stok),
  ADD UNIQUE KEY uq_produk_toko_barcode (id_toko, barcode);

-- ---------------------------------------------------------------------
-- 7. ALTER: pesanan — scope per toko + channel + fulfillment
-- ---------------------------------------------------------------------
ALTER TABLE pesanan
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER id,
  ADD COLUMN ongkir DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_harga,
  ADD COLUMN desa VARCHAR(100) NULL,
  ADD COLUMN delivery_lat DECIMAL(10,7) NULL,
  ADD COLUMN delivery_lng DECIMAL(10,7) NULL;

ALTER TABLE pesanan
  ADD CONSTRAINT fk_pesanan_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE,
  ADD INDEX idx_pesanan_toko_status (id_toko, status),
  ADD INDEX idx_pesanan_toko_kanal (id_toko, tipe_pesanan, tanggal_dibuat);

-- ---------------------------------------------------------------------
-- 8. ALTER: item_pesanan — scope per toko (denormalisasi untuk query cepat)
-- ---------------------------------------------------------------------
ALTER TABLE item_pesanan
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER id;

ALTER TABLE item_pesanan
  ADD CONSTRAINT fk_item_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE,
  ADD INDEX idx_item_toko (id_toko);

-- ---------------------------------------------------------------------
-- 9. ALTER: pengiriman — scope per toko
-- ---------------------------------------------------------------------
ALTER TABLE pengiriman
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER id;

ALTER TABLE pengiriman
  ADD CONSTRAINT fk_pengiriman_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE,
  ADD INDEX idx_pengiriman_toko_kurir (id_toko, id_kurir);

-- ---------------------------------------------------------------------
-- 10. ALTER: riwayat_stok — scope per toko + sumber perubahan
-- ---------------------------------------------------------------------
ALTER TABLE riwayat_stok
  ADD COLUMN id_toko VARCHAR(36) NULL AFTER id,
  ADD COLUMN sumber ENUM('pos','online','manual','restock') NOT NULL DEFAULT 'manual' AFTER alasan;

ALTER TABLE riwayat_stok
  ADD CONSTRAINT fk_riwayat_toko FOREIGN KEY (id_toko) REFERENCES toko(id) ON DELETE CASCADE,
  ADD INDEX idx_riwayat_toko_produk (id_toko, id_produk, tanggal_dibuat);

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SELESAI. Lanjut jalankan 002_seed_stores.sql untuk data contoh.
-- =====================================================================
