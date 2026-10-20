# Teknik yapı

_Son güncelleme: 16 Ekim 2026_

## Yığın

- Expo SDK 57, React Native 0.86, React 19.2, TypeScript (strict, `noUncheckedIndexedAccess`), expo-router.
- Yerel veri: expo-sqlite. Sunucu: Supabase (Postgres + e-posta kodu ile giriş + satır düzeyi yetki + Realtime + bir Edge Function).
- Bildirim: expo-notifications (yalnız yerel). Alarm: react-native-alarm-scheduler (iOS 26 AlarmKit). Ses: expo-audio. Dosya/fotoğraf: expo-image-picker, expo-document-picker, expo-file-system. Rehber: expo-contacts (seçici).
- Derleme ve dağıtım: EAS Build, TestFlight (EAS Submit), EAS Update.

## Klasörler

| Klasör | Ne var |
|---|---|
| `app/` | Ekranlar (expo-router). `(sekmeler)/` dört sekme, her sekmenin kendi yığını. `kart/[id]` tam ekran kart görünümü. |
| `bilesen/` | Arayüz parçaları; konuya göre alt klasörler (ajanda, giris, kart, plan, gruplar, listeler, kutuphane, oturum, paylasim…). |
| `mantik/` | Saf mantık; arayüzden ve veritabanından bağımsız; Jest testleri `__testler__`. |
| `veri/` | Yerel veritabanı: göçler, **tek yazma kapısı** (`kapi.ts`), değişiklik yayını (`yayin.ts`), kancalar (`useSorgu`, `useAyar`). |
| `sunucu/` | Supabase istemcisi, şema (`sema.sql`), şema denemesi (PGlite), Edge Function, kurulum notu (`KURULUM.md`). |
| `docs/` | Bu belgeler. |

Kural: veritabanına yazan her şey `veri/kapi.ts` üzerinden geçer ve hangi konuların değiştiğini duyurur (`ayar · kart · not · plan · animsatici · kisi · kutuphane`); ekranlar ilgilendikleri konulara abone olup kendiliğinden tazelenir.

## Veri: nerede ne durur

**Telefon (SQLite, göç sürümü `PRAGMA user_version`):**

| Sürüm | Tablolar |
|---|---|
| 1 | `ayar` (anahtar-değer: ad, giriş kutuları, son yedek, ilk açılış, bağlı e-posta…) |
| 2 | `kart`, `blok`, `kayit` (kartın tanımı ayrı, her günün kaydı ayrı) |
| 3 | `not` |
| 4 | `plan`, `alan_durumu`, `soru_cevap` |
| 5 | `animsatici`, `animsatici_gun` |
| 6 | `kisi` (Kişilerim; kişinin verdiği adlar telefonda kalır) |
| 7 | `kutuphane` (kart ya da planın kayıtsız kopyası, JSON içerik) |
| 8 | `animsatici.alarm` (alarm olarak çalar) |
| 9 | `paylasilan` (başka uygulamadan paylaşılan bağlantılar, Gelenler'de), `kart.alarm` |
| 10 | `blok.durum` ("Proje adımları"nın kalıcı durumu, JSON: adım başına yapıldığı gün, bitiş günü) |
| 11 | `animsatici.bitis` ("Süre sonra"nın çalacağı an, ISO); `animsatici.gunler` artık hafta günü listesi (JSON, 0 = Pzt); eski `hergun / haftaici / haftasonu` okurken çevrilir |
| 12 | `kart.sira` görünen sırayla yeniden numaralanır (saat, sonra eski sıra); ajanda artık yalnız `sira`ya göre dizilir. Yeni kartın sırası `yeniKartKaydet` içinde `yeniKartSirasi` ile verilir; sürüklemede `siraDegisikligi` (komşuların ortası) → `siralariYaz` |
| 13 | `kart.bag`: kartın bir grup etkinliğine bağı (`bulusma:<id>\|<gün>\|<saat>`); kaynağı `grup` olan kart (grubun adı `gelen_kimden`de) |
| 14 | `animsatici.ses` (bildirim sesi; null = telefonun sesi) |
| 15 | Planlar yerine **programlar**: pilottaki planlar, kartları ve kütüphanedeki plan kopyaları silinir; `plan` ve `soru_cevap` kalkar. Yeni: `program` (ad, alanlar JSON, neden, süre gün / null, durum `hazir\|uygulaniyor\|ara\|bitti`, son başlangıç, yıldız, değerlendirme, kaynak), `program_kart` (programın kartı: gün = başlangıçtan kaç gün sonra, saat, hatırlatma, alarm, tekrar, bloklar JSON). `alan_durumu`na `ad`, `aciklama`, `sira` (kişinin eklediği alan, anahtar `ozel-<id>`). `kart.plan_id` artık programı gösterir |

Var olan bir göç değiştirilmez; yapı değişince yeni sürüm eklenir. Fotoğraf, ses ve belgeler uygulamanın `dosyalar/` klasöründe; tablolarda yolları durur.

**Sunucu (Supabase, `sunucu/sema.sql`):** `kullanici`, `baglanti`, `davet`, `gelen` (gönderilen kart, alınınca silinir), `grup`, `grup_uye`, `liste`, `liste_erisim`, `madde`. Bütün tablolarda satır düzeyi yetki; yazmaların çoğu işlevlerle (`kisi_ekle`, `grup_kur`, `liste_olustur`…). `npm run sunucu-denemesi` şemayı yerelde gerçek Postgres (PGlite) üzerinde dener.

## Yedek dosyası biçimi

Yeni bir ürünün pilot kullanıcılarının verisini taşıyabilmesi için bu biçim önemlidir.

- Tek JSON dosyası, adı `rites-yedek-YYYY-AA-GG.json`, parolasız.
- Alanlar:
  - `bicim`: `"rites-yedek"`
  - `surum`: veritabanı göç sürümü (şu an 15)
  - `olusturma`: ISO zaman
  - `dosyaKlasoru`: yedeği alan telefondaki dosya klasörü (geri yüklemede yollar yeni klasöre çevrilir)
  - `tablolar`: `{ tabloAdı: satır[] }` — satırlar SQLite sütun adlarıyla; JSON sütunlar metin olarak
  - `dosyalar`: `{ dosyaAdı: base64 }` — fotoğraf, ses, belge
- Yedeğe giren tablolar: `ayar, kart, blok, kayit, not, program, program_kart, alan_durumu, animsatici, animsatici_gun, kisi, kutuphane, paylasilan`. Sürüm 15'ten eski yedek geri yüklenirken plan kartları (ve blok / kayıtları) ile kütüphanedeki plan kopyaları alınmaz (`eskiPlanlariAyikla`).
- Geri yükleme tek işlemdir: telefondaki veriler silinir, yedektekiler yazılır; eski sürümden yedekte olmayan sütunlar varsayılanını alır; daha yeni sürümün yedeği reddedilir.

## Derleme ve dağıtım

| Ne | Nasıl |
|---|---|
| Günlük geliştirme | Geliştirme derlemesi (`expo-dev-client`, EAS profili `development`), kod `npx expo start` ile bilgisayardan gelir |
| Pilot kullanıcılar | TestFlight (EAS profili `production`, `eas build --platform ios --auto-submit`) |
| Küçük düzeltmeler | EAS Update (`eas update --channel production --environment production --platform ios --message "…"`); yalnız JavaScript değişikliklerinde. `--platform ios` şart: yoksa web paketi de üretilmeye çalışılır ve expo-sqlite'ın web dosyası (wa-sqlite.wasm) yüzünden hata verir (17 Ekim). Yeni yerel modül ya da izin değişikliği yeni derleme ister. |

- **İki uygulama:** TestFlight sürümü "Rites" (`com.behnanozturkmen.ritespilot`, şema `rites`); geliştirme derlemesi "Rites Dev" (`com.behnanozturkmen.ritespilot.dev`, şema `rites-dev`, koyu simge). Ayrım `app.config.js`te, `APP_VARIANT=development` ile (eas.json → development profili). İkisi aynı telefonda yan yana durur; verileri ayrıdır.
- Paket kimliği: `com.behnanozturkmen.ritespilot`. `runtimeVersion` politikası `appVersion`: uygulama sürümü (`app.json` → `version`) artırılınca eski derlemeler yeni güncellemeyi almaz. Yerel bir şey değiştiğinde sürüm artırılır ve yeniden derlenir.
- Sunucu adresi ve yayımlanabilir anahtar `.env.local`te (depoya girmez); EAS derlemeleri ve güncellemeleri için aynı değerler EAS ortam değişkenlerine (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) girilir.
- **Paketler `npm ci` ile kurulur, `npm install` ile değil.** Windows'taki `npm install` kilit dosyasından (`package-lock.json`) isteğe bağlı bir paketi (react-native-worklets) düşürdü; EAS'ın `npm ci` adımı bu yüzden "Install dependencies" aşamasında hata verdi (14 Ekim). Yeni paket yalnız `npx expo install <paket>` ile eklenir ve kilit dosyası değişince EAS'tan önce `npm ci` denenir.
- Expo Go ile kendi derleme arasında veri taşınmaz (iki ayrı uygulama); geçişte yedek alınıp geri yüklenir.

## Alarmlar (iOS 26 AlarmKit)

- `mantik/alarm.ts` planı kurar: alarmlı her (anımsatıcı, saat) için haftalık tekrarlı bir alarm; bugün ertelenmiş saat için tek seferlik alarm. Kimlikler metinden türetilen kararlı UUID'ler; `veri/alarmlar.ts` telefondakilerle farkı uygular (eksik eklenir, fazla ya da saati değişen kaldırılır).
- Tekrarlı alarm telefonda durur; Rites açılmasa da her gün çalar. Bildirim planı alarmlı anımsatıcıları atlar (yalnız alarm izni varsa).
- Alarmdaki Durdur / Ertele düğmesi Rites'ı açar; modül basışı telefonda kaydeder, `BildirimYoneticisi` açılışta ve öne gelişte okuyup işler.
- Modül yalnız kendi derlemede vardır (`requireOptionalNativeModule`); yoksa her şey bildirimle sürer. Info.plist'e `NSAlarmKitUsageDescription` eklentiyle girer.
- Kart alarmı: alarmlı kartın önümüzdeki 3 gündeki hatırlatmaları belirli tarihli tek seferlik alarmlar (`kartAlarmPlani`); Ertele düğmesi yok, Durdur kartı açar.
- Modüle yama: `patches/react-native-alarm-scheduler+1.0.1.patch` zaman damgası verilen tek seferlik alarmı AlarmKit `.fixed(Date)` ile kurar (modül normalde saatin ilk gelişinde çalar). `npm ci` sonrası `postinstall: patch-package` uygular; modül sürümü değişirse yama yeniden üretilmeli.
- Alarmdaki Ertele (`.custom` ikinci düğme) alarmı susturmuyor (P-4); Rites basışı işlerken `completeNativeAlarmAsync` + `cancelAlarmAsync` ile susturur, plan tekrarlıyı yeniden kurar.
- Sürüm 1.2.0 (16 Ekim: WebView ve modül yaması yeni derleme istedi). 14 Ekim: yeni yerel modül olduğu için sürüm 1.1.0 (`runtimeVersion` değişti): 1.0.0 derlemeleri bu güncellemeyi almaz, yeni derleme gerekir.

## Paylaşımla içerik almak

- `expo-sharing` eklentisi iOS'ta bir paylaşım eklentisi (share extension) ekler; App Group `group.com.behnanozturkmen.ritespilot` (EAS kendisi kaydeder). Kabul edilen: metin ve en çok 1 web adresi.
- 16 Ekim'den beri `eklentiler/paylasimAdi.js` eklentinin kodunu yamalar: paylaşılan App Group'taki listeye **eklenir** (her paylaşımın başında `rites-paylasim:<zaman>` işaret öğesi), "Gelenler'e eklendi." gösterilir, uygulama açılmaz. Yama uygulanamazsa (expo-sharing kodu değişmişse) derleme hata verir.
- `bilesen/paylasim/PaylasimAlici.tsx` Rites açılınca / öne gelince `Sharing.getSharedPayloads()` ile listeyi okur, temizler, işaretlere göre paylaşımlara böler (`paylasimlaraBol`), her bağlantıyı başlığıyla `paylasilan` tablosuna yazar. Eski eklenti `rites://expo-sharing` ile açarsa `+native-intent` Gelenler'e götürür.
- Video başlığı: `https://www.youtube.com/oembed?format=json&url=…` (anahtar yok, 4 sn zaman aşımı). Bu istek yalnız kişi paylaştığında, yalnız o bağlantı için gider.
- Paylaşım menüsündeki ad: `eklentiler/paylasimAdi.js` eklentinin görünen adını "Rites" yapar (app.json'da expo-sharing'den önce yazılmalı).
- Gömülü oynatma: `bilesen/kart/YoutubeOynatici.tsx`, `react-native-webview` içinde YouTube iframe'i. Sayfanın adresi (`baseUrl`) `https://<paket kimliği>`: YouTube gömülü oynatıcı Referer ister, yoksa "Hata 153" verir. Oynatıcıdaki bağlantılar dışarıda (YouTube uygulamasında) açılır.

## Denetim

`npm run denetim` = tip denetimi + lint + Jest (mantık testleri ve gerçek SQLite (sql.js) üzerinde veri testleri). `npm run sunucu-denemesi` = sunucu şeması.

## Fotoğraf büyütme

`bilesen/kart/BuyutulebilirFoto.tsx`: Modal içinde iOS `ScrollView` (`maximumZoomScale` 6, `centerContent`); çift dokunuş `scrollResponderZoomTo` ile. Ek yerel modül yok, EAS update ile gider. Yakınlaştırma yalnız iOS'ta (Android'de ScrollView zoom desteklemez; web'de yalnız tam ekran).

## Grup etkinlikleri: Buluşma (sunucu)

- Tablolar `bulusma` (grup, kuran, baslik, gun, saat?, yer) ve `bulusma_yanit` (geliyorum · belki · gelemem). Yazma yalnız işlevlerle: `bulusma_kur` (kuran geliyor sayılır), `bulusma_duzenle` (yalnız kuran; gün ya da saat değişince öteki yanıtlar silinir), `bulusma_yanitla` (null: geri al). Okuma `bulusmalarim()` (üyesi olduğum grupların son 30 günden bu yana buluşmaları). Silme: kuran ya da grubun kurucusu.
- Telefonda: "Geliyorum" denince yerel kart eklenir (`bulusmaKarti`; saatliyse 1 saat önce bildirim), başka yanıtta silinir. `BulusmaSaglayici` her okumadan sonra eşitler: buluşma artık yoksa, gün/saat değiştiyse ya da yanıtım "Geliyorum" değilse kart kalkar (`kaldirilacakKartlar`; dünden eski kartlara dokunulmaz). Eşitleme kart eklemez; kişinin sildiği kart geri gelmez.
- Sunucu şeması güncellenmeden yeni sürüm açılırsa Buluşmalar "Şu an bağlanamıyor" gibi davranır; listeler etkilenmez.

## Grup etkinlikleri: Birlikte rutin (sunucu)

- Tablolar `rutin` (grup, kuran, ad, hedef 1–7: haftada kaç kez), `rutin_katilim`, `rutin_kayit` (rutin, kullanıcı, gün). Yazma yalnız işlevlerle: `rutin_kur` (kuran katılmış sayılır), `rutin_duzenle` (kuran), `rutine_katil(p_katil)` (ayrılınca kayıtları da silinir), `rutin_isaretle` (yalnız katılan, kendi adına). Okuma `rutinlerim(p_ilk)`: katılanlar ve p_ilk'ten bu yana yaptıkları günler. Silme: kuran ya da grubun kurucusu.
- Telefonda: katılınca (ya da kurunca) seçilen günlerde tekrarlı yerel kart (`rutinKarti`, `bag` = `rutin:<id>`). `RutinSaglayici` kartlarda değişiklik olunca (1,5 sn sonra), uygulama öne dönünce ve grup ekranı öne gelince eşitler: telefondaki "Yaptım"lar doğrudur, geçen haftanın Pazartesi'sinden bugüne fark sunucuya yazılır (`isaretFarki`); rutin silindiyse ya da artık katılmıyorsam kartın dizisi dün biter, bağı kopar, geçmiş kayıtları kalır (`bagiBitir`). Hafta Pazartesi başlar.

## Grup etkinlikleri: Nöbet / sıra (sunucu)

- Tablolar `nobet` (grup, kuran, ad, gunler int[] 0 = Pzt, sira uuid[], baslangic) ve `nobet_kayit` (nöbet, gün, yapan; günde bir kayıt). Yazma yalnız işlevlerle: `nobet_kur`, `nobet_duzenle` (kuran; sıradaki herkes grubun üyesi olmalı), `nobet_isaretle` (grubun herhangi bir üyesi; geri alma yalnız kendi işareti). Okuma `nobetlerim(p_ilk)`.
- Kimin günü olduğu telefonda hesaplanır (`siradaki`: `baslangic`tan o güne kadarki nöbet günü sayısı mod sıra uzunluğu); sunucu hesaplamaz. Günler ya da sıra değişince `baslangic` bugün olur.
- `NobetSaglayici` eşitler: önümüzdeki 14 günde sırası bende olan her gün için tek seferlik yerel kart (`bag` = `nobet:<id>|<gün>`), fazlası silinir (geçmiş kartlara dokunulmaz); son 14 günün "Yaptım"ları sunucuya yazılır (`nobetIsaretFarki`: başkası o günü işaretlediyse yeniden yazılmaz).

## Grup etkinlikleri: İş (sunucu)

- Tablo `grup_is` (`is` SQL'de ayrılmış kelime): grup, isteyen, baslik, tarih?, kime? (null = herkes), durum (acik · istendi · alindi · reddedildi · yapildi), alan, yapilma. Yazma yalnız işlevlerle: `is_ekle`, `is_duzenle` (isteyen; kime değişince ya da ret sonrası iş yeniden açılır/istenir), `is_yanitla(p_eylem)`: al · reddet · birak · yaptim · geri, her biri durum ve kişi denetimiyle. Okuma `islerim()` (yapılanlar 7 gün). Silme: isteyen ya da grubun kurucusu.
- `IsSaglayici` eşitler (`isEslemesi`): bende (alındı/yaptığım) olan işin kartı yoksa eklenir (tarih yoksa bugün); kartta "Yaptım" sunucuda `yaptim`, işaret kalkınca `geri`; artık bende olmayan işin yapılmamış kartı silinir, yapılmışsa kalır. Grup ekranındaki düğmeler sunucuyu ve kartı birlikte değiştirir.

## Grup etkinlikleri: Karar / oylama (sunucu)

- Tablolar `karar` (grup, kuran, soru, tur metin|gun, coklu, son_gun?, yer, sonuc?, bulusma?), `karar_secenek` (metin ya da gün + saat?, sıra), `karar_oy` (seçenek, kullanıcı). Yazma yalnız işlevlerle: `karar_kur` (2–10 seçenek, jsonb), `karar_oyla(p_secenekler uuid[])` (oylarımın yerine; tek seçimde en çok bir; karar verildiyse ya da son gün geçtiyse kapalı), `karar_ver` (yalnız kuran; gün kararında `bulusma` + kuranın "geliyorum" yanıtını kurar, buluşma kimliğini döner). Okuma `kararlarim()` (açıklar ve son 7 günde verilenler). Silme: kuran ya da grubun kurucusu.
- Telefonda kart yok (`KararSaglayici` yalnız okur ve yazar); gün kararında kurulan buluşmanın kartı kuranın ajandasına eklenir, ötekiler Buluşma'dan yanıtlar.
- Grup ekranındaki sıra: İşler · Kararlar · Buluşmalar · Birlikte rutinler · Nöbetler · Listeler · + Ekle · Üyeler (boş bölümler görünmez; Buluşmalar ve Listeler boşken de görünür).

## Gruplardan bekleyenler (Gelenler)

- `mantik/grupBekleyenler.ts` `banaBekleyenler`: dört sağlayıcının (İş, Buluşma, Karar, Rutin) verisinden bana yanıt bekleyenler; `gelen_gizli` ayarındaki (en çok 200) anahtarlar düşer. `useGrupBekleyenleri` Gelenler ekranı, Giriş'teki Gelenler kutusu ve Gruplar sekmesi kullanır; ekranlar öne gelince dört sağlayıcıyı tazeler. Sunucu değişmedi.

## Anında güncelleme (Supabase Realtime)

- `sema.sql` sonundaki blok grup, grup_uye, liste_erisim, gelen, baglanti, bulusma, bulusma_yanit, grup_is, karar, karar_oy, rutin, rutin_katilim, rutin_kayit, nobet, nobet_kayit tablolarını `supabase_realtime` yayınına ekler (madde zaten vardı).
- `sunucu/istemci.ts` `tablolariDinle(ad, tablolar, onDegisti)`: değişiklik haberi gelince (yarım saniye birleştirerek) yeniden okunur; haberin içeriği kullanılmaz, okuma her zamanki yetkiyle (RLS) yapılır. Sağlayıcılar (Buluşma, İş, Karar, Rutin, Nöbet) oturum açıkken dinler; `useSunucu(yukle, anahtar, dinle)` üçüncü parametreyle Gelenler, Kişilerim, Gruplarım ve Ortak listeler için.
- Supabase'de Realtime açık olmalı (varsayılan). Denetim: Database → Publications → supabase_realtime'da tablolar görünür. Web denemesinde sahte sunucu Realtime vermez; gerçek iki telefonla denenir.

## Bildirim sesleri

- `assets/sesler/*.wav` (44,1 kHz, 16 bit, tek kanal, 0,7–2,6 sn; Python ile üretildi). `app.json` → `expo-notifications` eklentisinin `sounds` seçeneğiyle uygulamaya gömülür; bildirimde `sound: '<ad>.wav'` (`mantik/sesler.ts` `bildirimSesi`). Yeni ses = yeni derleme.
- `animsatici.ses` (göç 14), ayar `hatirlatma_sesi` (kart hatırlatmaları). Önizleme `bilesen/SesSecici.tsx` (expo-audio).

## Telefona bildirim (sunucudan)

- Tablo `bildirim_adresi` (jeton = Expo bildirim adresi, kullanıcı, açık). Telefon oturum açılınca ve tercih değişince `bildirim_adresi_yaz(jeton, acik)` çağırır (`bilesen/GelenBildirimi.tsx`); aynı telefonda başka kullanıcı girerse jeton ona geçer.
- `bildirim_tetik()` tetikleyicisi gelen, baglanti, grup_uye, grup_is, bulusma, karar, rutin, nobet tablolarında; `bildirim_gonder(alicilar, baslik, govde, veri)` açık jetonlara tek istekte (en çok 100) `net.http_post` ile `https://exp.host/--/api/v2/push/send`. `pg_net` yoksa (yerel deneme) gönderilmez; gönderim hatası asıl yazmayı bozmaz. Yerel denemede `net.http_post`'un sahtesi istekleri bir tabloya yazar.
- Bildirimin `data.tur = 'gelen'`; dokununca `BildirimYoneticisi` Gelenler'i açar.
- Apple'a gönderim için EAS'ta bir kez bildirim anahtarı (APNs key) kurulur; Expo'nun bildirim servisi anahtarsız ("enhanced security" kapalı) kullanılır.

## Programlar (telefon)

- Mantık `mantik/program.ts`, veri `veri/programlar.ts`, ekranlar `app/(sekmeler)/yasam/` (`index`, `alan/[alan]`, `program/[id]`, `oneri/[id]`, `kutuphane/`), parçalar `bilesen/yasam/` (`useProgramlar`, `ProgramFormu`, `ProgramSayfalari`).
- Programın kartı `program_kart`ta durur. **Başlat** (`programBaslat`): her kart için `ajandaKarti` → ajandaya kart; `kart.plan_id = program`, `kart.bag = program:<programKartı>`; gün `başlangıç + gün`, tekrarlının bitişi programın son günü (`programBitisi`).
- Uygulanırken programa kart eklenince (`programKartiEkle`) o günden itibaren ajandaya düşer. Ajandada kart düzenlenince (`KartFormu` → `programaYansit`; "yalnız bu gün" hariç) programdaki karşılığı da değişir. Ajandadaki bir kart "⋯ → Programa ekle" ile (`karttanProgramaEkle`) uygulanan programa bağlanır, öbürlerine kopyalanır.
- **Ara ver / Bitir / Sil / programdan kart çıkar:** `durdurmaFarki` → bugünden önce başlamış dizilerin bitişi dün, gelecekteki ve bugünün yapılmamış kartları silinir; kalanların bağı kopar (geçmiş kayıtları durur). Süresi geçen program ekranda "bitti" sayılır (`etkinDurum`), değerlendirilince kapanır.
- Kart formu programın kartında tarih yerine "N. gün" gösterir (`ProgramGunu`; formun içinde sabit bir Pazartesi 1. gün sayılır); tekrar programla biter ("Kaç gün sürecek?" sorulmaz).
- Kişinin alanları açılışta ve her `alanDurumlari` okumasında `ozelAlanlariAyarla` ile `mantik/alanlar`a bildirilir (`alanAdi` her yerde bilir).
- Rites önerileri `ONERILER` (`mantik/alanlar` hazır paketlerinden); "Programlarıma ekle" kopyasını `kaynak = Rites önerisi` ile kurar.

## İçerik kataloğu

- Biçim ve denetim `mantik/katalog.ts` (`katalogCoz`: bozuk / pasif öğe atlanır, programın bilinmeyen kartı atlanır, alansız katalog geçersiz). Uygulamayla gelen içerik `mantik/hazirIcerik.ts` → `gomuluKatalog()`. Şu anki katalog `katalog()`; `alanlar.ts` (hazır alanlar, simge, varsayılan açık) ve `program.ts` (`oneriler`, `oneriKartlari`) buradan okur.
- Sunucu: `icerik_alan`, `icerik_kart`, `icerik_program` (`sema.sql`; RLS: `aktif` olanlar anon ve authenticated için okunur, yazma kapalı; `guncelleme` tetikleyiciyle). İlk içerik `sunucu/icerik.sql` (`npx tsx sunucu/icerik-uret.ts > sunucu/icerik.sql` ile uygulamayla gelenden üretilir; `on conflict do nothing`).
- İndirme `sunucu/katalog.ts`; saklama `veri/katalog.ts` (`ayar`: `katalog`, `katalog_denendi`, `gizli_oneriler`); `bilesen/KatalogGuncelleyici.tsx` açılışta ve öne dönünce, en çok 6 saatte bir indirir; farklıysa kaydeder (`plan`, `kutuphane` konuları duyurulur, ekranlar tazelenir). Açılışta saklı katalog `VeriSaglayici`de yüklenir.
- Kütüphanem'de öneri kartları kayıt biçimine çevrilir (`oneri:<id>`), aynı süzgeçten geçer; öneri ekranı `app/(sekmeler)/yasam/oneri/[id]` (`tur=kart` ya da program).
