-- ============================================================
-- CARRUSEL IA — Migrations completas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── 1. EXTENSIONES ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 2. TABLA: profiles ─────────────────────────────────────
-- Se crea automáticamente cuando un usuario se registra (via trigger)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  nombre     text,
  rol        text not null default 'editor' check (rol in ('editor', 'revisor')),
  created_at timestamptz default now()
);

-- Trigger: crear profile automáticamente al registrar usuario
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, rol)
  values (new.id, new.email, 'editor');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── 3. TABLA: marcas ───────────────────────────────────────
create table if not exists marcas (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  colores     jsonb not null default '{"primario":"#000000","secundario":"#ffffff","acento":"#6366f1","neutro":"#f3f4f6"}',
  tipografias jsonb not null default '[]',
  tono_visual text,
  created_at  timestamptz default now()
);

-- ─── 4. TABLA: assets_marca ─────────────────────────────────
create table if not exists assets_marca (
  id          uuid primary key default gen_random_uuid(),
  marca_id    uuid not null references marcas(id) on delete cascade,
  tipo        text not null check (tipo in ('logo','fondo','icono','elemento','foto','efecto')),
  url         text not null,
  descripcion text,
  tags        text[],
  created_at  timestamptz default now()
);

-- ─── 5. TABLA: carruseles ────────────────────────────────────
create table if not exists carruseles (
  id               uuid primary key default gen_random_uuid(),
  marca_id         uuid not null references marcas(id) on delete cascade,
  enfoque          text not null check (enfoque in ('educativo','promocional','storytelling','tendencia','otro')),
  estado           text not null default 'borrador' check (estado in ('borrador','en_revision','aprobado','con_cambios')),
  feedback_general text,
  notas            text,
  version          integer not null default 1,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Agregar columna notas si no existe (para bases de datos ya creadas)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'carruseles' and column_name = 'notas'
  ) then
    alter table carruseles add column notas text;
  end if;
end $$;

-- Trigger: actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists carruseles_updated_at on carruseles;
create trigger carruseles_updated_at
  before update on carruseles
  for each row execute procedure update_updated_at();

-- ─── 6. TABLA: slides ───────────────────────────────────────
create table if not exists slides (
  id                uuid primary key default gen_random_uuid(),
  carrusel_id       uuid not null references carruseles(id) on delete cascade,
  numero            integer not null,
  copy              text not null,
  sugerencia_visual text,
  url_jpg           text,
  feedback_slide    text,
  prompt_usado      text,
  created_at        timestamptz default now(),
  unique(carrusel_id, numero)
);

-- ─── 7. TABLA: versiones_carrusel ───────────────────────────
-- Guarda snapshots de slides cuando se solicitan cambios
create table if not exists versiones_carrusel (
  id           uuid primary key default gen_random_uuid(),
  carrusel_id  uuid not null references carruseles(id) on delete cascade,
  version      integer not null,
  slides_data  jsonb not null,  -- snapshot de los slides en ese momento
  created_at   timestamptz default now()
);

-- ─── 8. RLS POLICIES ────────────────────────────────────────

-- Habilitar RLS en todas las tablas
alter table profiles          enable row level security;
alter table marcas             enable row level security;
alter table assets_marca       enable row level security;
alter table carruseles         enable row level security;
alter table slides             enable row level security;
alter table versiones_carrusel enable row level security;

-- Helper: obtener rol del usuario actual
create or replace function get_user_rol()
returns text
language sql
security definer
as $$
  select rol from profiles where id = auth.uid();
$$;

-- profiles: cada usuario ve/edita solo su propio perfil
create policy "profiles: usuario lee su propio perfil"
  on profiles for select
  using (id = auth.uid());

create policy "profiles: usuario actualiza su propio perfil"
  on profiles for update
  using (id = auth.uid());

-- marcas: todos los usuarios autenticados pueden leer
create policy "marcas: autenticados leen"
  on marcas for select
  using (auth.uid() is not null);

-- marcas: solo editores pueden crear/editar/eliminar
create policy "marcas: editores escriben"
  on marcas for insert
  with check (get_user_rol() = 'editor');

create policy "marcas: editores actualizan"
  on marcas for update
  using (get_user_rol() = 'editor');

create policy "marcas: editores eliminan"
  on marcas for delete
  using (get_user_rol() = 'editor');

-- assets_marca: todos leen, solo editores escriben
create policy "assets: autenticados leen"
  on assets_marca for select
  using (auth.uid() is not null);

create policy "assets: editores insertan"
  on assets_marca for insert
  with check (get_user_rol() = 'editor');

create policy "assets: editores actualizan"
  on assets_marca for update
  using (get_user_rol() = 'editor');

create policy "assets: editores eliminan"
  on assets_marca for delete
  using (get_user_rol() = 'editor');

-- carruseles: todos los autenticados leen
create policy "carruseles: autenticados leen"
  on carruseles for select
  using (auth.uid() is not null);

-- editores: crean y editan
create policy "carruseles: editores insertan"
  on carruseles for insert
  with check (get_user_rol() = 'editor');

create policy "carruseles: editores actualizan"
  on carruseles for update
  using (get_user_rol() = 'editor');

-- revisores: solo pueden actualizar estado y feedback
create policy "carruseles: revisores actualizan estado"
  on carruseles for update
  using (get_user_rol() = 'revisor');

-- slides: todos leen
create policy "slides: autenticados leen"
  on slides for select
  using (auth.uid() is not null);

create policy "slides: editores escriben"
  on slides for insert
  with check (get_user_rol() = 'editor');

create policy "slides: editores actualizan"
  on slides for update
  using (get_user_rol() = 'editor');

create policy "slides: revisores dan feedback"
  on slides for update
  using (get_user_rol() = 'revisor');

-- versiones: todos leen, editores crean
create policy "versiones: autenticados leen"
  on versiones_carrusel for select
  using (auth.uid() is not null);

create policy "versiones: editores crean"
  on versiones_carrusel for insert
  with check (get_user_rol() = 'editor');

-- ─── 9. STORAGE BUCKETS ─────────────────────────────────────
-- Ejecutar en SQL Editor de Supabase:

insert into storage.buckets (id, name, public)
values ('assets-marca', 'assets-marca', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('slides-generados', 'slides-generados', true)
on conflict (id) do nothing;

-- Policies para storage: assets-marca
create policy "assets-marca: lectura pública"
  on storage.objects for select
  using (bucket_id = 'assets-marca');

create policy "assets-marca: editores suben"
  on storage.objects for insert
  with check (
    bucket_id = 'assets-marca'
    and auth.uid() is not null
    and get_user_rol() = 'editor'
  );

create policy "assets-marca: editores eliminan"
  on storage.objects for delete
  using (
    bucket_id = 'assets-marca'
    and auth.uid() is not null
    and get_user_rol() = 'editor'
  );

-- Policies para storage: slides-generados
create policy "slides-generados: lectura pública"
  on storage.objects for select
  using (bucket_id = 'slides-generados');

create policy "slides-generados: editores suben"
  on storage.objects for insert
  with check (
    bucket_id = 'slides-generados'
    and auth.uid() is not null
  );

-- ─── 10. ÍNDICES ─────────────────────────────────────────────
create index if not exists idx_assets_marca_id on assets_marca(marca_id);
create index if not exists idx_carruseles_marca_id on carruseles(marca_id);
create index if not exists idx_carruseles_estado on carruseles(estado);
create index if not exists idx_slides_carrusel_id on slides(carrusel_id);
create index if not exists idx_versiones_carrusel_id on versiones_carrusel(carrusel_id);

-- ─── FIN ─────────────────────────────────────────────────────
-- Para crear usuarios de prueba, usa Supabase Dashboard > Authentication > Users
-- Luego actualiza su rol en la tabla profiles:
--   update profiles set rol = 'revisor' where email = 'pm@tuempresa.com';

-- ─── ADDENDUM: imagen_referencia en carruseles ────────────────────────────────
-- Foto o logo de referencia que el usuario adjunta al crear el carrusel
alter table carruseles add column if not exists imagen_referencia text;

-- ─── ADDENDUM: columna composicion en slides ──────────────────────────────────
-- Ejecutar si ya corriste las migrations anteriores
alter table slides add column if not exists composicion jsonb;

-- ─── ADDENDUM: publicado_at en carruseles ─────────────────────────────────────
alter table carruseles add column if not exists publicado_at timestamptz;
