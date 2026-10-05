ALTER TABLE public.practitioners ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}'::text[];
COMMENT ON COLUMN public.practitioners.keywords IS 'Focus areas the practitioner can help with, matched by site search (e.g. addiction, anxiety, sleep)';

UPDATE public.practitioners SET keywords = ARRAY['anxiety','stress','trauma','emotional balance','nervous system','energy healing','relaxation']::text[] WHERE slug = 'session-lila-moreau';
UPDATE public.practitioners SET keywords = ARRAY['stress','burnout','sleep','insomnia','anxiety','breathwork','meditation','sound healing']::text[] WHERE slug = 'session-mateo-aren';
UPDATE public.practitioners SET keywords = ARRAY['digestion','gut health','chronic pain','joint pain','fatigue','detox','immunity','lifestyle']::text[] WHERE slug = 'session-anouk-vidal';
UPDATE public.practitioners SET keywords = ARRAY['addiction','alcohol','drinking','smoking','anxiety','limiting beliefs','self-esteem','relationships','trauma']::text[] WHERE slug = 'session-priya-shah';