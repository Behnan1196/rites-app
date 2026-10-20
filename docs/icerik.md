# İçerik kataloğu: uzman için rehber

_Son güncelleme: 20 Ekim 2026_

Rites'ın hazır alanları, öneri kartları ve öneri programları Supabase'deki üç tabloda durur. Supabase → **Table Editor**'de düzenlenir; değişiklik telefonlara kendiliğinden iner (en geç 6 saatte). Kişinin kendi kopyaları (programlarına eklediği öneri, ajandasına eklediği kart) değişmez; yalnız öneriler yenilenir.

## İlkeler

- **Klinik değildir.** Tanı, ilaç, doz, tahlil, tedavi yazılmaz. "Günde 5 g kreatin" gibi doz içeren kart olmaz; "Takviye kullanmadan önce doktoruna danış" gibi genel bir not olabilir.
- Sade Türkçe, kısa başlık (kartta 2–5 sözcük). Her yaştan, teknolojiden uzak biri ilk bakışta anlamalı.
- Bir şeyi kaldırmak için satırı silme, **`aktif`i `false` yap.** Böylece geri almak kolay olur.
- `sira` küçükten büyüğe dizer. Araya eklemek için 10'ar arayla numaralamak kolaylık sağlar (10, 20, 30…).

## `icerik_alan` — alanlar

| Sütun | Ne | Örnek |
|---|---|---|
| `anahtar` | Değişmez kimlik; küçük harf, rakam, alt çizgi. **Bir kez verildikten sonra değiştirilmez**: kişilerin puanları ve etiketleri buna bağlı. | `hareket`, `nefes` |
| `ad` | Görünen ad (değiştirilebilir) | `Hareket` |
| `aciklama` | Kısa açıklama | `Esneme, yürüyüş, güç` |
| `ikon` | Simge adı ([Ionicons](https://icons.expo.fyi) listesinden, `-outline` olanlar); tanınmazsa yaprak | `walk-outline` |
| `varsayilan_acik` | Yeni kişide Yaşam Tarzım'da açık mı | `true` |

Kaldırılan alan, onu etiket olarak kullanan kişide adıyla görünmeye devam eder.

## `icerik_kart` — öneri kartları

| Sütun | Ne | Örnek |
|---|---|---|
| `id` | Değişmez kimlik (programlar buna bağlanır) | `h1`, `direnc_duvar_sinavi` |
| `alanlar` | Alan anahtarları (JSON dizi) | `["hareket"]` |
| `baslik` | Kartın başlığı | `Duvar şınavı` |
| `kisa` | Kısa açıklama (isteğe bağlı) | `Omuz hizasında, 3 set` |
| `saat` | `SS:dd` ya da boş | `18:00` |
| `tekrar` | Boş = tek seferlik. Biçim aşağıda. | `{"desen":"hergun"}` |
| `bloklar` | Kartın içi (JSON dizi). Biçim aşağıda. | |
| `tur` | Kütüphanem'deki tür: `Tarif`, `Egzersiz`, `Bilgi`, `Ölçüm`, `Rutin`, `Diğer`; boşsa bloklardan tahmin edilir | `Egzersiz` |

**Tekrar:** `{"desen":"hergun"}` · `{"desen":"haftaici"}` · `{"desen":"haftasonu"}` · `{"gunler":["Pzt","Çar","Cum"]}` (günler: Pzt Sal Çar Per Cum Cmt Paz). İstenirse `"gunSayisi": 30` (kaç gün sürsün).

**Bloklar** (her biri bir nesne; yazılmayan alanlar boş kabul edilir):

| Blok | Yazılış |
|---|---|
| Talimat | `{"tur":"talimat","metin":"Sırtın dik, nefesini tutma."}` |
| Video | `{"tur":"video","metin":"https://www.youtube.com/watch?v=..."}` |
| Liste | `{"tur":"liste","ad":"Malzemeler","maddeler":["Yoğurt","Yulaf"]}` |
| Proje adımları | `{"tur":"adimlar","ad":"Hazırlık","maddeler":["Mat al","Yer aç"]}` |
| Zamanlayıcı | `{"tur":"sayac","dakika":10}` |
| Ölçüm | `{"tur":"olcum","ad":"Tekrar sayısı","birim":"tekrar"}` |
| Günün notu | `{"tur":"gunnot"}` |
| Gelişim fotoğrafı | `{"tur":"gelfoto"}` |

Örnek `bloklar`: `[{"tur":"video","metin":"https://youtu.be/xyz"},{"tur":"talimat","metin":"Videoyla birlikte 10 tekrar."},{"tur":"olcum","ad":"Tekrar","birim":"tekrar"}]`

## `icerik_program` — öneri programları

| Sütun | Ne | Örnek |
|---|---|---|
| `id` | Değişmez kimlik | `ph1` |
| `alanlar` | Alan anahtarları (JSON dizi) | `["hareket","beslenme"]` |
| `ad` | Programın adı | `Evde direnç: başlangıç` |
| `aciklama` | Neden / ne işe yarar (kısa) | `Kas kaybını önlemek için haftada üç gün.` |
| `sure` | Gün; boş = süresiz (alışkanlık) | `21` |
| `kartlar` | Kart kimlikleri ve programın kaçıncı günü (0 = 1. gün; tekrarlı kartta başladığı gün) | `[{"kart":"arastirma_video","gun":0},{"kart":"direnc_duvar_sinavi","gun":1}]` |

Programın kartları `icerik_kart`ta tanımlı olmalı; bilinmeyen kart atlanır, hiç kartı kalmayan program görünmez. Tekrarlı kart programın son gününde kendiliğinden durur.

## Kişi ne görür?

- **Yaşam Tarzım → alan ekranı:** o alana etiketli öneri programları ve kartlar.
- **Kütüphanem:** programlar ve kartlar listesinde, kişinin kendi kayıtlarının arasında "Öneri" etiketiyle. Kişi istemediğini "Önerilerden gizle" der.
- Öneri programında "Programlarıma ekle" → kişinin kendi kopyası (değiştirebilir, başlatır). Öneri kartında "Bugün Ajandama ekle" ya da "Programa ekle".
