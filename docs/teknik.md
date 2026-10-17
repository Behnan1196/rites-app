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

Var olan bir göç değiştirilmez; yapı değişince yeni sürüm eklenir. Fotoğraf, ses ve belgeler uygulamanın `dosyalar/` klasöründe; tablolarda yolları durur.

**Sunucu (Supabase, `sunucu/sema.sql`):** `kullanici`, `baglanti`, `davet`, `gelen` (gönderilen kart, alınınca silinir), `grup`, `grup_uye`, `liste`, `liste_erisim`, `madde`. Bütün tablolarda satır düzeyi yetki; yazmaların çoğu işlevlerle (`kisi_ekle`, `grup_kur`, `liste_olustur`…). `npm run sunucu-denemesi` şemayı yerelde gerçek Postgres (PGlite) üzerinde dener.

## Yedek dosyası biçimi

Yeni bir ürünün pilot kullanıcılarının verisini taşıyabilmesi için bu biçim önemlidir.

- Tek JSON dosyası, adı `rites-yedek-YYYY-AA-GG.json`, parolasız.
- Alanlar:
  - `bicim`: `"rites-yedek"`
  - `surum`: veritabanı göç sürümü (şu an 11)
  - `olusturma`: ISO zaman
  - `dosyaKlasoru`: yedeği alan telefondaki dosya klasörü (geri yüklemede yollar yeni klasöre çevrilir)
  - `tablolar`: `{ tabloAdı: satır[] }` — satırlar SQLite sütun adlarıyla; JSON sütunlar metin olarak
  - `dosyalar`: `{ dosyaAdı: base64 }` — fotoğraf, ses, belge
- Yedeğe giren tablolar: `ayar, kart, blok, kayit, not, plan, alan_durumu, soru_cevap, animsatici, animsatici_gun, kisi, kutuphane, paylasilan`.
- Geri yükleme tek işlemdir: telefondaki veriler silinir, yedektekiler yazılır; eski sürümden yedekte olmayan sütunlar varsayılanını alır; daha yeni sürümün yedeği reddedilir.

## Derleme ve dağıtım

| Ne | Nasıl |
|---|---|
| Günlük geliştirme | Geliştirme derlemesi (`expo-dev-client`, EAS profili `development`), kod `npx expo start` ile bilgisayardan gelir |
| Pilot kullanıcılar | TestFlight (EAS profili `production`, `eas build --platform ios --auto-submit`) |
| Küçük düzeltmeler | EAS Update (`eas update --channel production --environment production --message "…"`); yalnız JavaScript değişikliklerinde. Yeni yerel modül ya da izin değişikliği yeni derleme ister. |

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
