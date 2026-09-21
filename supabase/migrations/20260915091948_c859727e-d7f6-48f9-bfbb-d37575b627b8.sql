CREATE POLICY "Admins manage practitioner photos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'practitioner-photos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'practitioner-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read practitioner photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'practitioner-photos');