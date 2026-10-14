# Karar günlüğü

Her kayıt: **karar** · neden · kaynak. Kaynak: **Ürün sahibi** (Behnan'ın kararı), **Öneri** (geliştiricinin önerisi, ürün sahibi onayladı ya da itiraz etmedi), **Pilot** (kullanıcı yorumundan; `pilot-gozlemleri.md`ye bağlanır), **Paket** (`rites-paket`).

Yeni kayıt en alta eklenir. Eski bir karar değişirse silinmez; yeni kayıt "… kararının yerine" diye yazılır.

---

## Başlangıç (12 Ekim 2026)

Ürün kararlarının ana listesi `rites-paket/08-kararlar-ve-acik-sorular.md` (1–39) ve `rites-paket/10-netlestirmeler.md` (1–20). Özetle:

- Dört sekme: Giriş · Ajandam · Yaşam Tarzım · Gruplar. Tek tip kart, 9 blok türü. Tek kavram plan (program/proje ayrımı yok). — Paket
- Kişisel veri telefonda; sunucuda yalnız paylaşılan veri. Klinik alan yok. Şifresiz giriş. — Paket
- Plan süresi yalnız bitiş tarihine dönüşür ("Bitiş: 8 Kasım (28 gün)"). — Ürün sahibi (10/5)
- Yedek parolasız, tek dosya, kişinin kendi bulutuna; "her gece kendiliğinden" yok, yerine 7 günde bir soru. — Ürün sahibi (10/10)
- Silmede kayıtlar: kart silinince kayıtları da silinir; "bu gün ve sonrası"nda geçmiş kalır. — Ürün sahibi (10/9, 10/13)
- Saat 24 saat, tarih "15 Ekim" biçiminde. — Ürün sahibi
- İlk sürüm yalnız Expo Go'da çalışan modüllerle; geliştirme makinesi Windows. — Ürün sahibi (07)

## Görev 6 · Yaşam Tarzım (12 Ekim)

- **Plan bitiş tarihine gelince kartları kendiliğinden kalkmaz; "Planı bitir" denince kalkar.** Kişi isterse sürdürebilsin. — Ürün sahibi
- **Hazır paketteki video etkinliği: boş video bloğu + "Videoyu açıp birlikte uygula." talimatı.** Paket video bağlantısı içermiyor. — Ürün sahibi
- **"Planı bitir" Bilgiler sekmesinde.** — Ürün sahibi

## Görev 7 · Anımsatıcılar (12 Ekim)

- **Anımsatıcı bildirim olarak gelir** (alarm ekranı değil). Expo Go'da başka yol yok; kendi derlemede AlarmKit ileride düşünülebilir. — Ürün sahibi
- **Bildirim düğmeleri (Durdur / Ertele) uygulamayı açar**; uygulama kapalıyken düğme işi ancak açılışta yapılabildiği için. — Öneri

## Görev 8 · Giriş ayarı ve Profil (13 Ekim)

- **Su kutusu sonraya.** — Ürün sahibi
- **Çıkış ve Hesabımı sil 9. göreve (sunucuyla birlikte).** — Ürün sahibi
- **Yedekte yer seçimi (iCloud / Google Drive / yok) kaldırıldı;** paylaşım sayfasından "Dosyalar'a kaydet" yeterli. — Ürün sahibi
- **Hiç yedek yoksa ilk açılıştan 7 gün sonra sorulur.** — Ürün sahibi
- iCloud / Google Drive'a kaydetmeyi anlatan yönlendirme metinleri ileride eklenebilir. — Ürün sahibi (not)

## Görev 9 · Sunucu (13 Ekim)

- **Sunucu Supabase; yayımlanabilir anahtar (publishable key) kullanılır** (anon key eski). — Ürün sahibi
- **E-postalar Gmail SMTP ile gider;** Supabase şablon düzenlemesi için kendi SMTP istiyor. Yayından önce Rites'a ait alan adı ve servis gerekir. — Ürün sahibi / Öneri
- **Davet e-postası bir Edge Function ile gönderilir.** — Ürün sahibi
- **"E-postanla devam et" Profil'de ve Gruplar'da.** — Ürün sahibi
- **Telefon tek kişiye bağlı:** ilk giriş yapılan e-posta telefona kaydedilir; çıkıştan sonra yalnız o e-postayla girilir; başka e-posta için önce telefondaki veriler silinmeli. Çıkış yerel veriye ve ada dokunmaz. Neden: aynı telefonda başkasının verisi görünmesin. — Ürün sahibi (pilot gözlemi: 13 Ekim)

## Görev 10 · Gruplar ve ortak listeler (13 Ekim)

- **Grup daveti Gruplar ekranında ve Gelenler'de görünür** (Katıl / Reddet). — Ürün sahibi
- **Grubu yalnız kuran yönetir** (çağırır, çıkarır, siler); üye "Gruptan ayrıl" der. — Ürün sahibi
- **Ortak listede ad, paylaşım ve silme yalnız kuranda;** herkes madde ekler, işaretler, verir, siler; kişi olarak eklenen "Listeden ayrıl" der. — Ürün sahibi
- Gruba ve listeye yalnız **bağlı** kişiler eklenebilir. — Öneri
- Aynı grupta ya da listede olan, birbirini tanımayan kişiler birbirinin Rites'taki adını ve e-postasını görür. — Öneri
- Madde silmede onay sorulmaz (prototipteki gibi). — Öneri
- Geçmiş günde yapılmamış liste maddesi "Geçmişten kalanlar"a girmez. — Öneri

## Görev 11 · Kütüphanem (13 Ekim)

- **"Planı kütüphaneye kaydet" bir kopya kaydeder; plan sürer.** (Paketteki 'kutuphanede' plan durumu kullanılmadı.) — Ürün sahibi
- **Kütüphanedeki tekrarlı kart "Bugün Ajandama ekle" ile tekrarı ve saatiyle bugünden başlar.** — Ürün sahibi
- Plan kaydı sayfa açmadan kaydedilir; etiket: planın alanı + "Rutin". Planlar paylaşılamaz. — Öneri
- Plan kartında "Ajandamdan kaldır" seçeneği yok. — Öneri
- Kütüphanede süzgeç çiplerinde yalnız kayıtlarda geçen alanlar ve türler görünür. — Öneri
- Kütüphaneden paylaşılan kartın etiketleri de gider; alıcı kaydederken önceden seçili gelir. — Öneri

## Pilot başlangıcı (14 Ekim)

- **Pilot, paketten ayrışarak sürer;** kullanıcı yorumları ve ürün sahibinin istekleri belirleyicidir. Belgeler bu klasörde yaşar; amaç ileride baştan kurgu için PRD görevi görmeleri. — Ürün sahibi
- **Expo Go'dan kendi derlemeye geçiş:** EAS Build; geliştirici için geliştirme derlemesi, pilot kullanıcılar için TestFlight, düzeltmeler için EAS Update. Neden: pilot kullanıcının Expo Go ve geliştirme sunucusuna bağlı kalmaması, bildirimlerin ve izinlerin gerçek haliyle denenmesi. — Ürün sahibi / Öneri
- **Paket kimliği `com.behnanozturkmen.ritespilot`;** ana ekranda "Rites", App Store Connect'te "Rites Pilot". Pilot uygulaması kalıcı ürün değil; ticari ürün yeni kimlikle kurulacak. — Ürün sahibi / Öneri
