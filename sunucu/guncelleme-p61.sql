-- P-61 Liste çeşitleri: Supabase → SQL Editor'da bir kez çalıştır.
alter table public.liste add column if not exists cesit text not null default 'yapilacak'
  check (cesit in ('yapilacak', 'alisveris', 'hazirlik', 'not'));
alter table public.madde add column if not exists miktar text not null default '' check (length(miktar) <= 40);
grant insert (liste, metin, ekleyen, kime, tarih, miktar) on public.madde to authenticated;
grant update (yapildi, kime, tarih, miktar) on public.madde to authenticated;

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

revoke execute on function public.liste_olustur(text, uuid[], uuid[], text), public.liste_duzenle(uuid, text, uuid[], uuid[], text) from anon, public;
grant execute on function public.liste_olustur(text, uuid[], uuid[], text), public.liste_duzenle(uuid, text, uuid[], uuid[], text) to authenticated;
