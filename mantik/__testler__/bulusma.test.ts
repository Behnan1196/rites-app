import {
  gorusmeBaglantisi,
  gorusmeBaglantisiHatasi,
  gorusmeUygulamasi,
  bagCoz,
  bulusmaBagi,
  bulusmaFormuHatasi,
  bulusmaKarti,
  bulusmaZamani,
  kaldirilacakKartlar,
  yaklasanlar,
  yanitAyrintisi,
  yanitOzeti,
  type Bulusma,
} from '../bulusma';
import { kaynakAnahtari, kaynakEtiketi } from '../kaynak';

const BEN = 'ben';
const b = (d: Partial<Bulusma> = {}): Bulusma => ({
  id: 'b1',
  grup: 'g1',
  grupAdi: 'Aile',
  kuran: 'ali',
  baslik: 'Akşam yemeği',
  gun: '2026-10-25',
  saat: '19:30',
  yer: 'Bizde',
  yanitlar: [],
  ...d,
});

describe('buluşma', () => {
  it('yanıt özeti ve ayrıntısı', () => {
    const x = b({
      yanitlar: [
        { kullanici: 'ali', yanit: 'geliyorum' },
        { kullanici: BEN, yanit: 'geliyorum' },
        { kullanici: 'elif', yanit: 'belki' },
      ],
    });
    expect(yanitOzeti(x)).toBe('2 geliyor · 1 belki');
    expect(yanitOzeti(b())).toBe('Henüz yanıt yok');
    expect(yanitAyrintisi(x, (id) => (id === BEN ? 'Sen' : id))).toBe('Geliyor: ali, Sen · Belki: elif');
  });

  it('zaman metni ve yaklaşanlar', () => {
    expect(bulusmaZamani(b())).toBe('25 Ekim Pazar · 19:30 · Bizde');
    expect(bulusmaZamani(b({ saat: null, yer: '' }))).toBe('25 Ekim Pazar');
    const l = [b({ id: 'eski', gun: '2026-10-10' }), b(), b({ id: 'baska', grup: 'g2' })];
    expect(yaklasanlar(l, 'g1', '2026-10-18').map((x) => x.id)).toEqual(['b1']);
  });

  it('form hatası', () => {
    expect(bulusmaFormuHatasi(' ', '2026-10-25')).toBe('Buluşmaya bir ad ver.');
    expect(bulusmaFormuHatasi('Kahve', null)).toBe('Bir gün seç.');
    expect(bulusmaFormuHatasi('Kahve', '2026-10-25')).toBeNull();
  });

  it('ajandaya giren kart: saat, yer, 1 saat önce bildirim, grup kaynağı', () => {
    const k = bulusmaKarti('k1', b());
    expect(k).toMatchObject({
      baslik: 'Akşam yemeği',
      tarih: '2026-10-25',
      saat: '19:30',
      kisa: 'Yer: Bizde',
      hatirlatma: '1sa',
    });
    expect(kaynakAnahtari(k)).toBe('grup');
    expect(kaynakEtiketi(k, new Map())).toBe('Grup: Aile');
    expect(bulusmaKarti('k2', b({ saat: null })).hatirlatma).toBeNull();
    expect(bagCoz(k.bag)).toEqual({ id: 'b1', imza: '2026-10-25|19:30' });
    expect(bagCoz(null)).toBeNull();
  });

  it('kalkacak kartlar: yanıt değişti, zaman değişti, buluşma yok; geçmişe dokunulmaz', () => {
    const geliyor = (d: Partial<Bulusma> = {}) => b({ yanitlar: [{ kullanici: BEN, yanit: 'geliyorum' }], ...d });
    const kart = (id: string, x: Bulusma) => ({ id, bag: bulusmaBagi(x), tarih: x.gun });
    const kartlar = [
      kart('tamam', geliyor()),
      kart('belki', geliyor({ id: 'b2' })),
      kart('saat', geliyor({ id: 'b3', saat: '18:00' })),
      kart('silindi', geliyor({ id: 'b4' })),
      kart('gecmis', geliyor({ id: 'b5', gun: '2026-10-01' })),
      { id: 'baska', bag: null, tarih: '2026-10-25' },
    ];
    const sunucu = [
      geliyor(),
      b({ id: 'b2', yanitlar: [{ kullanici: BEN, yanit: 'belki' }] }),
      geliyor({ id: 'b3', saat: '20:00' }),
    ];
    expect(kaldirilacakKartlar(kartlar, sunucu, BEN, '2026-10-18')).toEqual(['belki', 'saat', 'silindi']);
  });
});

describe('Görüntülü görüşme bağlantısı (P-62)', () => {
  it('düzeltilir, denetlenir, uygulaması bulunur', () => {
    expect(gorusmeBaglantisi(' call.whatsapp.com/video/AbC ')).toBe('https://call.whatsapp.com/video/AbC');
    expect(gorusmeBaglantisi('https://meet.google.com/abc-defg-hij')).toBe('https://meet.google.com/abc-defg-hij');
    expect(gorusmeBaglantisi('')).toBe('');
    expect(gorusmeBaglantisiHatasi('')).toBeNull();
    expect(gorusmeBaglantisiHatasi('call.whatsapp.com/video/x')).toBeNull();
    expect(gorusmeBaglantisiHatasi('yarın ararım')).not.toBeNull();
    expect(gorusmeUygulamasi('https://call.whatsapp.com/video/x')).toBe('WhatsApp');
    expect(gorusmeUygulamasi('https://us02web.zoom.us/j/1')).toBe('Zoom');
    expect(gorusmeUygulamasi('https://ornek.com')).toBeNull();
    expect(gorusmeUygulamasi(undefined)).toBeNull();
  });
});
