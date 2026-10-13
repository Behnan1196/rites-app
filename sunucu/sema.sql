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
grant insert (liste, metin, ekleyen, kime, tarih) on public.madde to authenticated;
grant update (yapildi, kime, tarih) on public.madde to authenticated;
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

create or replace function public.liste_olustur(p_ad text, p_gruplar uuid[], p_kisiler uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ben uuid := auth.uid();
  l uuid;
begin
  if ben is null then raise exception 'oturum yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  insert into public.liste (sahip, ad) values (ben, trim(p_ad)) returning id into l;
  perform public.liste_paylasimini_yaz(l, p_gruplar, p_kisiler, '{}');
  return l;
end;
$$;

-- Listeyi düzenle: ad ve paylaşım (yalnız kuran).
create or replace function public.liste_duzenle(p_liste uuid, p_ad text, p_gruplar uuid[], p_kisiler uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare
  eski uuid[];
begin
  if not exists (select 1 from public.liste where id = p_liste and sahip = auth.uid()) then raise exception 'yetki yok'; end if;
  if length(trim(coalesce(p_ad, ''))) = 0 then raise exception 'ad yok'; end if;
  update public.liste set ad = trim(p_ad) where id = p_liste;
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
  public.gruplarim(), public.liste_olustur(text, uuid[], uuid[]), public.liste_duzenle(uuid, text, uuid[], uuid[]),
  public.listelerim(), public.bana_verilenler()
  from anon, public;
grant execute on function
  public.grup_kur(text, uuid[]), public.gruba_cagir(uuid, uuid), public.grup_davetini_yanitla(uuid, boolean),
  public.gruplarim(), public.liste_olustur(text, uuid[], uuid[]), public.liste_duzenle(uuid, text, uuid[], uuid[]),
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
