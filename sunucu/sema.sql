-- Rites sunucu şeması: kullanıcılar, bağlantılar, davetler, Gelenler (9. görev);
-- gruplar, ortak listeler ve maddeler (10. görev).
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

-- Grup bir kişi kümesidir; içerik taşımaz (`08` karar 36). Kuran da üyedir.
create table if not exists public.grup (
  id        uuid primary key default gen_random_uuid(),
  kurucu    uuid not null references public.kullanici (id) on delete cascade,
  ad        text not null check (length(trim(ad)) > 0),
  olusturma timestamptz not null default now()
);

-- durum: davet (çağrıldı, henüz katılmadı) · uye. Katılmayan grubun listelerini görmez.
create table if not exists public.grup_uye (
  grup      uuid not null references public.grup (id) on delete cascade,
  kullanici uuid not null references public.kullanici (id) on delete cascade,
  durum     text not null check (durum in ('davet', 'uye')),
  katilma   timestamptz not null default now(),
  primary key (grup, kullanici)
);
create index if not exists grup_uye_kullanici on public.grup_uye (kullanici);

create table if not exists public.liste (
  id        uuid primary key default gen_random_uuid(),
  sahip     uuid not null references public.kullanici (id) on delete cascade,
  ad        text not null check (length(trim(ad)) > 0),
  olusturma timestamptz not null default now()
);

-- Liste bir gruba ya da bir kişiye açılır. Gruba açık listeyi gruba sonradan katılan da görür.
create table if not exists public.liste_erisim (
  liste     uuid not null references public.liste (id) on delete cascade,
  grup      uuid references public.grup (id) on delete cascade,
  kullanici uuid references public.kullanici (id) on delete cascade,
  check ((grup is null) <> (kullanici is null))
);
create unique index if not exists liste_erisim_grup on public.liste_erisim (liste, grup) where grup is not null;
create unique index if not exists liste_erisim_kisi on public.liste_erisim (liste, kullanici) where kullanici is not null;
-- Birincil anahtarı yok (iki kısmi tekil dizin); canlı yayın (realtime) silmeleri yayınladığı
-- için satırın tamamı kimlik sayılır. Yoksa silme "replica identity" hatası verir (P-56:
-- Hesabımı sil, listeden çıkma, grup silme).
alter table public.liste_erisim replica identity full;

-- Madde: Kime? / Ne zaman? isteğe bağlı (GR-4).
create table if not exists public.madde (
  id      uuid primary key default gen_random_uuid(),
  liste   uuid not null references public.liste (id) on delete cascade,
  metin   text not null check (length(trim(metin)) > 0),
  yapildi boolean not null default false,
  ekleyen uuid references public.kullanici (id) on delete set null,
  kime    uuid references public.kullanici (id) on delete set null,
  tarih   date,
  sira    bigint generated always as identity
);
create index if not exists madde_liste on public.madde (liste);

-- Liste çeşitleri (pilot 29 Ekim, P-61): davranış uygulamada; sunucu yalnız saklar.
alter table public.liste add column if not exists cesit text not null default 'yapilacak'
  check (cesit in ('yapilacak', 'alisveris', 'hazirlik', 'not'));
alter table public.madde add column if not exists miktar text not null default '' check (length(miktar) <= 40);
create index if not exists madde_kime on public.madde (kime) where kime is not null;

alter table public.kullanici enable row level security;
alter table public.baglanti  enable row level security;
alter table public.davet     enable row level security;
alter table public.gelen     enable row level security;
alter table public.grup         enable row level security;
alter table public.grup_uye     enable row level security;
alter table public.liste        enable row level security;
alter table public.liste_erisim enable row level security;
alter table public.madde        enable row level security;

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

-- Grupta mı (davetli ya da üye)?
create or replace function public.grupta_mi(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.grup_uye where grup = g and kullanici = u);
$$;

create or replace function public.grup_uyesi_mi(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.grup_uye where grup = g and kullanici = u and durum = 'uye');
$$;

create or replace function public.grup_kurucusu_mu(g uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.grup where id = g and kurucu = u);
$$;

-- Listeyi görebilir mi: sahibi, listeye açılan kişi ya da listeye açılan grubun üyesi.
create or replace function public.listeye_erisir_mi(l uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.liste where id = l and sahip = u)
      or exists (
        select 1 from public.liste_erisim e
        where e.liste = l
          and (e.kullanici = u
               or (e.grup is not null and exists (
                     select 1 from public.grup_uye gu
                     where gu.grup = e.grup and gu.kullanici = u and gu.durum = 'uye')))
      );
$$;

-- Bir kişinin adını ve e-postasını görebilir mi: kendisi, bağlantısı (istek dahil),
-- aynı gruptaki ya da aynı listedeki kişi.
create or replace function public.gorebilir_mi(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select o = auth.uid()
      or exists (
        select 1 from public.baglanti
        where (a = auth.uid() and b = o) or (b = auth.uid() and a = o)
      )
      or exists (
        select 1 from public.grup_uye x join public.grup_uye y on x.grup = y.grup
        where x.kullanici = auth.uid() and y.kullanici = o
      )
      or exists (
        select 1 from public.liste l
        where public.listeye_erisir_mi(l.id, auth.uid()) and public.listeye_erisir_mi(l.id, o)
      );
$$;

-- ---- Satır düzeyi yetki -------------------------------------------------------

drop policy if exists kullanici_oku on public.kullanici;
create policy kullanici_oku on public.kullanici for select to authenticated
  using (public.gorebilir_mi(id));

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

-- Grup: davetli de adını ve üyelerini görür; grubu yalnız kuran siler.
drop policy if exists grup_oku on public.grup;
create policy grup_oku on public.grup for select to authenticated
  using (public.grupta_mi(id, auth.uid()));

drop policy if exists grup_sil on public.grup;
create policy grup_sil on public.grup for delete to authenticated
  using (kurucu = auth.uid());

drop policy if exists grup_uye_oku on public.grup_uye;
create policy grup_uye_oku on public.grup_uye for select to authenticated
  using (public.grupta_mi(grup, auth.uid()));

-- Kuran başkasını çıkarır; üye kendisi ayrılır (kuran ayrılamaz, grubu siler).
drop policy if exists grup_uye_sil on public.grup_uye;
create policy grup_uye_sil on public.grup_uye for delete to authenticated
  using (
    (kullanici = auth.uid() and not public.grup_kurucusu_mu(grup, auth.uid()))
    or (kullanici <> auth.uid() and public.grup_kurucusu_mu(grup, auth.uid()))
  );

-- Liste: adını değiştirmek, paylaşımı ve silmek yalnız kuranda.
drop policy if exists liste_oku on public.liste;
create policy liste_oku on public.liste for select to authenticated
  using (public.listeye_erisir_mi(id, auth.uid()));

drop policy if exists liste_sil on public.liste;
create policy liste_sil on public.liste for delete to authenticated
  using (sahip = auth.uid());

drop policy if exists liste_erisim_oku on public.liste_erisim;
create policy liste_erisim_oku on public.liste_erisim for select to authenticated
  using (public.listeye_erisir_mi(liste, auth.uid()));

-- Listeden ayrıl: listeye kişi olarak eklenmişsen kendi satırını silersin.
drop policy if exists liste_erisim_ayril on public.liste_erisim;
create policy liste_erisim_ayril on public.liste_erisim for delete to authenticated
  using (kullanici = auth.uid());

-- Madde: listeye erişen herkes ekler, işaretler, Kime?/Ne zaman? verir, siler.
-- Kime yalnız listenin bir üyesi olabilir.
drop policy if exists madde_oku on public.madde;
create policy madde_oku on public.madde for select to authenticated
  using (public.listeye_erisir_mi(liste, auth.uid()));

drop policy if exists madde_ekle on public.madde;
create policy madde_ekle on public.madde for insert to authenticated
  with check (
    ekleyen = auth.uid()
    and public.listeye_erisir_mi(liste, auth.uid())
    and (kime is null or public.listeye_erisir_mi(liste, kime))
  );

drop policy if exists madde_degistir on public.madde;
create policy madde_degistir on public.madde for update to authenticated
  using (public.listeye_erisir_mi(liste, auth.uid()))
  with check (
    public.listeye_erisir_mi(liste, auth.uid())
    and (kime is null or public.listeye_erisir_mi(liste, kime))
  );

drop policy if exists madde_sil on public.madde;
create policy madde_sil on public.madde for delete to authenticated
  using (public.listeye_erisir_mi(liste, auth.uid()));

-- Doğrudan yazma yok: kişi ekleme ve kabul yalnız aşağıdaki işlevlerle.
revoke insert, update on public.baglanti from anon, authenticated;
revoke insert, update on public.davet from anon, authenticated;
revoke insert, update on public.kullanici from anon, authenticated;
grant update (ad) on public.kullanici to authenticated;
revoke insert, update on public.grup, public.grup_uye, public.liste, public.liste_erisim from anon, authenticated;
revoke insert, update on public.madde from anon, authenticated;
grant insert (liste, metin, ekleyen, kime, tarih, miktar) on public.madde to authenticated;
grant update (yapildi, kime, tarih, miktar) on public.madde to authenticated;
revoke all on public.kullanici, public.baglanti, public.davet, public.gelen from anon;
revoke all on public.grup, public.grup_uye, public.liste, public.liste_erisim, public.madde from anon;

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

-- ---- Gruplar (GR-1) ---------------------------------------------------------------
-- Gruba yalnız bağlı kişiler çağrılır; kuran ekler ve çıkarır.

create or replace function public.grup_kur(p_ad text, p_uyeler uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  g uuid;
  u uuid;
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  insert into public.grup (kurucu, ad) values (ben, trim(p_ad)) returning id into g;
  insert into public.grup_uye (grup, kullanici, durum) values (g, ben, 'uye');
  foreach u in array coalesce(p_uyeler, '{}') loop
    if u = ben then continue; end if;
    if not public.bagli_mi(ben, u) then raise exception 'bagli degil'; end if;
    insert into public.grup_uye (grup, kullanici, durum) values (g, u, 'davet') on conflict do nothing;
  end loop;
  return g;
end;
$$;

create or replace function public.gruba_cagir(p_grup uuid, p_kisi uuid) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if not public.grup_kurucusu_mu(p_grup, ben) then raise exception 'yetki yok'; end if;
  if not public.bagli_mi(ben, p_kisi) then raise exception 'bagli degil'; end if;
  insert into public.grup_uye (grup, kullanici, durum) values (p_grup, p_kisi, 'davet') on conflict do nothing;
end;
$$;

-- Katıl ya da Reddet.
create or replace function public.grup_davetini_yanitla(p_grup uuid, p_katil boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if p_katil then
    update public.grup_uye set durum = 'uye', katilma = now()
    where grup = p_grup and kullanici = ben and durum = 'davet';
  else
    delete from public.grup_uye where grup = p_grup and kullanici = ben and durum = 'davet';
  end if;
  if not found then raise exception 'davet yok'; end if;
end;
$$;

-- Gruplarım ve beni çağıran gruplar: üyeler (ad, e-posta, durum) ve gruba açık listeler.
create or replace function public.gruplarim() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', g.id,
    'ad', g.ad,
    'kurucu', g.kurucu,
    'benim', me.durum,
    'uyeler', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'ad', k.ad, 'eposta', k.eposta, 'durum', gu.durum)
                                order by gu.katilma), '[]'::jsonb)
      from public.grup_uye gu join public.kullanici k on k.id = gu.kullanici
      where gu.grup = g.id
    ),
    'listeler', case when me.durum = 'uye' then (
      select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'ad', l.ad) order by l.olusturma), '[]'::jsonb)
      from public.liste_erisim e join public.liste l on l.id = e.liste
      where e.grup = g.id
    ) else '[]'::jsonb end
  ) order by g.olusturma), '[]'::jsonb)
  from public.grup g
  join public.grup_uye me on me.grup = g.id and me.kullanici = auth.uid();
$$;

-- ---- Ortak listeler (GR-2) ----------------------------------------------------------
-- Liste yalnız üyesi olduğun gruplara ve bağlı kişilere açılır.

create or replace function public.liste_paylasimini_yaz(p_liste uuid, p_gruplar uuid[], p_kisiler uuid[], p_eski uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  x uuid;
begin
  delete from public.liste_erisim where liste = p_liste;
  foreach x in array coalesce(p_gruplar, '{}') loop
    if not public.grup_uyesi_mi(x, ben) then raise exception 'grup yok'; end if;
    insert into public.liste_erisim (liste, grup) values (p_liste, x) on conflict do nothing;
  end loop;
  foreach x in array coalesce(p_kisiler, '{}') loop
    if x = ben then continue; end if;
    -- Önceden eklenmiş kişi, bağlantı kopmuş olsa da listede kalabilir.
    if not public.bagli_mi(ben, x) and not (x = any (coalesce(p_eski, '{}'))) then raise exception 'bagli degil'; end if;
    insert into public.liste_erisim (liste, kullanici) values (p_liste, x) on conflict do nothing;
  end loop;
end;
$$;
revoke execute on function public.liste_paylasimini_yaz(uuid, uuid[], uuid[], uuid[]) from anon, authenticated, public;

-- P-61: çeşit eklendi; eski üç parametreli sürüm kaldırılır (aynı adla iki işlev olmasın).
drop function if exists public.liste_olustur(text, uuid[], uuid[]);
create or replace function public.liste_olustur(p_ad text, p_gruplar uuid[], p_kisiler uuid[], p_cesit text default 'yapilacak') returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  l uuid;
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  insert into public.liste (sahip, ad, cesit) values (ben, trim(p_ad), coalesce(p_cesit, 'yapilacak')) returning id into l;
  perform public.liste_paylasimini_yaz(l, p_gruplar, p_kisiler, '{}');
  return l;
end;
$$;

-- Listeyi düzenle: ad ve paylaşım (yalnız kuran).
drop function if exists public.liste_duzenle(uuid, text, uuid[], uuid[]);
create or replace function public.liste_duzenle(p_liste uuid, p_ad text, p_gruplar uuid[], p_kisiler uuid[], p_cesit text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  eski uuid[];
begin
  if not exists (select 1 from public.liste where id = p_liste and sahip = auth.uid()) then raise exception 'yetki yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  update public.liste set ad = trim(p_ad), cesit = coalesce(p_cesit, cesit) where id = p_liste;
  select coalesce(array_agg(kullanici), '{}') into eski from public.liste_erisim where liste = p_liste and kullanici is not null;
  perform public.liste_paylasimini_yaz(p_liste, p_gruplar, p_kisiler, eski);
end;
$$;

-- Ortak listelerim: ad, sahip, açık olduğu gruplar ve kişiler, bütün üyeler, kalan madde.
create or replace function public.listelerim() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', l.id,
    'ad', l.ad,
    'cesit', l.cesit,
    'sahip', l.sahip,
    'gruplar', (
      select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'ad', g.ad) order by g.ad), '[]'::jsonb)
      from public.liste_erisim e join public.grup g on g.id = e.grup
      where e.liste = l.id
    ),
    'kisiler', (
      select coalesce(jsonb_agg(e.kullanici), '[]'::jsonb)
      from public.liste_erisim e where e.liste = l.id and e.kullanici is not null
    ),
    'uyeler', (
      select coalesce(jsonb_agg(jsonb_build_object('id', k.id, 'ad', k.ad, 'eposta', k.eposta)), '[]'::jsonb)
      from public.kullanici k
      where k.id in (
        select l.sahip
        union select e.kullanici from public.liste_erisim e where e.liste = l.id and e.kullanici is not null
        union select gu.kullanici from public.liste_erisim e
              join public.grup_uye gu on gu.grup = e.grup and gu.durum = 'uye'
              where e.liste = l.id
      )
    ),
    'kalan', (select count(*) from public.madde m where m.liste = l.id and not m.yapildi)
  ) order by l.olusturma), '[]'::jsonb)
  from public.liste l
  where public.listeye_erisir_mi(l.id, auth.uid());
$$;

-- Bana tarihle verilen maddeler: ajandamda sanal kart olarak görünür (`05` §9).
create or replace function public.bana_verilenler() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'metin', m.metin, 'yapildi', m.yapildi, 'tarih', m.tarih, 'liste', l.id, 'listeAdi', l.ad
  ) order by m.tarih, m.sira), '[]'::jsonb)
  from public.madde m join public.liste l on l.id = m.liste
  where m.kime = auth.uid() and m.tarih is not null and public.listeye_erisir_mi(l.id, auth.uid());
$$;

revoke execute on function
  public.grup_kur(text, uuid[]), public.gruba_cagir(uuid, uuid), public.grup_davetini_yanitla(uuid, boolean),
  public.gruplarim(), public.liste_olustur(text, uuid[], uuid[], text), public.liste_duzenle(uuid, text, uuid[], uuid[], text),
  public.listelerim(), public.bana_verilenler()
  from anon, public;
grant execute on function
  public.grup_kur(text, uuid[]), public.gruba_cagir(uuid, uuid), public.grup_davetini_yanitla(uuid, boolean),
  public.gruplarim(), public.liste_olustur(text, uuid[], uuid[], text), public.liste_duzenle(uuid, text, uuid[], uuid[], text),
  public.listelerim(), public.bana_verilenler()
  to authenticated;
revoke execute on function
  public.grupta_mi(uuid, uuid), public.grup_uyesi_mi(uuid, uuid), public.grup_kurucusu_mu(uuid, uuid),
  public.listeye_erisir_mi(uuid, uuid), public.gorebilir_mi(uuid)
  from anon, public;
grant execute on function
  public.grupta_mi(uuid, uuid), public.grup_uyesi_mi(uuid, uuid), public.grup_kurucusu_mu(uuid, uuid),
  public.listeye_erisir_mi(uuid, uuid), public.gorebilir_mi(uuid)
  to authenticated;

-- Listedeki değişiklik öteki telefonlara anında gitsin (Supabase Realtime).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'madde') then
    alter publication supabase_realtime add table public.madde;
  end if;
end $$;

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

-- ---- Buluşma (pilot 18 Ekim) -----------------------------------------------------
-- Grubun üyesi bir gün (ve isteğe bağlı saat, yer) önerir; herkes Geliyorum /
-- Belki / Gelemem der. Kuran günü ya da saati değiştirirse öteki yanıtlar silinir
-- (herkes yeniden yanıtlar). "Geliyorum" diyenin ajandasındaki kart telefonda durur;
-- sunucu yalnız buluşmayı ve yanıtları bilir.

create table if not exists public.bulusma (
  id        uuid primary key default gen_random_uuid(),
  grup      uuid not null references public.grup (id) on delete cascade,
  kuran     uuid not null references public.kullanici (id) on delete cascade,
  baslik    text not null check (length(trim(baslik)) > 0),
  gun       date not null,
  saat      text check (saat is null or saat ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  yer       text not null default '',
  olusturma timestamptz not null default now()
);
create index if not exists bulusma_grup on public.bulusma (grup);

create table if not exists public.bulusma_yanit (
  bulusma   uuid not null references public.bulusma (id) on delete cascade,
  kullanici uuid not null references public.kullanici (id) on delete cascade,
  yanit     text not null check (yanit in ('geliyorum', 'belki', 'gelemem')),
  zaman     timestamptz not null default now(),
  primary key (bulusma, kullanici)
);

alter table public.bulusma       enable row level security;
alter table public.bulusma_yanit enable row level security;

create or replace function public.bulusmaya_erisir_mi(b uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bulusma x
    join public.grup_uye gu on gu.grup = x.grup and gu.kullanici = u and gu.durum = 'uye'
    where x.id = b
  );
$$;

drop policy if exists bulusma_oku on public.bulusma;
create policy bulusma_oku on public.bulusma for select to authenticated
  using (public.grup_uyesi_mi(grup, auth.uid()));

-- Buluşmayı kuran ya da grubun kurucusu siler.
drop policy if exists bulusma_sil on public.bulusma;
create policy bulusma_sil on public.bulusma for delete to authenticated
  using (kuran = auth.uid() or public.grup_kurucusu_mu(grup, auth.uid()));

drop policy if exists bulusma_yanit_oku on public.bulusma_yanit;
create policy bulusma_yanit_oku on public.bulusma_yanit for select to authenticated
  using (public.bulusmaya_erisir_mi(bulusma, auth.uid()));

revoke insert, update, delete on public.bulusma_yanit from anon, authenticated;
revoke insert, update on public.bulusma from anon, authenticated;
revoke all on public.bulusma, public.bulusma_yanit from anon;

create or replace function public.bulusma_kur(p_grup uuid, p_baslik text, p_gun date, p_saat text, p_yer text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  b uuid;
begin
  if not public.grup_uyesi_mi(p_grup, ben) then raise exception 'grup yok'; end if;
  if length(trim(coalesce(p_baslik, ''))) = 0 then raise exception 'ad yok'; end if;
  insert into public.bulusma (grup, kuran, baslik, gun, saat, yer)
    values (p_grup, ben, trim(p_baslik), p_gun, nullif(p_saat, ''), trim(coalesce(p_yer, '')))
    returning id into b;
  -- Kuran geliyor sayılır (ajandasına da düşer).
  insert into public.bulusma_yanit (bulusma, kullanici, yanit) values (b, ben, 'geliyorum');
  return b;
end;
$$;

create or replace function public.bulusma_duzenle(p_bulusma uuid, p_baslik text, p_gun date, p_saat text, p_yer text)
returns void language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  eski public.bulusma;
begin
  select * into eski from public.bulusma where id = p_bulusma;
  if not found or eski.kuran <> ben then raise exception 'yetki yok'; end if;
  if length(trim(coalesce(p_baslik, ''))) = 0 then raise exception 'ad yok'; end if;
  update public.bulusma
    set baslik = trim(p_baslik), gun = p_gun, saat = nullif(p_saat, ''), yer = trim(coalesce(p_yer, ''))
    where id = p_bulusma;
  -- Gün ya da saat değiştiyse öteki yanıtlar silinir; herkes yeniden yanıtlar.
  if eski.gun <> p_gun or coalesce(eski.saat, '') <> coalesce(nullif(p_saat, ''), '') then
    delete from public.bulusma_yanit where bulusma = p_bulusma and kullanici <> ben;
  end if;
end;
$$;

-- p_yanit null: yanıtı geri al.
create or replace function public.bulusma_yanitla(p_bulusma uuid, p_yanit text)
returns void language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if not public.bulusmaya_erisir_mi(p_bulusma, ben) then raise exception 'yetki yok'; end if;
  if p_yanit is null then
    delete from public.bulusma_yanit where bulusma = p_bulusma and kullanici = ben;
  else
    insert into public.bulusma_yanit (bulusma, kullanici, yanit) values (p_bulusma, ben, p_yanit)
    on conflict (bulusma, kullanici) do update set yanit = excluded.yanit, zaman = now();
  end if;
end;
$$;

-- Üyesi olduğum grupların son 30 günden bu yana buluşmaları, yanıtlarıyla.
create or replace function public.bulusmalarim() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id, 'grup', b.grup, 'grupAdi', g.ad, 'kuran', b.kuran, 'baslik', b.baslik,
    'gun', b.gun, 'saat', b.saat, 'yer', b.yer,
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
  public.bulusma_kur(uuid, text, date, text, text), public.bulusma_duzenle(uuid, text, date, text, text),
  public.bulusma_yanitla(uuid, text), public.bulusmalarim(), public.bulusmaya_erisir_mi(uuid, uuid)
  from anon, public;
grant execute on function
  public.bulusma_kur(uuid, text, date, text, text), public.bulusma_duzenle(uuid, text, date, text, text),
  public.bulusma_yanitla(uuid, text), public.bulusmalarim(), public.bulusmaya_erisir_mi(uuid, uuid)
  to authenticated;

-- ---- Birlikte rutin (pilot 18 Ekim) ------------------------------------------------
-- "Haftada 3 yürüyüş" gibi ortak hedef. Katılan, kendi günlerini telefonda seçer
-- (ajandasında tekrarlı kart); "Yaptım" dediği günler buraya yazılır. Sunucu yalnız
-- kimin hangi gün yaptığını bilir; kartın içi (not, ölçüm) telefonda kalır.

create table if not exists public.rutin (
  id        uuid primary key default gen_random_uuid(),
  grup      uuid not null references public.grup (id) on delete cascade,
  kuran     uuid not null references public.kullanici (id) on delete cascade,
  ad        text not null check (length(trim(ad)) > 0),
  hedef     int  not null check (hedef between 1 and 7),
  olusturma timestamptz not null default now()
);
create index if not exists rutin_grup on public.rutin (grup);

create table if not exists public.rutin_katilim (
  rutin     uuid not null references public.rutin (id) on delete cascade,
  kullanici uuid not null references public.kullanici (id) on delete cascade,
  katilma   timestamptz not null default now(),
  primary key (rutin, kullanici)
);

create table if not exists public.rutin_kayit (
  rutin     uuid not null references public.rutin (id) on delete cascade,
  kullanici uuid not null references public.kullanici (id) on delete cascade,
  gun       date not null,
  primary key (rutin, kullanici, gun)
);

alter table public.rutin         enable row level security;
alter table public.rutin_katilim enable row level security;
alter table public.rutin_kayit   enable row level security;

create or replace function public.rutine_erisir_mi(r uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.rutin x
    join public.grup_uye gu on gu.grup = x.grup and gu.kullanici = u and gu.durum = 'uye'
    where x.id = r
  );
$$;

drop policy if exists rutin_oku on public.rutin;
create policy rutin_oku on public.rutin for select to authenticated
  using (public.grup_uyesi_mi(grup, auth.uid()));

drop policy if exists rutin_sil on public.rutin;
create policy rutin_sil on public.rutin for delete to authenticated
  using (kuran = auth.uid() or public.grup_kurucusu_mu(grup, auth.uid()));

drop policy if exists rutin_katilim_oku on public.rutin_katilim;
create policy rutin_katilim_oku on public.rutin_katilim for select to authenticated
  using (public.rutine_erisir_mi(rutin, auth.uid()));

drop policy if exists rutin_kayit_oku on public.rutin_kayit;
create policy rutin_kayit_oku on public.rutin_kayit for select to authenticated
  using (public.rutine_erisir_mi(rutin, auth.uid()));

revoke insert, update on public.rutin from anon, authenticated;
revoke insert, update, delete on public.rutin_katilim, public.rutin_kayit from anon, authenticated;
revoke all on public.rutin, public.rutin_katilim, public.rutin_kayit from anon;

-- Kuran katılmış sayılır.
create or replace function public.rutin_kur(p_grup uuid, p_ad text, p_hedef int) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  r uuid;
begin
  if not public.grup_uyesi_mi(p_grup, ben) then raise exception 'grup yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  insert into public.rutin (grup, kuran, ad, hedef) values (p_grup, ben, trim(p_ad), p_hedef) returning id into r;
  insert into public.rutin_katilim (rutin, kullanici) values (r, ben);
  return r;
end;
$$;

create or replace function public.rutin_duzenle(p_rutin uuid, p_ad text, p_hedef int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.rutin where id = p_rutin and kuran = auth.uid()) then raise exception 'yetki yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  update public.rutin set ad = trim(p_ad), hedef = p_hedef where id = p_rutin;
end;
$$;

-- Katıl (p_katil) ya da ayrıl; ayrılınca o kişinin kayıtları da silinir.
create or replace function public.rutine_katil(p_rutin uuid, p_katil boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if not public.rutine_erisir_mi(p_rutin, ben) then raise exception 'yetki yok'; end if;
  if p_katil then
    insert into public.rutin_katilim (rutin, kullanici) values (p_rutin, ben) on conflict do nothing;
  else
    delete from public.rutin_kayit where rutin = p_rutin and kullanici = ben;
    delete from public.rutin_katilim where rutin = p_rutin and kullanici = ben;
  end if;
end;
$$;

-- "Yaptım" ya da geri al; yalnız katılan, kendi adına.
create or replace function public.rutin_isaretle(p_rutin uuid, p_gun date, p_yapildi boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if not exists (select 1 from public.rutin_katilim where rutin = p_rutin and kullanici = ben)
     or not public.rutine_erisir_mi(p_rutin, ben) then
    raise exception 'katilmadin';
  end if;
  if p_yapildi then
    insert into public.rutin_kayit (rutin, kullanici, gun) values (p_rutin, ben, p_gun) on conflict do nothing;
  else
    delete from public.rutin_kayit where rutin = p_rutin and kullanici = ben and gun = p_gun;
  end if;
end;
$$;

-- Üyesi olduğum grupların rutinleri: katılanlar ve p_ilk'ten bu yana yaptıkları günler.
create or replace function public.rutinlerim(p_ilk date) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'grup', r.grup, 'grupAdi', g.ad, 'kuran', r.kuran, 'ad', r.ad, 'hedef', r.hedef,
    'katilanlar', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'kullanici', k.kullanici,
        'gunler', (
          select coalesce(jsonb_agg(x.gun order by x.gun), '[]'::jsonb)
          from public.rutin_kayit x where x.rutin = r.id and x.kullanici = k.kullanici and x.gun >= p_ilk
        )
      ) order by k.katilma), '[]'::jsonb)
      from public.rutin_katilim k where k.rutin = r.id
    )
  ) order by r.olusturma), '[]'::jsonb)
  from public.rutin r
  join public.grup g on g.id = r.grup
  join public.grup_uye me on me.grup = r.grup and me.kullanici = auth.uid() and me.durum = 'uye';
$$;

revoke execute on function
  public.rutin_kur(uuid, text, int), public.rutin_duzenle(uuid, text, int), public.rutine_katil(uuid, boolean),
  public.rutin_isaretle(uuid, date, boolean), public.rutinlerim(date), public.rutine_erisir_mi(uuid, uuid)
  from anon, public;
grant execute on function
  public.rutin_kur(uuid, text, int), public.rutin_duzenle(uuid, text, int), public.rutine_katil(uuid, boolean),
  public.rutin_isaretle(uuid, date, boolean), public.rutinlerim(date), public.rutine_erisir_mi(uuid, uuid)
  to authenticated;

-- ---- Nöbet / sıra (pilot 18 Ekim) --------------------------------------------------
-- Bulaşık, çöp gibi dönüşümlü iş. Kuran günleri (0 = Pzt … 6 = Paz) ve sırayı
-- (gruptan kişiler) seçer; her seçilen günde sıradaki kişi. Sıra takvime göre
-- döner (yapılmasa da geçer); kimin günü olduğunu telefon hesaplar (`baslangic`tan
-- bu yana kaçıncı gün). "Yaptım" grupta görünür.

create table if not exists public.nobet (
  id        uuid primary key default gen_random_uuid(),
  grup      uuid not null references public.grup (id) on delete cascade,
  kuran     uuid not null references public.kullanici (id) on delete cascade,
  ad        text not null check (length(trim(ad)) > 0),
  gunler    int[] not null check (cardinality(gunler) between 1 and 7 and gunler <@ array[0,1,2,3,4,5,6]),
  sira      uuid[] not null check (cardinality(sira) between 1 and 20),
  baslangic date not null,
  olusturma timestamptz not null default now()
);
create index if not exists nobet_grup on public.nobet (grup);

create table if not exists public.nobet_kayit (
  nobet uuid not null references public.nobet (id) on delete cascade,
  gun   date not null,
  yapan uuid not null references public.kullanici (id) on delete cascade,
  zaman timestamptz not null default now(),
  primary key (nobet, gun)
);

alter table public.nobet       enable row level security;
alter table public.nobet_kayit enable row level security;

create or replace function public.nobete_erisir_mi(n uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.nobet x
    join public.grup_uye gu on gu.grup = x.grup and gu.kullanici = u and gu.durum = 'uye'
    where x.id = n
  );
$$;

drop policy if exists nobet_oku on public.nobet;
create policy nobet_oku on public.nobet for select to authenticated
  using (public.grup_uyesi_mi(grup, auth.uid()));

drop policy if exists nobet_sil on public.nobet;
create policy nobet_sil on public.nobet for delete to authenticated
  using (kuran = auth.uid() or public.grup_kurucusu_mu(grup, auth.uid()));

drop policy if exists nobet_kayit_oku on public.nobet_kayit;
create policy nobet_kayit_oku on public.nobet_kayit for select to authenticated
  using (public.nobete_erisir_mi(nobet, auth.uid()));

revoke insert, update on public.nobet from anon, authenticated;
revoke insert, update, delete on public.nobet_kayit from anon, authenticated;
revoke all on public.nobet, public.nobet_kayit from anon;

-- Sıradaki herkes grubun üyesi olmalı.
create or replace function public.nobet_sirasi_gecerli(p_grup uuid, p_sira uuid[]) returns boolean
language sql stable security definer set search_path = public as $$
  select cardinality(p_sira) > 0 and not exists (
    select 1 from unnest(p_sira) u where not public.grup_uyesi_mi(p_grup, u)
  );
$$;

create or replace function public.nobet_kur(p_grup uuid, p_ad text, p_gunler int[], p_sira uuid[], p_baslangic date)
returns uuid language plpgsql security definer set search_path = public as $$
declare n uuid;
begin
  if not public.grup_uyesi_mi(p_grup, auth.uid()) then raise exception 'grup yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  if not public.nobet_sirasi_gecerli(p_grup, p_sira) then raise exception 'sira gecersiz'; end if;
  insert into public.nobet (grup, kuran, ad, gunler, sira, baslangic)
    values (p_grup, auth.uid(), trim(p_ad), p_gunler, p_sira, p_baslangic) returning id into n;
  return n;
end;
$$;

-- Günler ya da sıra değişince sıra p_baslangic'tan (bugün) yeniden başlar.
create or replace function public.nobet_duzenle(p_nobet uuid, p_ad text, p_gunler int[], p_sira uuid[], p_baslangic date)
returns void language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  select grup into g from public.nobet where id = p_nobet and kuran = auth.uid();
  if g is null then raise exception 'yetki yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  if not public.nobet_sirasi_gecerli(g, p_sira) then raise exception 'sira gecersiz'; end if;
  update public.nobet set ad = trim(p_ad), gunler = p_gunler, sira = p_sira, baslangic = p_baslangic where id = p_nobet;
end;
$$;

-- "Yaptım" (grubun herhangi bir üyesi; o günün işini kim yaptıysa) ya da geri al (yalnız kendi işaretini).
create or replace function public.nobet_isaretle(p_nobet uuid, p_gun date, p_yapildi boolean)
returns void language plpgsql security definer set search_path = public as $$
declare ben uuid := auth.uid();
begin
  if not public.nobete_erisir_mi(p_nobet, ben) then raise exception 'yetki yok'; end if;
  if p_yapildi then
    insert into public.nobet_kayit (nobet, gun, yapan) values (p_nobet, p_gun, ben)
    on conflict (nobet, gun) do nothing;
  else
    delete from public.nobet_kayit where nobet = p_nobet and gun = p_gun and yapan = ben;
  end if;
end;
$$;

create or replace function public.nobetlerim(p_ilk date) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'grup', n.grup, 'grupAdi', g.ad, 'kuran', n.kuran, 'ad', n.ad,
    'gunler', to_jsonb(n.gunler), 'sira', to_jsonb(n.sira), 'baslangic', n.baslangic,
    'kayitlar', (
      select coalesce(jsonb_agg(jsonb_build_object('gun', k.gun, 'yapan', k.yapan) order by k.gun), '[]'::jsonb)
      from public.nobet_kayit k where k.nobet = n.id and k.gun >= p_ilk
    )
  ) order by n.olusturma), '[]'::jsonb)
  from public.nobet n
  join public.grup g on g.id = n.grup
  join public.grup_uye me on me.grup = n.grup and me.kullanici = auth.uid() and me.durum = 'uye';
$$;

revoke execute on function
  public.nobet_kur(uuid, text, int[], uuid[], date), public.nobet_duzenle(uuid, text, int[], uuid[], date),
  public.nobet_isaretle(uuid, date, boolean), public.nobetlerim(date), public.nobete_erisir_mi(uuid, uuid),
  public.nobet_sirasi_gecerli(uuid, uuid[])
  from anon, public;
grant execute on function
  public.nobet_kur(uuid, text, int[], uuid[], date), public.nobet_duzenle(uuid, text, int[], uuid[], date),
  public.nobet_isaretle(uuid, date, boolean), public.nobetlerim(date), public.nobete_erisir_mi(uuid, uuid),
  public.nobet_sirasi_gecerli(uuid, uuid[])
  to authenticated;

-- ---- İş (pilot 18 Ekim): Ortak iş + Birinden iste ------------------------------------
-- kime null: herkese açık (acik → "Ben alırım" → alindi). kime dolu: o kişiden
-- istendi (istendi → Kabul → alindi; Reddet → reddedildi, isteyene döner).
-- Alan "Yaptım" deyince yapildi; yapılanlar 7 gün görünür. Alan bırakırsa iş
-- herkese açıksa yeniden açılır, birinden istenmişse isteyene döner.

create table if not exists public.grup_is (
  id        uuid primary key default gen_random_uuid(),
  grup      uuid not null references public.grup (id) on delete cascade,
  isteyen   uuid not null references public.kullanici (id) on delete cascade,
  baslik    text not null check (length(trim(baslik)) > 0),
  tarih     date,
  kime      uuid references public.kullanici (id) on delete set null,
  durum     text not null check (durum in ('acik', 'istendi', 'alindi', 'reddedildi', 'yapildi')),
  alan      uuid references public.kullanici (id) on delete set null,
  yapilma   timestamptz,
  olusturma timestamptz not null default now()
);
create index if not exists grup_is_grup on public.grup_is (grup);

alter table public.grup_is enable row level security;

drop policy if exists grup_is_oku on public.grup_is;
create policy grup_is_oku on public.grup_is for select to authenticated
  using (public.grup_uyesi_mi(grup, auth.uid()));

drop policy if exists grup_is_sil on public.grup_is;
create policy grup_is_sil on public.grup_is for delete to authenticated
  using (isteyen = auth.uid() or public.grup_kurucusu_mu(grup, auth.uid()));

revoke insert, update on public.grup_is from anon, authenticated;
revoke all on public.grup_is from anon;

create or replace function public.is_ekle(p_grup uuid, p_baslik text, p_tarih date, p_kime uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  i uuid;
begin
  if not public.grup_uyesi_mi(p_grup, ben) then raise exception 'grup yok'; end if;
  if length(trim(coalesce(p_baslik, ''))) = 0 then raise exception 'ad yok'; end if;
  if p_kime is not null and (p_kime = ben or not public.grup_uyesi_mi(p_grup, p_kime)) then raise exception 'kime gecersiz'; end if;
  insert into public.grup_is (grup, isteyen, baslik, tarih, kime, durum)
    values (p_grup, ben, trim(p_baslik), p_tarih, p_kime, case when p_kime is null then 'acik' else 'istendi' end)
    returning id into i;
  return i;
end;
$$;

-- İsteyen değiştirir (yapılmamışsa); kime değişirse iş yeniden açılır / istenir.
create or replace function public.is_duzenle(p_is uuid, p_baslik text, p_tarih date, p_kime uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  x public.grup_is;
begin
  select * into x from public.grup_is where id = p_is;
  if not found or x.isteyen <> ben then raise exception 'yetki yok'; end if;
  if x.durum = 'yapildi' then raise exception 'yapildi'; end if;
  if length(trim(coalesce(p_baslik, ''))) = 0 then raise exception 'ad yok'; end if;
  if p_kime is not null and (p_kime = ben or not public.grup_uyesi_mi(x.grup, p_kime)) then raise exception 'kime gecersiz'; end if;
  if x.kime is distinct from p_kime or x.durum = 'reddedildi' then
    update public.grup_is set baslik = trim(p_baslik), tarih = p_tarih, kime = p_kime, alan = null,
      durum = case when p_kime is null then 'acik' else 'istendi' end
    where id = p_is;
  else
    update public.grup_is set baslik = trim(p_baslik), tarih = p_tarih where id = p_is;
  end if;
end;
$$;

-- p_eylem: al (Ben alırım / Kabul et) · reddet · birak · yaptim · geri (yapıldıyı geri al)
create or replace function public.is_yanitla(p_is uuid, p_eylem text) returns void
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  x public.grup_is;
begin
  select * into x from public.grup_is where id = p_is;
  if not found or not public.grup_uyesi_mi(x.grup, ben) then raise exception 'yetki yok'; end if;
  if p_eylem = 'al' then
    if not (x.durum = 'acik' or (x.durum = 'istendi' and x.kime = ben)) then raise exception 'durum'; end if;
    update public.grup_is set durum = 'alindi', alan = ben where id = p_is;
  elsif p_eylem = 'reddet' then
    if not (x.durum = 'istendi' and x.kime = ben) then raise exception 'durum'; end if;
    update public.grup_is set durum = 'reddedildi' where id = p_is;
  elsif p_eylem = 'birak' then
    if not (x.durum = 'alindi' and x.alan = ben) then raise exception 'durum'; end if;
    update public.grup_is set alan = null, durum = case when x.kime is null then 'acik' else 'reddedildi' end where id = p_is;
  elsif p_eylem = 'yaptim' then
    if not (x.durum = 'alindi' and x.alan = ben) then raise exception 'durum'; end if;
    update public.grup_is set durum = 'yapildi', yapilma = now() where id = p_is;
  elsif p_eylem = 'geri' then
    if not (x.durum = 'yapildi' and x.alan = ben) then raise exception 'durum'; end if;
    update public.grup_is set durum = 'alindi', yapilma = null where id = p_is;
  else
    raise exception 'eylem';
  end if;
end;
$$;

-- Üyesi olduğum grupların işleri; yapılanlar 7 gün.
create or replace function public.islerim() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id, 'grup', i.grup, 'grupAdi', g.ad, 'isteyen', i.isteyen, 'baslik', i.baslik, 'tarih', i.tarih,
    'kime', i.kime, 'durum', i.durum, 'alan', i.alan, 'yapilma', i.yapilma
  ) order by i.tarih nulls last, i.olusturma), '[]'::jsonb)
  from public.grup_is i
  join public.grup g on g.id = i.grup
  join public.grup_uye me on me.grup = i.grup and me.kullanici = auth.uid() and me.durum = 'uye'
  where i.durum <> 'yapildi' or i.yapilma > now() - interval '7 days';
$$;

revoke execute on function
  public.is_ekle(uuid, text, date, uuid), public.is_duzenle(uuid, text, date, uuid), public.is_yanitla(uuid, text),
  public.islerim()
  from anon, public;
grant execute on function
  public.is_ekle(uuid, text, date, uuid), public.is_duzenle(uuid, text, date, uuid), public.is_yanitla(uuid, text),
  public.islerim()
  to authenticated;

-- ---- Karar / oylama (pilot 18 Ekim) -------------------------------------------------
-- Grubun üyesi bir soru ve seçenekler (metin ya da gün) önerir; herkes oy verir
-- (kuran tek ya da birden çok seçimi belirler). Kuran "Karar ver" der; gün
-- oylamasında seçilen güne Buluşma kurulur. İsteğe bağlı son günden sonra oy verilmez.

create table if not exists public.karar (
  id        uuid primary key default gen_random_uuid(),
  grup      uuid not null references public.grup (id) on delete cascade,
  kuran     uuid not null references public.kullanici (id) on delete cascade,
  soru      text not null check (length(trim(soru)) > 0),
  tur       text not null check (tur in ('metin', 'gun')),
  coklu     boolean not null default false,
  son_gun   date,
  yer       text not null default '',
  sonuc     uuid,
  bulusma   uuid references public.bulusma (id) on delete set null,
  olusturma timestamptz not null default now(),
  karar_zamani timestamptz
);
create index if not exists karar_grup on public.karar (grup);

create table if not exists public.karar_secenek (
  id    uuid primary key default gen_random_uuid(),
  karar uuid not null references public.karar (id) on delete cascade,
  metin text not null default '',
  gun   date,
  saat  text check (saat is null or saat ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  sira  int not null
);
create index if not exists karar_secenek_karar on public.karar_secenek (karar);

create table if not exists public.karar_oy (
  karar     uuid not null references public.karar (id) on delete cascade,
  secenek   uuid not null references public.karar_secenek (id) on delete cascade,
  kullanici uuid not null references public.kullanici (id) on delete cascade,
  primary key (secenek, kullanici)
);

alter table public.karar         enable row level security;
alter table public.karar_secenek enable row level security;
alter table public.karar_oy      enable row level security;

create or replace function public.karara_erisir_mi(k uuid, u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.karar x
    join public.grup_uye gu on gu.grup = x.grup and gu.kullanici = u and gu.durum = 'uye'
    where x.id = k
  );
$$;

drop policy if exists karar_oku on public.karar;
create policy karar_oku on public.karar for select to authenticated
  using (public.grup_uyesi_mi(grup, auth.uid()));
drop policy if exists karar_sil on public.karar;
create policy karar_sil on public.karar for delete to authenticated
  using (kuran = auth.uid() or public.grup_kurucusu_mu(grup, auth.uid()));
drop policy if exists karar_secenek_oku on public.karar_secenek;
create policy karar_secenek_oku on public.karar_secenek for select to authenticated
  using (public.karara_erisir_mi(karar, auth.uid()));
drop policy if exists karar_oy_oku on public.karar_oy;
create policy karar_oy_oku on public.karar_oy for select to authenticated
  using (public.karara_erisir_mi(karar, auth.uid()));

revoke insert, update on public.karar from anon, authenticated;
revoke insert, update, delete on public.karar_secenek, public.karar_oy from anon, authenticated;
revoke all on public.karar, public.karar_secenek, public.karar_oy from anon;

-- p_secenekler: [{"metin": "...", "gun": "2099-01-10" | null, "saat": "19:00" | null}], 2–10 tane.
create or replace function public.karar_kur(
  p_grup uuid, p_soru text, p_tur text, p_coklu boolean, p_son_gun date, p_yer text, p_secenekler jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  k uuid;
  s jsonb;
  i int := 0;
begin
  if not public.grup_uyesi_mi(p_grup, auth.uid()) then raise exception 'grup yok'; end if;
  if length(trim(coalesce(p_soru, ''))) = 0 then raise exception 'ad yok'; end if;
  if jsonb_array_length(coalesce(p_secenekler, '[]')) not between 2 and 10 then raise exception 'secenek sayisi'; end if;
  insert into public.karar (grup, kuran, soru, tur, coklu, son_gun, yer)
    values (p_grup, auth.uid(), trim(p_soru), p_tur, coalesce(p_coklu, false), p_son_gun, trim(coalesce(p_yer, '')))
    returning id into k;
  for s in select * from jsonb_array_elements(p_secenekler) loop
    if p_tur = 'gun' and nullif(s->>'gun', '') is null then raise exception 'gun yok'; end if;
    if p_tur = 'metin' and length(trim(coalesce(s->>'metin', ''))) = 0 then raise exception 'secenek bos'; end if;
    insert into public.karar_secenek (karar, metin, gun, saat, sira)
      values (k, trim(coalesce(s->>'metin', '')), nullif(s->>'gun', '')::date, nullif(s->>'saat', ''), i);
    i := i + 1;
  end loop;
  return k;
end;
$$;

-- Oylarımı yazar (öncekilerin yerine). Boş dizi: oyumu geri al.
create or replace function public.karar_oyla(p_karar uuid, p_secenekler uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  x public.karar;
begin
  select * into x from public.karar where id = p_karar;
  if not found or not public.karara_erisir_mi(p_karar, ben) then raise exception 'yetki yok'; end if;
  if x.sonuc is not null or (x.son_gun is not null and x.son_gun < current_date) then raise exception 'kapali'; end if;
  if not x.coklu and cardinality(coalesce(p_secenekler, '{}')) > 1 then raise exception 'tek secim'; end if;
  if exists (select 1 from unnest(coalesce(p_secenekler, '{}')) s
             where not exists (select 1 from public.karar_secenek ks where ks.id = s and ks.karar = p_karar)) then
    raise exception 'secenek yok';
  end if;
  delete from public.karar_oy where karar = p_karar and kullanici = ben;
  insert into public.karar_oy (karar, secenek, kullanici)
    select p_karar, s, ben from unnest(coalesce(p_secenekler, '{}')) s on conflict do nothing;
end;
$$;

-- Kuran karar verir; gün oylamasında seçilen güne buluşma kurulur (kuran geliyor sayılır). Döner: buluşma kimliği ya da null.
create or replace function public.karar_ver(p_karar uuid, p_secenek uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  x public.karar;
  s public.karar_secenek;
  b uuid;
begin
  select * into x from public.karar where id = p_karar;
  if not found or x.kuran <> ben then raise exception 'yetki yok'; end if;
  if x.sonuc is not null then raise exception 'kapali'; end if;
  select * into s from public.karar_secenek where id = p_secenek and karar = p_karar;
  if not found then raise exception 'secenek yok'; end if;
  if x.tur = 'gun' then
    insert into public.bulusma (grup, kuran, baslik, gun, saat, yer)
      values (x.grup, ben, x.soru, s.gun, s.saat, x.yer) returning id into b;
    insert into public.bulusma_yanit (bulusma, kullanici, yanit) values (b, ben, 'geliyorum');
  end if;
  update public.karar set sonuc = p_secenek, bulusma = b, karar_zamani = now() where id = p_karar;
  return b;
end;
$$;

-- Üyesi olduğum grupların kararları: açıklar ve son 7 günde verilenler.
create or replace function public.kararlarim() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', k.id, 'grup', k.grup, 'grupAdi', g.ad, 'kuran', k.kuran, 'soru', k.soru, 'tur', k.tur,
    'coklu', k.coklu, 'sonGun', k.son_gun, 'yer', k.yer, 'sonuc', k.sonuc, 'bulusma', k.bulusma,
    'secenekler', (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'metin', s.metin, 'gun', s.gun, 'saat', s.saat) order by s.sira), '[]'::jsonb)
      from public.karar_secenek s where s.karar = k.id
    ),
    'oylar', (
      select coalesce(jsonb_agg(jsonb_build_object('secenek', o.secenek, 'kullanici', o.kullanici)), '[]'::jsonb)
      from public.karar_oy o where o.karar = k.id
    )
  ) order by k.olusturma), '[]'::jsonb)
  from public.karar k
  join public.grup g on g.id = k.grup
  join public.grup_uye me on me.grup = k.grup and me.kullanici = auth.uid() and me.durum = 'uye'
  where k.sonuc is null or k.karar_zamani > now() - interval '7 days';
$$;

revoke execute on function
  public.karar_kur(uuid, text, text, boolean, date, text, jsonb), public.karar_oyla(uuid, uuid[]),
  public.karar_ver(uuid, uuid), public.kararlarim(), public.karara_erisir_mi(uuid, uuid)
  from anon, public;
grant execute on function
  public.karar_kur(uuid, text, text, boolean, date, text, jsonb), public.karar_oyla(uuid, uuid[]),
  public.karar_ver(uuid, uuid), public.kararlarim(), public.karara_erisir_mi(uuid, uuid)
  to authenticated;

-- ---- Anında güncelleme (pilot 19 Ekim) ----------------------------------------------
-- Grup etkinliklerindeki, Gelenler'deki ve kişilerdeki değişiklik öteki telefonlara
-- anında gitsin (Supabase Realtime). Telefon yalnız "değişti" haberini alır ve
-- kendi yetkisiyle yeniden okur.
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then return; end if;
  foreach t in array array[
    'grup', 'grup_uye', 'liste_erisim', 'gelen', 'baglanti',
    'bulusma', 'bulusma_yanit', 'grup_is', 'karar', 'karar_oy',
    'rutin', 'rutin_katilim', 'rutin_kayit', 'nobet', 'nobet_kayit'
  ] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---- Telefona bildirim (pilot 19 Ekim) -----------------------------------------------
-- Gelenler'e bir şey düşünce (kart, kişi isteği, grup daveti, iş, buluşma, oylama,
-- rutin, nöbet) ve kuranın işi kabul edilince / tamamlanınca alıcının telefonuna
-- bildirim gider. Telefon Expo bildirim adresini (jeton) buraya yazar; Gelenler
-- kutusundaki zil ile açılıp kapatılır. Gönderim `pg_net` ile Expo'nun bildirim
-- servisine yapılır (exp.host); `pg_net` yoksa sessizce gönderilmez.

do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net kurulamadı (yerel deneme?): %', sqlerrm;
end $$;

create table if not exists public.bildirim_adresi (
  jeton      text primary key,
  kullanici  uuid not null references public.kullanici (id) on delete cascade,
  acik       boolean not null default true,
  guncelleme timestamptz not null default now()
);
create index if not exists bildirim_adresi_kullanici on public.bildirim_adresi (kullanici);
alter table public.bildirim_adresi enable row level security;

drop policy if exists bildirim_adresi_oku on public.bildirim_adresi;
create policy bildirim_adresi_oku on public.bildirim_adresi for select to authenticated
  using (kullanici = auth.uid());
drop policy if exists bildirim_adresi_sil on public.bildirim_adresi;
create policy bildirim_adresi_sil on public.bildirim_adresi for delete to authenticated
  using (kullanici = auth.uid());
revoke insert, update on public.bildirim_adresi from anon, authenticated;
revoke all on public.bildirim_adresi from anon;

-- Bu telefonun jetonu bu kullanıcıya yazılır (aynı telefonda başka kullanıcı girdiyse ona geçer).
create or replace function public.bildirim_adresi_yaz(p_jeton text, p_acik boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'oturum yok'; end if;
  if length(coalesce(p_jeton, '')) < 10 then raise exception 'jeton'; end if;
  insert into public.bildirim_adresi (jeton, kullanici, acik, guncelleme)
    values (p_jeton, auth.uid(), coalesce(p_acik, true), now())
  on conflict (jeton) do update set kullanici = excluded.kullanici, acik = excluded.acik, guncelleme = now();
end;
$$;

create or replace function public.kisi_adi(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(ad), ''), split_part(eposta, '@', 1), 'Biri') from public.kullanici where id = u;
$$;

create or replace function public.grubun_uyeleri(g uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(kullanici), '{}') from public.grup_uye where grup = g and durum = 'uye';
$$;

create or replace function public.kisa_tarih(g date) returns text
language sql immutable as $$
  select extract(day from g)::int || ' ' ||
    (array['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'])[extract(month from g)::int];
$$;

-- Alıcıların açık jetonlarına tek istekte gönderir (en çok 100 ileti).
create or replace function public.bildirim_gonder(p_alicilar uuid[], p_baslik text, p_govde text, p_veri jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  iletiler jsonb;
begin
  select jsonb_agg(jsonb_build_object(
           'to', b.jeton, 'title', p_baslik, 'body', p_govde, 'sound', 'default',
           'data', coalesce(p_veri, '{}'::jsonb) || jsonb_build_object('tur', 'gelen')))
    into iletiler
  from (select jeton from public.bildirim_adresi
        where acik and kullanici = any (coalesce(p_alicilar, '{}')) limit 100) b;
  if iletiler is null then return; end if;
  if to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then return; end if;
  execute 'select net.http_post(url := $1, body := $2, headers := $3)'
    using 'https://exp.host/--/api/v2/push/send', iletiler,
          '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb;
exception when others then
  -- Bildirim gönderilemese de asıl yazma (kart, iş…) bozulmasın.
  raise warning 'bildirim gönderilemedi: %', sqlerrm;
end;
$$;

create or replace function public.bildirim_tetik() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  g text;
  herkes uuid[];
begin
  if tg_table_name = 'gelen' then
    perform public.bildirim_gonder(array[new.kime], public.kisi_adi(new.kimden),
      'Sana bir kart gönderdi: ' || coalesce(new.kart->>'baslik', ''), '{}');

  elsif tg_table_name = 'baglanti' then
    if tg_op = 'INSERT' and new.durum = 'istek' then
      perform public.bildirim_gonder(array[case when new.isteyen = new.a then new.b else new.a end], 'Rites',
        public.kisi_adi(new.isteyen) || ' seni kişilerine eklemek istiyor', '{}');
    elsif tg_op = 'UPDATE' and old.durum = 'istek' and new.durum = 'bagli' then
      perform public.bildirim_gonder(array[new.isteyen], 'Rites',
        public.kisi_adi(case when new.isteyen = new.a then new.b else new.a end) || ' isteğini kabul etti', '{}');
    end if;

  elsif tg_table_name = 'grup_uye' then
    if new.durum = 'davet' then
      select ad into g from public.grup where id = new.grup;
      perform public.bildirim_gonder(array[new.kullanici], 'Rites',
        public.kisi_adi((select kurucu from public.grup where id = new.grup)) || ' seni "' || g || '" grubuna çağırdı', '{}');
    end if;

  elsif tg_table_name = 'grup_is' then
    select ad into g from public.grup where id = new.grup;
    if tg_op = 'INSERT' or old.durum is distinct from new.durum then
      if new.durum = 'istendi' then
        perform public.bildirim_gonder(array[new.kime], g, public.kisi_adi(new.isteyen) || ' senden istiyor: ' || new.baslik, '{}');
      elsif new.durum = 'acik' and tg_op = 'INSERT' then
        perform public.bildirim_gonder(array_remove(public.grubun_uyeleri(new.grup), new.isteyen), g, 'Yeni iş: ' || new.baslik, '{}');
      elsif new.durum = 'alindi' and new.alan is distinct from new.isteyen and old.durum <> 'yapildi' then
        perform public.bildirim_gonder(array[new.isteyen], g, public.kisi_adi(new.alan) ||
          case when new.kime is not null then ' kabul etti: ' else ' üstlendi: ' end || new.baslik, '{}');
      elsif new.durum = 'reddedildi' and old.durum = 'istendi' then
        perform public.bildirim_gonder(array[new.isteyen], g, public.kisi_adi(new.kime) || ' kabul etmedi: ' || new.baslik, '{}');
      elsif new.durum = 'yapildi' and new.alan is distinct from new.isteyen then
        perform public.bildirim_gonder(array[new.isteyen], g, public.kisi_adi(new.alan) || ' tamamladı: ' || new.baslik, '{}');
      end if;
    end if;

  elsif tg_table_name = 'bulusma' then
    select ad into g from public.grup where id = new.grup;
    herkes := array_remove(public.grubun_uyeleri(new.grup), new.kuran);
    if tg_op = 'INSERT' then
      perform public.bildirim_gonder(herkes, g, new.baslik || ' · ' || public.kisa_tarih(new.gun) ||
        coalesce(' ' || new.saat, '') || ' — gelebilir misin?', '{}');
    elsif old.gun is distinct from new.gun or old.saat is distinct from new.saat then
      perform public.bildirim_gonder(herkes, g, new.baslik || ' için zaman değişti: ' || public.kisa_tarih(new.gun) ||
        coalesce(' ' || new.saat, ''), '{}');
    end if;

  elsif tg_table_name = 'karar' then
    select ad into g from public.grup where id = new.grup;
    herkes := array_remove(public.grubun_uyeleri(new.grup), new.kuran);
    if tg_op = 'INSERT' then
      perform public.bildirim_gonder(herkes, g, case when new.tur = 'gun' then new.soru || ': hangi gün? Oy ver'
        else 'Oylama: ' || new.soru end, '{}');
    elsif old.sonuc is null and new.sonuc is not null and new.tur = 'metin' then
      perform public.bildirim_gonder(herkes, g, 'Karar verildi: ' || new.soru || ' → ' ||
        coalesce((select metin from public.karar_secenek where id = new.sonuc), ''), '{}');
    end if;

  elsif tg_table_name = 'rutin' then
    select ad into g from public.grup where id = new.grup;
    perform public.bildirim_gonder(array_remove(public.grubun_uyeleri(new.grup), new.kuran), g,
      'Birlikte rutin: ' || new.ad || case when new.hedef >= 7 then ' (her gün)' else ' (haftada ' || new.hedef || ')' end, '{}');

  elsif tg_table_name = 'nobet' then
    select ad into g from public.grup where id = new.grup;
    perform public.bildirim_gonder(array_remove(new.sira, new.kuran), g, 'Nöbet: ' || new.ad || ' — sıraya eklendin', '{}');
  end if;
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['gelen', 'baglanti', 'grup_uye', 'grup_is', 'bulusma', 'karar', 'rutin', 'nobet'] loop
    execute format('drop trigger if exists bildirim on public.%I', t);
  end loop;
end $$;
create trigger bildirim after insert on public.gelen for each row execute function public.bildirim_tetik();
create trigger bildirim after insert or update on public.baglanti for each row execute function public.bildirim_tetik();
create trigger bildirim after insert on public.grup_uye for each row execute function public.bildirim_tetik();
create trigger bildirim after insert or update on public.grup_is for each row execute function public.bildirim_tetik();
create trigger bildirim after insert or update on public.bulusma for each row execute function public.bildirim_tetik();
create trigger bildirim after insert or update on public.karar for each row execute function public.bildirim_tetik();
create trigger bildirim after insert on public.rutin for each row execute function public.bildirim_tetik();
create trigger bildirim after insert on public.nobet for each row execute function public.bildirim_tetik();

revoke execute on function
  public.bildirim_gonder(uuid[], text, text, jsonb), public.bildirim_tetik(), public.kisi_adi(uuid),
  public.grubun_uyeleri(uuid)
  from anon, authenticated, public;
revoke execute on function public.bildirim_adresi_yaz(text, boolean) from anon, public;
grant execute on function public.bildirim_adresi_yaz(text, boolean) to authenticated;

-- ---- İçerik kataloğu (pilot 20 Ekim) ---------------------------------------------
-- Alanlar, öneri kartları ve öneri programları. Herkes (oturumsuz da) okur; kimse
-- uygulamadan yazamaz: içeriği Supabase panelinden (Table Editor) uzman ya da
-- ürün sahibi düzenler. İlk içerik `sunucu/icerik.sql` ile yüklenir. Yazım
-- kuralları `docs/icerik.md`de. Kişinin hiçbir verisi bu tablolara gitmez.

create table if not exists public.icerik_alan (
  anahtar         text primary key check (anahtar ~ '^[a-z0-9_]+$'),
  ad              text not null,
  aciklama        text not null default '',
  ikon            text,
  varsayilan_acik boolean not null default true,
  sira            integer not null default 0,
  aktif           boolean not null default true,
  guncelleme      timestamptz not null default now()
);

create table if not exists public.icerik_kart (
  id         text primary key,
  alanlar    jsonb not null default '[]',
  baslik     text not null,
  kisa       text not null default '',
  saat       text,
  tekrar     jsonb,
  bloklar    jsonb not null default '[]',
  tur        text,
  sira       integer not null default 0,
  aktif      boolean not null default true,
  guncelleme timestamptz not null default now()
);

create table if not exists public.icerik_program (
  id         text primary key,
  alanlar    jsonb not null default '[]',
  ad         text not null,
  aciklama   text not null default '',
  sure       integer check (sure is null or sure > 0),
  kartlar    jsonb not null default '[]',
  sira       integer not null default 0,
  aktif      boolean not null default true,
  guncelleme timestamptz not null default now()
);

create or replace function public.icerik_guncelleme() returns trigger language plpgsql as $$
begin
  new.guncelleme := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['icerik_alan', 'icerik_kart', 'icerik_program'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists icerik_oku on public.%I', t);
    execute format('create policy icerik_oku on public.%I for select to anon, authenticated using (aktif)', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('drop trigger if exists guncelleme on public.%I', t);
    execute format('create trigger guncelleme before update on public.%I for each row execute function public.icerik_guncelleme()', t);
  end loop;
end $$;
revoke execute on function public.icerik_guncelleme() from anon, authenticated, public;

-- ---- Kart çeşitleri (pilot 24 Ekim, P-41) ---------------------------------------
-- İsimli kart çeşitleri (Öğün listesi, Tartı, Su…): katalogla herkese iner.
-- Yalnız tasarımcılar (tasarimci tablosu; Supabase'den elle eklenir) yazar ve
-- yayında olmayanları görür. Silinmez; "aktif = false" ile yayından kalkar.

create table if not exists public.tasarimci (
  kullanici uuid primary key references auth.users(id) on delete cascade
);
alter table public.tasarimci enable row level security;
revoke all on public.tasarimci from anon, authenticated;

create or replace function public.tasarimci_miyim() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.tasarimci where kullanici = auth.uid());
$$;
revoke execute on function public.tasarimci_miyim() from public, anon;
grant execute on function public.tasarimci_miyim() to authenticated;

create table if not exists public.icerik_cesit (
  id           text primary key,
  alan         text not null,
  ad           text not null,
  ikon         text,
  aciklama     text not null default '',
  baslik       text not null default '',
  baslik_ipucu text not null default '',
  saat         text,
  tekrar       jsonb,
  bloklar      jsonb not null default '[]',
  sira         integer not null default 0,
  aktif        boolean not null default true,
  yazan        uuid default auth.uid(),
  guncelleme   timestamptz not null default now()
);
alter table public.icerik_cesit enable row level security;
drop policy if exists icerik_oku on public.icerik_cesit;
create policy icerik_oku on public.icerik_cesit for select to anon, authenticated using (aktif);
drop policy if exists cesit_tasarim_oku on public.icerik_cesit;
create policy cesit_tasarim_oku on public.icerik_cesit for select to authenticated using (public.tasarimci_miyim());
drop policy if exists cesit_tasarim_ekle on public.icerik_cesit;
create policy cesit_tasarim_ekle on public.icerik_cesit for insert to authenticated with check (public.tasarimci_miyim());
drop policy if exists cesit_tasarim_degistir on public.icerik_cesit;
create policy cesit_tasarim_degistir on public.icerik_cesit for update to authenticated
  using (public.tasarimci_miyim()) with check (public.tasarimci_miyim());
revoke insert, update, delete, truncate on public.icerik_cesit from anon;
revoke delete, truncate on public.icerik_cesit from authenticated;
grant select on public.icerik_cesit to anon, authenticated;
grant insert, update on public.icerik_cesit to authenticated;
-- P-49: tekrarlıda seri sayılsın mı (null: uygulamanın kuralı).
alter table public.icerik_cesit add column if not exists seri boolean;
drop trigger if exists guncelleme on public.icerik_cesit;
create trigger guncelleme before update on public.icerik_cesit for each row execute function public.icerik_guncelleme();
