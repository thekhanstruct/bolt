/*
# Create documents storage bucket

1. Storage
- Creates 'documents' bucket (private) for org-scoped PDF/document uploads
2. Security
- Storage policies: org members can read, editors+ can upload, org admins can delete
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "docs_storage_read" ON storage.objects;
CREATE POLICY "docs_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = name
      AND public.is_org_member(auth.uid(), d.organization_id)
    )
  );

DROP POLICY IF EXISTS "docs_storage_upload" ON storage.objects;
CREATE POLICY "docs_storage_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE public.can_edit_content(auth.uid(), o.id)
    )
  );

DROP POLICY IF EXISTS "docs_storage_delete" ON storage.objects;
CREATE POLICY "docs_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = name
      AND public.is_org_admin(auth.uid(), d.organization_id)
    )
  );