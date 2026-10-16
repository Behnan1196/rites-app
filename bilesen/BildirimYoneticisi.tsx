// Yerel bildirimlerin yöneticisi (kök düzende bir kez çizilir, görünmez).
// - Anımsatıcılar ya da kartlar değişince, uygulama öne gelince ve gün
//   değişince planı yeniden kurar (en çok 60, yakından uzağa).
// - Bildirimdeki Durdur / Ertele'yi işler; bildirime dokunulunca ilgili ekranı açar.
// - Alarmlı anımsatıcılar (iOS 26) telefonun alarmı olarak kurulur; izin yoksa ya da
//   telefon desteklemiyorsa bildirimle gelir. Alarmdaki Durdur / Ertele Rites'ı
//   açar ve burada işlenir.

import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import {
  ALARM_ERTELEME,
  alarmiEslestir,
  alarmPlani,
  erteleGecerliMi,
  kartAlarminiEslestir,
  kartAlarmPlani,
} from '@/mantik/alarm';
import { bildirimPlani, erteleSaati, saatMetni } from '@/mantik/animsatici';
import { bugun } from '@/mantik/tarih';
import {
  alarmiSustur,
  alarmIzni,
  alarmPlaniniUygula,
  basislariDinle,
  basislariTemizle,
  bekleyenBasislar,
} from '@/veri/alarmlar';
import { animsaticilariOku, durdur, eskiGunleriSil, ertele, gunDurumlari } from '@/veri/animsaticilar';
import {
  BILDIRIME_DOKUNULDU,
  bildirimleriKur,
  DURDUR,
  ERTELE,
  planiUygula,
  yanitlariDinle,
  type BildirimYaniti,
} from '@/veri/bildirimler';
import type { Okuyucu } from '@/veri/kapi';
import { gunYapilanlari, tumKartlar } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from './KisaMesaj';

function simdiSaat(): string {
  const d = new Date();
  return saatMetni(d.getHours() * 60 + d.getMinutes());
}

async function planlariHesapla(oku: Okuyucu, bugunGun: string) {
  const animsaticilar = await animsaticilariOku(oku);
  const durumlar = await gunDurumlari(oku, bugunGun);
  const simdi = simdiSaat();
  const kartlar = await tumKartlar(oku);
  const bugunYapilanlar = await gunYapilanlari(oku, bugunGun);
  const alarmVar = (await alarmIzni()) === 'var';
  return {
    bildirimler: bildirimPlani({
      animsaticilar,
      gunDurumlari: durumlar,
      kartlar,
      bugunYapilanlar,
      bugunGun,
      simdi,
      alarmlaCalanlar: alarmVar
        ? new Set([
            ...animsaticilar.filter((a) => a.alarm).map((a) => a.id),
            ...kartlar.filter((k) => k.alarm).map((k) => k.id),
          ])
        : undefined,
    }),
    alarmlar: [
      ...alarmPlani(animsaticilar, durumlar, bugunGun, simdi),
      ...kartAlarmPlani(kartlar, bugunYapilanlar, bugunGun, simdi),
    ],
    alarmVar,
  };
}

async function planlariUygula(p: Awaited<ReturnType<typeof planlariHesapla>>) {
  await planiUygula(p.bildirimler);
  await alarmPlaniniUygula(p.alarmlar, p.alarmVar);
}

export function BildirimYoneticisi() {
  const { kapi, oku, yayin } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();

  // Yeniden planlama; arka arkaya gelen değişiklikler tek seferde.
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planlaRef = useRef<() => void>(() => undefined);
  const bugunRef = useRef(bugunGun);
  useEffect(() => {
    bugunRef.current = bugunGun;
  }, [bugunGun]);

  useEffect(() => {
    void bildirimleriKur();
    const planla = (planlaRef.current = () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      zamanlayici.current = setTimeout(() => {
        void planlariHesapla(oku, bugunRef.current).then(planlariUygula, (e: unknown) =>
          console.error('Bildirim planı hesaplanamadı', e),
        );
      }, 400);
    });
    void eskiGunleriSil(kapi, bugunRef.current).finally(planla);
    const bitir = yayin.abone(['animsatici', 'kart', 'plan'], planla);
    const abonelik = AppState.addEventListener('change', (d) => {
      if (d === 'active') planla();
    });
    return () => {
      bitir();
      abonelik.remove();
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, [kapi, oku, yayin]);

  // Gün değişince (gece yarısı) eski durumlar silinir, plan yenilenir.
  const ilkGun = useRef(bugunGun);
  useEffect(() => {
    if (bugunGun === ilkGun.current) return;
    ilkGun.current = bugunGun;
    void eskiGunleriSil(kapi, bugunGun);
  }, [bugunGun, kapi]);

  // Bildirim yanıtları.
  const kisaMesajRef = useRef(kisaMesaj);
  useEffect(() => {
    kisaMesajRef.current = kisaMesaj;
  }, [kisaMesaj]);

  useEffect(() => {
    const isle = async ({ eylem, veri }: BildirimYaniti) => {
      if (!veri) return;
      if (veri.tur === 'kart') {
        if (eylem === BILDIRIME_DOKUNULDU)
          router.push({
            pathname: '/kart/[id]',
            params: { id: veri.kartId, gun: veri.gun },
          });
        return;
      }
      const a = (await animsaticilariOku(oku)).find((x) => x.id === veri.animsaticiId);
      if (!a) return;
      if (eylem === DURDUR) {
        await durdur(kapi, a.id, veri.gun, veri.saat);
        kisaMesajRef.current(`Durduruldu: ${a.ad}`);
      } else if (eylem === ERTELE) {
        const d = (await gunDurumlari(oku, veri.gun)).find((g) => g.animsaticiId === a.id && g.saat === veri.saat);
        const yeni = erteleSaati(d?.ertelenenSaat ?? veri.saat, simdiSaat(), a.erteleDk);
        await ertele(kapi, a.id, veri.gun, veri.saat, yeni);
        kisaMesajRef.current(`Ertelendi: ${yeni} · ${a.ad}`);
      } else {
        router.push('/giris/animsaticilar');
      }
    };
    // Uygulama bildirimle açıldıysa gezinme hazır olsun diye biraz beklenir.
    let hazir = false;
    const bekleyen: BildirimYaniti[] = [];
    const t = setTimeout(() => {
      hazir = true;
      bekleyen
        .splice(0)
        .forEach((y) => void isle(y).catch((e: unknown) => console.error('Bildirim yanıtı işlenemedi', e)));
    }, 600);
    const bitir = yanitlariDinle((y) => {
      if (!hazir) bekleyen.push(y);
      else void isle(y).catch((e: unknown) => console.error('Bildirim yanıtı işlenemedi', e));
    });
    return () => {
      clearTimeout(t);
      bitir();
    };
  }, [kapi, oku]);

  // Alarmdaki Durdur / Ertele (Rites'ı açar; basış telefonda bekler).
  useEffect(() => {
    let isleniyor = false;
    const isle = async () => {
      if (isleniyor) return;
      isleniyor = true;
      try {
        const basislar = await bekleyenBasislar();
        if (basislar.length === 0) return;
        const animsaticilar = await animsaticilariOku(oku);
        const bugunGun = bugun();
        let acilacakKart: { id: string; gun: string } | null = null;
        for (const b of basislar) {
          const basisGunu = bugun(new Date(b.zamanMs));
          const e = alarmiEslestir(b.alarmId, animsaticilar, basisGunu);
          if (!e) {
            // Kart alarmı: yalnız susturulur; kart açılır.
            await alarmiSustur(b.alarmId);
            const k = kartAlarminiEslestir(b.alarmId, await tumKartlar(oku), basisGunu);
            if (k) acilacakKart = { id: k.kart.id, gun: k.gun };
            continue;
          }
          const { animsatici: a, saat, gun } = e;
          // Alarmdaki Ertele alarmı susturmuyor; Rites susturur (tekrarlıysa plan yeniden kurar).
          await alarmiSustur(b.alarmId);
          if (b.tur === 'durdur') {
            await durdur(kapi, a.id, gun, saat);
            kisaMesajRef.current(`Durduruldu: ${a.ad}`);
          } else if (gun === bugunGun && erteleGecerliMi(b.zamanMs, Date.now())) {
            const d = (await gunDurumlari(oku, gun)).find((g) => g.animsaticiId === a.id && g.saat === saat);
            if (d?.durduruldu) continue;
            const yeni = erteleSaati(d?.ertelenenSaat ?? saat, simdiSaat(), ALARM_ERTELEME);
            await ertele(kapi, a.id, gun, saat, yeni);
            kisaMesajRef.current(`Ertelendi: ${yeni} · ${a.ad}`);
          }
        }
        await basislariTemizle();
        // Susturulan tekrarlı alarm yeniden kurulsun (yazma olmadıysa da).
        planlaRef.current();
        if (acilacakKart) router.push({ pathname: '/kart/[id]', params: acilacakKart });
      } catch (e) {
        console.error('Alarm düğmesi işlenemedi', e);
      } finally {
        isleniyor = false;
      }
    };
    const t = setTimeout(() => void isle(), 600);
    const bitir = basislariDinle(() => void isle());
    const abonelik = AppState.addEventListener('change', (d) => {
      if (d === 'active') void isle();
    });
    return () => {
      clearTimeout(t);
      bitir();
      abonelik.remove();
    };
  }, [kapi, oku]);

  return null;
}
