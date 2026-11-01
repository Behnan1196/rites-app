-- P-86 Listeler: Supabase → SQL Editor'da bir kez çalıştır (EAS güncellemesinden önce).
-- Liste çeşitleri (pilot 1 Kasım, P-86): kartla aynı üç çeşit: yapilacak (Adımlar), gunluk
-- (Günlük kontrol: işaretin günü `yapildi_gun`), not (Bilgi listesi). Alışveriş ve Hazırlık
-- Adımlar olur, miktarlar silinir. Madde metni yerinde düzeltilir.
update public.liste set cesit = 'yapilacak' where cesit not in ('yapilacak', 'gunluk', 'not');
alter table public.liste drop constraint if exists liste_cesit_check;
alter table public.liste add constraint liste_cesit_check check (cesit in ('yapilacak', 'gunluk', 'not'));
update public.madde set miktar = '' where miktar <> '';
alter table public.madde add column if not exists yapildi_gun date;
grant update (metin, yapildi_gun) on public.madde to authenticated;
