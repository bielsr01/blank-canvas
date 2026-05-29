ALTER TABLE public.loyalty_settings 
ADD COLUMN IF NOT EXISTS public_title text DEFAULT 'Programa de Fidelidade Coxinha Surprise',
ADD COLUMN IF NOT EXISTS public_description text DEFAULT 'Bem-vindo ao Programa de Fidelidade da Coxinha Surprise! Acumule pontos em cada compra e troque por benefícios exclusivos.',
ADD COLUMN IF NOT EXISTS public_rules text DEFAULT 'A cada R$1 gasto equivale a 1 ponto.\nOs pontos só podem ser utilizados na mesma unidade onde foi efetuada a compra.\nOs pontos só podem ser resgatados presencialmente na loja.',
ADD COLUMN IF NOT EXISTS button_text text DEFAULT 'Consultar Meus Pontos',
ADD COLUMN IF NOT EXISTS whatsapp_message text DEFAULT 'Seu código para consultar seus pontos é: {CODIGO}',
ADD COLUMN IF NOT EXISTS otp_expiry_minutes integer DEFAULT 10;
