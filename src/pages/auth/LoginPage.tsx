import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, setSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) { toast.error("Isi email dan password"); return; }
    const result = login(email, password);
    if (typeof result === "string") { toast.error(result); return; }
    setSession(result);
    toast.success(`Selamat datang, ${result.name}!`);
    if (result.role === "admin") navigate("/admin");
    else if (result.role === "courier") navigate("/courier");
    else navigate("/customer");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm animate-slide-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🏪</div>
          <CardTitle className="text-xl">Masuk ke WarungSync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" /></div>
          <Button className="w-full" onClick={handleLogin}>Masuk</Button>
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">Daftar</Link>
          </p>
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Demo Accounts:</p>
            <p>Admin: admin@warungsync.com / admin123</p>
            <p>Kurir: kurir@warungsync.com / kurir123</p>
            <p>Customer: customer@warungsync.com / customer123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
