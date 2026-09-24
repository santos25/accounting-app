-- Esquema inicial: clientes, declaraciones de renta anuales y calendario DIAN.

create type public.document_type as enum ('CC', 'CE', 'NIT', 'PASAPORTE');

create type public.declaration_status as enum (
  'PENDIENTE',
  'DOCUMENTOS_RECIBIDOS',
  'EN_PROCESO',
  'PRESENTADA',
  'NO_OBLIGADO'
);

create type public.payment_status as enum ('PENDIENTE', 'PARCIAL', 'PAGADO');

-- Clientes -------------------------------------------------------------------

create table public.clients (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name           text not null check (length(trim(full_name)) > 0),
  document_type       public.document_type not null default 'CC',
  document_number     text not null check (length(trim(document_number)) > 0),
  email               text,
  phone               text,
  -- Cifrado AES-256-GCM en la aplicación: "iv:authTag:ciphertext" en base64.
  portal_password_enc text,
  e_signature_enc     text,
  notes               text,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (owner_id, document_number)
);

create index clients_owner_id_idx on public.clients (owner_id);
create index clients_full_name_idx on public.clients (full_name);

-- Declaraciones (una por cliente y año gravable) -----------------------------

create table public.declarations (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete cascade,
  tax_year       int not null check (tax_year between 2000 and 2100),
  due_date       date not null,
  status         public.declaration_status not null default 'PENDIENTE',
  fee            numeric(12, 2) not null default 0 check (fee >= 0),
  amount_paid    numeric(12, 2) not null default 0 check (amount_paid >= 0),
  -- Lo calcula el trigger set_payment_status a partir de fee y amount_paid.
  payment_status public.payment_status not null default 'PENDIENTE',
  filed_at       timestamptz,
  form_number    text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (client_id, tax_year)
);

create index declarations_owner_id_idx on public.declarations (owner_id);
create index declarations_due_date_idx on public.declarations (due_date);
create index declarations_status_idx on public.declarations (status);

-- Calendario DIAN de personas naturales --------------------------------------

create table public.tax_calendar (
  tax_year    int not null,
  last_digits char(2) not null check (last_digits ~ '^[0-9]{2}$'),
  due_date    date not null,
  primary key (tax_year, last_digits)
);

-- Triggers -------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger declarations_set_updated_at
  before update on public.declarations
  for each row execute function public.set_updated_at();

create function public.set_payment_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.payment_status = case
    when new.amount_paid <= 0 then 'PENDIENTE'::public.payment_status
    when new.amount_paid >= new.fee then 'PAGADO'::public.payment_status
    else 'PARCIAL'::public.payment_status
  end;
  return new;
end;
$$;

create trigger declarations_set_payment_status
  before insert or update of fee, amount_paid on public.declarations
  for each row execute function public.set_payment_status();

-- Vista para dashboard y tablas ----------------------------------------------

create view public.declarations_overview
with (security_invoker = on) as
select
  d.id,
  d.owner_id,
  d.client_id,
  d.tax_year,
  d.due_date,
  d.status,
  d.fee,
  d.amount_paid,
  d.payment_status,
  d.filed_at,
  d.form_number,
  d.notes,
  d.created_at,
  d.updated_at,
  c.full_name,
  c.document_type,
  c.document_number,
  (d.due_date - (now() at time zone 'America/Bogota')::date) as days_left,
  (d.fee - d.amount_paid) as balance
from public.declarations d
join public.clients c on c.id = d.client_id;

-- Row Level Security ---------------------------------------------------------

alter table public.clients enable row level security;
alter table public.declarations enable row level security;
alter table public.tax_calendar enable row level security;

create policy "Clientes propios"
  on public.clients
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Declaraciones propias"
  on public.declarations
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = client_id and c.owner_id = (select auth.uid())
    )
  );

create policy "Calendario legible"
  on public.tax_calendar
  for select
  to authenticated
  using (true);

-- Permisos de la Data API: solo usuarios autenticados.
revoke all on public.clients, public.declarations, public.tax_calendar, public.declarations_overview from anon;
grant select, insert, update, delete on public.clients, public.declarations to authenticated;
grant select on public.tax_calendar, public.declarations_overview to authenticated;
