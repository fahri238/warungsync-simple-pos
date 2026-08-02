import { useToast } from "@/hooks/use-toast";
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, ShieldAlert, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    // UBAH DURASI DI SINI: 1500 = 1,5 detik (ubah angka ini jika masih kurang cepat/lama)
    <ToastProvider duration={1500}>
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            
            {variant === "destructive" ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 mb-2">
                <ShieldAlert className="h-12 w-12 text-red-600" />
              </div>
            ) : variant === "success" ? (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-2">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 mb-2">
                <Info className="h-12 w-12 text-blue-600" />
              </div>
            )}

            <div className="grid gap-1 text-center">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}