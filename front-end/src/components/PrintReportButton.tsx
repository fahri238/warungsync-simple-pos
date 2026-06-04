import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Eye } from "lucide-react";
import { BRAND_NAME } from "@/constants/brand";

interface PrintReportButtonProps {
  title: string;
  subtitle?: string;
  dateRange?: { from: string; to: string };
  children: React.ReactNode;
}

const STORE_NAME = BRAND_NAME;

const PrintReportButton = ({ title, subtitle, dateRange, children }: PrintReportButtonProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const buildPrintHTML = () => {
    const content = printRef.current;
    if (!content) return "";

    const dateStr = dateRange?.from || dateRange?.to
      ? `Periode: ${dateRange.from || "..."} s/d ${dateRange.to || "..."}`
      : `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;

    return `<!DOCTYPE html>
<html><head><title>${title} - ${STORE_NAME}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 24px; font-size: 12px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4CAF50; padding-bottom: 12px; }
  .header h1 { font-size: 18px; color: #2C3E50; margin-bottom: 2px; }
  .header .store-name { font-size: 22px; font-weight: bold; color: #4CAF50; }
  .header .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
  .header .date { font-size: 10px; color: #999; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f0f0f0; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; color: #555; border-bottom: 2px solid #ddd; }
  td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
  tr:nth-child(even) { background: #fafafa; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-mono { font-family: 'Courier New', monospace; }
  .font-bold { font-weight: 700; }
  .total-row { background: #e8f5e9 !important; font-weight: 700; font-size: 12px; }
  .total-row td { border-top: 2px solid #4CAF50; padding: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
  .badge-green { background: #e8f5e9; color: #2e7d32; }
  .badge-orange { background: #fff3e0; color: #e65100; }
  .badge-red { background: #fce4ec; color: #c62828; }
  .badge-blue { background: #e3f2fd; color: #1565c0; }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }
  .summary-card { display: inline-block; border: 1px solid #ddd; border-radius: 8px; padding: 12px 20px; margin: 4px; text-align: center; min-width: 140px; }
  .summary-card .label { font-size: 10px; color: #888; }
  .summary-card .value { font-size: 18px; font-weight: 700; color: #2C3E50; }
  .summary-row { text-align: center; margin-bottom: 16px; }
  @media print { body { padding: 12px; } }
</style>
</head><body>
<div class="header">
  <div class="store-name">${STORE_NAME}</div>
  <h1>${title}</h1>
  ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
  <div class="date">${dateStr}</div>
</div>
${content.innerHTML}
<div class="footer">Dicetak dari ${STORE_NAME} &mdash; ${new Date().toLocaleString("id-ID")}</div>
</body></html>`;
  };

  const handlePrint = () => {
    const html = buildPrintHTML();
    if (!html) return;

    // Try window.open first, fallback to iframe
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 300);
    } else {
      // Fallback: use hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "210mm";
      iframe.style.height = "297mm";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 300);
      }
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4" />Preview
        </Button>
        <Button variant="default" size="sm" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" />Print
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview: {title}</span>
              <Button size="sm" className="gap-2" onClick={() => { setPreviewOpen(false); setTimeout(handlePrint, 100); }}>
                <Printer className="h-4 w-4" />Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white text-black">
            <div className="text-center mb-5 border-b-2 border-primary pb-3">
              <p className="text-xl font-bold text-primary">{STORE_NAME}</p>
              <h2 className="text-lg font-bold text-secondary">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                {dateRange?.from || dateRange?.to
                  ? `Periode: ${dateRange.from || "..."} s/d ${dateRange.to || "..."}`
                  : `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            </div>
            <div ref={printRef}>{children}</div>
            <p className="text-center text-xs text-muted-foreground mt-6 border-t pt-3">
              Dicetak dari {STORE_NAME} — {new Date().toLocaleString("id-ID")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrintReportButton;
