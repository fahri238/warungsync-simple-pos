import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "courier">("customer");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      toast.error("Isi semua field");
      return;
    }
    if (role === "courier" && !address) {
      toast.error("Kurir wajib mengisi alamat");
      return;
    }

    try {
      setSubmitting(true);
      const user = await register({
        name,
        email,
        password,
        phone,
        role,
        address: address || undefined,
      });
      toast.success("Akun berhasil dibuat!");
      navigate(user.role === "courier" ? "/courier" : "/customer");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mendaftar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm animate-slide-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🏪</div>
          <CardTitle className="text-xl">Daftar Akun Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Daftar Sebagai</Label>
            <RadioGroup value={role} onValueChange={v => setRole(v as "customer" | "courier")} className="flex gap-4">
              <div className="flex items-center gap-2 rounded-lg border px-4 py-2 flex-1">
                <RadioGroupItem value="customer" id="r-customer" />
                <Label htmlFor="r-customer" className="cursor-pointer text-sm">🛒 Pembeli</Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-4 py-2 flex-1">
                <RadioGroupItem value="courier" id="r-courier" />
                <Label htmlFor="r-courier" className="cursor-pointer text-sm">🛵 Kurir</Label>
              </div>
            </RadioGroup>
          </div>
          <div><Label>Nama Lengkap</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda" /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" /></div>
          <div><Label>No. HP</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
          {role === "courier" && (
            <div><Label>Alamat</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap kurir" /></div>
          )}
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" /></div>
          <Button className="w-full" onClick={handleRegister} disabled={submitting || loading}>
            {submitting ? "Memproses..." : "Daftar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Masuk</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
