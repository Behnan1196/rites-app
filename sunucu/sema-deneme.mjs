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
// pg_net'in sahtesi: gönderilen istekler bir tabloya yazılır (bildirim denemesi için).
await ex(`
create schema if not exists net;
create table net.giden (url text, body jsonb, headers jsonb);
create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds integer default 5000)
returns bigint language sql as $$ insert into net.giden values (url, body, headers) returning 1::bigint $$;
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

// Buluşma (pilot 18 Ekim)
const bul = (await tek(ayse, `select bulusma_kur($1, 'Akşam yemeği', '2099-01-10', '19:30', 'Bizde') b`, [aile])).b;
esit('kuran geliyor sayılır', (await tek(ayse, 'select bulusmalarim() b')).b[0].yanitlar.map(y => y.yanit), ['geliyorum']);
esit('grup üyesi buluşmayı görür', (await tek(ali, 'select bulusmalarim() b')).b.map(x => [x.baslik, x.grupAdi, x.saat]), [['Akşam yemeği', 'Aile', '19:30']]);
esit('grupta olmayan görmez', (await tek(zeynep, 'select bulusmalarim() b')).b.length, 0);
await hataBekle('grupta olmayan yanıtlayamaz', () => olarak(zeynep, () => q(`select bulusma_yanitla($1, 'geliyorum')`, [bul])), 'yetki yok');
await hataBekle('grupta olmayan kuramaz', () => olarak(zeynep, () => q(`select bulusma_kur($1, 'X', '2099-01-10', null, '')`, [aile])), 'grup yok');
await olarak(ali, () => q(`select bulusma_yanitla($1, 'belki')`, [bul]));
await olarak(ali, () => q(`select bulusma_yanitla($1, 'geliyorum')`, [bul]));
esit('yanıt değişir', (await tek(ali, 'select bulusmalarim() b')).b[0].yanitlar.length, 2);
await hataBekle('yanlış yanıt', () => olarak(ali, () => q(`select bulusma_yanitla($1, 'evet')`, [bul])), 'check');
await hataBekle('yanıt doğrudan yazılamaz', () => olarak(ali, () => q(`insert into bulusma_yanit values ($1, $2, 'gelemem')`, [bul, ali])), 'permission denied');
await hataBekle('başkası düzenleyemez', () => olarak(ali, () => q(`select bulusma_duzenle($1, 'X', '2099-01-10', '19:30', '')`, [bul])), 'yetki yok');
await olarak(ayse, () => q(`select bulusma_duzenle($1, 'Akşam yemeği', '2099-01-10', '19:30', 'Dışarıda')`, [bul]));
esit('yer değişince yanıtlar kalır', (await tek(ali, 'select bulusmalarim() b')).b[0].yanitlar.length, 2);
await olarak(ayse, () => q(`select bulusma_duzenle($1, 'Akşam yemeği', '2099-01-11', '19:30', 'Dışarıda')`, [bul]));
esit('gün değişince yalnız kuranın yanıtı kalır', (await tek(ali, 'select bulusmalarim() b')).b[0].yanitlar.map(y => y.kullanici), [ayse]);
await olarak(ali, () => q(`select bulusma_yanitla($1, 'geliyorum')`, [bul]));
await olarak(ali, () => q(`select bulusma_yanitla($1, null)`, [bul]));
esit('yanıt geri alınır', (await tek(ali, 'select bulusmalarim() b')).b[0].yanitlar.length, 1);
await hataBekle('saat biçimi', () => olarak(ayse, () => q(`select bulusma_kur($1, 'X', '2099-01-10', '25:00', '')`, [aile])), 'check');
await olarak(ali, () => q('delete from bulusma where id = $1', [bul]));
esit('üye başkasının buluşmasını silemez', (await q('select count(*)::int n from bulusma')).rows[0].n, 1);
await olarak(ayse, () => q('delete from bulusma where id = $1', [bul]));
esit('kuran siler, yanıtlar da gider', [(await q('select count(*)::int n from bulusma')).rows[0].n, (await q('select count(*)::int n from bulusma_yanit')).rows[0].n], [0, 0]);
await olarak(ayse, () => q(`select bulusma_kur($1, 'Piknik', '2099-02-01', null, '')`, [aile]));

// Birlikte rutin (pilot 18 Ekim)
const yur = (await tek(ayse, `select rutin_kur($1, 'Yürüyüş', 3) r`, [aile])).r;
esit('kuran katılmış sayılır', (await tek(ali, `select rutinlerim('2099-01-01') r`)).r.map(x => [x.ad, x.hedef, x.katilanlar.length, x.grupAdi]), [['Yürüyüş', 3, 1, 'Aile']]);
await hataBekle('katılmadan işaretlenemez', () => olarak(ali, () => q(`select rutin_isaretle($1, '2099-01-05', true)`, [yur])), 'katilmadin');
await olarak(ali, () => q('select rutine_katil($1, true)', [yur]));
await olarak(ali, () => q(`select rutin_isaretle($1, '2099-01-05', true)`, [yur]));
await olarak(ali, () => q(`select rutin_isaretle($1, '2099-01-05', true)`, [yur]));
await olarak(ali, () => q(`select rutin_isaretle($1, '2099-01-06', true)`, [yur]));
await olarak(ali, () => q(`select rutin_isaretle($1, '2098-12-01', true)`, [yur]));
const aliGunleri = async () => (await tek(ayse, `select rutinlerim('2099-01-01') r`)).r[0].katilanlar.find(k => k.kullanici === ali).gunler;
esit('günler (p_ilk sonrası, tekrarsız)', await aliGunleri(), ['2099-01-05', '2099-01-06']);
await olarak(ali, () => q(`select rutin_isaretle($1, '2099-01-06', false)`, [yur]));
esit('geri alınır', await aliGunleri(), ['2099-01-05']);
await hataBekle('kayıt doğrudan yazılamaz', () => olarak(ali, () => q(`insert into rutin_kayit values ($1, $2, '2099-01-07')`, [yur, ali])), 'permission denied');
await hataBekle('grupta olmayan katılamaz', () => olarak(zeynep, () => q('select rutine_katil($1, true)', [yur])), 'yetki yok');
esit('grupta olmayan görmez', (await tek(zeynep, `select rutinlerim('2099-01-01') r`)).r.length, 0);
await hataBekle('hedef 1–7', () => olarak(ayse, () => q(`select rutin_kur($1, 'X', 8)`, [aile])), 'check');
await hataBekle('başkası düzenleyemez', () => olarak(ali, () => q(`select rutin_duzenle($1, 'X', 2)`, [yur])), 'yetki yok');
await olarak(ayse, () => q(`select rutin_duzenle($1, 'Akşam yürüyüşü', 4)`, [yur]));
await olarak(ali, () => q('select rutine_katil($1, false)', [yur]));
esit('ayrılınca kayıtları da silinir', [(await q('select count(*)::int n from rutin_kayit')).rows[0].n, (await tek(ayse, `select rutinlerim('2099-01-01') r`)).r[0].katilanlar.length], [0, 1]);
await olarak(ali, () => q('delete from rutin where id = $1', [yur]));
esit('üye başkasının rutinini silemez', (await q('select count(*)::int n from rutin')).rows[0].n, 1);
await olarak(ayse, () => q('delete from rutin where id = $1', [yur]));
esit('kuran siler', (await q('select count(*)::int n from rutin_katilim')).rows[0].n, 0);
await olarak(ayse, () => q(`select rutin_kur($1, 'Okuma', 7)`, [aile]));

// Nöbet (pilot 18 Ekim)
await hataBekle('sırada gruptan olmayan', () => olarak(ayse, () => q(`select nobet_kur($1, 'Çöp', '{0,3}', array[$2,$3]::uuid[], '2099-01-05')`, [aile, ayse, veli])), 'sira gecersiz');
await hataBekle('gün 0–6', () => olarak(ayse, () => q(`select nobet_kur($1, 'Çöp', '{7}', array[$2]::uuid[], '2099-01-05')`, [aile, ayse])), 'check');
const cop = (await tek(ayse, `select nobet_kur($1, ' Çöp ', '{0,3}', array[$2,$3]::uuid[], '2099-01-05') n`, [aile, ali, ayse])).n;
esit('üye görür', (await tek(ali, `select nobetlerim('2099-01-01') n`)).n.map(x => [x.ad, x.gunler, x.sira.length, x.grupAdi]), [['Çöp', [0, 3], 2, 'Aile']]);
esit('grupta olmayan görmez', (await tek(zeynep, `select nobetlerim('2099-01-01') n`)).n.length, 0);
await olarak(ali, () => q(`select nobet_isaretle($1, '2099-01-05', true)`, [cop]));
await olarak(ayse, () => q(`select nobet_isaretle($1, '2099-01-05', true)`, [cop]));
esit('günü ilk yapan kalır', (await tek(ayse, `select nobetlerim('2099-01-01') n`)).n[0].kayitlar, [{ gun: '2099-01-05', yapan: ali }]);
await olarak(ayse, () => q(`select nobet_isaretle($1, '2099-01-05', false)`, [cop]));
esit('başkasının işaretini geri alamaz', (await tek(ayse, `select nobetlerim('2099-01-01') n`)).n[0].kayitlar.length, 1);
await olarak(ali, () => q(`select nobet_isaretle($1, '2099-01-05', false)`, [cop]));
esit('kendi işaretini geri alır', (await tek(ayse, `select nobetlerim('2099-01-01') n`)).n[0].kayitlar.length, 0);
await hataBekle('grupta olmayan işaretleyemez', () => olarak(zeynep, () => q(`select nobet_isaretle($1, '2099-01-05', true)`, [cop])), 'yetki yok');
await hataBekle('kayıt doğrudan yazılamaz', () => olarak(ali, () => q(`insert into nobet_kayit values ($1, '2099-01-06', $2)`, [cop, ali])), 'permission denied');
await hataBekle('başkası düzenleyemez', () => olarak(ali, () => q(`select nobet_duzenle($1, 'X', '{1}', array[$2]::uuid[], '2099-01-06')`, [cop, ali])), 'yetki yok');
await olarak(ayse, () => q(`select nobet_duzenle($1, 'Çöp', '{0,1,2,3,4,5,6}', array[$2]::uuid[], '2099-01-07')`, [cop, ayse]));
esit('düzenlenir', (await tek(ali, `select nobetlerim('2099-01-01') n`)).n.map(x => [x.gunler.length, x.sira, x.baslangic]), [[7, [ayse], '2099-01-07']]);
await olarak(ali, () => q('delete from nobet where id = $1', [cop]));
esit('üye başkasının nöbetini silemez', (await q('select count(*)::int n from nobet')).rows[0].n, 1);
await olarak(ayse, () => q('delete from nobet where id = $1', [cop]));
esit('kuran siler', (await q('select count(*)::int n from nobet')).rows[0].n, 0);
await olarak(ayse, () => q(`select nobet_kur($1, 'Bulaşık', '{0}', array[$2]::uuid[], '2099-01-05')`, [aile, ayse]));

// İş (pilot 18 Ekim)
const isDurum = async (id, kim = ayse) => (await tek(kim, 'select islerim() i')).i.find(x => x.id === id);
const acik = (await tek(ayse, `select is_ekle($1, 'Eczaneye uğra', null, null) i`, [aile])).i;
esit('herkese açık', (await isDurum(acik)).durum, 'acik');
await olarak(ali, () => q(`select is_yanitla($1, 'al')`, [acik]));
esit('Ben alırım', [(await isDurum(acik)).durum, (await isDurum(acik)).alan], ['alindi', ali]);
await hataBekle('alınmış iş yeniden alınamaz', () => olarak(ayse, () => q(`select is_yanitla($1, 'al')`, [acik])), 'durum');
await hataBekle('başkası yaptım diyemez', () => olarak(ayse, () => q(`select is_yanitla($1, 'yaptim')`, [acik])), 'durum');
await olarak(ali, () => q(`select is_yanitla($1, 'birak')`, [acik]));
esit('bırakınca yeniden açılır', [(await isDurum(acik)).durum, (await isDurum(acik)).alan], ['acik', null]);
await olarak(ali, () => q(`select is_yanitla($1, 'al')`, [acik]));
await olarak(ali, () => q(`select is_yanitla($1, 'yaptim')`, [acik]));
esit('yapıldı', (await isDurum(acik)).durum, 'yapildi');
await olarak(ali, () => q(`select is_yanitla($1, 'geri')`, [acik]));
esit('geri alınır', (await isDurum(acik)).durum, 'alindi');
const ist = (await tek(ayse, `select is_ekle($1, 'Faturayı öde', '2099-01-10', $2) i`, [aile, ali])).i;
esit('birinden istendi', (await isDurum(ist)).durum, 'istendi');
await hataBekle('istenmeyen kabul edemez', () => olarak(ayse, () => q(`select is_yanitla($1, 'al')`, [ist])), 'durum');
await olarak(ali, () => q(`select is_yanitla($1, 'reddet')`, [ist]));
esit('ret isteyene döner', (await isDurum(ist)).durum, 'reddedildi');
await hataBekle('kendinden istenemez', () => olarak(ayse, () => q(`select is_duzenle($1, 'Faturayı öde', null, $2)`, [ist, ayse])), 'kime gecersiz');
await hataBekle('gruptan olmayana istenemez', () => olarak(ayse, () => q(`select is_ekle($1, 'X', null, $2)`, [aile, veli])), 'kime gecersiz');
await hataBekle('başkası düzenleyemez', () => olarak(ali, () => q(`select is_duzenle($1, 'X', null, null)`, [ist])), 'yetki yok');
await olarak(ayse, () => q(`select is_duzenle($1, 'Faturayı öde', null, null)`, [ist]));
esit('herkese açılır', (await isDurum(ist)).durum, 'acik');
await olarak(ayse, () => q(`select is_duzenle($1, 'Faturayı öde', null, $2)`, [ist, ali]));
await olarak(ali, () => q(`select is_yanitla($1, 'al')`, [ist]));
await olarak(ali, () => q(`select is_yanitla($1, 'birak')`, [ist]));
esit('istenen iş bırakılınca isteyene döner', (await isDurum(ist)).durum, 'reddedildi');
esit('grupta olmayan görmez', (await tek(zeynep, 'select islerim() i')).i.length, 0);
await hataBekle('doğrudan yazılamaz', () => olarak(ali, () => q(`update grup_is set durum = 'yapildi' where id = $1`, [ist])), 'permission denied');
await olarak(ali, () => q('delete from grup_is where id = $1', [ist]));
esit('üye başkasının işini silemez', (await q('select count(*)::int n from grup_is')).rows[0].n, 2);
await olarak(ayse, () => q('delete from grup_is where id = $1', [ist]));
esit('isteyen siler', (await q('select count(*)::int n from grup_is')).rows[0].n, 1);

// Karar / oylama (pilot 18 Ekim)
const kararOku = async (id, kim = ayse) => (await tek(kim, 'select kararlarim() k')).k.find(x => x.id === id);
await hataBekle('en az iki seçenek', () => olarak(ayse, () => q(`select karar_kur($1, 'Ne yiyelim?', 'metin', false, null, '', '[{"metin":"Pizza"}]')`, [aile])), 'secenek sayisi');
const yemek = (await tek(ayse, `select karar_kur($1, 'Ne yiyelim?', 'metin', false, null, '', '[{"metin":"Pizza"},{"metin":"Köfte"},{"metin":"Balık"}]') k`, [aile])).k;
const ys = (await kararOku(yemek)).secenekler.map(x => x.id);
esit('seçenekler sırayla', (await kararOku(yemek)).secenekler.map(x => x.metin), ['Pizza', 'Köfte', 'Balık']);
await hataBekle('tek seçimde iki oy', () => olarak(ali, () => q('select karar_oyla($1, $2::uuid[])', [yemek, [ys[0], ys[1]]])), 'tek secim');
await olarak(ali, () => q('select karar_oyla($1, $2::uuid[])', [yemek, [ys[0]]]));
await olarak(ali, () => q('select karar_oyla($1, $2::uuid[])', [yemek, [ys[1]]]));
await olarak(ayse, () => q('select karar_oyla($1, $2::uuid[])', [yemek, [ys[1]]]));
esit('oy değişir', (await kararOku(yemek)).oylar.filter(o => o.secenek === ys[1]).length, 2);
esit('Pizza oy almadı', (await kararOku(yemek)).oylar.filter(o => o.secenek === ys[0]).length, 0);
await hataBekle('grupta olmayan oy veremez', () => olarak(zeynep, () => q('select karar_oyla($1, $2::uuid[])', [yemek, [ys[0]]])), 'yetki yok');
await hataBekle('oy doğrudan yazılamaz', () => olarak(ali, () => q('insert into karar_oy values ($1, $2, $3)', [yemek, ys[2], ali])), 'permission denied');
await hataBekle('başkası karar veremez', () => olarak(ali, () => q('select karar_ver($1, $2)', [yemek, ys[1]])), 'yetki yok');
esit('metin kararında buluşma kurulmaz', (await tek(ayse, 'select karar_ver($1, $2) b', [yemek, ys[1]])).b, null);
esit('sonuç yazıldı', (await kararOku(yemek)).sonuc, ys[1]);
await hataBekle('karar verilince oy kapanır', () => olarak(ali, () => q('select karar_oyla($1, $2::uuid[])', [yemek, [ys[0]]])), 'kapali');
const gun = (await tek(ayse, `select karar_kur($1, 'Piknik', 'gun', true, null, 'Belgrad Ormanı', '[{"gun":"2099-02-01","saat":"10:00"},{"gun":"2099-02-02","saat":"10:00"}]') k`, [aile])).k;
const gs = (await kararOku(gun)).secenekler.map(x => x.id);
await olarak(ali, () => q('select karar_oyla($1, $2::uuid[])', [gun, gs]));
esit('çoklu seçimde iki oy', (await kararOku(gun)).oylar.length, 2);
const bulId = (await tek(ayse, 'select karar_ver($1, $2) b', [gun, gs[1]])).b;
esit('gün kararında buluşma kurulur', (await tek(ali, 'select bulusmalarim() b')).b.filter(x => x.id === bulId).map(x => [x.baslik, x.gun, x.saat, x.yer, x.yanitlar.length]), [['Piknik', '2099-02-02', '10:00', 'Belgrad Ormanı', 1]]);
const eski = (await tek(ayse, `select karar_kur($1, 'X', 'metin', false, '2000-01-01', '', '[{"metin":"a"},{"metin":"b"}]') k`, [aile])).k;
const eskiSecenek = (await kararOku(eski)).secenekler[0].id;
await hataBekle('son gün geçince oy verilmez', () => olarak(ali, () => q('select karar_oyla($1, $2::uuid[])', [eski, [eskiSecenek]])), 'kapali');
esit('grupta olmayan görmez', (await tek(zeynep, 'select kararlarim() k')).k.length, 0);
await olarak(ali, () => q('delete from karar where id = $1', [eski]));
esit('üye başkasının kararını silemez', (await q('select count(*)::int n from karar')).rows[0].n, 3);
await olarak(ayse, () => q('delete from karar where id = $1', [eski]));
esit('kuran siler', (await q('select count(*)::int n from karar')).rows[0].n, 2);

// Telefona bildirim (pilot 19 Ekim)
await ex('delete from net.giden');
await hataBekle('jeton yalnız işlevle yazılır', () => olarak(ali, () => q(`insert into bildirim_adresi values ('ExponentPushToken[ali]', $1, true, now())`, [ali])), 'permission denied');
await olarak(ali, () => q(`select bildirim_adresi_yaz('ExponentPushToken[ali-telefon]', true)`));
await olarak(ayse, () => q(`select bildirim_adresi_yaz('ExponentPushToken[ayse-telefon]', true)`));
esit('kendi jetonunu görür, başkasınınkini görmez', (await olarak(ali, () => q('select jeton from bildirim_adresi'))).rows.map(r => r.jeton), ['ExponentPushToken[ali-telefon]']);
const giden = async () => (await q('select body from net.giden')).rows.flatMap(r => r.body).map(m => [m.to.slice(18, -1), m.title, m.body, m.data.tur]);
const bIs = (await tek(ayse, `select is_ekle($1, 'Faturayı öde', null, $2) i`, [aile, ali])).i;
esit('istenen işte alıcıya bildirim', await giden(), [['ali-telefon', 'Aile', 'ayse senden istiyor: Faturayı öde', 'gelen']]);
await ex('delete from net.giden');
await olarak(ali, () => q(`select is_yanitla($1, 'al')`, [bIs]));
await olarak(ali, () => q(`select is_yanitla($1, 'yaptim')`, [bIs]));
esit('isteyene: kabul etti, tamamladı', (await giden()).map(m => m[2]), ['Ali kabul etti: Faturayı öde', 'Ali tamamladı: Faturayı öde']);
await ex('delete from net.giden');
await olarak(ali, () => q(`select bildirim_adresi_yaz('ExponentPushToken[ali-telefon]', false)`));
await olarak(ayse, () => q(`select bulusma_kur($1, 'Piknik', '2099-03-05', '10:30', '')`, [aile]));
esit('kapatan bildirim almaz', await giden(), []);
await olarak(ali, () => q(`select bildirim_adresi_yaz('ExponentPushToken[ali-telefon]', true)`));
await olarak(ayse, () => q(`select karar_kur($1, 'Ne yiyelim?', 'metin', false, null, '', '[{"metin":"a"},{"metin":"b"}]')`, [aile]));
await olarak(ayse, () => q(`select rutin_kur($1, 'Yürüyüş', 3)`, [aile]));
esit('oylama ve rutin: kurana gitmez, üyeye gider', (await giden()).map(m => [m[0], m[2]]), [['ali-telefon', 'Oylama: Ne yiyelim?'], ['ali-telefon', 'Birlikte rutin: Yürüyüş (haftada 3)']]);
await ex('delete from net.giden');
await olarak(ali, () => q(`insert into gelen (kimden, kime, kart) values ($1, $2, '{"baslik":"Bulgur"}')`, [ali, ayse]));
esit('gelen kart', await giden(), [['ayse-telefon', 'Ali', 'Sana bir kart gönderdi: Bulgur', 'gelen']]);
await olarak(ayse, () => q(`select bildirim_adresi_yaz('ExponentPushToken[ali-telefon]', true)`));
esit('aynı telefonda başka kullanıcı girince jeton ona geçer', (await q(`select kullanici from bildirim_adresi where jeton = 'ExponentPushToken[ali-telefon]'`)).rows[0].kullanici, ayse);

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
await hataBekle('oturumsuz buluşma okunamaz', () => q('select bulusmalarim()'), 'permission denied');
await hataBekle('oturumsuz karar okunamaz', () => q('select kararlarim()'), 'permission denied');
await hataBekle('oturumsuz iş okunamaz', () => q('select islerim()'), 'permission denied');
await hataBekle('oturumsuz nöbet okunamaz', () => q(`select nobetlerim('2099-01-01')`), 'permission denied');
await hataBekle('oturumsuz rutin okunamaz', () => q(`select rutinlerim('2099-01-01')`), 'permission denied');
await ex('reset role');
// İçerik kataloğu: herkes okur, kimse yazamaz; pasif satır görünmez.
const icerik = fs.readFileSync(new URL('./icerik.sql', import.meta.url), 'utf8');
await ex(icerik);
await ex(icerik); // yeniden çalıştırmak güvenli mi
await q(`update icerik_kart set baslik = 'Su (yeni)' where id = 'b1'`);
await q(`update icerik_kart set aktif = false where id = 'b2'`);
await ex('set role anon');
esit('oturumsuz alanları okur', (await q('select count(*)::int n from icerik_alan')).rows[0].n, 9);
esit('panelde değişen kart görünür, pasif görünmez', (await q(`select id, baslik from icerik_kart where id in ('b1','b2')`)).rows, [{ id: 'b1', baslik: 'Su (yeni)' }]);
esit('programlar okunur', (await q('select count(*)::int n from icerik_program')).rows[0].n > 0, true);
await hataBekle('oturumsuz içerik yazamaz', () => q(`insert into icerik_alan (anahtar, ad) values ('x', 'X')`), 'permission denied');
await ex('reset role');
await hataBekle('oturumlu içerik değiştiremez', () => olarak(ali, () => q(`update icerik_kart set baslik = 'x'`)), 'permission denied');
esit('güncelleme zamanı yenilenir', (await q(`select guncelleme > (select guncelleme from icerik_alan limit 1) - interval '1 day' ok from icerik_kart where id = 'b1'`)).rows[0].ok, true);
await hataBekle('özel alan anahtarı katalogda olamaz', () => q(`insert into icerik_alan (anahtar, ad) values ('ozel-1', 'X')`), 'check');
// Kart çeşitleri (P-41): herkes yayındakini okur; yalnız tasarımcı yazar ve pasifi görür.
esit('çeşitler yüklü', (await q('select count(*)::int n from icerik_cesit')).rows[0].n, 5);
const yeniCesit = `insert into icerik_cesit (id, alan, ad) values ('deneme', 'beslenme', 'Deneme')`;
esit('tasarımcı değilim', (await olarak(ali, () => q('select tasarimci_miyim() t'))).rows[0].t, false);
await hataBekle('tasarımcı olmayan çeşit yazamaz', () => olarak(ali, () => q(yeniCesit)), 'row-level security');
await ex('set role anon'); await hataBekle('oturumsuz tasarımcı soramaz', () => q('select tasarimci_miyim()'), 'permission denied'); await ex('reset role');
await q('insert into tasarimci values ($1)', [ali]);
esit('tasarımcıyım', (await olarak(ali, () => q('select tasarimci_miyim() t'))).rows[0].t, true);
await olarak(ali, () => q(yeniCesit));
await olarak(ali, () => q(`update icerik_cesit set aktif = false where id = 'deneme'`));
esit('tasarımcı pasifi görür', (await olarak(ali, () => q(`select count(*)::int n from icerik_cesit where id = 'deneme'`))).rows[0].n, 1);
await ex('set role anon');
esit('herkes pasifi görmez', (await q(`select count(*)::int n from icerik_cesit where id = 'deneme'`)).rows[0].n, 0);
await ex('reset role');
await hataBekle('tasarımcı da çeşit silemez', () => olarak(ali, () => q(`delete from icerik_cesit where id = 'deneme'`)), 'permission denied');

console.log(hatalar ? `${hatalar} HATA` : 'HEPSİ TAMAM');
