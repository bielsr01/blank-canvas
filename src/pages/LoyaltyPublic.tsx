import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoyaltyPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const { data } = await supabase
        .from("restaurants")
        .select("id, name, logo_url")
        .eq("slug", slug)
        .maybeSingle();
      setRestaurant(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Restaurante não encontrado</h1>
        <p className="text-muted-foreground mb-4">O link que você acessou pode estar incorreto.</p>
        <Link to="/" className="text-primary hover:underline">Voltar para o início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 flex flex-col items-center text-center mt-12">
        {restaurant.logo_url ? (
          <img 
            src={restaurant.logo_url} 
            alt={restaurant.name} 
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
            {restaurant.name[0]}
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-slate-900">{restaurant.name}</h1>
        <p className="text-slate-500 mt-1">Programa de Fidelidade</p>
        
        <div className="w-full h-px bg-slate-100 my-8" />
        
        <div className="space-y-4 w-full">
          <p className="text-slate-600">Em breve você poderá consultar seus pontos e resgatar prêmios por aqui!</p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400">Powered by</p>
          <div className="flex items-center gap-2 grayscale opacity-50">
             <span className="font-bold text-lg tracking-tight">SISTEMA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
