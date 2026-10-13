-- Rites sunucu şeması (9. görev): kullanıcılar, bağlantılar, davetler, Gelenler.
-- Supabase → SQL Editor'e yapıştırıp bir kez çalıştırılır. Yeniden çalıştırmak güvenlidir.
--
-- İlke (`03`): sunucuda yalnız paylaşılan veri durur. Kişinin verdiği adlar
-- ("Ali (eşim)") telefonda kalır; sunucu yalnız kimin kiminle bağlı olduğunu bilir.
-- Bütün tablolarda satır düzeyi yetki açıktır; kural dışı her şey yasaktır.

-- ---- Tablolar ---------------------------------------------------------------

create table if not exists public.kullanici (
  id     uuid primary key references auth.users (id) on delete cascade,
  eposta text not null unique,
  ad     text not null default ''
);

-- İki kişi arasında tek satır: a < b. durum: istek (isteyen bekliyor) · bagli.
create table if not exists public.baglanti (
  a         uuid not null references public.kullanici (id) on delete cascade,
  b         uuid not null references public.kullanici (id) on delete cascade,
  durum     text not null check (durum in ('istek', 'bagli')),
  isteyen   uuid not null references public.kullanici (id) on delete cascade,
  olusturma timestamptz not null default now(),
  primary key (a, b),
  check (a < b),
  check (isteyen = a or isteyen = b)
);

-- Rites'ta olmayan birine davet. Kişi katılınca bağlantı isteğine döner.
create table if not exists public.davet (
  eposta     text not null,
  davet_eden uuid not null references public.kullanici (id) on delete cascade,
  olusturma  timestamptz not null default now(),
  primary key (eposta, davet_eden)
);

-- Gönderilen kart (kopya). Alıcı kaydedince ya da silince silinir.
create table if not exists public.gelen (
  id       uuid primary key default gen_random_uuid(),
  kimden   uuid not null references public.kullanici (id) on delete cascade,
  kime     uuid not null references public.kullanici (id) on delete cascade,
  kart     jsonb not null,
  gonderim timestamptz not null default now()
);
create index if not exists gelen_kime on public.gelen (kime);

alter table public.kullanici enable row level security;
alter table public.baglanti  enable row level security;
alter table public.davet     enable row level security;
alter table public.gelen     enable row level security;

-- ---- Yardımcılar ------------------------------------------------------------

create or replace function public.bagli_mi(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.baglanti
    where a = least(x, y) and b = greatest(x, y) and durum = 'bagli'
  );
$$;

-- Ücretsiz sınır: senin eklediklerin (istek ya da bağlı, sen isteyensen) + davetlerin.
create or replace function public.ekledigim_sayi(ben uuid) returns integer
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.baglanti where isteyen = ben)::int
       + (select count(*) from public.davet where davet_eden = ben)::int;
$$;

-- ---- Satır düzeyi yetki -------------------------------------------------------

drop policy if exists kullanici_oku on public.kullanici;
create policy kullanici_oku on public.kullanici for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.baglanti
      where (a = auth.uid() and b = kullanici.id) or (b = auth.uid() and a = kullanici.id)
    )
  );

drop policy if exists kullanici_ad on public.kullanici;
create policy kullanici_ad on public.kullanici for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists baglanti_oku on public.baglanti;
create policy baglanti_oku on public.baglanti for select to authenticated
  using (auth.uid() in (a, b));

-- Reddet, Sil: bağlantı iki tarafta da kopar (`08` açık soru 9).
drop policy if exists baglanti_sil on public.baglanti;
create policy baglanti_sil on public.baglanti for delete to authenticated
  using (auth.uid() in (a, b));

drop policy if exists davet_oku on public.davet;
create policy davet_oku on public.davet for select to authenticated
  using (davet_eden = auth.uid());

drop policy if exists davet_sil on public.davet;
create policy davet_sil on public.davet for delete to authenticated
  using (davet_eden = auth.uid());

-- Kart yalnız bağlı kişiye gönderilir (`05` §13).
drop policy if exists gelen_gonder on public.gelen;
create policy gelen_gonder on public.gelen for insert to authenticated
  with check (kimden = auth.uid() and public.bagli_mi(kimden, kime));

drop policy if exists gelen_oku on public.gelen;
create policy gelen_oku on public.gelen for select to authenticated
  using (kime = auth.uid());

drop policy if exists gelen_sil on public.gelen;
create policy gelen_sil on public.gelen for delete to authenticated
  using (kime = auth.uid());

-- Doğrudan yazma yok: kişi ekleme ve kabul yalnız aşağıdaki işlevlerle.
revoke insert, update on public.baglanti from anon, authenticated;
revoke insert, update on public.davet from anon, authenticated;
revoke insert, update on public.kullanici from anon, authenticated;
grant update (ad) on public.kullanici to authenticated;
revoke all on public.kullanici, public.baglanti, public.davet, public.gelen from anon;

-- ---- İşlevler (uygulamanın çağırdıkları) --------------------------------------

-- Kişi ekle (KS-1). Döner: {sonuc: 'istek' | 'bagli' | 'davet', kullanici_id}
-- Hata kodları: kendin · sinir · zaten
create or replace function public.kisi_ekle(p_eposta text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  e text := lower(trim(p_eposta));
  o uuid;
  mevcut public.baglanti;
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if e = (select eposta from public.kullanici where id = ben) then raise exception 'kendin'; end if;
  select id into o from public.kullanici where eposta = e;

  if o is not null then
    select * into mevcut from public.baglanti where a = least(ben, o) and b = greatest(ben, o);
    if found then
      -- O seni zaten eklemek istemişse: eklemen kabul sayılır.
      if mevcut.durum = 'istek' and mevcut.isteyen = o then
        update public.baglanti set durum = 'bagli' where a = mevcut.a and b = mevcut.b;
        return jsonb_build_object('sonuc', 'bagli', 'kullanici_id', o);
      end if;
      raise exception 'zaten';
    end if;
    if public.ekledigim_sayi(ben) >= 5 then raise exception 'sinir'; end if;
    insert into public.baglanti (a, b, durum, isteyen) values (least(ben, o), greatest(ben, o), 'istek', ben);
    return jsonb_build_object('sonuc', 'istek', 'kullanici_id', o);
  end if;

  if exists (select 1 from public.davet where eposta = e and davet_eden = ben) then raise exception 'zaten'; end if;
  if public.ekledigim_sayi(ben) >= 5 then raise exception 'sinir'; end if;
  insert into public.davet (eposta, davet_eden) values (e, ben);
  return jsonb_build_object('sonuc', 'davet', 'kullanici_id', null);
end;
$$;

-- Seni eklemek isteyenler → Kabul et (KS-2).
create or replace function public.istegi_kabul_et(p_kisi uuid) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  update public.baglanti set durum = 'bagli'
  where a = least(ben, p_kisi) and b = greatest(ben, p_kisi) and durum = 'istek' and isteyen = p_kisi;
  if not found then raise exception 'istek yok'; end if;
end;
$$;

-- Hesabımı sil: kullanıcı ve ona bağlı her şey (bağlantılar, davetler, Gelenler) silinir.
create or replace function public.hesabimi_sil() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'oturum yok'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.kisi_ekle(text), public.istegi_kabul_et(uuid), public.hesabimi_sil() from anon, public;
grant execute on function public.kisi_ekle(text), public.istegi_kabul_et(uuid), public.hesabimi_sil() to authenticated;
revoke execute on function public.bagli_mi(uuid, uuid), public.ekledigim_sayi(uuid) from anon, public;
grant execute on function public.bagli_mi(uuid, uuid), public.ekledigim_sayi(uuid) to authenticated;

-- ---- Kullanıcı katılınca --------------------------------------------------------
-- E-postası doğrulanınca (ilk kodla girişte) kullanıcı satırı açılır ve ona gelen
-- davetler bağlantı isteğine döner. Davet e-postasıyla açılmış ama henüz
-- girmemiş kişi "Rites'ta değil" sayılır.

create or replace function public.kullanici_katildi() returns trigger
language plpgsql security definer set search_path = public as $$
declare e text := lower(new.email);
begin
  insert into public.kullanici (id, eposta) values (new.id, e)
  on conflict (id) do update set eposta = excluded.eposta;
  insert into public.baglanti (a, b, durum, isteyen)
    select least(d.davet_eden, new.id), greatest(d.davet_eden, new.id), 'istek', d.davet_eden
    from public.davet d where d.eposta = e and d.davet_eden <> new.id
  on conflict do nothing;
  delete from public.davet where eposta = e;
  return new;
end;
$$;

drop trigger if exists kullanici_katildi on auth.users;
create trigger kullanici_katildi
  after insert or update of email_confirmed_at on auth.users
  for each row when (new.email_confirmed_at is not null)
  execute function public.kullanici_katildi();
