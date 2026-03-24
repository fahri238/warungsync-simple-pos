import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, setSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password || !phone) { toast.error("Isi semua field"); return; }
    const result = registerUser(name, email, password, phone);
    if (typeof result === "string") { toast.error(result); return; }
    setSession(result);
    toast.success("Akun berhasil dibuat!");
    navigate("/customer");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm animate-slide-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🏪</div>
          <CardTitle className="text-xl">Daftar Akun Baru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nama Lengkap</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda" /></div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" /></div>
          <div><Label>No. HP</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" /></div>
          <Button className="w-full" onClick={handleRegister}>Daftar</Button>
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
