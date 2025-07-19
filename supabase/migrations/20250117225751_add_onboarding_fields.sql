-- Add onboarding fields to users table
alter table public.users add column if not exists first_name text;
alter table public.users add column if not exists last_name text;
alter table public.users add column if not exists phone_number text;
alter table public.users add column if not exists address text;
alter table public.users add column if not exists birthday text;
alter table public.users add column if not exists education_level text;
alter table public.users add column if not exists subjects_teach text[];
alter table public.users add column if not exists class_size text;
alter table public.users add column if not exists identity_url text;

-- Create identity-proof storage bucket
insert into storage.buckets (id, name, public)
values ('identity-proof', 'identity-proof', false)
on conflict (id) do nothing;

-- Create storage policy for identity documents
create policy "Users can upload their own identity documents" on storage.objects
  for insert
  with check (
    bucket_id = 'identity-proof' and
    (replace(storage.filename(name), concat('.', storage.extension(name)), '')::uuid) = auth.uid()
  );

create policy "Users can read their own identity documents" on storage.objects
  for select
  using (
    bucket_id = 'identity-proof' and
    (replace(storage.filename(name), concat('.', storage.extension(name)), '')::uuid) = auth.uid()
  );

create policy "Users can update their own identity documents" on storage.objects
  for update
  using (
    bucket_id = 'identity-proof' and
    (replace(storage.filename(name), concat('.', storage.extension(name)), '')::uuid) = auth.uid()
  );

create policy "Users can delete their own identity documents" on storage.objects
  for delete
  using (
    bucket_id = 'identity-proof' and
    (replace(storage.filename(name), concat('.', storage.extension(name)), '')::uuid) = auth.uid()
  );
