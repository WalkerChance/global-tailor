-- Global Tailor — media storage (Phase 1)
-- A public bucket for fabric/garment images. Objects are namespaced by uploader
-- uid (first path segment), so a user can only write under their own folder.
-- Public read serves the images; the media table stores the URLs.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- RLS on storage.objects is enabled by Supabase. Scope writes to the owner.
create policy "media public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
