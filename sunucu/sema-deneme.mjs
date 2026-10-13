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

// Hesabımı sil
await olarak(ayse, () => q('select hesabimi_sil()'));
esit('Ayşe ve Gelenler\'i silinir', [(await q('select count(*)::int n from kullanici where id = $1', [ayse])).rows[0].n, (await q('select count(*)::int n from gelen')).rows[0].n], [0, 0]);
await ex('set role anon'); await hataBekle('oturumsuz çağrılamaz', () => q(`select kisi_ekle('a@b.c')`), 'permission denied');
await ex('reset role');
console.log(hatalar ? `${hatalar} HATA` : 'HEPSİ TAMAM');
