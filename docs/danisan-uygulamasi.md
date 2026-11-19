# Rites: fitness ve beslenme danışan uygulaması (plan)

_19 Kasım 2026 · taslak · P-127–P-130_

Örnek: Everfit. Everfit'in iki parçası var: **koçun web paneli** (program kurar, danışanı yönetir, ödeme alır) ve **danışanın telefon uygulaması** (programı uygular, kaydeder, koçla konuşur). Bu planda Rites ikincisi olur; koçun paneli ayrı bir web uygulamasıdır (aynı Supabase). Rites koçsuz kişisel kullanımda da aynen sürer; koça bağlanan kişide yalnız **Koçum** bölümü ve koçtan gelenler görünür.

## 1. Everfit'in danışan uygulaması ve Rites'taki karşılığı

| Everfit (danışan) | Rites'ta bugün | Eksik |
|---|---|---|
| Koçun atadığı program: günlere yayılmış antrenmanlar | Program (kartlar günlere yayılır, ajandaya düşer); Günlük kontrol listesi = antrenman, maddesi = egzersiz kartı | Koçtan program alma (bugün yalnız tek kart verilebiliyor) |
| Egzersizde video, set · tekrar · ağırlık, dinlenme | Video parçası; **Setler** (P-127): hedef, geçen sefer, dinlenme sayacı | Antrenmanı baştan sona akışla yapmak ("Başla" → egzersiz egzersiz), süperset, kişisel rekor |
| Egzersiz kütüphanesi (1.000+ video) | Kişinin kendi videoları, Gelenler'den al | Koçun kütüphanesi (koç panelinde; Rites'a kartla iner) |
| Alışkanlıklar ve görevler (su, uyku, adım) | Alışkanlıklar, Devam edenler, su sayacı, anımsatıcı ve alarm | Koçun alışkanlık ataması (kart vermeyle olur) |
| Ölçümler (kilo, bel, adım) | Ölçümlerim, gidişat | Koçun istediği ölçümü ataması; koçla paylaşma |
| Gelişim fotoğrafı (ön, yan, arka) | Gelişim fotoğrafı parçası (tek fotoğraf) | Üç açı, yan yana karşılaştırma |
| Haftalık check-in formu | Günün notu, puan | Çok sorulu form, koça gönderme |
| Beslenme: makro hedefi, yemek günlüğü, öğün planı, tarif kitabı, alışveriş listesi, fotoğrafla kayıt | Beslenme çeşitleri (öğün listesi, tarif, tartı, tabağım, su), listeler, tablo | Koçtan öğün planı ve tarif alma; makro hedefi ve günlüğü; yemek veritabanı |
| Koçla mesajlaşma | Gelenler ve bildirim (mesaj yok) | Koçla yazışma (yazı, sesli not) |
| Giyilebilirden veri (adım, uyku) | Yok | Apple Sağlık'tan okuma (yeni yerel modül, yeni derleme) |
| Topluluk, yarışmalar | Gruplar, birlikte rutin | Şimdilik gerekmez |
| Çok dil | Türkçe | Rites'ın asıl üstünlüğü: Türkçe ve sade |

Sonuç: danışan tarafının yaklaşık yarısı Rites'ta zaten var (kart modeli, program, ajanda, alarm, ölçüm, alışkanlık, set). Eksik olanların çoğu **koçla bağ** gerektiriyor: programın gelmesi, verinin gitmesi, konuşma.

## 2. İlke değişikliği: veri koça nasıl gider

Bugünkü ilke "kişisel veri telefonda". P-109'da "panelin danışan verisini görmesi ayrı ve büyük bir karar" denmişti; bu plan o kararı istiyor.

**Öneri:**
- Koçsuz kullanıcıda hiçbir şey değişmez.
- Koça bağlanan kişi, bağlanırken **neyin koça gideceğini açıkça seçer**: Yaptım günleri (varsayılan açık) · set özeti · ölçümler (kilo, bel…) · check-in cevapları · gelişim fotoğrafları. Seçmediği hiçbir şey telefondan çıkmaz; seçimi sonradan değiştirir, bağı koparınca sunucudaki verisi silinir.
- Sunucuya ham kayıt değil **özet** gider (gün, kart, "3 × 12 · 20 kg", "Kilo 82,4").
- **KVKK:** kilo, bel, beslenme ve egzersiz kayıtları özel nitelikli (sağlık) veri sayılabilir; açık rıza ve aydınlatma metni gerekir. Supabase sunucusu yurt dışında olduğu için yurt dışına aktarım şartları da gerekir. Verinin sorumlusu koç (ya da diyetisyen), Rites işleyen olur. **Yayından önce hukuki görüş alınmalı.**
- "Klinik değildir" ilkesi Rites'ta kalır: tanı, ilaç, doz yok. Diyetisyenin klinik araçları (NutriCore) panelde kalır, Rites'a yalnız plan ve tarif iner.

## 3. Yapı

**Sunucu (Supabase, mevcut şemaya ek):**
- `koc` (koç ya da diyetisyen; alanı fitness / beslenme), `koc_danisan` (bağ, rıza tarihi, paylaşım kapsamı).
- Koçun içeriği: egzersiz, kart kalıbı, program, öğün planı, tarif (panelde yazılır).
- `program_atama` (danışan, program, başlangıç günü). Bugünkü `verilen_kart` program paketine genişler.
- Geri bildirim: `danisan_ozet` (gün, kart, tür, özet), `checkin` (form, cevaplar), `mesaj`.

**Rites (telefon):**
- Giriş'te **Koçum** kutusu: koçun adı, bu haftaki program, bekleyen check-in, mesajlar.
- Koçtan gelen program kendi günlerinde ajandaya düşer (verilen kart gibi; içeriği koçun, saatini kişi değiştirir).
- Kayıt yapılınca paylaşım kapsamındaki özet sunucuya gider (bugünkü kart verme eşitlemesi gibi).
- Mesajlaşma ve check-in sunucuda (Realtime).

**Koç paneli (web):** danışan listesi ve uyum (bu hafta 5/6), program ve öğün planı kurma, gönderme, check-in okuma, mesaj. Beslenme tarafı için NutriCore'un diyetisyen ekranı aynı sunucuya bağlanabilir.

## 4. Aşamalar

Fitness ve beslenme **birlikte** yürür (P-128): ortak altyapı (koç bağı, program ve plan gönderme, ayrı web paneli) bir kez kurulur, iki alan üstüne biner.

| Aşama | Fitness | Beslenme | Kim dener |
|---|---|---|---|
| 0 · Plan (şimdi) | Bu belge fitness koçu arkadaşla konuşulur | Bu belge diyetisyenle konuşulur | Behnan, iki tasarım ortağı |
| 1 · Ortak altyapı | Koçum bağı (davet kodu); web panelinin iskeleti (giriş, danışan listesi); koçtan program / plan gönderme (bugünkü kart vermenin program paketine genişlemesi); Yaptım günlerinin dönmesi (bugün de dönüyor) | aynı | İki ortak, kendi telefonlarıyla |
| 2 · Alanın kendisi | Antrenman akışı (Başla → egzersiz egzersiz, dinlenme, bitince özet), egzersiz geçmişi ve rekor, koçun egzersiz kütüphanesi | Öğün planı ve tarif kitabının gelmesi, alışveriş listesi (Listeler'e), basit yemek günlüğü (öğün işareti, "plandan farklı ne yedin", fotoğraf) | Ortaklar + 2–3 danışan |
| 3 · Takip (veri kararından sonra) | Set özeti, ölçüm, fotoğraf paylaşımı; check-in; mesaj | Kilo, bel paylaşımı; check-in; mesaj; makro hedefi | Aynı grup |
| 4 · Ticari | Panelde abonelik ve ödeme, Apple Sağlık, yeni paket kimliği ve ad | aynı | — |

Aşama 3, danışan verisinin koça gitmesi kararına bağlı (karar hukuki görüşten sonra). O zamana kadar koça yalnız bugünkü gibi Yaptım günleri gider; Rites'ın "kişisel veri telefonda" ilkesi değişmez.

Her aşama pilotla biter: tasarım ortakları (fitness koçu arkadaş, diyetisyen) gerçek danışanlarla dener, gözlemler `pilot-gozlemleri.md`ye yazılır.

## 4a. Ekran yapısı (P-129, onay P-130)

Kaynak: ürün sahibinin görüşü (P-129). Everfit'in danışan uygulaması dört bölüm (Bugün · Koçluk · Mesajlar · Sen), HubFit beş sekme (Ana sayfa · Antrenman · Alışkanlıklar · Beslenme · Profil; koçun kapattığı sekme görünmez). İkisinde de danışan kendi işini giremez; Rites'ın farkı bu.

| Sekme | Kimde | İçinde |
|---|---|---|
| **Giriş** | herkes | Koçum kutusu (bugünün antrenmanı ve öğünleri, okunmamış mesaj, bekleyen check-in) · Anımsatıcılar ve zamanlayıcı · Hızlı not · Listeler · Ölçümlerim · Alışkanlıklar |
| **Ajandam** | herkes | Kendi işleri ve koçtan gelenler; üstte **Hepsi · Koçumdan** geçişi (yalnız koçun antrenman ve öğünleri) |
| **Koçum** | herkes | Bağlıysa: Program (önümüzdeki günler, geçmiş, rekorlar) · Beslenme (öğün planı, tarifler) · Mesajlar (yazı, sesli not, görüntülü görüşme bağlantısı) · Check-in · Gelişim. Bağlı değilse: koçla bağlanma (davet kodu) ve ne işe yaradığı |
| **Programlar** | herkes | Rites önerileri (ücretsiz uygulanır) · Kütüphanem · **Kendi programını kur** (ücretli; örnek: Gelenler'deki videolardan cilt bakımı programı) |
| **Gruplar** | ücretli | Gruplar, paylaşım, kart verme |

- İlk açılışta boş kalmasın diye (P-129: "ücretsiz ilk açtığında çok mu boş kalıyor") Koçum ve Programlar herkeste görünür; koçsuz kişide Koçum bağlanmayı anlatır, Programlar'da hazır öneriler uygulanır. Ücretli olan düğme kilitli görünür, ne açtığı yazar.
- Yaşam Tarzım ve yaşam alanları kalkar (P-129: tam oturmadı; hareket ve beslenme koçluktan gelir). Programlar etiketsiz. Kütüphanem Programlar'a girer.
- Mesajlar Koçum'un içinde; okunmamış sayısı sekmede rozet ve Giriş'teki Koçum kutusunda. Gelenler (paylaşılan videolar, verilen kartlar) Giriş'te kalır.
- Ücretsiz: kartlar, listeler, anımsatıcılar, ölçümler, alışkanlıklar, hazır öneriler, koç bağı. Ücretli: kendi programını kurma, gruplar ve paylaşım. Ayrım ödeme altyapısıyla birlikte netleşir (Aşama 4); o zamana kadar hepsi açık.

## 5. Kararlar ve açık sorular

**Verildi (P-128):** fitness ve beslenme birlikte; koç ve diyetisyen programı **ayrı web panelinde** hazırlar; ilk adım bu plan belgesi (kod yok).

**Açık:**

1. Danışan verisinin koça gitmesi (yukarıdaki öneri): hukuki görüşten sonra karar.
2. Beslenme paneli NutriCore mu olacak, yoksa ortak web paneline mi eklenecek?
3. Ekran yapısı (4a) onaylandı (P-130). Ekran çizimleri: claude.ai'deki "Rites Koçum ekranları" tasarımı (Giriş, Ajandam · Koçumdan, Koçum koçsuz ve koçlu, Mesajlar, Programlar).
4. Tasarım ortaklarına sorulacaklar: Everfit'te en çok neyi kullanıyorlar, danışandan ne görmek istiyorlar, Türkiye'de danışanları nasıl takip ediyorlar (WhatsApp, Excel…)?
5. Tek uygulama mı (kişisel + danışan), ayrı danışan uygulaması mı? (Öneri: tek uygulama, koça bağlanınca Koçum görünür.)
6. Yemek veritabanı ve makro sayımı: hangi kaynak, lisansı ne? (Aşama 3'te.)
7. Sunucunun yeri (yurt dışı aktarım) ve ticari sürümde paket kimliği ve ad.

## Kaynaklar

- Everfit özellik listesi: https://everfit.io/llms.txt
- Everfit beslenme: https://everfit.io/nutrition
- Everfit incelemesi (beslenme zayıf, antrenman güçlü; rakip sitesinden): https://www.promealplan.com/en/blog/everfit-review-2026
- Everfit fiyatları: https://toolradar.com/tools/everfit/pricing
- KVKK sağlık verisi düzenlemesi: https://www.erdem-erdem.av.tr/bilgi-bankasi/saglik-verilerinin-islenmesine-iliskin-yeni-duzenleme
