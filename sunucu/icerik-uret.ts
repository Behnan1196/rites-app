// Uygulamayla gelen içerikten (`mantik/hazirIcerik.ts`) sunucudaki kataloğun ilk
// içeriğini üretir: `npx tsx sunucu/icerik-uret.ts > sunucu/icerik.sql`.
// Var olan satırlara dokunmaz (uzmanın değişiklikleri korunur).

import { gomuluKatalog } from '../mantik/katalog';

const k = gomuluKatalog();
const m = (s: string | null) => (s === null ? 'null' : `'${s.replace(/'/g, "''")}'`);
const j = (x: unknown) => (x === null ? 'null' : `${m(JSON.stringify(x))}::jsonb`);
const satirlar: string[] = [
  '-- Rites içerik kataloğunun ilk içeriği (uygulamayla gelenin aynısı).',
  '-- `sema.sql`den sonra bir kez çalıştırılır; yeniden çalıştırmak güvenlidir (var olana dokunmaz).',
  '-- Üreten: sunucu/icerik-uret.ts',
  '',
];
k.alanlar.forEach((a, i) =>
  satirlar.push(
    `insert into public.icerik_alan (anahtar, ad, aciklama, ikon, varsayilan_acik, sira) values (${m(a.anahtar)}, ${m(a.ad)}, ${m(a.aciklama)}, ${m(a.ikon)}, ${a.varsayilanAcik}, ${(i + 1) * 10}) on conflict (anahtar) do nothing;`,
  ),
);
satirlar.push('');
k.kartlar.forEach((c, i) =>
  satirlar.push(
    `insert into public.icerik_kart (id, alanlar, baslik, kisa, saat, tekrar, bloklar, tur, sira) values (${m(c.id)}, ${j(c.alanlar)}, ${m(c.baslik)}, ${m(c.kisa)}, ${m(c.saat)}, ${j(c.tekrar)}, ${j(c.bloklar.map(({ dosya: _d, ...b }) => b))}, ${m(c.tur)}, ${(i + 1) * 10}) on conflict (id) do nothing;`,
  ),
);
satirlar.push('');
k.programlar.forEach((p, i) =>
  satirlar.push(
    `insert into public.icerik_program (id, alanlar, ad, aciklama, sure, kartlar, sira) values (${m(p.id)}, ${j(p.alanlar)}, ${m(p.ad)}, ${m(p.aciklama)}, ${p.sure ?? 'null'}, ${j(p.kartlar)}, ${(i + 1) * 10}) on conflict (id) do nothing;`,
  ),
);
process.stdout.write(satirlar.join('\n') + '\n');
