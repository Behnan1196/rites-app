import { adKaydet, ayarOku, ayarYaz } from '../ayar';
import { GOCLER, gocleriUygula, gocListesiHatasi } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Yazici } from '../kapi';
import { yayinOlustur } from '../yayin';
import { sahteVeriTabani } from './sahteVeriTabani';

describe('yayın', () => {
  it('yalnız ilgili konuya abone olanı çağırır', () => {
    const yayin = yayinOlustur();
    const dinleyici = jest.fn();
    yayin.abone(['ayar'], dinleyici);
    yayin.duyur(['ayar']);
    expect(dinleyici).toHaveBeenCalledTimes(1);
    yayin.duyur([]);
    expect(dinleyici).toHaveBeenCalledTimes(1);
  });

  it('aynı duyuruda konu tekrar etse de bir kez çağırır', () => {
    const yayin = yayinOlustur();
    const dinleyici = jest.fn();
    yayin.abone(['ayar'], dinleyici);
    yayin.duyur(['ayar', 'ayar']);
    expect(dinleyici).toHaveBeenCalledTimes(1);
  });

  it('abonelik bitince çağırmaz', () => {
    const yayin = yayinOlustur();
    const dinleyici = jest.fn();
    const bitir = yayin.abone(['ayar'], dinleyici);
    bitir();
    yayin.duyur(['ayar']);
    expect(dinleyici).not.toHaveBeenCalled();
  });

  it('duyuru sırasında aboneliği biten dinleyici atlanır', () => {
    const yayin = yayinOlustur();
    const ikinci = jest.fn();
    let ikinciyiBitir = () => {};
    yayin.abone(['ayar'], () => ikinciyiBitir());
    ikinciyiBitir = yayin.abone(['ayar'], ikinci);
    yayin.duyur(['ayar']);
    expect(ikinci).not.toHaveBeenCalled();
  });
});

describe('yazma kapısı', () => {
  it('yazmayı işlem içinde yapar, bitince duyurur', async () => {
    const db = sahteVeriTabani();
    const yayin = yayinOlustur();
    const duyurular: string[] = [];
    yayin.abone(['ayar'], () => duyurular.push(db.gunluk.at(-1) ?? ''));
    const kapi = kapiOlustur(db, yayin);

    await kapi.yaz(['ayar'], (y) => y.calistir('UPDATE x'));

    expect(db.gunluk).toEqual(['islem:basla', 'run:UPDATE x', 'islem:bitti']);
    // Duyuru, işlem bittikten sonra geldi.
    expect(duyurular).toEqual(['islem:bitti']);
  });

  it('hata olursa duyurmaz ve hatayı iletir', async () => {
    const db = sahteVeriTabani();
    const yayin = yayinOlustur();
    const dinleyici = jest.fn();
    yayin.abone(['ayar'], dinleyici);
    const kapi = kapiOlustur(db, yayin);

    db.sonrakiIslemHataVersin = true;
    await expect(kapi.yaz(['ayar'], (y) => y.calistir('UPDATE x'))).rejects.toThrow('sahte hata');
    expect(dinleyici).not.toHaveBeenCalled();
    expect(db.gunluk).toContain('islem:geri');
  });

  it('yazmaları sıraya koyar; biri bitmeden öteki başlamaz', async () => {
    const db = sahteVeriTabani();
    const kapi = kapiOlustur(db, yayinOlustur());

    const birinci = kapi.yaz(['ayar'], async (y) => {
      await y.calistir('A1');
      await new Promise((r) => setTimeout(r, 5));
      await y.calistir('A2');
    });
    const ikinci = kapi.yaz(['ayar'], (y) => y.calistir('B1'));
    await Promise.all([birinci, ikinci]);

    expect(db.gunluk).toEqual([
      'islem:basla', 'run:A1', 'run:A2', 'islem:bitti',
      'islem:basla', 'run:B1', 'islem:bitti',
    ]);
  });

  it('bir yazmanın hatası sonrakini durdurmaz', async () => {
    const db = sahteVeriTabani();
    const kapi = kapiOlustur(db, yayinOlustur());
    const hatali = kapi.yaz(['ayar'], async () => {
      throw new Error('olmadı');
    });
    const sonraki = kapi.yaz(['ayar'], (y) => y.calistir('B1'));
    await expect(hatali).rejects.toThrow('olmadı');
    await expect(sonraki).resolves.toBeUndefined();
    expect(db.gunluk).toContain('run:B1');
  });

  it('işlem bittikten sonra yazıcı kullanılamaz', async () => {
    const db = sahteVeriTabani();
    const kapi = kapiOlustur(db, yayinOlustur());
    let kacak: Yazici | undefined;
    await kapi.yaz(['ayar'], async (y) => {
      kacak = y;
    });
    await expect(kacak!.calistir('UPDATE x')).rejects.toThrow();
  });
});

describe('göçler', () => {
  it('liste 1den başlayıp birer artmalı', () => {
    expect(gocListesiHatasi(GOCLER)).toBeNull();
    expect(gocListesiHatasi([{ surum: 2, sql: '' }])).not.toBeNull();
    expect(gocListesiHatasi([{ surum: 1, sql: '' }, { surum: 3, sql: '' }])).not.toBeNull();
  });

  it('boş veritabanına bütün göçleri uygular', async () => {
    const db = sahteVeriTabani();
    const surum = await gocleriUygula(db);
    expect(surum).toBe(GOCLER.length);
    expect(db.userVersion).toBe(GOCLER.length);
    expect(db.gunluk.some((s) => s.includes('CREATE TABLE IF NOT EXISTS ayar'))).toBe(true);
  });

  it('yalnız eksik göçleri uygular', async () => {
    const db = sahteVeriTabani();
    db.userVersion = 1;
    const gocler = [
      { surum: 1, sql: 'BIR' },
      { surum: 2, sql: 'IKI' },
    ];
    expect(await gocleriUygula(db, gocler)).toBe(2);
    expect(db.gunluk).not.toContain('exec:BIR');
    expect(db.gunluk).toContain('exec:IKI');
  });

  it('güncel veritabanında hiçbir göç çalıştırmaz', async () => {
    const db = sahteVeriTabani();
    db.userVersion = GOCLER.length;
    await gocleriUygula(db);
    expect(db.gunluk.filter((s) => s === 'islem:basla')).toHaveLength(0);
  });
});

describe('ayarlar ve ad', () => {
  it('yazılan ayar okunur, yazınca "ayar" duyurulur', async () => {
    const db = sahteVeriTabani();
    const yayin = yayinOlustur();
    const dinleyici = jest.fn();
    yayin.abone(['ayar'], dinleyici);
    const kapi = kapiOlustur(db, yayin);
    const oku = okuyucuOlustur(db);

    expect(await ayarOku(oku, 'ad')).toBeNull();
    await ayarYaz(kapi, 'ad', 'Ayşe');
    expect(await ayarOku(oku, 'ad')).toBe('Ayşe');
    expect(dinleyici).toHaveBeenCalledTimes(1);
  });

  it('bozuk değer null okunur', async () => {
    const db = sahteVeriTabani();
    db.ayarlar.set('ad', '{bozuk');
    expect(await ayarOku(okuyucuOlustur(db), 'ad')).toBeNull();
  });

  it('boş adı kaydetmez, mesaj döndürür', async () => {
    const db = sahteVeriTabani();
    const kapi = kapiOlustur(db, yayinOlustur());
    expect(await adKaydet(kapi, '   ')).toBe('Önce adını yaz.');
    expect(db.ayarlar.size).toBe(0);
  });

  it('adı temizleyip kaydeder', async () => {
    const db = sahteVeriTabani();
    const kapi = kapiOlustur(db, yayinOlustur());
    expect(await adKaydet(kapi, '  Ayşe   Nur ')).toBeNull();
    expect(await ayarOku(okuyucuOlustur(db), 'ad')).toBe('Ayşe Nur');
  });
});
