-- =====================================================================
-- SEED: 3 toko contoh + super admin + assign admin lama ke toko pertama
-- Jalankan SETELAH 001_multitenant.sql
-- =====================================================================

-- 1. Super admin (platform owner)
-- Password: superadmin123 (bcrypt hash, rounds=10)
INSERT INTO pengguna (id, nama, email, kata_sandi, no_hp, peran)
VALUES (
  'super-admin-1',
  'Super Admin',
  'superadmin@warungplatform.com',
  '$2a$10$RZ8gkVwgZ7DjBfTzU0G3NeXfAGEvWzGsT5kQ9oP8.HEvOZk2gG3Ru',
  '08111111111',
  'super_admin'
)
ON DUPLICATE KEY UPDATE peran = 'super_admin';

-- 2. Toko #1: Warung Mama Eva (existing)
INSERT INTO toko (id, nama, slug, deskripsi, alamat, desa, latitude, longitude, no_hp, delivery_aktif, pickup_aktif, is_active)
VALUES (
  'toko-1',
  'Warung Mama Eva',
  'warung-mama-eva',
  'Warung sembako dan makanan siap saji legendaris',
  'Jl. Merdeka No. 12',
  'Sukamaju',
  -6.2088, 106.8456,
  '08123456789',
  1, 1, 1
) ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- 3. Toko #2: Toko Berkah Pak Hasan
INSERT INTO toko (id, nama, slug, deskripsi, alamat, desa, latitude, longitude, no_hp, delivery_aktif, pickup_aktif, is_active)
VALUES (
  'toko-2',
  'Toko Berkah Pak Hasan',
  'toko-berkah-pak-hasan',
  'Sembako, beras, dan kebutuhan harian',
  'Jl. Mawar No. 5',
  'Sukamaju',
  -6.2100, 106.8470,
  '08129876543',
  1, 1, 1
) ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- 4. Toko #3: Warung Bu Siti
INSERT INTO toko (id, nama, slug, deskripsi, alamat, desa, latitude, longitude, no_hp, delivery_aktif, pickup_aktif, is_active)
VALUES (
  'toko-3',
  'Warung Bu Siti',
  'warung-bu-siti',
  'Jajanan, minuman, dan kebutuhan dapur',
  'Jl. Melati No. 8',
  'Sukamundur',
  -6.2050, 106.8430,
  '08134567890',
  1, 0, 1
) ON DUPLICATE KEY UPDATE nama = VALUES(nama);

-- 5. Assign admin lama ke toko-1, pemiliknya juga
UPDATE pengguna SET id_toko = 'toko-1' WHERE email = 'admin@warungmamaeva.com';
UPDATE toko SET id_pemilik = (SELECT id FROM pengguna WHERE email = 'admin@warungmamaeva.com' LIMIT 1)
  WHERE id = 'toko-1';

-- 6. Admin baru untuk toko-2 dan toko-3 (password: admin123)
INSERT INTO pengguna (id, nama, email, kata_sandi, no_hp, peran, id_toko)
VALUES
  ('admin-toko-2', 'Pak Hasan', 'admin@tokoberkah.com',
   '$2a$10$KbQA5kQpZ3VOmTzM6vUEXuC.bL2ZF0YrPnXxNqQ8eYxKGu4hZl1qe', '08129876543', 'admin', 'toko-2'),
  ('admin-toko-3', 'Bu Siti', 'admin@warungbusiti.com',
   '$2a$10$KbQA5kQpZ3VOmTzM6vUEXuC.bL2ZF0YrPnXxNqQ8eYxKGu4hZl1qe', '08134567890', 'admin', 'toko-3')
ON DUPLICATE KEY UPDATE id_toko = VALUES(id_toko);

UPDATE toko SET id_pemilik = 'admin-toko-2' WHERE id = 'toko-2';
UPDATE toko SET id_pemilik = 'admin-toko-3' WHERE id = 'toko-3';

-- 7. Pindahkan SEMUA kategori & produk yg ada ke toko-1
UPDATE kategori SET id_toko = 'toko-1' WHERE id_toko IS NULL;
UPDATE produk   SET id_toko = 'toko-1' WHERE id_toko IS NULL;

-- 8. Backfill pesanan/item/pengiriman/riwayat lama ke toko-1
UPDATE pesanan      SET id_toko = 'toko-1' WHERE id_toko IS NULL;
UPDATE item_pesanan SET id_toko = 'toko-1' WHERE id_toko IS NULL;
UPDATE pengiriman   SET id_toko = 'toko-1' WHERE id_toko IS NULL;
UPDATE riwayat_stok SET id_toko = 'toko-1' WHERE id_toko IS NULL;

-- 9. Tarif pengiriman contoh
INSERT INTO tarif_pengiriman (id, id_toko, desa, ongkir) VALUES
  ('tarif-1', 'toko-1', 'Sukamaju', 5000),
  ('tarif-2', 'toko-1', 'Sukamundur', 8000),
  ('tarif-3', 'toko-2', 'Sukamaju', 4000),
  ('tarif-4', 'toko-2', 'Sukamundur', 7000),
  ('tarif-5', 'toko-3', 'Sukamundur', 3000)
ON DUPLICATE KEY UPDATE ongkir = VALUES(ongkir);

-- 10. Catatan: password hash di atas dibuat dengan bcrypt.
-- Jika hash invalid di environment kamu, ganti via endpoint register / hash ulang.
