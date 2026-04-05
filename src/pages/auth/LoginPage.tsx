import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { findUserByEmail, verifyPassword, generateToken } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sequence Diagram: inputCredentials(email, password) → POST /login
  const handleLogin = () => {
    if (!email || !password) { toast.error("Isi email dan password"); return; }

    // Step 3: AuthController → UserModel: findUserByEmail(email)
    const userData = findUserByEmail(email);

    // Step 5: AuthController → AuthController: verifyPassword(password, hash)
    if (!userData || !verifyPassword(password, userData.password)) {
      // Alt [Tidak Valid]: return error 401 → showErrorMsg()
      toast.error("Email atau password salah");
      return;
    }

    // Alt [Valid]: generateToken() → redirect to Dashboard
    generateToken(userData);
    toast.success(`Selamat datang, ${userData.name}!`);
    if (userData.role === "admin") navigate("/admin");
    else if (userData.role === "courier") navigate("/courier");
    else navigate("/customer");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4 animate-slide-in">
      <Button variant="ghost" size="sm" className="gap-1" asChild>
        <Link to="/"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      </Button>
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-4xl">🏪</div>
          <CardTitle className="text-xl">Masuk ke Warung Mama Eva</CardTitle>
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
    </div>
  );
};

export default LoginPage;
