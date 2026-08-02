import { toast as shadcnToast } from "@/hooks/use-toast";

// Kita membuat fungsi yang cara pakainya persis seperti Sonner
const customToast = Object.assign(
  // Untuk penulisan standar: toast("Pesan biasa")
  (message: string) => shadcnToast({ description: message }),
  {
    // Untuk penulisan: toast.success("Berhasil")
    success: (message: string) =>
      shadcnToast({
        variant: "success",
        title: "Berhasil",
        description: message,
      }),
    
    // Untuk penulisan: toast.error("Gagal")
    error: (message: string) =>
      shadcnToast({
        variant: "destructive",
        title: "Peringatan",
        description: message,
      }),
      
    // Untuk penulisan info/warning jika ada
    info: (message: string) =>
      shadcnToast({
        variant: "default",
        title: "Informasi",
        description: message,
      }),
  }
);

// Kita export dengan nama 'toast' agar sama persis dengan sonner
export { customToast as toast };