import { bildirimPlani, type Animsatici } from '../animsatici';
import { yeniKart } from '../kart';
import { bildirimSesi, gecerliSes, sesEtiketi, SESLER } from '../sesler';

describe('bildirim sesleri', () => {
  it('dosya adı ya da telefonun sesi', () => {
    expect(bildirimSesi('zil')).toBe('zil.wav');
    expect(bildirimSesi(null)).toBe('default');
    expect(bildirimSesi('yok')).toBe('default');
    expect(gecerliSes('can')).toBe('can');
    expect(sesEtiketi('kus')).toBe('Kuş');
    expect(SESLER[0]!.ad).toBeNull();
  });

  it('planda anımsatıcının sesi ve ajanda hatırlatmalarının sesi', () => {
    const a: Animsatici = {
      id: 'a',
      ad: 'İlaç',
      saatler: ['20:00'],
      gunler: [0, 1, 2, 3, 4, 5, 6],
      sesli: true,
      erteleDk: 10,
      alarm: false,
      bitis: null,
      ses: 'can',
    };
    const k = yeniKart('k', { baslik: 'Diş', tarih: '2026-10-13', saat: '10:00', hatirlatma: '1sa' });
    const p = bildirimPlani({
      animsaticilar: [a],
      gunDurumlari: [],
      kartlar: [k],
      bugunYapilanlar: new Set(),
      bugunGun: '2026-10-12',
      simdi: '08:00',
      gunSayisi: 2,
      kartSesi: 'bip',
    });
    expect(p.find((b) => b.veri.tur === 'animsatici')?.ses).toBe('can');
    expect(p.find((b) => b.veri.tur === 'kart')?.ses).toBe('bip');
  });
});
