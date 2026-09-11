-- Fase 4: avatar_url on profiles
alter table profiles add column if not exists avatar_url text;
create index if not exists idx_profiles_avatar on profiles(avatar_url) where avatar_url is not null;
