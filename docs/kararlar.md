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

## Pilot · 14 Ekim

- **YouTube'dan (ve başka uygulamalardan) paylaşılan bağlantı Rites'ta yeni kart formunu dolu açar:** başlık videonun başlığı (YouTube oEmbed ile alınır; alınamazsa paylaşılan metin ya da "YouTube videosu"), içinde Video bloğu, tarih bugün. Kişi tarih/saat/tekrarı seçip kaydeder. — Ürün sahibi
- Paylaşım Expo'nun kendi modülüyle (`expo-sharing`, iOS'ta deneysel) yapılır; YouTube bağlantısındaki takip ekleri (`si`, `feature`) atılır. Kaydedilmeden kapatılırsa "Yazdıkların silinsin mi?" sorulur. — Öneri
- **Uygulama simgesi:** petrol zemin üzerinde haftanın 7 gününü anlatan yedi parçalı halka, bir parçası kehribar (ritüel ve tekrar). Açılış ekranında aynı halka petrol renkte. — Ürün sahibi
- **Geliştirme derlemesi ayrı uygulama: "Rites Dev"** (ayrı paket kimliği, koyu simge). TestFlight'taki Rites ile aynı telefonda durabilsin; günlük kullanım verisi geliştirme denemelerine karışmasın. — Ürün sahibi

## Ekranı verimli kullanmak (14 Ekim)

- **"Rites" marka satırı kaldırıldı.** Üst satırda solda ekran başlığı (alt ekranlarda "‹ Geri"), sağda ekranın simgeleri ve avatar; ad yazısı da kalktı (avatarın baş harfi yeter). — Ürün sahibi (ad yazısı: Öneri)
- **Ajandam:** başlık yazısı yok (alt menü zaten "Ajandam" diyor); üst satırda ara · süz · Gün/Hafta · takvim simgeleri. Gün/Hafta bölümlü düğmesi tek simgeli geçişe döndü. — Ürün sahibi
- **Hafta şeridinde gün başına kart sayısı ve "1 / 3 tamam" satırı kaldırıldı.** — Ürün sahibi
- **Kaynak çip şeridi yerine süzgeç simgesi ve çoklu seçimli menü** ("Ajandada göster"): işareti kaldırılan kaynak gizlenir, "Hepsini göster" ile sıfırlanır; süzgeç açıkken simge dolu petrol. Yeni bir kaynak (yeni plan) kendiliğinden görünür. — Ürün sahibi (davranış ayrıntısı: Öneri)
- **Giriş'in üst satırında "Rites"** (petrol renk). — Ürün sahibi
- **Avatara dokununca menü: Profil · Ayarlar** (ileride başka seçenekler eklenebilir); menünün başında ad ve e-posta. Profil: ad, e-posta / "E-postanla devam et", Çıkış yap, Hesabımı sil. Ayarlar: Giriş ekranı, Yedekleme, Üyelik. — Ürün sahibi (bölüşüm: Öneri)
- **"Eklediğin kişiler (ücretsiz) N / 5" göstergesi Gruplar'dan Ayarlar → Üyelik'e taşındı.** Sınır dolunca "+ Kişi ekle" yine uyarır. — Ürün sahibi

## Alarm olarak çalan anımsatıcı (14 Ekim)

- **"Görev 7: anımsatıcı bildirim olarak gelir" kararının yerine:** anımsatıcı formunda isteğe bağlı **"Alarm olarak çalsın"** anahtarı (varsayılan kapalı). Açıkken anımsatıcı iOS 26'nın AlarmKit'iyle telefonun alarmı olarak kurulur: kilit ekranını kaplar, sessizde ve Odak'ta çalar. Neden: ilaç gibi önemli anımsatıcılarda bildirim gözden kaçıyor. — Ürün sahibi (P-3)
- **Alarmda Ertele 5 dakika** (değiştirilemez); alarm açıkken formda "Sesli uyar" ve "Ertele dersem" gizlenir. — Ürün sahibi (gizleme: Öneri)
- **Yalnız alarm; güçlendirilmiş bildirim yok.** Telefon desteklemiyorsa (iOS 26'dan eski) anahtar görünmez; izin verilmediyse alarmlı anımsatıcı eskisi gibi bildirimle gelir. — Ürün sahibi (yedek yol: Öneri)
- Alarmdaki **Durdur** o saati "Durduruldu" yapar, **Ertele** 5 dk sonraya tek seferlik alarm kurar; ikisi de Rites'ı açar (modül böyle çalışıyor; kilitliyse önce kilit açılır). Uygulama 10 dakikadan geç açıldıysa Ertele basışı yok sayılır. — Öneri
- Modül: `react-native-alarm-scheduler` (Expo eklentili, iOS 15.1'de kurulur, AlarmKit'i yalnız iOS 26'da kullanır). Expo'nun kendi modülü yok; `expo-alarm-kit` uygulamanın en düşük iOS sürümünü 26'ya çıkarıp Xcode'da elle ayar istediği için seçilmedi. — Öneri
- **Alarmdaki Ertele alarmı susturmuyordu** (Rites açılıyor, "Ertelendi" yazıyor, alarm çalmaya devam ediyor; Durdur düğmesi görünmedi, yan tuşla sustu). Çözüm: Rites basışı işlerken alarmı kendisi susturur (iptal edip tekrarlıyı yeniden kurar); uygulama içindeki Durdur / Ertele de çalan alarmı susturur. — Pilot (P-4)

## Anımsatıcılar ekranı sadeleşti (14 Ekim)

- **Ekranda yalnız eklenen anımsatıcıların listesi;** satıra dokununca düzenleme sayfası açılır (ad, saatler, günler, alarm…), silme de orada ("Anımsatıcıyı sil", onaylı). "Bugün" bölümü ve satırdaki Sil düğmesi kalktı; bugünün çalan anımsatması Giriş'teki kutuda kalır. — Ürün sahibi (düzenlemede silme ve alarm simgesi: Öneri)
- Düzenlenen anımsatıcının alarmı yeniden kurulur (saat, gün ya da ad değişince); kalkan bir saatin bugünkü durumu silinir. — Öneri

## Kart alarmı, paylaşım Gelenler'e, gömülü video (16 Ekim)

- **Ajanda kartının hatırlatması alarm olarak çalabilir:** Hatırlatma sayfasında, bir hatırlatma seçiliyken "Alarm olarak çalsın" anahtarı (iOS 26). Kart satırında zil yerine alarm simgesi. — Ürün sahibi (P-6)
- Kart alarmında **Ertele yok, yalnız Durdur**; Durdur Rites'ta kartı açar. Neden: kart bildiriminde de ertele yok; ertelemenin durumunu tutmak karta yeni alan ister. Kartın önümüzdeki 3 gündeki hatırlatmaları belirli tarihli tek seferlik alarm olarak kurulur (bildirim planıyla aynı pencere; Rites açıldıkça yenilenir). — Öneri
- Belirli tarihte alarm için alarm modülüne küçük bir yama eklendi (`patches/`, `patch-package`; AlarmKit `.fixed`). — Öneri
- **"14 Ekim: paylaşılan bağlantı yeni kart formunu dolu açar" kararının yerine:** paylaşılan bağlantı **Gelenler'de hazır bir kart** olarak bekler (başlık videonun adı, içinde Video bloğu). Gelenler'de: Kütüphaneme kaydet · Ajandama ekle (kart formu dolu açılır; kaydedilince Gelenler'den kalkar) · Sil. — Ürün sahibi (P-7)
- **Paylaşım Rites'ı açmaz:** paylaşım sayfasında kısa bir "Gelenler'e eklendi." görünür ve YouTube'da kalınır; paylaşılanlar telefonda birikir, Rites açılınca Gelenler'e yazılır. Paylaşılanlar yalnız telefonda durur, e-postayla devam etmeden de Gelenler'de görünür; Giriş'teki Gelenler kutusunda sayılır. (Eklentinin uygulamayı açması Apple'ın desteklemediği bir yoldu, o da kalktı.) — Öneri
- **YouTube videosu kartın içinde oynar** (gömülü YouTube oynatıcısı, WebView); altında "YouTube'da aç". Gelenler'deki paylaşılan videoda da oynar. YouTube olmayan bağlantı eskisi gibi "Videoyu aç" ile dışarıda açılır. — Ürün sahibi (P-7)

## Rutin ve proje: "Proje adımları" bloğu (16 Ekim, deneme)

- **Rutin ile proje ayrımı kart bloğu düzeyinde denenir:** Liste bloğu rutindir (işaretler her gün sıfırlanır, değişmedi). Yeni **"Proje adımları"** bloğu projedir: işaretler güne bağlı değil, kalıcıdır; kart günden güne taşınsa da kaldığı yerden sürer. Neden: Yaşam Tarzım'da program ile proje tek "plan" kavramında birleşti ve karıştı; ayrım burada denenip gerçek bir mini projeye geliştirilecek. — Ürün sahibi (P-8)
- **Bütün adımlar bitince kart yapıldı sayılır;** tekrarlı kartsa dizisi o gün biter (ajandadan kalkar). Bir adımın işareti kaldırılırsa ikisi de geri alınır. — Ürün sahibi
- **Yapılan adım işaretli, yerinde durur;** yanında yapıldığı gün ("16 Ekim"); blokta "3 / 7 adım" ve ilerleme çubuğu, ajanda satırında "3/7". — Ürün sahibi
- Düzenlemede adımların işareti metnine göre korunur (sırası değişse de); yeni adım yapılmamış başlar. Kütüphaneye kaydedilen ya da paylaşılan kartta adımlar işaretsiz gider. — Öneri
- Bilinen eksik: bitmiş bir projeye düzenlemeyle yeni adım eklenince kart kendiliğinden "yapılmadı"ya dönmez; bir adımın işareti değişince düzelir. — Öneri (sonra)
