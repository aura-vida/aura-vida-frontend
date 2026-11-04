-- Migration: Add whatsapp_number column to profiles table for customer accounts
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp_number text;

COMMENT ON COLUMN public.profiles.whatsapp_number IS 'Mandatory contact WhatsApp number for customer accounts, including country code.';

