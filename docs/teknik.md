# Teknik yapı

_Son güncelleme: 14 Ekim 2026_

## Yığın

- Expo SDK 57, React Native 0.86, React 19.2, TypeScript (strict, `noUncheckedIndexedAccess`), expo-router.
- Yerel veri: expo-sqlite. Sunucu: Supabase (Postgres + e-posta kodu ile giriş + satır düzeyi yetki + Realtime + bir Edge Function).
- Bildirim: expo-notifications (yalnız yerel). Ses: expo-audio. Dosya/fotoğraf: expo-image-picker, expo-document-picker, expo-file-system. Rehber: expo-contacts (seçici).
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

Var olan bir göç değiştirilmez; yapı değişince yeni sürüm eklenir. Fotoğraf, ses ve belgeler uygulamanın `dosyalar/` klasöründe; tablolarda yolları durur.

**Sunucu (Supabase, `sunucu/sema.sql`):** `kullanici`, `baglanti`, `davet`, `gelen` (gönderilen kart, alınınca silinir), `grup`, `grup_uye`, `liste`, `liste_erisim`, `madde`. Bütün tablolarda satır düzeyi yetki; yazmaların çoğu işlevlerle (`kisi_ekle`, `grup_kur`, `liste_olustur`…). `npm run sunucu-denemesi` şemayı yerelde gerçek Postgres (PGlite) üzerinde dener.

## Yedek dosyası biçimi

Yeni bir ürünün pilot kullanıcılarının verisini taşıyabilmesi için bu biçim önemlidir.

- Tek JSON dosyası, adı `rites-yedek-YYYY-AA-GG.json`, parolasız.
- Alanlar:
  - `bicim`: `"rites-yedek"`
  - `surum`: veritabanı göç sürümü (şu an 7)
  - `olusturma`: ISO zaman
  - `dosyaKlasoru`: yedeği alan telefondaki dosya klasörü (geri yüklemede yollar yeni klasöre çevrilir)
  - `tablolar`: `{ tabloAdı: satır[] }` — satırlar SQLite sütun adlarıyla; JSON sütunlar metin olarak
  - `dosyalar`: `{ dosyaAdı: base64 }` — fotoğraf, ses, belge
- Yedeğe giren tablolar: `ayar, kart, blok, kayit, not, plan, alan_durumu, soru_cevap, animsatici, animsatici_gun, kisi, kutuphane`.
- Geri yükleme tek işlemdir: telefondaki veriler silinir, yedektekiler yazılır; eski sürümden yedekte olmayan sütunlar varsayılanını alır; daha yeni sürümün yedeği reddedilir.

## Derleme ve dağıtım

| Ne | Nasıl |
|---|---|
| Günlük geliştirme | Geliştirme derlemesi (`expo-dev-client`, EAS profili `development`), kod `npx expo start` ile bilgisayardan gelir |
| Pilot kullanıcılar | TestFlight (EAS profili `production`, `eas build --platform ios --auto-submit`) |
| Küçük düzeltmeler | EAS Update (`eas update --channel production --environment production --message "…"`); yalnız JavaScript değişikliklerinde. Yeni yerel modül ya da izin değişikliği yeni derleme ister. |

- Paket kimliği: `com.behnanozturkmen.ritespilot`. `runtimeVersion` politikası `appVersion`: uygulama sürümü (`app.json` → `version`) artırılınca eski derlemeler yeni güncellemeyi almaz. Yerel bir şey değiştiğinde sürüm artırılır ve yeniden derlenir.
- Sunucu adresi ve yayımlanabilir anahtar `.env.local`te (depoya girmez); EAS derlemeleri ve güncellemeleri için aynı değerler EAS ortam değişkenlerine (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) girilir.
- **Paketler `npm ci` ile kurulur, `npm install` ile değil.** Windows'taki `npm install` kilit dosyasından (`package-lock.json`) isteğe bağlı bir paketi (react-native-worklets) düşürdü; EAS'ın `npm ci` adımı bu yüzden "Install dependencies" aşamasında hata verdi (14 Ekim). Yeni paket yalnız `npx expo install <paket>` ile eklenir ve kilit dosyası değişince EAS'tan önce `npm ci` denenir.
- Expo Go ile kendi derleme arasında veri taşınmaz (iki ayrı uygulama); geçişte yedek alınıp geri yüklenir.

## Paylaşımla içerik almak

- `expo-sharing` eklentisi iOS'ta bir paylaşım eklentisi (share extension) ekler; App Group `group.com.behnanozturkmen.ritespilot` (EAS kendisi kaydeder). Kabul edilen: metin ve en çok 1 web adresi.
- Eklenti paylaşılanı App Group'a yazar ve uygulamayı `rites://expo-sharing` ile açar; `app/+native-intent.tsx` bunu `/ajandam?paylasim=…`a çevirir; Ajandam `Sharing.getSharedPayloads()` ile alır, temizler ve kart formunu açar.
- Video başlığı: `https://www.youtube.com/oembed?format=json&url=…` (anahtar yok, 4 sn zaman aşımı). Bu istek yalnız kişi paylaştığında, yalnız o bağlantı için gider.
- Paylaşım menüsündeki ad: `eklentiler/paylasimAdi.js` eklentinin görünen adını "Rites" yapar (app.json'da expo-sharing'den önce yazılmalı).
- Not: iOS'ta eklentinin ana uygulamayı açması Apple'ın resmi olarak desteklediği bir yol değil; Expo da bunu belgede belirtiyor. İleride iOS sürümünde bozulabilir.

## Denetim

`npm run denetim` = tip denetimi + lint + Jest (mantık testleri ve gerçek SQLite (sql.js) üzerinde veri testleri). `npm run sunucu-denemesi` = sunucu şeması.
