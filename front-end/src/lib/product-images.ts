import foodNasiGoreng from "@/assets/food-nasi-goreng.jpg";
import foodMieGoreng from "@/assets/food-mie-goreng.jpg";
import foodAyamGoreng from "@/assets/food-ayam-goreng.jpg";
import foodSotoAyam from "@/assets/food-soto-ayam.jpg";
import foodEsTeh from "@/assets/food-es-teh.jpg";
import foodEsJeruk from "@/assets/food-es-jeruk.jpg";
import foodKopi from "@/assets/food-kopi.jpg";
import foodKerupuk from "@/assets/food-kerupuk.jpg";
import foodGorengan from "@/assets/food-gorengan.jpg";
import foodNasiPutih from "@/assets/food-nasi-putih.jpg";

export const defaultProductImages: Record<string, string> = {
  "p-1": foodNasiGoreng,
  "p-2": foodMieGoreng,
  "p-3": foodAyamGoreng,
  "p-4": foodSotoAyam,
  "p-5": foodEsTeh,
  "p-6": foodEsJeruk,
  "p-7": foodKopi,
  "p-8": foodKerupuk,
  "p-9": foodGorengan,
  "p-10": foodNasiPutih,
};

export const defaultPlaceholder = foodNasiPutih;
