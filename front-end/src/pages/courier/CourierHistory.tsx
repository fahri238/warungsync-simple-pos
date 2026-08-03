import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/store";
import type { Order } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Printer, CalendarDays, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/services/orderService";
import { toast } from "@/lib/custom-toast";

const CourierHistory = () => {
  const session = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    
    fetchOrders()
      .then((rows) => {
        const mine = rows.filter(
          (o: any) =>
            Number(o.courierId) === Number(session.id) &&
            (o.fulfillment === "delivery" || o.fulfillment === "kurir"),
        );
        setOrders(mine);
      })
      .catch((error: any) => {
        toast.error(error?.message || "Gagal memuat riwayat");
      })
      .finally(() => setLoading(false));
  }, [session]);

  const completedOrders = useMemo(
    () => orders.filter((o) => ["completed", "selesai"].includes(o.status as string)),
    [orders]
  );

  const getOrderTotal = (order: Order) => {
    if (typeof order.total === "number") return order.total;
    const itemsTotal = order.items?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0;
    return itemsTotal + ((order as any).shippingFee || 0);
  };

  const totalSetoran = useMemo(() => completedOrders.reduce((sum, o) => sum + getOrderTotal(o), 0), [completedOrders]);

  const handlePrintCompleted = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return toast.error("Pop-up diblokir browser");

    const printDate = new Date().toLocaleString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const summaryHtml = `
      <div class="summary-box">
        <div class="summary-item green">
          <div class="summary-label">TOTAL UANG SETORAN COD</div>
          <h3 class="summary-value">Rp ${totalSetoran.toLocaleString("id-ID")}</h3>
        </div>
        <div class="summary-item">
          <div class="summary-label">TOTAL PENGIRIMAN SELESAI</div>
          <h3 class="summary-value">${completedOrders.length} Paket</h3>
        </div>
      </div>
    `;

    const tableHtml = `
      <div class="section-title">Rincian Pengiriman</div>
      <table>
        <thead>
          <tr>
            <th>Tanggal Selesai</th>
            <th>Nama Pelanggan</th>
            <th>Alamat Tujuan</th>
            <th class="text-right color-green">Tagihan / Setoran (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${completedOrders.map((o) => `
            <tr>
              <td>${new Date(o.createdAt).toLocaleString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              <td><b>${o.customerName}</b><br><small>${o.customerPhone || "-"}</small></td>
              <td>${(o as any).deliveryAddress || o.customerAddress || "-"}</td>
              <td class="text-right font-bold color-green">${getOrderTotal(o).toLocaleString("id-ID")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Setoran Kurir - ${session?.name}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          html { margin: 0; padding: 0; height: 100%; background: #fff; }
          body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            color: #333; margin: 0; padding: 1.5cm 2cm; font-size: 11px; box-sizing: border-box; 
            min-height: 296mm; display: flex; flex-direction: column; 
          }
          .content-wrapper { flex: 1 1 auto; }
          .signature-wrapper { 
            margin-top: auto; padding-top: 40px; display: flex; justify-content: flex-end; page-break-inside: avoid;
          }
          .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; margin: 0 0 5px 0; color: #2c3e50; letter-spacing: 1px; text-transform: uppercase; }
          .subtitle { font-size: 13px; color: #7f8c8d; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta { display: flex; justify-content: space-between; font-size: 11px; color: #555; margin-bottom: 20px; background: #f8f9fa; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .summary-box { display: flex; gap: 15px; margin-bottom: 24px; }
          .summary-item { border: 1px solid #000; padding: 12px; border-radius: 4px; text-align: left; flex: 1; }
          .summary-item.green { background-color: #f0fdf4; border-color: #16a34a; }
          .summary-label { font-size: 10px; color: #555; text-transform: uppercase; font-weight: bold; margin-bottom: 6px; }
          .summary-item.green .summary-label { color: #166534; }
          .summary-value { font-size: 16px; font-weight: bold; color: #000; margin: 0; }
          .summary-item.green .summary-value { color: #16a34a; font-size: 18px; }
          .section-title { font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          th, td { border: 1px solid #000; padding: 8px; }
          th { background-color: #eaeaea; font-weight: bold; text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .color-green { color: #166534; }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #333; margin-bottom: 30px;">
            <span>${printDate}</span>
            <span style="font-weight: bold;">WarungSync — Logistik Kurir</span>
          </div>
          <div class="header">
            <h1 class="title">Laporan Setoran Kurir</h1>
            <p class="subtitle">Rekapitulasi Pengiriman dan Tagihan Cash On Delivery (COD)</p>
          </div>
          <div class="meta">
            <div><strong>Nama Kurir Terdaftar:</strong> <span style="text-transform: uppercase; font-weight: bold;">${session?.name || "Kurir"}</span></div>
            <div><strong>Identitas Akun:</strong> #${session?.id || "-"}</div>
          </div>
          
          ${summaryHtml}
          ${tableHtml}
        </div>

        <div class="signature-wrapper">
          <div style="text-align: center; width: 220px;">
            <p style="margin: 0 0 65px 0; font-size: 12px;">Banjarmasin, ${new Date().toLocaleDateString("id-ID")}</p>
            <p style="margin: 0; font-weight: bold; border-top: 1px solid #000; padding-top: 6px; font-size: 12px; text-transform: uppercase;">
              ${session?.name || "Kurir Penanggung Jawab"}
            </p>
          </div>
        </div>

        <script>
          window.onload = () => { setTimeout(() => window.print(), 500); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-success/15 flex items-center justify-center shrink-0">
            <CheckCircle className="h-7 w-7 text-success" />
          </div>
          <div>
            <p className="text-3xl font-black text-foreground leading-none">{completedOrders.length}</p>
            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Total Diselesaikan</p>
          </div>
        </div>
        
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Receipt className="h-7 w-7 text-orange-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-foreground leading-none">Rp {totalSetoran.toLocaleString("id-ID")}</p>
            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider">Total Setoran COD</p>
          </div>
        </div>
      </div>

      <Card className="rounded-[1.5rem] border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 pb-5 pt-6 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Riwayat Pengiriman
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handlePrintCompleted} className="h-10 gap-2 shadow-sm rounded-xl px-4 border-border">
            <Printer className="h-4 w-4 text-muted-foreground" /> Cetak Laporan Setoran
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground animate-pulse">Memuat riwayat...</div>
          ) : completedOrders.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircle className="h-12 w-12 mb-3 opacity-20" />
              <p>Belum ada pengiriman yang diselesaikan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-background">
                    <th className="px-6 py-5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Tanggal</th>
                    <th className="px-6 py-5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Pelanggan</th>
                    <th className="px-6 py-5 text-left font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Alamat Tujuan</th>
                    <th className="px-6 py-5 text-right font-bold text-muted-foreground uppercase tracking-wider text-[11px]">Setoran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {completedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-foreground text-xs font-medium whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-foreground text-sm font-bold">
                        {o.customerName} <br />
                        <span className="text-xs font-normal text-muted-foreground">{o.customerPhone || "-"}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs leading-relaxed max-w-[250px] font-medium">
                        {(o as any).deliveryAddress || o.customerAddress || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold whitespace-nowrap text-success text-base">
                        Rp {getOrderTotal(o).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourierHistory;