import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Send, CheckCircle2, History, Award, Info, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatPhone, normalizeBrPhone, brl } from "@/lib/format";

export default function LoyaltyPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth flow states
  const [step, setStep] = useState<"landing" | "phone" | "otp" | "account">("landing");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [member, setMember] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      
      // Load restaurant
      const { data: rest } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url")
        .eq("slug", slug)
        .maybeSingle();
      
      if (!rest) {
        setLoading(false);
        return;
      }
      
      setRestaurant(rest);

      // Load loyalty settings
      const { data: sett } = await supabase
        .from("loyalty_settings")
        .select("*")
        .eq("restaurant_id", rest.id)
        .maybeSingle();
      
      setSettings(sett || {
        public_title: "Programa de Fidelidade Coxinha Surprise",
        public_description: "Bem-vindo ao Programa de Fidelidade da Coxinha Surprise! Acumule pontos em cada compra e troque por benefícios exclusivos.",
        public_rules: "A cada R$1 gasto equivale a 1 ponto.\nOs pontos só podem ser utilizados na mesma unidade onde foi efetuada a compra.\nOs pontos só podem ser resgatados presencialmente na loja.",
        button_text: "Consultar Meus Pontos",
        whatsapp_message: "Seu código para consultar seus pontos é: {CODIGO}",
        otp_expiry_minutes: 10
      });
      
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleRequestOtp = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return toast.error("Informe um telefone válido com DDD");
    }
    
    setBusy(true);
    try {
      const normalizedPhone = normalizeBrPhone(phone);
      
      // For this implementation, we simulate the OTP sending via Evolution API
      // In a real scenario, this would be an Edge Function call
      const { data, error } = await supabase.functions.invoke("loyalty-otp", {
        body: { 
          action: "send", 
          restaurantId: restaurant.id, 
          phone: normalizedPhone,
          messageTemplate: settings.whatsapp_message
        }
      });

      if (error) throw error;
      
      toast.success("Código enviado via WhatsApp!");
      setStep("otp");
      setOtpTimer(60); // 1 minute cooldown for resend
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao enviar código. Verifique se o WhatsApp da loja está conectado.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return toast.error("Informe o código de 6 dígitos");
    
    setBusy(true);
    try {
      const normalizedPhone = normalizeBrPhone(phone);
      
      const { data, error } = await supabase.functions.invoke("loyalty-otp", {
        body: { 
          action: "verify", 
          restaurantId: restaurant.id, 
          phone: normalizedPhone,
          code: otp
        }
      });

      if (error) throw error;
      
      if (data.ok) {
        // Load member data and transactions
        const { data: memberData } = await supabase
          .from("loyalty_members")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .eq("phone", normalizedPhone)
          .maybeSingle();
        
        if (!memberData) {
          toast.error("Nenhum cadastro encontrado para este número.");
          setStep("phone");
          return;
        }
        
        const { data: txData } = await supabase
          .from("loyalty_transactions")
          .select("*, orders(order_number)")
          .eq("member_id", memberData.id)
          .order("created_at", { ascending: false });
        
        setMember(memberData);
        setTransactions(txData || []);
        setStep("account");
      } else {
        toast.error(data.message || "Código inválido ou expirado.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao validar código.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpTimer]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <h1 className="text-2xl font-bold mb-2">Restaurante não encontrado</h1>
        <p className="text-muted-foreground mb-4">O link que você acessou pode estar incorreto.</p>
        <Link to="/" className="text-primary hover:underline">Voltar para o início</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 pb-20">
      <div className="w-full max-w-2xl space-y-6 mt-4 sm:mt-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          {restaurant.logo_url ? (
            <img 
              src={restaurant.logo_url} 
              alt={restaurant.name} 
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-md">
              {restaurant.name[0]}
            </div>
          )}
          <div>
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{restaurant.name}</h2>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{settings?.public_title || "Programa de Fidelidade"}</h1>
          </div>
        </div>

        {step === "landing" && (
          <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Sobre o Programa
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {settings?.public_description}
                  </p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Regras
                  </h3>
                  <div className="space-y-2">
                    {settings?.public_rules?.split("\n").map((rule: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-600">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={() => setStep("phone")}
                >
                  {settings?.button_text || "Consultar Meus Pontos"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "phone" && (
          <Card className="border-none shadow-sm max-w-md mx-auto overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => setStep("landing")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <CardTitle>Identificação</CardTitle>
              <CardDescription>Informe seu WhatsApp para receber um código de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input 
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="h-12 text-lg"
                  disabled={busy}
                />
              </div>
              <Button 
                className="w-full h-12 text-base font-bold" 
                onClick={handleRequestOtp}
                disabled={busy}
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                Receber Código
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "otp" && (
          <Card className="border-none shadow-sm max-w-md mx-auto overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => setStep("phone")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Alterar número
              </Button>
              <CardTitle>Validar Código</CardTitle>
              <CardDescription>
                Digitie o código de 6 dígitos enviado para <strong>{phone}</strong> via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-center">
                <Input 
                  type="text"
                  maxLength={6}
                  className="h-16 text-3xl text-center font-mono tracking-[0.5em] w-full max-w-[240px]"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={busy}
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <Button 
                  className="w-full h-12 text-base font-bold" 
                  onClick={handleVerifyOtp}
                  disabled={busy || otp.length < 6}
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Confirmar
                </Button>
                <div className="text-center">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-muted-foreground"
                    onClick={handleRequestOtp}
                    disabled={busy || otpTimer > 0}
                  >
                    {otpTimer > 0 ? `Reenviar código em ${otpTimer}s` : "Não recebeu o código? Reenviar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "account" && member && (
          <div className="space-y-6">
            {/* Account Summary */}
            <Card className="border-none shadow-sm overflow-hidden bg-primary text-primary-foreground">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Saldo Atual</p>
                  <h2 className="text-5xl font-black">{member.points}</h2>
                  <p className="text-primary-foreground/90 font-medium">Pontos disponíveis</p>
                </div>
                <div className="h-px w-full sm:h-20 sm:w-px bg-white/20" />
                <div className="space-y-2">
                  <div className="text-lg font-bold">{member.name}</div>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-sm inline-block">
                    {formatPhone(member.phone)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions History */}
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Extrato de Pontos
                  </CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep("landing")}>Sair</Button>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Pontos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs font-medium text-slate-500">
                            {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {tx.orders?.order_number ? `#${tx.orders.order_number}` : "—"}
                          </TableCell>
                          <TableCell>
                            {tx.type === "earn" && <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">Crédito</Badge>}
                            {tx.type === "redeem" && <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50">Resgate</Badge>}
                            {tx.type === "manual" && <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Ajuste</Badge>}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${tx.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {tx.points >= 0 ? `+${tx.points}` : tx.points}
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            Nenhuma movimentação encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Os resgates de prêmios devem ser realizados presencialmente informando seu CPF ou telefone no caixa da unidade.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 pt-6 pb-10 grayscale opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Powered by</p>
          <div className="flex items-center gap-2">
             <span className="font-black text-xl tracking-tighter text-slate-700">CS PRO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
