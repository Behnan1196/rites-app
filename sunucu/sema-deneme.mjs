// Sunucu şemasının denemesi: gerçek Postgres (PGlite) üzerinde Supabase benzeri ortam.
// Çalıştırma: npm run sunucu-denemesi
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const db = new PGlite();
const q = (s, p) => db.query(s, p);
const ex = (s) => db.exec(s);
// Supabase benzeri ortam
await ex(`
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
`);
const sema = fs.readFileSync(process.argv[2], 'utf8');
await ex(sema);
await ex(sema); // yeniden çalıştırmak güvenli mi
let hatalar = 0;
const esit = (ad, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) hatalar++; console.log(ok ? 'TAMAM' : 'HATA ', ad, ok ? '' : JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); };
const hataBekle = async (ad, f, parca) => { try { await f(); hatalar++; console.log('HATA ', ad, 'hata bekleniyordu'); } catch (e) { const ok = !parca || String(e.message).includes(parca); if (!ok) hatalar++; console.log(ok ? 'TAMAM' : 'HATA ', ad, ok ? '' : e.message); } };
const kayit = async (email, onayli = true) => (await q(`insert into auth.users (email, email_confirmed_at) values ($1, ${onayli ? 'now()' : 'null'}) returning id`, [email])).rows[0].id;
const olarak = async (uid, f) => { await ex(`set role authenticated; select set_config('test.uid', '${uid}', false);`); try { return await f(); } finally { await ex(`reset role;`); } };

const ali = await kayit('Ali@Ornek.com');
const ayse = await kayit('ayse@ornek.com');
esit('katılınca kullanıcı satırı (küçük harf)', (await q('select eposta from kullanici order by eposta')).rows.map(r => r.eposta), ['ali@ornek.com', 'ayse@ornek.com']);

// Ali, Ayşe'yi ekler → istek
esit('Rites\'taki kişi: istek', (await olarak(ali, () => q(`select kisi_ekle('AYSE@ornek.com ') r`))).rows[0].r.sonuc, 'istek');
await hataBekle('aynı kişi ikinci kez', () => olarak(ali, () => q(`select kisi_ekle('ayse@ornek.com')`)), 'zaten');
await hataBekle('kendini ekleyemez', () => olarak(ali, () => q(`select kisi_ekle('ali@ornek.com')`)), 'kendin');
esit('Ayşe isteği görür', (await olarak(ayse, () => q('select durum, isteyen from baglanti'))).rows, [{ durum: 'istek', isteyen: ali }]);
esit('Ayşe, Ali\'nin adını ve e-postasını görür', (await olarak(ayse, () => q('select eposta from kullanici order by eposta'))).rows.length, 2);

// Bağlı değilken kart gönderilemez
await hataBekle('bağlı değilken kart yok', () => olarak(ali, () => q(`insert into gelen (kimden, kime, kart) values ($1, $2, '{}')`, [ali, ayse])), 'row-level security');
// İsteyen kendi isteğini kabul edemez
await hataBekle('isteyen kabul edemez', () => olarak(ali, () => q(`select istegi_kabul_et($1)`, [ayse])), 'istek yok');
await olarak(ayse, () => q(`select istegi_kabul_et($1)`, [ali]));
esit('kabul → bağlı', (await q('select durum from baglanti')).rows[0].durum, 'bagli');

// Kart gönder, alıcı görür, gönderen göremez, başkası göremez
await olarak(ali, () => q(`insert into gelen (kimden, kime, kart) values ($1, $2, '{"baslik":"Bulgur"}')`, [ali, ayse]));
esit('alıcı Gelenler\'i görür', (await olarak(ayse, () => q('select kart from gelen'))).rows.map(r => r.kart.baslik), ['Bulgur']);
esit('gönderen göremez', (await olarak(ali, () => q('select * from gelen'))).rows.length, 0);
await hataBekle('başkası adına gönderilemez', () => olarak(ali, () => q(`insert into gelen (kimden, kime, kart) values ($1, $2, '{}')`, [ayse, ali])), 'row-level security');

// Yetkisiz yazmalar
await hataBekle('bağlantı doğrudan eklenemez', () => olarak(ali, () => q(`insert into baglanti (a,b,durum,isteyen) values ($1,$2,'bagli',$1)`, [ali < ayse ? ali : ayse, ali < ayse ? ayse : ali])), 'permission denied');
await hataBekle('e-posta değiştirilemez', () => olarak(ali, () => q(`update kullanici set eposta = 'x@y.z' where id = $1`, [ali])), 'permission denied');
await olarak(ali, () => q(`update kullanici set ad = 'Ali' where id = $1`, [ali]));
await olarak(ali, () => q(`update kullanici set ad = 'Kötü' where id = $1`, [ayse]));
esit('yalnız kendi adını değiştirir', (await q('select ad from kullanici order by eposta')).rows.map(r => r.ad), ['Ali', '']);

// Davet → katılınca isteğe döner; davet e-postasıyla açılan ama girmeyen "Rites'ta değil"
esit('Rites\'ta olmayan: davet', (await olarak(ali, () => q(`select kisi_ekle('mehmet@ornek.com') r`))).rows[0].r.sonuc, 'davet');
const mehmet = await kayit('mehmet@ornek.com', false); // davetle açıldı, henüz girmedi
esit('girmeyen kişi kullanıcı sayılmaz', (await q(`select count(*)::int n from kullanici where eposta = 'mehmet@ornek.com'`)).rows[0].n, 0);
await q('update auth.users set email_confirmed_at = now() where id = $1', [mehmet]);
esit('girince davet isteğe döner', (await olarak(mehmet, () => q('select durum, isteyen from baglanti'))).rows, [{ durum: 'istek', isteyen: ali }]);
esit('davet silinir', (await q('select count(*)::int n from davet')).rows[0].n, 0);

// Karşılıklı ekleme: o seni istemişken sen onu eklersen bağlanırsınız
const zeynep = await kayit('zeynep@ornek.com');
await olarak(zeynep, () => q(`select kisi_ekle('ayse@ornek.com')`));
esit('karşılıklı ekleme → bağlı', (await olarak(ayse, () => q(`select kisi_ekle('zeynep@ornek.com') r`))).rows[0].r.sonuc, 'bagli');

// Ücretsiz sınır: 5
const yeni = [];
for (let i = 0; i < 4; i++) yeni.push(`k${i}@ornek.com`);
for (const e of yeni) await olarak(mehmet, () => q(`select kisi_ekle($1)`, [e]));
await olarak(mehmet, () => q(`select kisi_ekle('k4@ornek.com')`)); // 5. (davetler sayılır)
await hataBekle('6. kişi: sınır', () => olarak(mehmet, () => q(`select kisi_ekle('k5@ornek.com')`)), 'sinir');
esit('seni ekleyenler sınıra sayılmaz', (await q(`select ekledigim_sayi($1) n`, [mehmet])).rows[0].n, 5);

// Reddet / Sil iki tarafta da koparır
await olarak(mehmet, () => q('delete from baglanti'));
esit('Mehmet silince Ali de göremez', (await olarak(ali, () => q('select * from baglanti where $1 in (a,b)', [mehmet]))).rows.length, 0);

// ---- Gruplar ve ortak listeler (10. görev) ----
// Ayşe şu an Ali ve Zeynep ile bağlı; Veli kimseyle bağlı değil.
const veli = await kayit('veli@ornek.com');
const tek = async (uid, sorgu, p = []) => (await olarak(uid, () => q(sorgu, p))).rows[0];
await hataBekle('bağlı olmayan gruba çağrılamaz', () => olarak(ayse, () => q(`select grup_kur('Aile', array[$1]::uuid[])`, [veli])), 'bagli degil');
await hataBekle('adsız grup olmaz', () => olarak(ayse, () => q(`select grup_kur('  ', '{}')`)), 'ad yok');
const aile = (await tek(ayse, `select grup_kur(' Aile ', array[$1,$2]::uuid[]) g`, [ali, zeynep])).g;
esit('kuran üye, çağrılanlar davetli', (await q('select durum from grup_uye where grup=$1 order by durum', [aile])).rows.map(r => r.durum), ['davet', 'davet', 'uye']);
esit('davetli grubu ve kuranı görür', (await tek(ali, 'select gruplarim() g')).g.map(x => [x.ad, x.benim, x.kurucu === ayse]), [['Aile', 'davet', true]]);
esit('dışarıdaki grubu göremez', (await olarak(veli, () => q('select * from grup'))).rows.length, 0);
await hataBekle('grup doğrudan eklenemez', () => olarak(veli, () => q(`insert into grup (kurucu, ad) values ($1, 'X')`, [veli])), 'permission denied');
await hataBekle('üyelik doğrudan değiştirilemez', () => olarak(ali, () => q(`update grup_uye set durum = 'uye' where grup = $1`, [aile])), 'permission denied');
await hataBekle('kurucu olmayan gruba çağıramaz', () => olarak(ali, () => q('select gruba_cagir($1, $2)', [aile, zeynep])), 'yetki yok');

const market = (await tek(ayse, `select liste_olustur('Market', array[$1]::uuid[], '{}') l`, [aile])).l;
esit('daveti kabul etmeyen listeyi görmez', (await tek(ali, 'select listelerim() l')).l.length, 0);
await olarak(ali, () => q('select grup_davetini_yanitla($1, true)', [aile]));
esit('katılınca gruba açık listeyi görür', (await tek(ali, 'select listelerim() l')).l.map(x => [x.ad, x.uyeler.length, x.gruplar[0].ad]), [['Market', 2, 'Aile']]);
await olarak(zeynep, () => q('select grup_davetini_yanitla($1, false)', [aile]));
esit('reddeden gruptan çıkar', (await q('select count(*)::int n from grup_uye where grup=$1', [aile])).rows[0].n, 2);
await hataBekle('olmayan daveti yanıtlayamaz', () => olarak(zeynep, () => q('select grup_davetini_yanitla($1, true)', [aile])), 'davet yok');

// Maddeler
await olarak(ali, () => q(`insert into madde (liste, metin, ekleyen) values ($1, 'Süt', $2)`, [market, ali]));
await hataBekle('başkası adına madde eklenemez', () => olarak(ali, () => q(`insert into madde (liste, metin, ekleyen) values ($1, 'X', $2)`, [market, ayse])), 'row-level security');
await hataBekle('erişimi olmayan madde ekleyemez', () => olarak(veli, () => q(`insert into madde (liste, metin, ekleyen) values ($1, 'X', $2)`, [market, veli])), 'row-level security');
esit('erişimi olmayan maddeyi görmez', (await olarak(veli, () => q('select * from madde'))).rows.length, 0);
await hataBekle('listede olmayana verilemez', () => olarak(ali, () => q('update madde set kime = $1 where liste = $2', [veli, market])), 'row-level security');
await olarak(ali, () => q(`update madde set kime = $1, tarih = '2026-10-15' where liste = $2`, [ayse, market]));
esit('Ayşe\'ye tarihle verilen madde ajandasında', (await tek(ayse, 'select bana_verilenler() b')).b.map(x => [x.metin, x.tarih, x.listeAdi]), [['Süt', '2026-10-15', 'Market']]);
esit('Ali\'nin ajandasında yok', (await tek(ali, 'select bana_verilenler() b')).b.length, 0);
await olarak(ayse, () => q('update madde set yapildi = true where liste = $1', [market]));
esit('işaret herkes için', (await olarak(ali, () => q('select yapildi from madde'))).rows[0].yapildi, true);
await hataBekle('madde başka listeye taşınamaz', () => olarak(ali, () => q('update madde set liste = $1', [market])), 'permission denied');
esit('kalan madde sayısı', (await tek(ayse, 'select listelerim() l')).l[0].kalan, 0);

// Liste yetkisi yalnız kuranda
await hataBekle('paylaşımı yalnız kuran değiştirir', () => olarak(ali, () => q(`select liste_duzenle($1, 'X', '{}', '{}')`, [market])), 'yetki yok');
await olarak(ali, () => q('delete from liste where id = $1', [market]));
esit('listeyi yalnız kuran siler', (await q('select count(*)::int n from liste')).rows[0].n, 1);
await hataBekle('bağlı olmayan kişiye liste açılamaz', () => olarak(ayse, () => q(`select liste_olustur('X', '{}', array[$1]::uuid[])`, [veli])), 'bagli degil');
await hataBekle('üyesi olmadığın gruba liste açılamaz', () => olarak(zeynep, () => q(`select liste_olustur('X', array[$1]::uuid[], '{}')`, [aile])), 'grup yok');

// Adlar: aynı listedeki ama bağlı olmayan kişiler birbirini görür
esit('Ali, Zeynep\'i göremez', (await olarak(ali, () => q('select * from kullanici where id = $1', [zeynep]))).rows.length, 0);
const piknik = (await tek(ayse, `select liste_olustur('Piknik', array[$1]::uuid[], array[$2]::uuid[]) l`, [aile, zeynep])).l;
esit('aynı listede: Ali, Zeynep\'in adını görür', (await olarak(ali, () => q('select eposta from kullanici where id = $1', [zeynep]))).rows.map(r => r.eposta), ['zeynep@ornek.com']);
esit('Zeynep listeyi görür', (await tek(zeynep, 'select listelerim() l')).l.map(x => x.ad), ['Piknik']);
await olarak(zeynep, () => q('delete from liste_erisim where liste = $1', [piknik]));
esit('Listeden ayrıl', (await tek(zeynep, 'select listelerim() l')).l.length, 0);
await olarak(ayse, () => q(`select liste_duzenle($1, 'Piknik', array[$2]::uuid[], array[$3]::uuid[])`, [piknik, aile, zeynep]));
esit('kuran yeniden ekler', (await tek(zeynep, 'select listelerim() l')).l.length, 1);

// Gruptan ayrıl, çıkar, grubu sil
await olarak(ayse, () => q('delete from grup_uye where grup = $1 and kullanici = $2', [aile, ayse]));
esit('kuran gruptan ayrılamaz', (await q('select count(*)::int n from grup_uye where grup = $1', [aile])).rows[0].n, 2);
await olarak(ali, () => q('delete from grup_uye where grup = $1 and kullanici = $2', [aile, ali]));
esit('ayrılan gruba açık listeleri görmez', (await tek(ali, 'select listelerim() l')).l.length, 0);
await olarak(ayse, () => q('select gruba_cagir($1, $2)', [aile, ali]));
await olarak(ali, () => q('select grup_davetini_yanitla($1, true)', [aile]));
await olarak(ayse, () => q('delete from grup_uye where grup = $1 and kullanici = $2', [aile, ali]));
esit('kuran çıkarır', (await tek(ali, 'select gruplarim() g')).g.length, 0);
await olarak(ali, () => q('delete from grup where id = $1', [aile]));
esit('grubu yalnız kuran siler', (await q('select count(*)::int n from grup')).rows[0].n, 1);
await olarak(ayse, () => q('delete from grup where id = $1', [aile]));
esit('grup silinince erişimi de gider', (await q('select count(*)::int n from liste_erisim where grup is not null')).rows[0].n, 0);
await olarak(zeynep, () => q(`insert into madde (liste, metin, ekleyen, kime, tarih) values ($1, 'Termos', $2, $2, '2026-10-20')`, [piknik, zeynep]));

// Hesabımı sil
await olarak(ayse, () => q('select hesabimi_sil()'));
esit('Ayşe ve Gelenler\'i silinir', [(await q('select count(*)::int n from kullanici where id = $1', [ayse])).rows[0].n, (await q('select count(*)::int n from gelen')).rows[0].n], [0, 0]);
esit('Ayşe\'nin listeleri ve maddeleri silinir', [(await q('select count(*)::int n from liste')).rows[0].n, (await q('select count(*)::int n from madde')).rows[0].n], [0, 0]);
await ex('set role anon'); await hataBekle('oturumsuz çağrılamaz', () => q(`select kisi_ekle('a@b.c')`), 'permission denied');
await hataBekle('oturumsuz liste okunamaz', () => q('select listelerim()'), 'permission denied');
await ex('reset role');
console.log(hatalar ? `${hatalar} HATA` : 'HEPSİ TAMAM');
