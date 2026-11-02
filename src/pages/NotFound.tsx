import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Compass className="h-8 w-8" aria-hidden />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-2 text-3xl font-display font-bold text-foreground">Sahifa topilmadi</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Manzil noto'g'ri yoki sahifa ko'chirilgan bo'lishi mumkin. Bosh sahifaga qaytib, kerakli bo'limni menyudan tanlang.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/"><Home className="mr-2 h-4 w-4" />Bosh sahifaga qaytish</Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>Orqaga</Button>
        </div>
        <p className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />Zahro Dental
        </p>
      </div>
    </main>
  );
};

export default NotFound;
