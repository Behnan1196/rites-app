import {
  alarmFarki,
  kartAlarmKimligi,
  kartAlarminiEslestir,
  kartAlarmPlani,
  alarmImzasi,
  alarmiEslestir,
  alarmPlani,
  erteleGecerliMi,
  ertelemeAlarmKimligi,
  isoHaftaGunleri,
  kararliUuid,
  saatParcalari,
  tekrarliAlarmKimligi,
} from '../alarm';
import { animsaticiMeta, bildirimPlani, type Animsatici } from '../animsatici';
import { yeniKart } from '../kart';

const BUGUN = '2026-10-12'; // Pazartesi
const ilac: Animsatici = {
  id: 'i',
  ad: 'İlaç',
  saatler: ['08:00', '20:00'],
  gunler: 'hergun',
  sesli: true,
  erteleDk: 5,
  alarm: true,
};
const su: Animsatici = {
  id: 's',
  ad: 'Su',
  saatler: ['10:00'],
  gunler: 'hergun',
  sesli: true,
  erteleDk: 10,
  alarm: false,
};
const hs: Animsatici = {
  id: 'h',
  ad: 'Hafta sonu ilacı',
  saatler: ['09:00'],
  gunler: 'haftasonu',
  sesli: true,
  erteleDk: 5,
  alarm: true,
};

describe('kararlı UUID', () => {
  it('UUID biçiminde, aynı girdiye aynı, farklıya farklı', () => {
    const a = kararliUuid('x');
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(kararliUuid('x')).toBe(a);
    expect(kararliUuid('y')).not.toBe(a);
    expect(tekrarliAlarmKimligi('i', '08:00')).not.toBe(tekrarliAlarmKimligi('i', '20:00'));
    expect(ertelemeAlarmKimligi('i', BUGUN, '08:00')).not.toBe(tekrarliAlarmKimligi('i', '08:00'));
  });
});

describe('alarm planı', () => {
  it('yalnız alarmlı anımsatıcılar; her saat için haftalık tekrarlı alarm', () => {
    const plan = alarmPlani([ilac, su, hs], [], BUGUN, '07:00');
    expect(plan.map((p) => [p.baslik, p.saat, p.haftaGunleri.join('')])).toEqual([
      ['İlaç', '08:00', '1234567'],
      ['İlaç', '20:00', '1234567'],
      ['Hafta sonu ilacı', '09:00', '67'],
    ]);
    expect(plan.every((p) => p.gun === null)).toBe(true);
  });

  it('ertelenen saat için bugüne tek seferlik alarm; geçmişse ya da durdurulduysa yok', () => {
    const ertelendi = [
      {
        animsaticiId: 'i',
        saat: '08:00',
        durduruldu: false,
        ertelenenSaat: '08:05',
      },
    ];
    const plan = alarmPlani([ilac], ertelendi, BUGUN, '08:01');
    expect(plan.find((p) => p.gun === BUGUN)).toMatchObject({
      id: ertelemeAlarmKimligi('i', BUGUN, '08:00'),
      saat: '08:05',
      haftaGunleri: [],
      kaynak: { tur: 'animsatici', animsaticiId: 'i', saat: '08:00' },
      ertelenebilir: true,
    });
    expect(alarmPlani([ilac], ertelendi, BUGUN, '08:05').some((p) => p.gun)).toBe(false);
    expect(alarmPlani([ilac], [{ ...ertelendi[0]!, durduruldu: true }], BUGUN, '08:01').some((p) => p.gun)).toBe(false);
  });

  it('ISO hafta günleri', () => {
    expect(isoHaftaGunleri('haftaici')).toEqual([1, 2, 3, 4, 5]);
    expect(isoHaftaGunleri('haftasonu')).toEqual([6, 7]);
  });

  it('saat parçaları', () => {
    expect(saatParcalari('07:05')).toEqual({ hour: 7, minute: 5 });
  });
});

describe('telefondakiyle fark', () => {
  const plan = alarmPlani([ilac], [], BUGUN, '07:00');
  it('eksik eklenir, fazla kaldırılır, aynısı dokunulmaz', () => {
    const f = alarmFarki(plan, [
      { id: plan[0]!.id, imza: alarmImzasi('08:00', [1, 2, 3, 4, 5, 6, 7], 'İlaç') },
      { id: 'eski', imza: '06:00||x' },
    ]);
    expect(f.eklenecek.map((p) => p.saat)).toEqual(['20:00']);
    expect(f.kaldirilacak).toEqual(['eski']);
  });
  it('aynı kimlikte saat değiştiyse (yeniden ertele) kaldırılıp yeniden eklenir', () => {
    const ertele = alarmPlani(
      [ilac],
      [
        {
          animsaticiId: 'i',
          saat: '08:00',
          durduruldu: false,
          ertelenenSaat: '08:10',
        },
      ],
      BUGUN,
      '08:06',
    );
    const tek = ertele.find((p) => p.gun)!;
    const f = alarmFarki(ertele, [
      ...plan.map((p) => ({ id: p.id, imza: alarmImzasi(p.saat, p.haftaGunleri, p.baslik) })),
      { id: tek.id, imza: alarmImzasi('08:05', [], 'İlaç', BUGUN) },
    ]);
    expect(f.kaldirilacak).toEqual([tek.id]);
    expect(f.eklenecek).toEqual([tek]);
  });
  it('ad ya da günler değiştiyse (düzenleme) yeniden kurulur', () => {
    const telefonda = plan.map((p) => ({ id: p.id, imza: alarmImzasi(p.saat, p.haftaGunleri, p.baslik) }));
    const yeni = alarmPlani([{ ...ilac, ad: 'Tansiyon ilacı', gunler: 'haftaici' }], [], BUGUN, '07:00');
    const f = alarmFarki(yeni, telefonda);
    expect(f.kaldirilacak).toHaveLength(2);
    expect(f.eklenecek.map((p) => p.baslik)).toEqual(['Tansiyon ilacı', 'Tansiyon ilacı']);
  });
  it('izin yoksa (boş plan) hepsi kalkar', () => {
    expect(alarmFarki([], [{ id: 'a', imza: 'x' }]).kaldirilacak).toEqual(['a']);
  });
});

describe('alarmdaki düğme', () => {
  it('tekrarlı ve ertelenmiş alarm kimliği anımsatmaya eşlenir', () => {
    expect(alarmiEslestir(tekrarliAlarmKimligi('i', '20:00'), [su, ilac], BUGUN)).toMatchObject({
      saat: '20:00',
      gun: BUGUN,
    });
    expect(alarmiEslestir(ertelemeAlarmKimligi('i', '2026-10-11', '20:00'), [ilac], BUGUN)).toMatchObject({
      gun: '2026-10-11',
    });
    expect(alarmiEslestir('bilinmeyen', [ilac], BUGUN)).toBeNull();
  });
  it('ertele basışı 10 dakikadan eskiyse geçersiz', () => {
    expect(erteleGecerliMi(0, 9 * 60_000)).toBe(true);
    expect(erteleGecerliMi(0, 11 * 60_000)).toBe(false);
  });
});

describe('bildirimle ilişki', () => {
  it('alarmla çalan anımsatıcıya bildirim planlanmaz', () => {
    const girdi = {
      animsaticilar: [ilac, su],
      gunDurumlari: [],
      kartlar: [],
      bugunYapilanlar: new Set<string>(),
      bugunGun: BUGUN,
      simdi: '07:00',
      gunSayisi: 1,
    };
    expect(new Set(bildirimPlani(girdi).map((b) => b.baslik))).toEqual(new Set(['İlaç', 'Su']));
    expect(new Set(bildirimPlani({ ...girdi, alarmlaCalanlar: new Set(['i']) }).map((b) => b.baslik))).toEqual(
      new Set(['Su']),
    );
  });
  it('meta metni', () => {
    expect(animsaticiMeta(ilac)).toBe('Her gün · Alarm · erteleme 5 dk');
  });
});

describe('kart alarmı', () => {
  const doktor = yeniKart('d', {
    baslik: 'Doktor',
    tarih: '2026-10-13',
    saat: '10:00',
    hatirlatma: '1sa',
    alarm: true,
  });
  const her = yeniKart('h', {
    baslik: 'Yürüyüş',
    tarih: BUGUN,
    saat: '07:30',
    hatirlatma: 'saatinde',
    alarm: true,
    tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
  });
  const alarmsiz = yeniKart('a', { baslik: 'Toplantı', tarih: BUGUN, saat: '15:00', hatirlatma: 'saatinde' });

  it('alarmlı kartın hatırlatması belirli günde tek seferlik alarm; Ertele yok', () => {
    const plan = kartAlarmPlani([doktor, alarmsiz], new Set(), BUGUN, '08:00');
    expect(plan).toEqual([
      {
        id: kartAlarmKimligi('d', '2026-10-13'),
        saat: '09:00',
        haftaGunleri: [],
        baslik: 'Doktor',
        gun: '2026-10-13',
        ertelenebilir: false,
        kaynak: { tur: 'kart', kartId: 'd', gun: '2026-10-13' },
      },
    ]);
  });

  it('geçmiş saat ve bugün yapılan atlanır', () => {
    expect(kartAlarmPlani([her], new Set(), BUGUN, '08:00').map((p) => p.gun)).toEqual(['2026-10-13', '2026-10-14']);
    expect(kartAlarmPlani([her], new Set(['h']), BUGUN, '06:00').map((p) => p.gun)).toEqual([
      '2026-10-13',
      '2026-10-14',
    ]);
    expect(kartAlarmPlani([her], new Set(), BUGUN, '06:00').map((p) => p.gun)).toEqual([
      BUGUN,
      '2026-10-13',
      '2026-10-14',
    ]);
  });

  it('alarmlı karta bildirim planlanmaz; alarm kimliği karta eşlenir', () => {
    const girdi = {
      animsaticilar: [],
      gunDurumlari: [],
      kartlar: [doktor],
      bugunYapilanlar: new Set<string>(),
      bugunGun: BUGUN,
      simdi: '08:00',
    };
    expect(bildirimPlani(girdi)).toHaveLength(1);
    expect(bildirimPlani({ ...girdi, alarmlaCalanlar: new Set(['d']) })).toHaveLength(0);
    expect(kartAlarminiEslestir(kartAlarmKimligi('d', '2026-10-13'), [doktor], '2026-10-13')).toEqual({
      kart: doktor,
      gun: '2026-10-13',
    });
    expect(kartAlarminiEslestir('x', [doktor], BUGUN)).toBeNull();
  });
});
