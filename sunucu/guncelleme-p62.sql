-- P-62 Kart verme ve buluşmada görüntülü görüşme bağlantısı: Supabase → SQL Editor'da bir kez çalıştır.
-- Görüntülü görüşme bağlantısı (pilot 29 Ekim, P-62): WhatsApp arama bağlantısı ya da başka bir adres.
alter table public.bulusma add column if not exists baglanti text not null default ''
  check (baglanti = '' or (baglanti ~ '^https?://' and length(baglanti) <= 300));
drop function if exists public.bulusma_kur(uuid, text, date, text, text);
create or replace function public.bulusma_kur(p_grup uuid, p_baslik text, p_gun date, p_saat text, p_yer text, p_baglanti text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  b uuid;
begin
  if not public.grup_uyesi_mi(p_grup, ben) then raise exception 'grup yok'; end if;
  if length(trim(coalesce(p_baslik, ''))) = 0 then raise exception 'ad yok'; end if;
  insert into public.bulusma (grup, kuran, baslik, gun, saat, yer, baglanti)
    values (p_grup, ben, trim(p_baslik), p_gun, nullif(p_saat, ''), trim(coalesce(p_yer, '')), trim(coalesce(p_baglanti, '')))
    returning id into b;
  -- Kuran geliyor sayılır (ajandasına da düşer).
  insert into public.bulusma_yanit (bulusma, kullanici, yanit) values (b, ben, 'geliyorum');
  return b;
end;
$$;

drop function if exists public.bulusma_duzenle(uuid, text, date, text, text);
create or replace function public.bulusma_duzenle(p_bulusma uuid, p_baslik text, p_gun date, p_saat text, p_yer text, p_baglanti text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  eski public.bulusma;
begin
  select * into eski from public.bulusma where id = p_bulusma;
  if not found or eski.kuran <> ben then raise exception 'yetki yok'; end if;
  if length(trim(coalesce(p_baslik, ''))) = 0 then raise exception 'ad yok'; end if;
  update public.bulusma
    set baslik = trim(p_baslik), gun = p_gun, saat = nullif(p_saat, ''), yer = trim(coalesce(p_yer, '')),
        baglanti = trim(coalesce(p_baglanti, ''))
    where id = p_bulusma;
  -- Gün ya da saat değiştiyse öteki yanıtlar silinir; herkes yeniden yanıtlar.
  if eski.gun <> p_gun or coalesce(eski.saat, '') <> coalesce(nullif(p_saat, ''), '') then
    delete from public.bulusma_yanit where bulusma = p_bulusma and kullanici <> ben;
  end if;
end;
$$;

create or replace function public.bulusmalarim() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id, 'grup', b.grup, 'grupAdi', g.ad, 'kuran', b.kuran, 'baslik', b.baslik,
    'gun', b.gun, 'saat', b.saat, 'yer', b.yer, 'baglanti', b.baglanti,
    'yanitlar', (
      select coalesce(jsonb_agg(jsonb_build_object('kullanici', y.kullanici, 'yanit', y.yanit) order by y.zaman), '[]'::jsonb)
      from public.bulusma_yanit y where y.bulusma = b.id
    )
  ) order by b.gun, b.saat nulls first, b.olusturma), '[]'::jsonb)
  from public.bulusma b
  join public.grup g on g.id = b.grup
  join public.grup_uye me on me.grup = b.grup and me.kullanici = auth.uid() and me.durum = 'uye'
  where b.gun >= current_date - 30;
$$;

revoke execute on function
  public.bulusma_kur(uuid, text, date, text, text, text), public.bulusma_duzenle(uuid, text, date, text, text, text),
  public.bulusma_yanitla(uuid, text), public.bulusmalarim(), public.bulusmaya_erisir_mi(uuid, uuid)
  from anon, public;
grant execute on function
  public.bulusma_kur(uuid, text, date, text, text, text), public.bulusma_duzenle(uuid, text, date, text, text, text),
  public.bulusma_yanitla(uuid, text), public.bulusmalarim(), public.bulusmaya_erisir_mi(uuid, uuid)
  to authenticated;

-- ---- Kart verme (pilot 29 Ekim, P-62) -------------------------------------------------
-- Aile içi: bir kişi, izin verdiği yakınının tasarladığı kartı doğrudan ajandasına alır.
-- İzin "Ajandama kart ekleyebilir": sahip (ajanda sahibi) yetkiliye verir; yetkili "İzin
-- iste" diyebilir (istek sahibin Gelenler'ine düşer). Verilen kart sahibin telefonuna
-- açılışta iner, tarihli ajandaya girer; geri dönen bilgi yalnız "Yaptım" günleridir.

create table if not exists public.ajanda_izni (
  sahip   uuid not null references public.kullanici (id) on delete cascade,
  yetkili uuid not null references public.kullanici (id) on delete cascade,
  durum   text not null check (durum in ('istek', 'izinli')),
  zaman   timestamptz not null default now(),
  primary key (sahip, yetkili),
  check (sahip <> yetkili)
);
create index if not exists ajanda_izni_yetkili on public.ajanda_izni (yetkili);

create table if not exists public.verilen_kart (
  id        uuid primary key default gen_random_uuid(),
  veren     uuid not null references public.kullanici (id) on delete cascade,
  alan      uuid not null references public.kullanici (id) on delete cascade,
  kart      jsonb not null,
  baslangic date not null,
  durum     text not null default 'aktif' check (durum in ('aktif', 'birakildi')),
  olusturma timestamptz not null default now(),
  check (veren <> alan)
);
create index if not exists verilen_kart_alan on public.verilen_kart (alan);
create index if not exists verilen_kart_veren on public.verilen_kart (veren);

create table if not exists public.verilen_yapildi (
  kart uuid not null references public.verilen_kart (id) on delete cascade,
  gun  date not null,
  primary key (kart, gun)
);

alter table public.ajanda_izni     enable row level security;
alter table public.verilen_kart    enable row level security;
alter table public.verilen_yapildi enable row level security;

drop policy if exists ajanda_izni_oku on public.ajanda_izni;
create policy ajanda_izni_oku on public.ajanda_izni for select to authenticated
  using (sahip = auth.uid() or yetkili = auth.uid());
-- Sahip izni kaldırır ya da isteği reddeder; yetkili isteğini geri alır.
drop policy if exists ajanda_izni_sil on public.ajanda_izni;
create policy ajanda_izni_sil on public.ajanda_izni for delete to authenticated
  using (sahip = auth.uid() or yetkili = auth.uid());

drop policy if exists verilen_kart_oku on public.verilen_kart;
create policy verilen_kart_oku on public.verilen_kart for select to authenticated
  using (veren = auth.uid() or alan = auth.uid());
-- Veren "Geri al" der (kart alanın ajandasından da kalkar).
drop policy if exists verilen_kart_sil on public.verilen_kart;
create policy verilen_kart_sil on public.verilen_kart for delete to authenticated
  using (veren = auth.uid());

create or replace function public.verilen_karti_gorur_mu(k uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.verilen_kart where id = k and (veren = u or alan = u))
$$;
create or replace function public.verilen_kartin_alani_mi(k uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.verilen_kart where id = k and alan = u)
$$;

drop policy if exists verilen_yapildi_oku on public.verilen_yapildi;
create policy verilen_yapildi_oku on public.verilen_yapildi for select to authenticated
  using (public.verilen_karti_gorur_mu(kart, auth.uid()));
drop policy if exists verilen_yapildi_ekle on public.verilen_yapildi;
create policy verilen_yapildi_ekle on public.verilen_yapildi for insert to authenticated
  with check (public.verilen_kartin_alani_mi(kart, auth.uid()));
drop policy if exists verilen_yapildi_sil on public.verilen_yapildi;
create policy verilen_yapildi_sil on public.verilen_yapildi for delete to authenticated
  using (public.verilen_kartin_alani_mi(kart, auth.uid()));

revoke insert, update on public.ajanda_izni, public.verilen_kart from anon, authenticated;
revoke update on public.verilen_yapildi from anon, authenticated;
grant insert (kart, gun) on public.verilen_yapildi to authenticated;
revoke all on public.ajanda_izni, public.verilen_kart, public.verilen_yapildi from anon;

-- Yetkili: "İzin iste" (yalnız bağlı kişiye; izin varsa bir şey değişmez).
create or replace function public.ajanda_izni_iste(p_sahip uuid) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if not public.bagli_mi(ben, p_sahip) then raise exception 'bagli degil'; end if;
  insert into public.ajanda_izni (sahip, yetkili, durum) values (p_sahip, ben, 'istek') on conflict do nothing;
end;
$$;

-- Sahip: izni verir (p_ver true; istek varsa kabul) ya da kaldırır / reddeder (false).
create or replace function public.ajanda_izni_ver(p_yetkili uuid, p_ver boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if not p_ver then
    delete from public.ajanda_izni where sahip = ben and yetkili = p_yetkili;
    return;
  end if;
  if not public.bagli_mi(ben, p_yetkili) then raise exception 'bagli degil'; end if;
  insert into public.ajanda_izni (sahip, yetkili, durum) values (ben, p_yetkili, 'izinli')
    on conflict (sahip, yetkili) do update set durum = 'izinli', zaman = now();
end;
$$;

-- Veren: kartı izin veren kişinin ajandasına koyar.
create or replace function public.kart_ver(p_alan uuid, p_kart jsonb, p_baslangic date) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  k uuid;
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if not exists (select 1 from public.ajanda_izni where sahip = p_alan and yetkili = ben and durum = 'izinli') then
    raise exception 'izin yok';
  end if;
  if coalesce(length(trim(p_kart->>'baslik')), 0) = 0 then raise exception 'ad yok'; end if;
  insert into public.verilen_kart (veren, alan, kart, baslangic) values (ben, p_alan, p_kart, p_baslangic)
    returning id into k;
  return k;
end;
$$;

-- Alan: "Bırak" (kart ajandasından kalkar; veren görür).
create or replace function public.karti_birak(p_kart uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.verilen_kart set durum = 'birakildi' where id = p_kart and alan = auth.uid();
  if not found then raise exception 'yetki yok'; end if;
end;
$$;

revoke execute on function
  public.ajanda_izni_iste(uuid), public.ajanda_izni_ver(uuid, boolean), public.kart_ver(uuid, jsonb, date),
  public.karti_birak(uuid), public.verilen_karti_gorur_mu(uuid, uuid), public.verilen_kartin_alani_mi(uuid, uuid)
  from anon, public;
grant execute on function
  public.ajanda_izni_iste(uuid), public.ajanda_izni_ver(uuid, boolean), public.kart_ver(uuid, jsonb, date),
  public.karti_birak(uuid), public.verilen_karti_gorur_mu(uuid, uuid), public.verilen_kartin_alani_mi(uuid, uuid)
  to authenticated;

create or replace function public.kart_verme_bildirimi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'ajanda_izni' then
    if tg_op = 'INSERT' and new.durum = 'istek' then
      perform public.bildirim_gonder(array[new.sahip], 'Rites',
        public.kisi_adi(new.yetkili) || ' ajandana kart eklemek istiyor', '{}');
    elsif new.durum = 'izinli' and (tg_op = 'INSERT' or old.durum = 'istek') then
      perform public.bildirim_gonder(array[new.yetkili], 'Rites',
        public.kisi_adi(new.sahip) || ' ajandasına kart eklemene izin verdi', '{}');
    end if;
  elsif tg_table_name = 'verilen_kart' then
    if tg_op = 'INSERT' then
      perform public.bildirim_gonder(array[new.alan], public.kisi_adi(new.veren),
        'Ajandana bir kart ekledi: ' || coalesce(new.kart->>'baslik', ''), '{}');
    elsif old.durum = 'aktif' and new.durum = 'birakildi' then
      perform public.bildirim_gonder(array[new.veren], 'Rites',
        public.kisi_adi(new.alan) || ' bıraktı: ' || coalesce(new.kart->>'baslik', ''), '{}');
    end if;
  end if;
  return null;
end;
$$;
drop trigger if exists bildirim on public.ajanda_izni;
create trigger bildirim after insert or update on public.ajanda_izni for each row execute function public.kart_verme_bildirimi();
drop trigger if exists bildirim on public.verilen_kart;
create trigger bildirim after insert or update on public.verilen_kart for each row execute function public.kart_verme_bildirimi();

-- Kart verme değişiklikleri öteki telefona anında gitsin (Supabase Realtime).
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then return; end if;
  foreach t in array array['ajanda_izni', 'verilen_kart', 'verilen_yapildi'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
