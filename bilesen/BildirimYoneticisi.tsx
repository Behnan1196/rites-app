// Yerel bildirimlerin yöneticisi (kök düzende bir kez çizilir, görünmez).
// - Anımsatıcılar ya da kartlar değişince, uygulama öne gelince ve gün
//   değişince planı yeniden kurar (en çok 60, yakından uzağa).
// - Bildirimdeki Durdur / Ertele'yi işler; bildirime dokunulunca ilgili ekranı açar.

import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { bildirimPlani, erteleSaati, saatMetni } from '@/mantik/animsatici';
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

async function planiHesapla(oku: Okuyucu, bugunGun: string) {
  return bildirimPlani({
    animsaticilar: await animsaticilariOku(oku),
    gunDurumlari: await gunDurumlari(oku, bugunGun),
    kartlar: await tumKartlar(oku),
    bugunYapilanlar: await gunYapilanlari(oku, bugunGun),
    bugunGun,
    simdi: simdiSaat(),
  });
}

export function BildirimYoneticisi() {
  const { kapi, oku, yayin } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();

  // Yeniden planlama; arka arkaya gelen değişiklikler tek seferde.
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bugunRef = useRef(bugunGun);
  useEffect(() => {
    bugunRef.current = bugunGun;
  }, [bugunGun]);

  useEffect(() => {
    void bildirimleriKur();
    const planla = () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      zamanlayici.current = setTimeout(() => {
        void planiHesapla(oku, bugunRef.current).then(planiUygula, (e: unknown) =>
          console.error('Bildirim planı hesaplanamadı', e),
        );
      }, 400);
    };
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
        if (eylem === BILDIRIME_DOKUNULDU) router.push({ pathname: '/kart/[id]', params: { id: veri.kartId, gun: veri.gun } });
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
      bekleyen.splice(0).forEach((y) => void isle(y).catch((e: unknown) => console.error('Bildirim yanıtı işlenemedi', e)));
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

  return null;
}
