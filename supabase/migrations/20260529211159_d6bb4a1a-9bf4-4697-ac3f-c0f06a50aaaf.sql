-- Tables for Loyalty Program
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
  restaurant_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  points_per_real numeric NOT NULL DEFAULT 1,
  public_title text DEFAULT 'Programa de Fidelidade Coxinha Surprise',
  public_description text DEFAULT 'Bem-vindo ao Programa de Fidelidade da Coxinha Surprise! Acumule pontos em cada compra e troque por benefícios exclusivos.',
  public_rules text DEFAULT 'A cada R$1 gasto equivale a 1 ponto.\nOs pontos só podem ser utilizados na mesma unidade onde foi efetuada a compra.\nOs pontos só podem ser resgatados presencialmente na loja.',
  button_text text DEFAULT 'Consultar Meus Pontos',
  whatsapp_message text DEFAULT 'Seu código para consultar seus pontos é: {CODIGO}',
  otp_expiry_minutes integer DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, phone)
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  member_id uuid NOT NULL REFERENCES public.loyalty_members(id) ON DELETE CASCADE,
  order_id uuid,
  points integer NOT NULL,
  type text NOT NULL, -- earn, redeem, manual
  status text NOT NULL DEFAULT 'pending', -- pending, credited
  created_at timestamptz NOT NULL DEFAULT now(),
  credited_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  product_id uuid,
  name text NOT NULL,
  points_cost integer NOT NULL,
  stock integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT ON public.loyalty_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_settings TO authenticated;
GRANT ALL ON public.loyalty_settings TO service_role;

GRANT SELECT ON public.loyalty_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_members TO authenticated;
GRANT ALL ON public.loyalty_members TO service_role;

GRANT SELECT ON public.loyalty_transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;

GRANT SELECT ON public.loyalty_rewards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rewards TO authenticated;
GRANT ALL ON public.loyalty_rewards TO service_role;

-- RLS
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for loyalty_settings
CREATE POLICY "Loyalty settings public read" ON public.loyalty_settings FOR SELECT USING (true);
CREATE POLICY "Manager manages loyalty settings" ON public.loyalty_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for loyalty_members
CREATE POLICY "Loyalty members public read" ON public.loyalty_members FOR SELECT USING (true);
CREATE POLICY "Manager manages loyalty members" ON public.loyalty_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for loyalty_transactions
CREATE POLICY "Loyalty transactions public read" ON public.loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "Manager manages loyalty transactions" ON public.loyalty_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for loyalty_rewards
CREATE POLICY "Loyalty rewards public read" ON public.loyalty_rewards FOR SELECT USING (true);
CREATE POLICY "Manager manages loyalty rewards" ON public.loyalty_rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
