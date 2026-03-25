-- Enable RLS
ALTER TABLE public.caretaker_contacts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert caretaker contacts"
ON public.caretaker_contacts
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own caretaker contacts"
ON public.caretaker_contacts
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own caretaker contacts"
ON public.caretaker_contacts
FOR DELETE TO authenticated
USING (user_id = auth.uid());