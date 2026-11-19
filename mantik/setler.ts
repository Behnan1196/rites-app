// Setler (pilot 19 Kasım, P-127): egzersiz kartında set set tekrar ve ağırlık kaydı.
// Parçanın hedefi `blok.metin`de: {"set": 3, "tekrar": 10, "agirlik": "10", "dinlenme": 60}
// (ağırlık kg, boş olabilir; dinlenme saniye, 0 = yok). O günün setleri kayıtta:
// `degerler[blok.id]` = [{"t": 12, "a": "10", "y": 1}, …] (tekrar, ağırlık, yapıldı).
// Kayıt yoksa setler hedefle dolu ve yapılmamış gelir. Bütün setler yapılınca kart
// kendiliğinden Yaptım olur; bir setin işareti kalkınca Yaptım da kalkar (yalnız sınır geçilince).

import type { Blok, Kayit } from './kart';
import type { Gun } from './tarih';

export interface SetHedefi {
  set: number;
  tekrar: number;
  /** kg; boş: ağırlıksız (vücut ağırlığı). */
  agirlik: string;
  /** Saniye; 0: dinlenme sayacı yok. */
  dinlenme: number;
}

export interface SetKaydi {
  tekrar: number;
  agirlik: string;
  yapildi: boolean;
}

export const EN_COK_SET = 10;
export const DINLENME_SECENEKLERI: readonly number[] = [0, 30, 45, 60, 90, 120];
export const VARSAYILAN_HEDEF: SetHedefi = { set: 3, tekrar: 10, agirlik: '', dinlenme: 60 };

function json(s: string | undefined): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

const nesneMi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const tamSayi = (x: unknown, varsayilan: number, alt: number, ust: number) => {
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? Math.min(ust, Math.max(alt, n)) : varsayilan;
};

/** "12,5" · "12.5" → "12,5"; sayı değilse boş. */
export function agirlikDuzelt(s: unknown): string {
  const t = String(s ?? '')
    .trim()
    .replace(/\s|kg/gi, '')
    .replace('.', ',');
  if (!t) return '';
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? String(Math.round(n * 100) / 100).replace('.', ',') : '';
}

function agirlikSayisi(a: string): number | null {
  if (!a) return null;
  const n = Number(a.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function setHedefiOku(b: Pick<Blok, 'metin'>): SetHedefi {
  const v = json(b.metin);
  if (!nesneMi(v)) return { ...VARSAYILAN_HEDEF };
  return {
    set: tamSayi(v.set, VARSAYILAN_HEDEF.set, 1, EN_COK_SET),
    tekrar: tamSayi(v.tekrar, VARSAYILAN_HEDEF.tekrar, 1, 999),
    agirlik: agirlikDuzelt(v.agirlik),
    dinlenme: tamSayi(v.dinlenme, VARSAYILAN_HEDEF.dinlenme, 0, 600),
  };
}

export function setHedefiYaz(h: SetHedefi): string {
  return JSON.stringify({ set: h.set, tekrar: h.tekrar, agirlik: h.agirlik, dinlenme: h.dinlenme });
}

/** Kayıtta setler var mı (kişi o gün bir şey girdi mi). */
export function setKaydiVarMi(kayit: Pick<Kayit, 'degerler'>, blokId: string): boolean {
  return Array.isArray(json(kayit.degerler[blokId]));
}

/** O günün setleri; kayıt yoksa hedefle dolu, yapılmamış. Hedeften az kayıtlı set hedefle tamamlanır. */
export function setleriOku(kayit: Pick<Kayit, 'degerler'>, hedef: SetHedefi, blokId: string): SetKaydi[] {
  const v = json(kayit.degerler[blokId]);
  const kayitli: SetKaydi[] = Array.isArray(v)
    ? v.filter(nesneMi).map((s) => ({
        tekrar: tamSayi(s.t, hedef.tekrar, 0, 999),
        agirlik: agirlikDuzelt(s.a),
        yapildi: s.y === 1 || s.y === true,
      }))
    : [];
  const bos: SetKaydi = { tekrar: hedef.tekrar, agirlik: hedef.agirlik, yapildi: false };
  return Array.from({ length: Math.max(hedef.set, kayitli.length) }, (_, i) => kayitli[i] ?? { ...bos });
}

/**
 * Setleri kayda yazar. Bütün setler yapılınca Yaptım olur; yapılmamış set kalınca (önceden hepsi
 * yapılmışsa) Yaptım kalkar. Kişinin elle verdiği Yaptım başka zaman değişmez.
 */
export function setleriYaz(kayit: Kayit, blokId: string, eski: readonly SetKaydi[], yeni: readonly SetKaydi[]): Kayit {
  const deger = JSON.stringify(yeni.map((s) => ({ t: s.tekrar, a: s.agirlik, y: s.yapildi ? 1 : 0 })));
  const sonuc: Kayit = { ...kayit, degerler: { ...kayit.degerler, [blokId]: deger } };
  const hepsi = (l: readonly SetKaydi[]) => l.length > 0 && l.every((s) => s.yapildi);
  if (!hepsi(eski) && hepsi(yeni)) sonuc.yapildi = true;
  else if (hepsi(eski) && !hepsi(yeni)) sonuc.yapildi = false;
  return sonuc;
}

/** "3 × 10" · "3 × 10 · 12,5 kg" (hedef için). */
export function hedefMetni(h: SetHedefi): string {
  return `${h.set} × ${h.tekrar}${h.agirlik ? ` · ${h.agirlik} kg` : ''}`;
}

/**
 * Yapılan setlerin özeti: hepsi aynıysa "3 × 12 · 10 kg"; ağırlık aynıysa "12 · 10 · 8 tekrar · 10 kg"
 * (ağırlıksızda "12 · 10 · 8 tekrar"); ağırlık değiştiyse set set "12 × 10 · 10 × 12,5 kg".
 * Yapılan set yoksa boş.
 */
export function setOzeti(setler: readonly SetKaydi[]): string {
  const y = setler.filter((s) => s.yapildi);
  if (y.length === 0) return '';
  const ilk = y[0]!;
  if (y.every((s) => s.tekrar === ilk.tekrar && s.agirlik === ilk.agirlik))
    return `${y.length} × ${ilk.tekrar}${ilk.agirlik ? ` · ${ilk.agirlik} kg` : ''}`;
  // Ağırlık aynı (ya da hiç yok), tekrarlar farklı: "11 · 9 · 11 tekrar · 20 kg".
  if (y.every((s) => s.agirlik === ilk.agirlik))
    return `${y.map((s) => s.tekrar).join(' · ')} tekrar${ilk.agirlik ? ` · ${ilk.agirlik} kg` : ''}`;
  return `${y.map((s) => (s.agirlik ? `${s.tekrar} × ${s.agirlik}` : `${s.tekrar}`)).join(' · ')} kg`;
}

export interface SetGunu {
  gun: Gun;
  setler: SetKaydi[];
  ozet: string;
  /** Yapılan setlerin toplam tekrarı. */
  toplamTekrar: number;
  /** Yapılan setlerin en ağırı; ağırlık yoksa null. */
  enAgir: number | null;
}

/** Bir günün yapılan setleri (hiç yapılan yoksa null). */
function setGunu(k: Kayit, hedef: SetHedefi, blokId: string): SetGunu | null {
  if (!setKaydiVarMi(k, blokId)) return null;
  const setler = setleriOku(k, hedef, blokId);
  const yapilan = setler.filter((s) => s.yapildi);
  if (yapilan.length === 0) return null;
  const agirliklar = yapilan.map((s) => agirlikSayisi(s.agirlik)).filter((n): n is number => n !== null);
  return {
    gun: k.tarih,
    setler: yapilan,
    ozet: setOzeti(setler),
    toplamTekrar: yapilan.reduce((t, s) => t + s.tekrar, 0),
    enAgir: agirliklar.length ? Math.max(...agirliklar) : null,
  };
}

/** Setlerin geçmişi (yapılan seti olan günler), yeniden eskiye; `once` verilirse o günden öncekiler. */
export function setGecmisi(kayitlar: readonly Kayit[], b: Pick<Blok, 'id' | 'metin'>, once?: Gun): SetGunu[] {
  const hedef = setHedefiOku(b);
  return kayitlar
    .filter((k) => !once || k.tarih < once)
    .map((k) => setGunu(k, hedef, b.id))
    .filter((g): g is SetGunu => g !== null)
    .sort((a, c) => c.gun.localeCompare(a.gun));
}

/** "Geçen sefer": açılan günden önceki son yapılan setler. */
export function gecenSefer(kayitlar: readonly Kayit[], b: Pick<Blok, 'id' | 'metin'>, gun: Gun): SetGunu | null {
  return setGecmisi(kayitlar, b, gun)[0] ?? null;
}

/** Dinlenme süresi metni: "60 sn" · "1 dk 30 sn" · "2 dk" · "Yok". */
export function dinlenmeMetni(sn: number): string {
  if (sn <= 0) return 'Yok';
  const dk = Math.floor(sn / 60);
  const s = sn % 60;
  if (dk === 0) return `${s} sn`;
  return s === 0 ? `${dk} dk` : `${dk} dk ${s} sn`;
}
