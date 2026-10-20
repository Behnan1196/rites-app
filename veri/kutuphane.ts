// Kütüphanem: yerel veritabanı (`03` → kutuphane).

import type { AlanAnahtari } from '@/mantik/alanlar';
import { turMu, type KutuphaneKaydi } from '@/mantik/kutuphane';

import type { Kapi, Okuyucu } from './kapi';

interface Satir {
  id: string;
  tur: string;
  baslik: string;
  alanlar: string;
  etiket_tur: string;
  kaynak: string;
  paylasilabilir: number;
  icerik: string;
  olusturma: string;
}

function satirdan(s: Satir): KutuphaneKaydi | null {
  try {
    const ortak = {
      id: s.id,
      baslik: s.baslik,
      alanlar: JSON.parse(s.alanlar) as AlanAnahtari[],
      etiketTur: turMu(s.etiket_tur) ? s.etiket_tur : 'Diğer',
      kaynak: s.kaynak,
      paylasilabilir: s.paylasilabilir === 1,
      olusturma: s.olusturma,
    } as const;
    if (s.tur !== 'kart') return null;
    return { ...ortak, tur: 'kart', icerik: JSON.parse(s.icerik) };
  } catch (e) {
    console.warn('Kütüphane kaydı okunamadı', s.id, e);
    return null;
  }
}

/** En yeni üstte. */
export async function kutuphaneyiOku(oku: Okuyucu): Promise<KutuphaneKaydi[]> {
  const satirlar = await oku.hepsi<Satir>('SELECT * FROM kutuphane ORDER BY olusturma DESC');
  return satirlar.map(satirdan).filter((k): k is KutuphaneKaydi => k !== null);
}

export async function kutuphaneKaydiOku(oku: Okuyucu, id: string): Promise<KutuphaneKaydi | null> {
  const s = await oku.ilk<Satir>('SELECT * FROM kutuphane WHERE id = ?', [id]);
  return s ? satirdan(s) : null;
}

export async function kutuphaneSayisi(oku: Okuyucu): Promise<number> {
  return (await oku.ilk<{ n: number }>('SELECT COUNT(*) AS n FROM kutuphane'))?.n ?? 0;
}

/**
 * Kütüphaneye kaydeder. `ajandadanKaldir` verilirse o kart (kayıtları ve
 * bloklarıyla) aynı işlemde silinir (L-1 "Ajandamdan kaldır").
 */
export function kutuphaneyeKaydet(kapi: Kapi, k: KutuphaneKaydi, ajandadanKaldir?: string): Promise<void> {
  return kapi.yaz(ajandadanKaldir ? ['kutuphane', 'kart'] : ['kutuphane'], async (y) => {
    await y.calistir(
      `INSERT INTO kutuphane (id, tur, baslik, alanlar, etiket_tur, kaynak, paylasilabilir, icerik, olusturma)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        k.id,
        k.tur,
        k.baslik,
        JSON.stringify(k.alanlar),
        k.etiketTur,
        k.kaynak,
        k.paylasilabilir ? 1 : 0,
        JSON.stringify(k.icerik),
        k.olusturma,
      ],
    );
    if (ajandadanKaldir) {
      await y.calistir('DELETE FROM kayit WHERE kart_id = ?', [ajandadanKaldir]);
      await y.calistir('DELETE FROM blok WHERE kart_id = ?', [ajandadanKaldir]);
      await y.calistir('DELETE FROM kart WHERE id = ?', [ajandadanKaldir]);
    }
  });
}

export function kutuphanedenCikar(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['kutuphane'], (y) => y.calistir('DELETE FROM kutuphane WHERE id = ?', [id]));
}
