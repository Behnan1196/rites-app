// Uygulamayla gelen içerikten (`mantik/hazirIcerik.ts`) sunucudaki kataloğun ilk
// içeriğini üretir: `npx tsx sunucu/icerik-uret.ts > sunucu/icerik.sql`.
// Var olan satırlara dokunmaz (uzmanın değişiklikleri korunur).

import { hatirlatmaYaz } from '../mantik/kart';
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
    `insert into public.icerik_kart (id, alanlar, baslik, kisa, saat, hatirlatma, tekrar, bloklar, tur, sira) values (${m(c.id)}, ${j(c.alanlar)}, ${m(c.baslik)}, ${m(c.kisa)}, ${m(c.saat)}, ${m(hatirlatmaYaz(c.hatirlatma ?? null))}, ${j(c.tekrar)}, ${j(c.bloklar.map(({ dosya: _d, ...b }) => b))}, ${m(c.tur)}, ${(i + 1) * 10}) on conflict (id) do nothing;`,
  ),
);
satirlar.push('');
k.programlar.forEach((p, i) =>
  satirlar.push(
    `insert into public.icerik_program (id, alanlar, ad, aciklama, sure, kartlar, sira) values (${m(p.id)}, ${j(p.alanlar)}, ${m(p.ad)}, ${m(p.aciklama)}, ${p.sure ?? 'null'}, ${j(p.kartlar)}, ${(i + 1) * 10}) on conflict (id) do nothing;`,
  ),
);
satirlar.push('');
k.cesitler.forEach((c, i) =>
  satirlar.push(
    `insert into public.icerik_cesit (id, alan, ad, ikon, aciklama, baslik, baslik_ipucu, saat, tekrar, bloklar, seri, sira) values (${m(c.id)}, ${m(c.alan)}, ${m(c.ad)}, ${m(c.ikon)}, ${m(c.aciklama)}, ${m(c.baslik)}, ${m(c.baslikIpucu)}, ${m(c.saat)}, ${j(c.tekrar)}, ${j(c.bloklar.map(({ dosya: _d, ...b }) => b))}, ${c.seri ?? 'null'}, ${(i + 1) * 10}) on conflict (id) do nothing;`,
  ),
);
// P-49: önceden yüklenmiş çeşitlerde seri boşsa uygulamadakine eşitlenir (elle verilen değere dokunulmaz).
k.cesitler
  .filter((c) => c.seri !== null)
  .forEach((c) =>
    satirlar.push(`update public.icerik_cesit set seri = ${c.seri} where id = ${m(c.id)} and seri is null;`),
  );
process.stdout.write(satirlar.join('\n') + '\n');
