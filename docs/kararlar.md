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

## Kart görünümü sadeleşti (16 Ekim)

- **Kart görünümünün altındaki "Yaptım" çubuğu kalktı;** yanıltıcıydı. Yapıldı işareti ajandadaki satırın işaret kutusunda. — Ürün sahibi (P-9)
- **Kart görünümünde sağ üstte "⋯" menüsü:** Kütüphaneye kaydet · Paylaş · Sil (koç kartında yalnız Kütüphaneye kaydet). Sil eskisi gibi sorar: tekrarlı kartta "Hangi günler silinsin?", değilse onay. Kart formundaki Kütüphaneye kaydet / Paylaş / Sil düğmeleri kalktı; form yalnız düzenleme için. — Ürün sahibi (P-9; menüdeki sıra ve formdan kaldırma: Öneri)
- **Bloksuz kart da kart görünümünde açılır** (önceden doğrudan düzenleme formu açılıyordu); Sil'in tek yeri menü olduğu için. ~~Ajandadaki her satırda ">" var.~~ (17 Ekim: ">" kaldırıldı, P-13) — Öneri

## Anımsatıcı sadeleşti: "Süre sonra" ve "Saatinde" (17 Ekim)

- **İki tür:** ekleme sayfasının üstünde "Süre sonra | Saatinde" seçimi (son kullanılan açılır). — Ürün sahibi (P-10)
- **Süre sonra (hızlı zamanlayıcı; ocağın altı, çamaşır):** hazır süreler 5 · 10 · 15 · 20 · 30 · 45 dk · 1 sa ve "Başka bir süre" (artı/eksi); "Çalacağı saat" görünür. Ad isteğe bağlı (boşsa "20 dk"). Varsayılan uyarı Alarm. Bir kez, saniyesiyle tam anında çalar; durdurulunca silinir (durdurulmasa da bir saat sonra). — Ürün sahibi (silinme: onaylı öneri; bir saat sonra silinme: Öneri)
- **Giriş'teki Anımsatıcılar kutusunda** kurulu "Süre sonra"lar kalan süreleriyle ve İptal ile; altta **"⏱ Süre sonra"** düğmesi (iki dokunuşta kurulur). — Ürün sahibi (onaylı öneri)
- **Saatinde (ilaç, göz damlası):** ad (örnek "Tansiyon ilacı 5 mg"; ilaç adı ve dozu yazılabilir, telefonda kalır), 1 dakika hassasiyetinde saatler (ilki o anın saati; "+ Saat ekle" bir saat sonrasını ekler; her satırda ×), haftanın günleri Pzt … Paz (hepsi seçili başlar). "Günde 2 / 3 kez" düğmeleri ve 13:00 varsayılanı kalktı. — Ürün sahibi
- **"Sesli uyar" yerine "Nasıl uyarsın? Bildirim | Alarm";** Ertele 5 / 10 / 15 dk ikisinde de seçilir (alarmda sabit 5 dk kararının yerine). Alarm yalnız destekleyen telefonda görünür. — Ürün sahibi
- Açıklamadaki "Ajandam'a kart ekle" yönlendirmesi kalktı. — Ürün sahibi
- **Kaydet sağ üstte, Vazgeç solda** (Notlar'daki gibi); anımsatıcıda ve ajanda kartı formunda. Kart formunun altında yalnız zamanlama çubuğu kaldı. — Ürün sahibi (onaylı öneri)
- "Süre sonra" anımsatıcısı düzenlenmez; listede yalnız İptal var. — Öneri

## Ajandam üst kısmı ve kart formunda zamanlama (17 Ekim)

- **Gün başlığında yalnız tarih** ("18 Ekim Pazar"); "Bugün · / Yarın · / Dün ·" yazılmaz. Bugün değilse başlığın yanında küçük **bugüne dön simgesi** (↶); alttaki "↩ Bugüne dön" satırı kalktı. — Ürün sahibi (P-11)
- **Yazılar ve düğmeler küçüldü:** başlık 18 pt, ‹ › 44 pt, hafta şeridindeki gün numaraları 18 pt. — Ürün sahibi (ölçüler: Öneri)
- **Kart formunda Tarih / Saat / Hatırlat / Tekrar ayarları alttan açılan sayfa yerine çubuğun hemen altında açılır;** klavye kapanır, açık bölme çubukta vurgulanır, "Tamam" ya da aynı bölmeye yeniden dokunmak kapatır. "+ Blok ekle" de önce klavyeyi kapatır. Neden: klavye açıkken alttan açılan sayfalar klavyenin altında kalıyordu. — Ürün sahibi (P-11)

## Kart hatırlatması: saat şart değil, "Başka zaman" (17 Ekim)

- **Hatırlatma için kartın saati şart değil.** Hatırlatma seçenekleri: Yok · (kartın saati varsa) Saatinde / 15 dk önce / 1 saat önce · **Başka zaman**. — Ürün sahibi (P-12)
- **"Başka zaman": kartın gününden kaç gün önce (0–30) ve saat kaçta** (1 dakika hassasiyet); altında hatırlatmanın tarihi ve saati görünür ("15 Ekim Perşembe · 09:00"). Tekrarlı kartta her seferinde aynı uzaklıkta çalar. Alarm seçeneği bunda da var. Varsayılan: saatli kartta 1 gün önce kartın saatinde, saatsiz kartta aynı gün 09:00. — Ürün sahibi (biçim: Öneri — tarih takvimden değil "kaç gün önce" ile seçilir; tekrarlı kartta da çalışsın diye)
- Bildirim ve alarm planı, günler önce çalan hatırlatmalar için kartın 30 gün ilerisine kadar bakar; yine yalnız önümüzdeki 3 günde çalacaklar kurulur. — Öneri

## Ajandam: elle sıralama, ">" kalktı (17 Ekim)

- **Satırların sağındaki ">" kalktı;** her kart zaten görünümünde açılıyor. — Ürün sahibi (P-13)
- **Kartlar saate göre değil, elle verilen sırayla dizilir;** saatli kartlar da serbestçe taşınır (tek sıra). — Ürün sahibi ("Hepsi serbest")
- **Yeni kart:** saatsizse en sona; saatliyse saatlilerin arasına saatine göre (saati kendisinden sonra olan ilk saatli kartın önüne). Sonra istenen yere taşınabilir. — Ürün sahibi (onaylı öneri)
- **Sürükleme: karta uzun basıp (0,3 sn) sürüklemek;** tutamaç yok (yer kaplamasın). Kısa dokunuş kartı açar. Telefonda akıcı olmazsa Notlar'daki gibi tutamaca dönülür. Ekran okuyucuda kartın "Yukarı taşı / Aşağı taşı" eylemleri var. — Ürün sahibi ("Uzun bas, sürükle")
- Mevcut kartlar güncellemede bugünkü görünen sırayla (önce saatliler saatine göre, sonra saatsizler) numaralandı; liste ilk açılışta değişmez. — Öneri
- Ortak listelerden verilen maddeler günün kartlarının ardından gelir, sürüklenmez. Sıra bütün günler için tektir: bir kart taşındığında başka günlerdeki sırası da aynı göreli yerde kalır. Hafta görünümünde sürükleme yok. — Öneri

## Kartta fotoğraf büyütülür (17 Ekim)

- **Kart görünümünde fotoğrafa dokununca tam ekranda açılır;** iki parmakla 6 kata kadar büyütülür, büyütülmüşken kaydırılır, sağ üstteki × kapatır. — Ürün sahibi (P-14)
- Çift dokunuş dokunulan yere 2,5 kat yakınlaştırır, yeniden çift dokunuş geri alır. Fotoğrafın sağ alt köşesinde küçük büyütme simgesi var (dokunulabildiği anlaşılsın diye). Gelişim fotoğrafında ve Kütüphane'deki kart ayrıntısında da aynı. Düzenleme formundaki önizleme büyümez. — Öneri

## Gruplar: ortak etkinlikler çeşitlenir; listelerin yeri Gruplar (18 Ekim)

- **Grup etkinlikleri sırayla eklenecek:** 1) liste örnekleri, 2) Buluşma, 3) Birlikte rutin, 4) Nöbet / sıra, 5) İş (Ortak iş + Birinden iste tek türde; Kime? "Herkes" ya da bir kişi) ve Karar / oylama. Web denemesindeki başlıklar (Ortak iş, Birinden iste, Liste, Buluşma, Birlikte rutin) temel alındı. — Ürün sahibi (P-15; birleştirme ve sıra: onaylı öneri)
- **Ortak listelerin asıl yeri Gruplar sekmesi.** Sekmenin sırası: Gruplarım · Ortak listeler (+ Yeni liste) · Kişilerim. Giriş'teki Ortak listeler kutusu kısayol olarak kalır. — Ürün sahibi (sıra ve kutunun kalması: Öneri)
- **Grup ekranında "Listeler" ve "+ Liste ekle";** form o grup seçili açılır. Yeni gelecek türler aynı yere "+ Ekle" ile eklenecek. — Öneri
- **Yeni liste formunda örnek adlar:** Yapılacaklar · Market · Bayram hazırlığı · Tatil hazırlığı · Taşınma · Okul; dokununca ad olur. Neden: liste yalnız alışveriş listesi gibi geliyordu. — Ürün sahibi (örnekler: Öneri)

## Buluşma (18 Ekim)

- **Tek gün ve saat önerilir** (saat ve yer isteğe bağlı); herkes Geliyorum / Belki / Gelemem der. Seçenekli oylama Karar türüyle gelecek. — Ürün sahibi
- **"Geliyorum" diyenin ajandasına kart düşer;** Belki ya da Gelemem'e geçince kalkar. Kartın kaynağı "Grup: <grup adı>" (yeni mavi şerit), süzgeçte "Gruplardan". Saatliyse 1 saat önce bildirim kurulu gelir; kişi kartı kendi ajandasında değiştirebilir. — Ürün sahibi (kaynak, renk ve bildirim: Öneri)
- **Kuran günü ya da saati değiştirirse öteki yanıtlar sıfırlanır;** ajandalardaki kartlar kalkar, herkes yeniden yanıtlar. Yalnız ad ya da yer değişirse yanıtlar kalır. — Ürün sahibi (ad/yer ayrımı: Öneri)
- Kuran geliyor sayılır (kartı ajandasına girer). Buluşmayı kuran değiştirir; kuran ya da grubun kurucusu siler (silinince ajandalardaki kart kalkar). Grup ekranında yalnız bugün ve sonrası görünür. — Öneri
- **Grup ekranının sırası:** Buluşmalar · Listeler · **+ Ekle** (Buluşma, Liste; yeni türler buraya) · Üyeler. — Öneri
- Kart, buluşmanın gününde ve saatinde kalır; kişi kartı ajandasından silerse eşitleme onu geri getirmez (yanıtı yine Geliyorum görünür). — Öneri

## Birlikte rutin (18 Ekim)

- **Hedef "haftada N kez"** (1–7; 7 = Her gün); hangi gün yapılacağı kişiye kalır. Hafta Pazartesi başlar. — Ürün sahibi
- **Katılırken kişi kendi günlerini seçer;** hedef kadar gün önerilir (3 → Pzt Çar Cum), değiştirilebilir. Ajandasında o günlerde tekrarlı kart ("Grup: <grup adı>"); kartta "Yaptım" dediği günler grupta sayılır. — Ürün sahibi (öneri günleri: Öneri)
- **Grupta kişi kişi bu haftaki sayı görünür** ("Sen 1/3 · Gül Aksoy 3/3 ✓"; hedefe ulaşan dolu renkte). Sunucuya yalnız gün gider; kartın içi (not, ölçüm) telefonda kalır. — Ürün sahibi
- Kuran katılmış sayılır. Ad ve hedefi kuran değiştirir; kuran ya da grubun kurucusu siler. Ayrılınca ya da rutin silinince ajandadaki dizi dün biter, geçmiş kayıtlar kalır; sunucudaki o kişinin günleri silinir. — Öneri
- Ad örnekleri: Yürüyüş · Su içmek · 10 dk okuma · Esneme · Ekransız akşam · Erken yatmak. Grup ekranında Buluşmalar'ın altında, yalnız rutin varsa "Birlikte rutinler" bölümü. — Öneri
- İşaretler telefon çevrimiçiyken birkaç saniye içinde, değilse uygulama yeniden açılınca gruba gider; geçen haftanın başından eski işaretler gönderilmez. — Öneri

## Nöbet / sıra (18 Ekim)

- **Sıra takvime göre döner:** her seçilen günde sıradaki kişi; yapılmasa da geçer, önceden bilinir. — Ürün sahibi
- **Seçilen günlerde** (her gün ya da ör. Pzt ve Per); her seçilen gün bir sıra. — Ürün sahibi
- **Sıradakileri ve sıralarını kuran seçer** (gruptan; dokunma sırası sıradır, yeniden dokununca çıkar). — Ürün sahibi
- Sırası gelenin ajandasına o gün tek seferlik kart düşer ("Grup: <grup adı>"); önümüzdeki 14 gün için hazırlanır. Kişi kartı silse de bir sonraki eşitlemede geri gelir (iş onun). — Öneri
- Grup ekranında sıradaki 5 gün ve kimde olduğu; yapıldıysa ✓ (başkası yaptıysa adıyla). "Yaptım" günün sahibi dışında biri işaretlerse de sayılır; geri alma yalnız kendi işaretinde. — Öneri
- Kuran günleri ya da sırayı değiştirirse sıra bugünden, listenin başından yeniden başlar; yalnız ad değişirse sıra sürer. Kuran ya da grubun kurucusu siler; ajandalardaki gelecek günler kalkar. — Öneri
- Ad örnekleri: Bulaşık · Çöp · Sofra · Çiçekleri sulamak · Market · Akşam yemeği. Varsayılan: her gün. — Öneri

## İş: herkese aç ya da birinden iste (18 Ekim)

- **Ortak iş ile Birinden iste tek tür: "İş".** Kime? "Herkes" ise isteyen "Ben alırım" der; bir kişiyse o kişi "Kabul et" ya da "Alamam" der. — Ürün sahibi (onaylı öneri)
- **"Ne zaman?" isteğe bağlı** (Tarih yok · Bugün · Yarın · Başka gün). Tarih verilirse alanın ajandasına o güne, verilmezse aldığı güne düşer; yapılmazsa "Geçmişten kalan"da durur. — Ürün sahibi
- **Ret isteyene döner** ("Elif alamadı"); isteyen "Başkasına ver" ile başka birine verir, herkese açar ya da siler. — Ürün sahibi
- **Yapılan iş 7 gün "Yapıldı · <kişi> ✓"** olarak görünür, sonra kalkar. — Ürün sahibi
- Alan, işi grup ekranından ya da ajandadaki kartından "Yaptım" ile bitirir; "Bırak" derse iş herkese açıksa yeniden açılır, birinden istenmişse isteyene döner. Yapılan işi yalnız yapan geri alır. İsteyen düzenler; isteyen ya da grubun kurucusu siler. — Öneri
- Grup ekranında **İşler en üstte** (yalnız iş varsa): önce bende olanlar ve benden istenenler, sonra açıklar, sonra öbürleri, yapılanlar en sonda. Ad örnekleri: Eczaneye uğra · Faturayı öde · Okuldan al · Ekmek al · Kargoyu teslim al. — Öneri

## Karar / oylama (18 Ekim)

- **Kaç seçenek işaretleneceğini kuran seçer:** "Tek seçim" ya da "Birden çok" (gün oylamasında varsayılan Birden çok). — Ürün sahibi
- **Kuran "Karar ver" der** (seçeneklerden birine dokunur, onaylar); isteğe bağlı son gün (Yok · Yarın · 3 gün sonra · 1 hafta sonra), son günden sonra oy verilmez, kararı yine kuran verir. — Ürün sahibi (son gün seçenekleri: Öneri)
- **Kim neye oy verdi adlarıyla görünür;** en çok oy alan kalın. — Ürün sahibi
- **"Gün seçimi" oylaması:** "Ne için?" (Piknik…), takvimden günler, isteğe bağlı ortak saat ve yer; karar verilince o güne Buluşma kurulur (kuran geliyor sayılır, ajandasına girer; ötekiler Geliyorum / Belki / Gelemem der). Oy verenlere kendiliğinden "Geliyorum" yazılmaz. — Ürün sahibi (kendiliğinden yanıt yok: Öneri)
- Oya yeniden dokununca geri alınır. Verilmiş karar 7 gün görünür ("Karar: …"), sonra kalkar. Soru örnekleri: Ne yiyelim? · Nereye gidelim? · Hangi film? · Hediye ne alalım?; gün için: Piknik · Akşam yemeği · Aile toplantısı · Doğum günü. — Öneri
- **"+ Ekle" sayfasının sırası:** İş · Buluşma · Karar / oylama · Birlikte rutin · Nöbet / sıra · Liste. Böylece grup etkinliklerinin altısı da hazır (P-15 tamam). — Öneri

## Notlar: ajandadaki gibi sürükleme; ajandadaki "Notlarım" bağlantısı kalktı (19 Ekim)

- **Notlar ekranında nota uzun basıp sürükleyerek sıralanır** (Ajandam'daki gibi); soldaki tutamaç kalktı. Kısa dokunuş notu açar; ekran okuyucuda "Yukarı taşı / Aşağı taşı". — Ürün sahibi (P-16)
- **Hızlı Not kutusu kapalıyken Ajandam'ın üstünde çıkan "Notlarım (N) ›" bağlantısı kalktı** (G-7'nin bu kısmı geçersiz). Notlara Giriş'teki Hızlı Not kutusundan ulaşılır; kutu kapalıysa Giriş ayarından açılır. — Ürün sahibi (P-16)

## Gruplar sadeleşti: Gelenler, takip, üç ana tür, listelerin yeri grup (19 Ekim)

- **Yanıt bekleyen her şey üyenin Gelenler'ine düşer** ("Gruplarından"): benden istenen iş, herkese açık iş, yanıtlamadığım buluşma, oy vermediğim oylama, katılmadığım birlikte rutin. Kart grup ekranındakinin aynısı; düğmeleri Gelenler'de çalışır, yanıtlayınca kalkar. Benden istenen iş ve buluşma dışındakilerde "Gizle" (telefonda tutulur; grupta yine görünür). Giriş'teki Gelenler kutusu bunları da sayar ("2 grup isteği"). — Ürün sahibi (P-17; gizlenebilenler: Öneri)
- **Kuran için takip:** buluşmada "Yanıt bekleniyor: …", oylamada "Oy vermedi: …" (yalnız kurana). Gruplar sekmesinde grubun satırında "Senden N yanıt bekleniyor". — Ürün sahibi (P-17)
- **"+ Ekle": üç ana tür** — Yapılacak (Tek iş | Liste), Buluşma (Gün belli | Günü oylayalım), Birlikte rutin; **"Diğer"** altında Nöbet / sıra ve Oylama (yalnız seçenekli; gün oylaması Buluşma'ya geçti). — Ürün sahibi (P-17)
- **Grup ekranının bölümleri:** Yapılacaklar (işler ve listeler) · Buluşmalar (gün oylamaları ve buluşmalar) · Birlikte rutinler · Oylamalar · Nöbetler · + Ekle · Üyeler. Boş bölüm görünmez; hepsi boşsa "+ Ekle ile başlat" yazar. — Öneri
- **Listelerin tek yeri grup.** Gruplar sekmesindeki "Ortak listeler" bölümü, "+ Yeni liste" ve Giriş'teki Ortak Listeler kutusu kalktı; yeni liste grupta "+ Ekle → Yapılacak → Liste" ile açılır ve gruba açılır. Eskiden kişiye açılmış listeler Gruplar sekmesinde "Kişilerle listeler" altında görünmeye devam eder (düzenlerken kişileri değiştirilebilir); bir kişiyle paylaşmak için iki kişilik grup kurulur. — Ürün sahibi (P-17; eski listelerin kalması: Öneri)
- Hızlı Not kutusunun ayardaki açıklaması güncellendi (Ajandam'daki bağlantı P-16'da kalkmıştı). — Öneri

## İş metinleri ve anında güncelleme (19 Ekim)

- **Birinden istenen iş kabul edilince "Elif kabul etti · ajandasında"**, herkese açık işte "Elif üstlendi · ajandasında"; bitince **"Elif tamamladı ✓"** (kendin için "Kabul ettin / Üstlendin · ajandanda", "Tamamladın ✓"). Reddedilen iş "Elif kabul etmedi". Düğme "Yaptım" yerine "Tamamladım". — Ürün sahibi (P-18; herkese açık işteki "üstlendi" ve kendi metinlerin: Öneri)
- **Gruplardaki değişiklik öteki telefonlara anında gelir** (sekmeyi yenilemeye gerek yok): iş, buluşma ve yanıtlar, oylama ve oylar, birlikte rutin ve işaretleri, nöbet, grup üyeleri, Gelenler, kişi istekleri. Telefon yalnız "değişti" haberini alır, kendi yetkisiyle yeniden okur. — Ürün sahibi (P-18)

## Kişi ekleme istekleri Gelenler'de (19 Ekim)

- **"Seni eklemek isteyenler" Gelenler'de de görünür** (Kabul et · Reddet), Gruplar sekmesindeki gibi; Giriş'teki Gelenler kutusu sayar ("1 kişi ekleme isteği"). Davet edilen kişi Rites'a katılınca isteği de böyle Gelenler'den kabul eder. — Ürün sahibi (P-20)

## Anımsatıcı bildirimi sadeleşti (19 Ekim)

- **Bildirim tek ve düğmesiz:** bildirimin üstüne basılı tutunca çıkan Durdur / Ertele kalktı, durdurulmazsa 3 kez yeniden çalma da kalktı. Bildirime dokununca Rites Anımsatıcılar'ı açar. — Ürün sahibi (P-21; yeniden çalmanın kalkması: Öneri — düğme olmadan durdurmanın yolu kalmıyordu)
- **"Ertele dersem" yalnız Alarm'da;** alarmda Durdur / Ertele eskisi gibi. Anımsatıcı satırında bildirimliler için erteleme yazmaz. — Öneri

## Bildirim sesleri ve Gelenler bildirimi (19 Ekim, sürüm 1.3.0)

- **Beş örnek ses:** Zil · Çan · Yumuşak · Kuş · Kısa bip (Rites'ın kendi ürettiği kısa sesler; telifsiz) ve "Telefonun sesi" (varsayılan). — Ürün sahibi (P-21; seslerin kendisi: Öneri)
- **Ses kullanıcıya kalır:** her anımsatıcıda "Ses" (bildirimli olanlarda; dokununca bir kez çalar); kart hatırlatmaları için Anımsatıcılar ekranında "Ajanda hatırlatmalarının sesi". Alarmın sesi değişmez (telefonun alarm sesi). — Ürün sahibi (yerleri: Öneri)
- **Gelenler bildirimi:** Gelenler'e bir şey düşünce telefona bildirim gelir — kart, kişi isteği (ve kabul edildi), grup daveti, benden istenen ya da herkese açık iş, buluşma (ve zamanı değişti), oylama (ve karar), birlikte rutin, nöbete eklenme; kuranın işi kabul edilince / tamamlanınca / kabul edilmeyince kurana. Bildirime dokununca Gelenler açılır. — Ürün sahibi (P-21; hangi olayların bildirim verdiği: Öneri)
- **Aç / kapat Gelenler kutusundaki zilde** (Giriş'te ve Gelenler ekranının sağ üstünde); varsayılan açık; kapalıyken sunucu o telefona hiç göndermez. Tercih telefonda tutulur, telefon değişirse yeniden seçilir. — Ürün sahibi
- Giriş'te "hazır değil" kutular (Ortak Listeler) artık hiç çizilmiyor (19 Ekim'de kaldırılan kutu eski ayarda açık kalmıştı). — Öneri

## Yaşam Tarzım: planlar yerine programlar (20 Ekim)

- **Program:** adı olan, uygulanabilen kart topluluğu; eski "Plan"ın yerini alır. Alanlarla etiketlenir (birden çok; hiç de olabilir), kısa bir "Neden?" yazılır, süreli (1–8 hafta) ya da süresiz (alışkanlık). Hedef, Günün sorusu ve plan içindeki "adımlar" ayrımı kalktı; iş projeleri kartın "Proje adımları" bloğunda yürür. — Ürün sahibi (P-22; yalnız "Neden" kalsın)
- **Kartları ajandadaki kartların aynısı** (süre tutar, ölçüm alır, video / not tutar); zamanı programın başlangıcına göre yazılır: "1. gün" (ör. araştırma videosu ve notlar), "Pzt Çar Cum · 18:00", "8. günden". Kartlar programın ekranında yazılır ya da Kütüphanem'den eklenir. — Ürün sahibi (P-22; "N. hafta · N. gün" seçimi ve tekrarın programla bitmesi: Öneri)
- **Başlat → ajanda:** başlangıç günü seçilir (Bugün / Yarın / Pazartesi / takvim); kartlar kendi günlerinde ajandaya düşer, etiketlerinde programın adı. Program uygulanırken programa eklenen kart **o günden sonra kendiliğinden ajandaya düşer**. — Ürün sahibi
- **Ajandadan programa:** kart görünümünde "⋯ → Programa ekle". Uygulanan programa eklenen kart programın parçası olur (ajandada aynı kart kalır); başka bir programa kopyası eklenir. Uygulanan programın kartı ajandada düzenlenince programdaki karşılığı da değişir ("yalnız bu gün" düzenlemesi hariç). — Ürün sahibi (P-22; düzenlemenin programa yansıması: Öneri)
- **Ara ver / Bitir:** bugünden sonraki yapılmamış kartlar ajandadan kalkar, yaptıkların geçmişte kalır; program durur, **Yeniden başlat** ile seçilen günden baştan başlar. Süresi dolan program "Süresi doldu" der. Program silinince geçmiş kartlar sıradan kart olarak kalır. — Öneri
- **Değerlendirme:** uygulanmış (ara verilmiş ya da bitmiş) program 1–5 yıldız (İşe yaramadı · Pek değil · İdare eder · İyi geldi · Çok iyi geldi) ve kısa notla değerlendirilir; "Bitir" deyince değerlendirme sayfası açılır. Yıldızlar Kütüphanem'de ve Yaşam Tarzım'da görünür. — Ürün sahibi (P-22; sözler ve Bitir'den sonra açılması: Öneri)
- **Alanlar:** dokuz hazır alan yeni kullanıcıya yol gösterir; kişi kendi alanını ekler (Alanları seç → "+ Kendi alanını ekle" ya da program formunda "+ Yeni alan"), adını değiştirir, siler (programlar silinmez, yalnız etiket kalkar). **Alan puanı kişinin kendi değerlendirmesidir, programlardan bağımsızdır**; alan kutusu "1 program uygulanıyor" / "İlerlemek istiyorum" / "Program yok" yazar. Plan açılırken alınan başlangıç puanı kalktı. — Ürün sahibi (P-22)
- **Programlar iki yerde:** Yaşam Tarzım'da Programlarım (uygulananlar sıradaki işiyle ve "1 / 2 bugün"; sonra en çok üç hazır / ara verilmiş / biten) ve Kütüphanem'de bütün programlar yıldızlarıyla, kayıtlı kartlar ve Rites önerileri; arama hepsinde. — Ürün sahibi (yerleşim ayrıntısı: Öneri)
- **Hazır paketler "Rites önerisi" oldu:** alan ekranında ve Kütüphanem'de; "Programlarıma ekle" kopyasını kişinin programı yapar. — Ürün sahibi
- **Pilottaki planlar silindi** (kartları ve kütüphanedeki plan kopyaları da; sürüm 15). Eski yedek geri yüklenirken plan kartları alınmaz. — Ürün sahibi
- Giriş'teki **Devam edenler** uygulanan programları gösterir; **Günün sorusu** kutusu kalktı. — Öneri
- Sonraya: programı başkasına göndermek (Gelenler'e program olarak), gelişimi daha ayrıntılı izlemek (rutin / alışkanlık sayıları). — Not

## Rites önerileri Kütüphanem'de; içerik kataloğu indirilebilir (20 Ekim)

- **Öneriler kişinin kayıtlarının arasında:** Kütüphanem'de Programlar ve Kartlar listelerinde, kişinin kendilerinden sonra "Öneri" etiketiyle ("Rites önerisi"). Arama ve alan / tür süzgeci önerilerde de çalışır. İstemediğini "Önerilerden gizle" der; "Gizlediğin öneriler (N)" ile yeniden görür. — Ürün sahibi
- **Öneri kartları da var:** alanlardaki hazır etkinlikler (Su, Sabah esnemesi, Şükran notu…) tek tek öneri kart; "Bugün Ajandama ekle" ya da "Programa ekle". Alan ekranındaki "Rites önerileri" programları ve kartları birlikte gösterir. — Ürün sahibi
- Öneri program "Programlarıma ekle" denince kişinin programı olur ve öneri Kütüphanem'de artık görünmez (gizlenir; isterse yeniden gösterir). — Öneri
- **İçerik kataloğu sunucuda:** alanlar, öneri kartları ve öneri programları Supabase'deki üç tabloda (`icerik_alan`, `icerik_kart`, `icerik_program`); herkes okur, uygulamadan kimse yazamaz; ürün sahibi ya da uzman Supabase panelinden düzenler (ileride ayrı bir düzenleme sayfası). Uygulama açılışta ve öne dönünce, en çok 6 saatte bir indirir, telefonda saklar; indiremezse saklı kopyayı, o da yoksa uygulamayla geleni kullanır. Sunucuya kişinin verisi gitmez. — Ürün sahibi (6 saat: Öneri)
- **Katalog alanları da değiştirebilir:** ad, açıklama, simge, yeni kişide açık olup olmadığı; yeni alan eklenebilir. Anahtarlar değişmez; katalogdan kalkan alan kişinin etiketlerinde adıyla kalır. Kişinin kendi kopyaları katalog değişince değişmez. — Ürün sahibi
- Uzman için yazım kuralları `docs/icerik.md`de; "Klinik değildir" ilkesi içerik için de geçerli (doz, tanı yok). — Öneri

## Profil: avatar ve görünen ad (20 Ekim)

- **Profil'de "Sana nasıl hitap edelim?" kutusu kalktı** (ad ilk açılışta soruluyor). Yerine adın yanında sağda **"Düzenle"**: profil fotoğrafı (seç, çek, kaldır; kare kırpılır) ve **görünen ad**. Ad Rites'ın hitabı ve kişilerin / grupların gördüğü ad; fotoğraf yalnız bu telefonda durur, sunucuya gitmez. Avatar fotoğraf varsa onu, yoksa baş harfi gösterir. — Ürün sahibi (fotoğrafın yalnız telefonda kalması: Öneri)

## Giriş: kutularda modül simgesi; Giriş'te iğneli notlar (21 Ekim)

- **Her Giriş kutusunda, kutunun modülünü açan simge** (21 Ekim öğleden sonra: sağdan başlığın soluna, en başa alındı): Hızlı Not → yapışkan notlar simgesi (Notlar), Bugün sırada → takvim (Ajandam), Gelenler → gelen kutusu (Gelenler), Anımsatıcılar → zil (Anımsatıcılar), Devam edenler → yaprak (Yaşam Tarzım). Eski "›" okları ve "Tümü ›" bunların yerine kalktı; satıra dokunmak da eskisi gibi açar. — Ürün sahibi (P-25)
- **Giriş'te yalnız iğnelenen notlar:** Notlar ekranında her notun sağında iğne; not sayfasında "Giriş'e iğnele / Giriş'ten kaldır". İğneli notlar Giriş'te hemen görünür (en çok 3, Notlar'daki sırayla; fazlası "N iğneli not daha ›"). "Göster / Gizle" ve en yeni iki not kalktı. İğneli not yoksa yazma kutusu kalır; not varsa "Bir notu burada görmek için Notlar'da iğnele." — Ürün sahibi (P-25; ipucu metni: Öneri)
- Kaydedilen not için "Kaydedildi: …" satırı artık her zaman 4 saniye görünür (notlar listesi olmadığından). — Öneri

## Hızlı Not: söyleneni yazıya çeviren mikrofon ve ayrı ses kaydı; sesli notu paylaşma (21 Ekim, sürüm 1.4.0)

- **İki simge:** mikrofon söyleneni yazıya çevirir (iPhone'un konuşma tanıması, Türkçe; yazı kutusuna canlı yazar, kişi düzeltip kaydeder; dokununca durur); yanındaki **dalga** simgesi ses kaydı alır ("Sesli not"). Yazı varken dalga yerine kaydet oku çıkar. Klavyedeki dikteyi uygulama açamaz (iOS izin vermiyor); bu yüzden tanıma Rites'ın içinde. — Ürün sahibi (P-26)
- **Tanıma telefonun içinde** yapılır (ses dışarı gitmez); telefon Türkçeyi kendi içinde tanıyamıyorsa klavyedeki dikte gibi Apple'ın tanımasına gider. İlk kullanımda mikrofon ve konuşma tanıma izni sorulur. — Öneri
- **Ses kaydında "İptal":** kayıt sürerken "Kaydediliyor…" satırında İptal (kayıt atılır) ve Bitir (sesli not olur). — Ürün sahibi (P-26)
- **Sesli notu paylaş ya da kaydet:** not sayfasında "Ses kaydını paylaş ya da kaydet" → telefonun paylaşım sayfası (Dosyalar'a kaydet, mesajla gönder…). Dosya adı notun adı ve zamanı ("Sesli not 21 Ekim 11.22.m4a"). Biçim **m4a** (AAC): iPhone kaydı böyle tutar, her yerde çalar; mp3'e çevirmek ek bir kodlayıcı ister, şimdilik yok. — Ürün sahibi (P-26; m4a: Öneri)
- Yeni yerel modül (konuşma tanıma) eklendiği için sürüm **1.4.0**; güncelleme olarak gitmez, yeni derleme gerekir. — Not

## Hızlı Not: ses kaydı başlık satırında, adı yazı kutusundan; dikte duraklamada silinmez (21 Ekim)

- **Modül simgeleri kutuların solunda, en başta** (sağda değil). — Ürün sahibi (P-27)
- **"Ses kaydı" düğmesi Hızlı Not'un başlık satırında sağda** (dalga + "Ses kaydı"); yazı kutusunda yalnız mikrofon (dikte) ve yazı varken kaydet oku kalır. Kayıt sürerken yazı kutusu açık kalır ("Kaydın adı (isteğe bağlı)"), altında Kaydediliyor… · İptal · Bitir; kutuya yazılan **kaydın adı** olur, boşsa "Sesli not". — Ürün sahibi (P-27; başlık satırı: Öneri)
- **Dikte duraklamada öncekini silmiyor:** iPhone her duraklamada parçayı kesinleştirip yeni parçaya baştan başlıyor; kesin parçalar birikip arka arkaya ekleniyor. — Hata düzeltmesi (P-27)

## Giriş ayarı ve Bugün sırada kartı (21 Ekim)

- **"Giriş'te neler görünsün?"** listesinde her kutunun adının solunda kutudaki simgenin aynısı; sıra, satıra **uzun basıp sürükleyerek** değişir (↑ ↓ okları kalktı; ekran okuyucuda "Yukarı / Aşağı taşı"). Aç / kapat düğmesi yerinde. — Ürün sahibi (P-28)
- **Bugün sırada:** sıradaki iş koyu kutunun içinde beyaz bir **kart**: başlık, saat ve tekrar; açılabilen kartta dokununca açılır (›); **"Yaptım" kartın üstünde** (dolu, ✓). Altında "Bugün N iş daha var" ve "Geçmişten kalan" eskisi gibi. — Ürün sahibi (P-28; kartın içeriği: Öneri)

## Kart görünümü: tek uzun kart, bloklar bölüm bölüm (21 Ekim)

- **Kartı açınca tek, uzun beyaz kart:** üstte başlık, zaman (saat · tekrar), program etiketi ve kısa açıklama; tekrarlı kartta seri; sonra **her blok kendi bölümünde**, bölümün başında türünün simgesi ve adı (VİDEO, TALİMAT, LİSTE · Malzemeler, ÖLÇÜM…; içerik blokları ana renk, kayıt blokları kehribar). Bölümler ince çizgiyle ayrılır. Kaynaklı kartta (program, grup, gelen…) solda ajandadaki gibi renkli şerit. Bloksuz kartta "Düzenle"ye yönlendiren kısa bir not. — Ürün sahibi (P-29; yerleşim: Öneri)
- Kart görünümünde yapılabilecekler pilot denemelerinde ayrıca konuşulacak. — Not

## Alanlardaki "Bu alanda ilerlemek istiyorum" kalktı (22 Ekim)

- Düğmenin alan kutusunda "İlerlemek istiyorum" yazdırmaktan başka işlevi yoktu; alan ekranından ve alan kutusundan kalktı. Alan kutusu artık "N program uygulanıyor" · "N program" · "Program yok" yazar. Telefondaki eski değer silinmez, kullanılmaz. — Ürün sahibi

## Zamanlayıcı: "Süre sonra"nın yerine (23 Ekim)

- **Adı "Zamanlayıcı".** Giriş'teki Anımsatıcılar kutusunda ve Anımsatıcılar ekranında **"+ Zamanlayıcı"** düğmesi; "Anımsatıcı ekle" sayfasındaki "Süre sonra | Saatinde" seçimi kalktı (o sayfa yalnız saatli anımsatıcılar için). 17 Ekim kararının "Süre sonra" kısmının yerine geçer. — Ürün sahibi (P-30)
- **Süre seçimi:** üstte seçilen süre büyük rakamlarla (05:00), altında "Çalacağı saat"; hazır süreler **1 · 3 · 5 · 10 · 15 · 30 dk** ve **saat / dakika / saniye tekerleği** (saniyesine kadar; en çok 23:59:59). Ad isteğe bağlı (boşsa "5 dk", "2 dk 30 sn"). — Ürün sahibi (P-30)
- **Sayfa son kurulan süreyle açılır** (ilk seferde 5 dk). — Öneri
- **Uyarı:** destekleniyorsa varsayılan Alarm, istenirse Bildirim (ses seçilir). Alarmda ertele **5 dk** (seçim yok, sayfa kısa kalsın). — Öneri
- **Çalışırken:** her zamanlayıcı kendi satırında **saniye saniye geri sayar** (00:46), solunda **dolan halka**; halkanın ortasına dokununca **Duraklat / Devam** (duraklayınca halka griye döner, "Duraklatıldı"); sağda **+1 dk** ve **İptal**. Bitiş saati satırda ("Bitiş 11:42"). — Ürün sahibi (P-30; halkanın Duraklat düğmesi olması: Öneri)
- **Duraklatılan zamanlayıcının** bildirimi ve alarmı kalkar; Devam kalan süreden yeniden kurar. Duraklatılmış zamanlayıcı kendiliğinden silinmez (kişi sürdürür ya da iptal eder). **+1 dk** duraklatılmışken de çalışır; halkanın toplamı da bir dakika büyür. — Öneri
- Süre dolunca kutu eskisi gibi "Şimdi çalıyor · Durdur / Ertele" olur; artık saniyesi dolmadan (aynı dakikanın başında) "çalıyor"a geçmez. — Hata düzeltmesi (P-30: "hassas değil")
- Tekerlek ve halka uygulamanın kendi parçaları (yeni yerel modül yok): **güncelleme olarak gider**, yeni derleme gerekmez. — Not

## Zamanlayıcı: form yok, kutuda kurulur; yalnız alarm; ertele 1 dk (23 Ekim)

- **"+ Zamanlayıcı" form açmaz:** kutunun içinde açılır (Giriş'teki Anımsatıcılar kutusu ve Anımsatıcılar ekranı): büyük rakamlarla süre, hazır süreler, saat / dakika / saniye tekerleği; **Vazgeç** ve **▶ Başlat**. Ad yok (satırda süre yazar: "5 dk"), ayar yok. Yukarıdaki (aynı gün) alttan sayfanın yerine geçer. — Ürün sahibi (P-31)
- **Yalnız alarm:** zamanlayıcı her zaman alarm olarak çalar; Bildirim / ses seçimi yok. Telefon alarmı desteklemiyorsa (iOS 26 öncesi) bildirim olarak gelir. — Ürün sahibi (P-31; destek yoksa bildirim: Öneri)
- **Bitiş saati yazılmaz** (duraklatıp sürdürünce yanıltıyordu); satırda yalnız geri sayım, duraklatılmışsa "Duraklatıldı". — Ürün sahibi (P-31)
- **Ertele 1 dk**, alarmdaki düğmede de Giriş'te de ("1 dk ertele"). Ertele zamanlayıcıyı **saniyesiyle** 1 dakika sonrasına yeniden kurar; satır geri döner, geri sayım ve halka 01:00'dan başlar. — Ürün sahibi (P-31; yeniden kurulma: Öneri)

## Zamanlayıcı kadranı: mutfak zamanlayıcısı gibi (23 Ekim)

- **Anımsatıcılar kutusunun başlık satırında sağda zamanlayıcı simgesi.** Basınca kutunun içinde **kadran** açılır, **5 dk'ya ayarlı**; yeniden basınca ya da sağ üstteki ✕ ile kapanır. Anımsatıcılar ekranında "+ Zamanlayıcı" düğmesi aynı kadranı açar. Aynı günün "kutuda kurulur" kararındaki hazır süreler ve tekerlek kalktı. — Ürün sahibi (P-32)
- **Süre kadranla:** tutamak halkanın üstünde parmakla çevrilir; **bir tam tur 60 dk, adım 1 dk**, saniye yok. Renkli yay seçilen süredir (tepeden saat yönünde); kenarda her 5 dk'da çizgi, 0 · 15 · 30 · 45 yazar. Halkaya dokununca o dakikaya atlar; çevirirken tepeden geçince 60'ta (ya da 0'da) durur. Çevirirken ekran kaymaz. Ekran okuyucuda kadran ayarlanabilir öğedir (yukarı / aşağı: 1 dk). — Ürün sahibi (P-32; dokununca atlama, tepede durma: Öneri)
- **Ortada süre (05:00) ve yuvarlak Başlat.** — Ürün sahibi (P-32)
- **Zamanlayıcı en çok 1 saat;** daha uzun işler saatli anımsatıcıyla kurulur. +1 dk ile 60'ın üstüne çıkılabilir. — Ürün sahibi (P-32; +1 dk ile aşma: Öneri)
- **Başlayan zamanlayıcı** şimdiki gibi küçük halkalı satıra iner (birden çok zamanlayıcıda Giriş kalabalıklaşmasın). Halka artık **kalan süreyi** gösterir: mutfak zamanlayıcısı gibi küçülerek biter. Çalışan zamanlayıcının süresi kadranla değişmez (cepten çıkarırken yanlışlıkla değişmesin); +1 dk ve Duraklat var. — Ürün sahibi (P-32)
- Çevirirken her dakikada hafif titreşim (gerçek düğme hissi) yeni bir yerel modül ister; bir sonraki derlemeye bırakıldı. — Not

## Alarmın sesi seçilir (23 Ekim)

- **YouTube'la uyanmak yok:** iPhone kilitliyken bir uygulama kendiliğinden açılıp video/müzik oynatamaz; alarm sesi telefonda duran bir dosya olmalı, YouTube sesi indirilemez. Bu senaryo için iPhone'un Saat uygulaması (Apple Music şarkısıyla alarm) kullanılacak; ev otomasyonu ileride düşünülebilir. — Ürün sahibi (P-33)
- **Alarm sesi seçimi:** kartın alarmında ("Alarm olarak çalsın" açıkken) ve anımsatıcının alarmında **"Alarm sesi"**: Telefonun alarm sesi · Zil · Çan · Yumuşak · Kuş · Kısa bip (Rites'ın gömülü sesleri; dokununca bir kez çalar). Varsayılan telefonun alarm sesi. Her kart / anımsatıcı kendi sesini seçer; programın kartında seçilen ses ajandaya düşen karta geçer. — Ürün sahibi (P-33)
- Anımsatıcıda bildirim sesi ile alarm sesi aynı alandır (hangisi seçiliyse onun sesi). Zamanlayıcı telefonun alarm sesiyle çalar. — Öneri
- **Denendi (23 Ekim):** kilit ekranında seçilen ses (Çan) çaldı ve durdurulana kadar tekrar tekrar çalıyor; deneme yeterli. **Alarma özel (daha uzun) sesler ileride** eklenecek (yeni derleme ister). "Kendi sesin" ve kartın bildirim sesinin kart başına seçilmesi de o zaman konuşulur. — Ürün sahibi (P-33)

## Üst satır düzeni ve Kişilerim (23 Ekim)

Menü yerleşimi çalışmasının (P-23) ilk adımı; kullanımda ayar yapılabilir.

- **Avatar (Profil · Ayarlar) yalnız Giriş'te.** Öbür sekmelerde sağ üst köşe sekmenin işlerine kalır. — Ürün sahibi (P-34)
- **Ajandam:** solda başlık **"Ajandam"** geri geldi; sağda **ara · takvim · Görünüm · ＋**. Süzgeç ve Gün / Hafta tek **Görünüm** menüsünde (üstte Gün | Hafta, altında "Ajandada göster" kaynakları; süzgeç açıksa düğme dolu). **＋ (kart ekle)** üstte, ana renkte dolu; listenin altındaki "+ Kart ekle" kalktı. Boş günde listenin ortasında "+ Bu güne kart ekle". — Ürün sahibi (P-34)
- **Gruplar:** en üstte kapalı **"Kişilerim · N kişi"** satırı; seni eklemek isteyen varsa altında "N kişi seni eklemek istiyor" (kehribar çerçeve). Dokununca **Kişilerim** ekranı: istekler, kişi listesi (Sil), + Kişi ekle. Sağ üstte de Kişilerim simgesi. Kişiler avatar menüsüne taşınmadı (gruplarla iç içe). — Ürün sahibi (P-34)
- **Yaşam Tarzım:** sağ üstte **Kütüphanem** simgesi (sayfanın altındaki Kütüphanem satırı da duruyor). — Ürün sahibi (P-34)

## Kart: içerik ile yapı ayrıldı (24 Ekim)

Kart yapısı çalışmasının 1. adımı (sıra: 1 içerik / yapı ayrımı · 2 seri anahtarı ve takip kartında geçmiş · 3 yeni kartta "hazır biçimle başla" · 4 notta "Karta çevir").

- **Kart görünümünde "Düzenle" düğmesi kalktı.** Kartın üstünde dokunulan kısım tek başına açılır (✎ işaretli): **başlık ve kısa açıklama**, **zaman** satırı (tarih, saat, hatırlatma, tekrar; saat yoksa "Saat ve tekrar ekle"), **içerik bölümleri** (talimat metni, video bağlantısı, liste maddeleri, proje adımları, fotoğraf, dosya). Kayıt bölümlerinin (ölçüm, zamanlayıcı, günün notu, gelişim fotoğrafı) içeriği yok; yapıdan değişir. Tekrarlı kartta "yalnız bu gün / bu gün ve sonrası" sorusu eskisi gibi. — Ürün sahibi (P-35; küçük sayfa olarak açılması: Öneri)
- **"Kartın yapısı"** (⋯ menüsünde en üstte): blok ekle, kaldır, sırala; liste adı, proje adı, ölçümün adı ve birimi, zamanlayıcının süresi. Kartın altında "+ Blok ekle" de yapıyı açar (blok seçici hazır). — Ürün sahibi (P-35)
- Yeni kart ve programın kartı formu şimdilik eskisi gibi tek formda (3. adımda değişecek). — Not
- **Karakter kuralı (2. adımda):** tekrarlı kartta "Seriyi say" anahtarı açık gelir; liste ya da ölçüm varsa kapalı gelir, kişi değiştirir. Ölçüm / sayaç varsa kartın içinde geçmiş görünür. Notlar kart olmaz; "Karta çevir" eklenir. — Ürün sahibi (P-35)

## Kart: seri anahtarı, ölçüm geçmişi, hazır biçimler, notu karta çevir (24 Ekim)

Kart yapısı çalışmasının 2–4. adımları. Kullanımda görünüş ayrıca düzeltilecek ("pek hoş görünmüyor"). — Not (P-35)

- **Seriyi say:** tekrarlı kartta zamanlamada "Seriyi say" anahtarı. Kural: açık gelir; kartta liste ya da ölçüm varsa kapalı gelir. Kişinin seçimi kartta saklanır. Seri sayılmayan tekrarlı kartta 7 günlük şeridin altında seri yerine "Son 7 günde N kez". — Ürün sahibi (P-35)
- **Ölçüm geçmişi kartın içinde:** ölçüm bölümünde, en az iki değer varsa "Son ölçümler": son 7 değer küçük çubuklarla (değer üstte, gün altta; en sonuncusu koyu). Yalnız sayı olan değerler ("72,5"); "120/80" gibi değerler çubuğa girmez. — Ürün sahibi (P-35; çubuk görünümü: Öneri)
- **Yeni kartta hazır biçim:** üstte Boş kart · Alışkanlık · Ölçüm takibi · Liste · Video / talimat. Biçim kartı o yapıyla açar (Alışkanlık: her gün; Ölçüm takibi: her gün + ölçüm; Liste: liste; Video / talimat: video + talimat), sonra kart tamamen kişinin; şablona bağlı kalmaz. "Kütüphanemden" şimdilik Yaşam Tarzım → Kütüphanem'den. — Ürün sahibi (P-35; Kütüphanemden'in yeri: Öneri)
- **Notu karta çevir:** not sayfasındaki "Bugünün ajandasına al" yerine "Karta çevir": kart formu dolu açılır (ilk satır başlık, en çok 60 harf; birden çok satır ya da uzun metin talimat; sesli notun kaydı dosya bloğu), gün, saat, tekrar seçilir; kart kaydedilince not silinir. — Ürün sahibi (P-35)

## Kart: 50+ kullanıcı için sade düzen (24 Ekim)

Aynı günün "içerik ile yapı ayrıldı" ve "hazır biçimler" kararlarının görünen yüzünün yerine geçer; arka plan (seri kuralı, ölçüm geçmişi, notu karta çevir) kalır. İlke: az seçenek, yazılı düğme, tek yol, teknik sözcük yok. — Ürün sahibi (P-36)

- **Kart görünümünde tek bir yazılı "Düzenle"** (sağ üstte, ⋯'nin solunda); ✎ kalemler ve "⋯ → Kartın yapısı" kalktı. ⋯'de Kütüphaneye kaydet · Programa ekle · Paylaş · Sil. Boş kartta "+ Karta bir şey ekle". — Ürün sahibi (P-36)
- **Kart formu tek sayfa:** "Ne yapacaksın?" (başlık), açıklama, "Ne zaman yapacağını aşağıdaki düğmelerden seç" (alttaki Bugün · Saat · Hatırlat · Tekrar), **"Kartın içinde"** (her parça adıyla; "Kayıt / İçerik" etiketi ve sıralama okları yok; altında küçük kırmızı "Bunu kaldır") ve **"+ Karta ekle"**. Yeni kartta bu kısım kapalı gelir: "Karta bir şey ekle (isteğe bağlı) · Liste, video, ölçüm…". — Ürün sahibi (P-36; sıralamanın kalkması: Öneri)
- **Hazır biçim düğmeleri ve formdaki "Seriyi say" anahtarı kalktı.** Kural kendiliğinden işler; istisna kart görünümünde seri satırının altındaki küçük "Seriyi gösterme" / "Seriyi göster" ile. — Ürün sahibi (P-36)
- **"Karta ekle" seçicisi:** başlık "Karta ekle"; gruplar "Kartta dursun" (talimat, video, liste, proje adımları, fotoğraf, dosya) ve "Her seferinde doldur" (zamanlayıcı, ölçüm, günün notu, gelişim fotoğrafı). "Blok" sözcüğü arayüzden kalktı. — Öneri
- Zaman seçimi şimdilik alttaki yazılı dört düğmeyle (Bugün · Saat · Hatırlat · Tekrar); üç satırlık düzen kullanıcı denemesinden sonra düşünülecek. — Not
- **Deneme:** pilotta 50 yaş üstü 1–2 kişiye küçük görevler ("bir alışkanlık kartı ekle, sonra içine liste koy"); takıldıkları yer not edilecek. — Öneri

## Kart formunda zaman: soru satırları (24 Ekim)

- **Alttaki dört düğmeli zaman çubuğu kalktı.** Formda "Ne yapacaksın?"tan sonra **"Ne zaman?"** başlığı ve alt alta satırlar: **Hangi gün?** (tekrarlıda "Hangi gün başlasın?"; programda "Programın kaçıncı günü?") · **Saat kaçta?** · **Tekrar etsin mi?** · **Hatırlatsın mı?** (saat seçilince ya da hatırlatma kuruluysa görünür). Sağda seçili değer (Bugün · 08:00 · Her gün · Hayır), dokununca ayarı satırın hemen altında açılır, "Tamam" kapatır. — Ürün sahibi (P-37)
- **Tekrar sadeleşti:** "Tekrar etsin" anahtarı ve "Kaç gün sürecek?" yerine **"Ne sıklıkla?"** (Bir kez · Her gün · Hafta içi · Hafta sonu · Seçtiğim günler → gün düğmeleri) ve **"Ne kadar sürsün?"** (Bitişi yok · Belli bir süre → kaç gün). Tekrar açılınca artık **bitişsiz** gelir (eskiden 30 gün). Satırda "Her gün", "Hafta içi, 30 gün", "Pzt Çar Cum". — Ürün sahibi (P-37; bitişsiz varsayılan: Öneri)

## Kartın tek yerleşimi; zamanlayıcı süreyi kaydeder; Yaptım kartta (24 Ekim)

Kart modeli çalışmasının (`kart-modeli.md`) 1. adımı.

- **Kart görünümü üç bölüm:** üstte başlık, zaman, seri; **"Ne yapacaksın"** (talimat, video, liste, proje adımları, fotoğraf, dosya, zamanlayıcı); **"Bugün"** (açılan gün başkaysa o günün adı: ölçüm, günün notu, gelişim fotoğrafı); en altta büyük **Yaptım**. Parçalar eklenme sırasına değil türüne göre yerleşir. Kartı kim yazdıysa (kişi, danışman, Rites) aynı görünür. — Ürün sahibi (P-38)
- **Yaptım'ı kişi işaretler:** değer girmek ya da zamanlayıcıyı bitirmek kartı yapıldı saymaz. Yaptım kartın altında büyük düğme; işaretliyken "Yapıldı" (açık renkli), yeniden dokununca geri alınır. — Ürün sahibi (P-38)
- **Zamanlayıcı süreyi kaydeder:** durdurulunca ya da bitince geçen süre o günün kaydına eklenir; altında "Bugün: 10 dk". Bitince "Bitti. Yaptıysan aşağıdan işaretle." Düğme Başlat · Durdur · Devam · Yeniden. — Ürün sahibi (P-38; düğme adları: Öneri)
- Veritabanı değişmedi (süre, kaydın değerlerinde saniye olarak). — Not

## Yaptım yalnız ajandada; yeni kayıt türleri (24 Ekim)

Kart modeli çalışmasının 2. adımı.

- **Yaptım yalnız ajandadaki küçük kartta** (satırda) işaretlenir; kart görünümündeki büyük Yaptım düğmesi kalktı. Değer girmek ya da zamanlayıcıyı bitirmek kartı yapıldı saymaz. — Ürün sahibi (P-39)
- **Kronometre** ("Kartta ne görünsün?"): ileri sayar; "Dur" deyince süre o günün kaydına eklenir ("Bugün: 45 sn"). Plank gibi "ne kadar dayandın?" kartları için. — Ürün sahibi (P-39)
- **Sayarak** ("Ne kaydedilsin?"): büyük − ve + düğmeleri, ortada "3 / 8 bardak"; isteğe bağlı günlük hedef. Yazmaktan kolay (su, sigara…). — Ürün sahibi (P-39)
- **Puan**: 1'den 5'e büyük daireler, altında "Çok kötü … Çok iyi"; seçili puana yeniden dokununca silinir (enerjim, stresim, uyku kalitem). — Ürün sahibi (P-39; etiketler: Öneri)
- **Soru:** günün notuna isteğe bağlı soru yazılır ("Bugün neye şükrediyorsun?"); kartta başlık soru olur, altında cevap alanı. — Ürün sahibi (P-39)
- Sayarak ve puanın da son değerleri ölçüm gibi çubuklarla görünür (en az iki gün). Kayıt parçalarında tür başlığı (ÖLÇÜM, PUAN…) gösterilmez; kendi adları ("Su", "Enerjim", soru) yeter. — Öneri
- **"Karta ekle" iki soru:** "Kartta ne görünsün?" (talimat, video, liste, proje adımları, fotoğraf, dosya, zamanlayıcı, kronometre) · "Ne kaydedilsin?" (ölçüm, sayarak, puan, günün notu, gelişim fotoğrafı). — Ürün sahibi (P-39)
- Hazır içerik: **Su** artık sayarak (hedef 8 bardak); **Şükran notu** ve **Haftanın değerlendirmesi** sorulu. `sunucu/icerik.sql` yeniden üretildi; Supabase'de çalıştırılınca sunucudaki katalog da güncellenir. — Öneri
- Veritabanı değişmedi (yeni türler blok türü olarak; değerler kaydın değerlerinde). Eski sürümdeki telefona bu türlerle paylaşılan kart gelirse o parça görünmez. — Not

## Süre ve cevapların geçmişi kartta (24 Ekim)

Kart modeli çalışmasının 3. adımı (son kısmı).

- **Zamanlayıcı ve kronometre:** altında "Son günler": son 7 günün süresi çubuklarla ("10 dk", "45 sn"; en az iki gün). — Ürün sahibi (P-40)
- **Günün notu / soru:** cevap alanının altında önceki 3 cevap, tarihiyle (soldan ince çizgili). — Ürün sahibi (P-40; 3 cevap: Öneri)
- Böylece bütün kayıt türlerinin geçmişi kartın içinde: ölçüm, sayarak, puan, süre (çubuk); cevap (liste). — Not

## İsimli kart çeşitleri: Beslenme (24 Ekim)

Kart modelinin bir sonraki adımı. Çeşitler alan alan tasarlanır; pilotta ilk alan Beslenme.

- **Çeşit** boş bir kalıptır: ad, simge, kısa açıklama, alan, kartın ilk başlığı (ya da ipucu), parçalar (kartta ne görünsün / ne kaydedilsin), saat ve tekrar. Öneri kartından farkı: öneri dolu bir karttır, çeşit kalıptır. — Ürün sahibi (P-41)
- **Beslenme'nin beş çeşidi:** Öğün listesi (öğün planı listesi + "Plandan farklı ne yedin, ne kadar?"), Yemek tarifi (malzemeler + yapılışı; öğünden ayrı, başka işe de yarar), Tartı (kilo, bel; haftada bir, Pzt 08:00), Tabağım (tek fotoğraf; gerekirse öğünler ayrı kart), Su (sayarak, hedef 8 bardak). — Ürün sahibi (P-41); ayrıntılar (saatler, açıklamalar): Öneri
- **Öğün listesi** hem değişmeyen bir plan hem kayıttır: plan liste olarak durur, her gün işaretlenir; farklı yenen şey ve miktarı serbestçe yazılır ("o kadar hassas olmaya gerek yok"). — Ürün sahibi (P-41)
- **Kişiye nasıl görünür:** yeni kartın ilk adımı "Ne tür bir kart?": en başta "Basit kart", sonra alan alan çeşitler. Paylaşımdan ya da nottan gelen kartta sorulmaz. Yaşam Tarzım → alan ekranında "Beslenme kartları" sırası; dokununca kart o kalıpla açılır. — Öneri (P-41'de onaylandı)
- Kart hangi çeşitten açıldığını **hatırlar** (`kart.cesit`); ileride ajandada simge, haftalık gözden geçirme ve danışman raporu için. — Öneri
- **Tasarım yeri:** Ayarlar → Kart çeşitleri, **yalnız tasarımcı** hesaplarda (sunucuda `tasarimci` tablosu; Supabase'den elle eklenir). Tasarım bugünkü kart formuyla yapılır (çeşidin adı, alanı, simgesi; zamanda yalnız saat ve tekrar); "Yayınla" sunucudaki kataloğa yazar, herkesin telefonuna iner. Çeşit silinmez, "Yayında" kapatılarak gizlenir. Tasarımda telefondaki fotoğraf / dosya eklenemez. — Ürün sahibi (P-41: Ayarlar); ayrıntılar: Öneri
- Danışman kendi çeşidini tanımlayabilsin mi: açık (şimdilik çeşitler Rites'ın, tasarımcı hesaplarla). — Not

## Giriş'te tek zamanlayıcı (25 Ekim)

- **Tek zamanlayıcı:** "ekle" yok. Biri çalışırken Anımsatıcılar kutusunda yalnız onun satırı durur, zamanlayıcı simgesi gizlenir; Anımsatıcılar ekranında da yenisi kurulmaz. — Ürün sahibi (P-42)
- **+1 dk kalktı.** Çalan zamanlayıcıda 1 dk ertele kalır (P-31). — Ürün sahibi (P-42)
- Yer: bugünkü gibi Anımsatıcılar kutusunun içinde. — Ürün sahibi (P-42)
- **Tek ayar düğmesi (⚙)**, kurulum panelinin sağ üstünde (eski ✕'in yerinde; panel başlıktaki simgeyle kapanır): görünüm (Kadran / Dijital), süre dolunca (Alarm, varsayılan / Bildirim), ses. Telefon alarmı desteklemiyorsa alarm bildirim olarak çalar ve ayarda bu yazar. — Ürün sahibi (P-42); yerleşim: Öneri
- **Dijital görünüm:** dakika ve saniye çarkı (telefonun saat uygulamasındaki gibi); en çok 60:00. Bir sayıya dokunmak da onu seçer. — Ürün sahibi (P-42)
- Açılınca **en son kurulan süre** gelir (ilk seferde 5 dk). Kadranda tam dakikaya yuvarlanır. — Ürün sahibi (P-42)
- Ayar telefonda (`ayar.zamanlayici`); veritabanı değişmedi. — Not
- **Zamanlayıcı her zaman görünür** (açıp kapatma simgesi kalktı): Anımsatıcılar kutusunun altında tek satır. Kadranda: süre, Başlat, ⚙; süreye dokununca kadran açılır. Dijitalde ayrı form yok: göstergenin rakamları çarktır (dakika : saniye), yanında Başlat ve ⚙. Çalışırken aynı yerde geri sayım, Duraklat / Devam, İptal. Anımsatıcılar ekranında da aynı. — Ürün sahibi (P-43); kadranın satırdan açılması: Öneri
- **Ayarla düğmesi (P-44):** zamanlayıcı iki satır: üstte süre (kadranda küçük halkayla) ve alt yazı, sağda ⚙; altta **Ayarla · Başlat**. "Ayarla" dijitalde rakamları çarka çevirir, kadranda kadranı açar; ikisinde de yalnız **Tamam** var, başlatmak Tamam'dan sonra Başlat'la. Çalışırken alt satır **Duraklat / Devam · İptal**; alt yazının yeri hep ayrılır, "Duraklatıldı" gelince yükseklik değişmez. — Ürün sahibi (P-44); iki satırlı yerleşim: Öneri

## Programa kart eklerken de çeşitler (25 Ekim)

- Programın "+ Yeni kart"ında da ilk adım "Ne tür bir kart?"; programın alanlarının çeşitleri önce gelir. Seçilen çeşit programın kartında saklanır, program başlayınca ajandaya geçen karta da geçer (ajandadan programa da). — Ürün sahibi (P-45); sıralama: Öneri
- Kütüphanemden ya da öneriden eklenen kartta çeşit sorulmaz (içerik zaten hazır). — Not

## Kart formu: zaman özeti ve Vazgeç sorusu (25 Ekim)

- **"Ne zaman?" tek satır özet:** soru satırları kapalı gelir; yerine takvim simgeli tek satır ("Bugün · 08:00 · Her Pzt"). Dokununca sorular açılır, özete yeniden dokununca kapanır. "Ne zaman?" başlığı kalktı. — Ürün sahibi (P-46)
- **Vazgeç sorusu (bütün alttan sayfalarda):** "Değişiklikler kaydedilsin mi?" — **Kaydet** (sayfanın sağ üstteki eylemi; çeşit tasarımında "Yayınla") · **Kaydetmeden çık** · **Düzenlemeye dön**. "Sil" sözü kalktı. Sağ üstte kaydetme eylemi olmayan sayfada "Kaydetmeden çıkılsın mı?" ve son iki seçenek. — Ürün sahibi (P-46)
- **Zaman sağ üstte (P-47):** kart formunda "Ne yapacaksın?" satırının sağında zaman rozeti: "26 Ekim · ..:.." (saat yoksa `..:..`; tekrarlıysa ↻, hatırlatma varsa zil). Formda zaman satırı kalmadı. Rozete dokununca "Ne zaman?" sayfası: üstte gün (Bugün / Yarın ve takvim; programda "N. gün"), altında Saat kaçta? · Tekrar etsin mi? · Hatırlatsın mı? Tarihi değiştirmek kartı taşımaktır. Çeşit tasarımında rozet yalnız saati gösterir, sayfada gün ve hatırlatma yok. — Ürün sahibi (P-47; tekrar ve hatırlatma aynı sayfada)
- **Zaman sayfasında soru yok (P-48):** "Saat kaçta?" gibi soru satırları kalktı; sayfada doğrudan seçim alanları: **Tarih** (Bugün / Yarın, takvim; tekrarlıda "Başlangıç") · **Saat** (Sabah / Öğle / Akşam, saat seçici, Saati kaldır) · **Tekrar günleri** (yedi gün düğmesi; hiçbiri seçili değilse bir kez, hepsi her gün; "Her gün" ve "Bir kez" kısayolları) · **Süre** (gün seçilince: Süresiz · 7 · 21 · 30 gün, − / + ile gün sayısı; programda yok, program bitince biter) · **Hatırlatma** (saat varsa). Hafta içi / hafta sonu ayrı seçenek değil, günlerle seçilir. — Ürün sahibi (P-48); kısayollar ve süre seçenekleri: Öneri

## Kart formu: başlık, süre ve seri (26 Ekim)

- **"Ne yapacaksın?" kalktı** (bilgi kartı da var): başlık alanının ipucu "Kartın başlığı". Zaman rozetinin solunda, kart bir çeşitten açıldıysa çeşidin simgesi ve adı ("💧 Su"). — Ürün sahibi (P-49); çeşit adı: Öneri
- **Önce Süre, sonra Günler:** "Ne zaman?" sayfasında Süre: Bir gün · 7 · 21 · 30 gün · Süresiz (− / + ile gün sayısı; programda Bir gün · Program boyunca). Bir günden fazlaysa **Günler** (yedi gün düğmesi, en az biri; "Her gün"). "Tekrar" sözü kalktı. — Ürün sahibi (P-49)
- **Seri her tekrarda değil:** kural sürer (liste ya da ölçüm varsa seri yok; kişi kartta "Seriyi göster / gösterme" der). Ek olarak **çeşit seriyi belirler** (`seri`: evet / hayır / kural); Beslenme'nin beş çeşidinde seri yok. Tasarımcı "Seri sayılsın" anahtarıyla değiştirir. Programdan gelen kart da çeşidin ayarını alır. — Ürün sahibi (P-49: "öğünler bir seri değil"); çeşit ayarı: Öneri
- Sunucu: `icerik_cesit.seri` (sema.sql'in son bölümü; icerik.sql var olan Beslenme çeşitlerinde boşsa `false` yapar). — Not

## Biçimli metin (26 Ekim, sürüm 1.5.0)

- **Talimat ve Açıklama biçimli metin:** küçük araç çubuğu: **K** (kalın) · *İ* (italik) · madde işaretli liste · numaralı liste · onay kutulu liste. Kütüphane: react-native-enriched-html (Software Mansion, yerel editör; Expo belgelerinin ilk önerisi). — Ürün sahibi (P-50)
- **Liste ve Proje adımları** aynı editörde onay kutulu liste olarak yazılır; maddeler ayrı tutulur (günlük işaret ve proje ilerlemesi bugünkü gibi). Araç çubuğu yok; her satır bir madde. — Ürün sahibi (P-50)
- Talimat ve açıklamadaki onay kutuları yalnız biçimdir (işaret kaydedilmez); işaretlenecek şeyler Liste ile. — Not
- Saklama HTML; eski kartların düz metni olduğu gibi gösterilir. Arama ve kısa gösterimlerde düz metne çevrilir. Biçimli metin sistem yazı tipiyle çizilir (kalın / italik güvenle çıksın diye). — Öneri
- Yerel modül eklendiği için **yeni derleme** (1.5.0); bu sürümden sonraki güncellemeler yalnız 1.5.0'a gider. — Not

## Normal kullanıcı ve uzman (27 Ekim)

- Ayrım ücretle değil, **uzman / normal kullanıcı** olarak (ücretli sürüm şimdilik düşünülmüyor). — Ürün sahibi (P-51)
- **Uzman görünümü** Ayarlar'da bir anahtar (`ayar.uzman_gorunumu`). Açıkken kart formu bugünkü tam hali: bütün parçalar, programda "N. gün". Kart çeşidi yayınlamak ayrıca sunucudaki tasarımcı yetkisidir. — Ürün sahibi (P-51: anahtar)
- **Normal kullanıcının kartı:** başlık, biçimli açıklama (talimatın yerine), zaman. "Karta ekle"de yalnız **Liste · Fotoğraf · Video**. Zamanlayıcı yok (Giriş'teki yeter); dosya yok. Ölçüm, sayarak, puan, soru, kronometre, gelişim fotoğrafı yalnız çeşitlerin içinde hazır gelir. Var olan kartlardaki parçalar görünür ve düzenlenir. Not → kart: notun metni açıklamaya gider. — Ürün sahibi (P-51)
- **Tek Liste** (Proje adımları ayrı değil; ikisi de "Liste"): bir günlük ya da tarihsiz kartta işaretler kalır, hepsi bitince kart yapıldı sayılır; birden çok gün süren kartta listenin altında **Her gün baştan** (varsayılan) · **İşaretler kalsın** seçimi ("her cumartesi bahçe" gibi). Kişi seçmediyse süre değişince davranış da kendiliğinden değişir. Uzmanda da aynı. — Ürün sahibi (P-51)
- **Program:** normal kullanıcı hazır programı uygular, kartlarını programa çevirir ya da adını verip kurar; programın kartlarında gün seçilmez (hepsi 1. günden). Gün / hafta düzeni uzmanda. — Ürün sahibi (P-51)

## Küçük düzeltmeler (27 Ekim)

- Kart formunda "Karta bir şey ekle (isteğe bağlı)" ara durumu kalktı; doğrudan "+ Karta ekle". — Ürün sahibi (P-52)
- Klavye: alttan açılan sayfa ve sorular açılırken klavye kapanır; sayfada odaklanan alan (yazı alanı, biçimli editör) klavyenin altında kalırsa içerik kendiliğinden kayar. — Ürün sahibi (P-52); yöntem: Öneri
- Biçimli editörün araç çubuğu alta alındı (metin seçince çıkan Kopyala / Yapıştır menüsü üstünü örtüyordu); seçim menüsüne de **Kalın** ve **İtalik** eklendi. — Ürün sahibi (P-52); seçim menüsü: Öneri

## Çoklu video (27 Ekim)

- Video parçası birden çok video tutar. Formda: video yokken koyu alan ve **+ Video ekle**; eklerken alanın içinde bağlantı adresi, isteğe bağlı başlık, aynı satırda **Başla:** ve **Bitiş:** (dakika:saniye), altında **Vazgeç · Ekle**. Eklenen video oynatılabilir halde görünür; altında ⚙ (seçilen videonun bağlantı, başlık, başla, bitiş ayarı; "Videoyu kaldır") ve **+ Video ekle**. — Ürün sahibi (P-53); "Videoyu kaldır": Öneri
- İki ya da daha çok videoda üstte **Video 1 · Video 2** seçici; başlık seçicide yazılmaz (uzun başlıklar sığmaz). Kart görünümünde de aynı; seçilen video gömülü oynar, başlığı varsa altında küçük. — Ürün sahibi (P-53); görünümde başlık: Öneri
- YouTube'da başla / bitiş oynatıcıya verilir (orada başlar, orada durur). Başla boşsa bağlantıdaki `t=` kullanılır. — Öneri
- Saklama: `blok.maddeler` her video için bir JSON, `blok.metin` ilk videonun bağlantısı; eski tek bağlantılı kartlar tek video olarak açılır. Veritabanı değişmedi. — Not

## Videolar: Gelenlerden al, Yansıt (27 Ekim)

- "YouTube'da aç" kalktı (video kartın içinde oynuyor). — Ürün sahibi (P-54)
- **Gelenlerden al:** video eklerken, YouTube'dan Rites'a paylaşılan videolar (Gelenler'deki paylaşımlar) "Gelenlerden al (N)" altında listelenir; dokunulan bu karta eklenir (başlığıyla). Kart kaydedilince Gelenler'den kalkar; vazgeçilirse Gelenler'de kalır. Başka kişilerin gönderdiği kartlardaki videolar şimdilik listede yok. — Ürün sahibi (P-54); kaydedince kalkması: Öneri
- **Yansıt:** şimdilik oynatıcının tam ekranında AirPlay açık (Apple TV ya da AirPlay 2'li televizyon). Ayrı bir "Yansıt" düğmesi (AirPlay seçici) yerel modül ister: bir sonraki derlemede. Chromecast / Android TV ayrı ve daha büyük iş. — Öneri (P-54)

## Instagram videoları; Hesabımı sil hatası (27 Ekim)

- Yansıt: AirPlay yeter (oynatıcının tam ekranı ya da Denetim Merkezi); ayrı düğme yok. — Ürün sahibi (P-55)
- **Instagram:** paylaşılan Instagram gönderisi / reel'i video parçasında ve Gelenler'de kartın içinde gömülü oynar (Instagram'ın gömme sayfası). Başla / Bitiş Instagram bağlantısında sorulmaz (verilemez). Gelenlerden al listesinde de var (Instagram simgesiyle). — Ürün sahibi (P-55)
- Hesabımı sil başarısız olursa artık sunucunun gerekçesi gösterilir ("Silinemedi: …"); yalnız bağlantı sorununda "Şu an bağlanamıyor". Neden araştırılıyor. — Not
- **Hesabımı sil düzeldi (P-56):** sebep `liste_erisim` tablosunun birincil anahtarı olmamasıydı; tablo canlı yayında (realtime) olduğu için silmeler "replica identity" ister. `alter table public.liste_erisim replica identity full;` (sema.sql). Aynı hata listeden çıkmayı ve grup silmeyi de etkiliyordu. — Not

## Kart formu: ikinci şerit; editörde satır aralığı (27 Ekim)

- Sağ üstteki zaman rozeti yalnız **tarih ve saat**i açar. **Süre** ve **Hatırlatma** formda ikinci bir şeritte, her biri kendi küçük sayfasında: [↻ Pzt · Süresiz] [🔔 Yok] … [+ Karta ekle]. "+ Karta ekle" de bu şeritte (alttaki büyük düğme kalktı). — Ürün sahibi (P-57)
- Hatırlatma saat yoksa da açılır (yalnız "Yok" ve "Başka zaman"; saat seçince saatinde / önce seçenekleri gelir). — Öneri
- Biçimli editörde satır aralığı açıldı: satır yüksekliği yazı boyunun ~1,4 katı ("1,2 satır aralığı"). — Ürün sahibi (P-57)

## Listelerim: kişisel listeler telefonda (27 Ekim)

- Tarihsiz liste ajandada durmaz. Giriş'teki kutunun ve ekranın adı **Listelerim**: üstte kişisel listeler (yalnız telefonda), altta **Ortak listeler** (sunucuda, gruplarla). — Ürün sahibi (P-58)
- Kişisel liste telefonda durur; **Başkalarıyla paylaş** deyince maddeleriyle ortak listeye çevrilir (oturum yoksa önce giriş istenir) ve telefondaki kopyası silinir. — Ürün sahibi (P-58)
- Bir maddeye tarih verilirse (Bugün · Yarın · takvim) o gün ajandada "Liste: …" etiketiyle görünür, oradan işaretlenebilir. — Öneri
- Yalnız listeden ibaret tek seferlik kartlar (tekrarı, programı, grup bağı olmayan) ilk açılışta bir kez Listelerim'e taşınır: adı kartın başlığı, açıklaması kartın açıklaması; işaretler korunur; kartın tarihi bugün ya da sonraysa bitmemiş maddelere o tarih verilir. — Ürün sahibi (P-58); tarih aktarımı: Öneri
- Giriş'teki **Listelerim** kutusu (19 Ekim'de kalkmıştı) geri geldi: yarım kutu, "N liste"; "Giriş'te neler görünsün?"de açılıp kapatılır, varsayılan açık, en sonda. — Ürün sahibi (P-58); yer: Öneri
- Tarihsiz yeni liste yalnız Listelerim'den (**+ Yeni liste**) açılır; kart formundaki Liste parçası tarihli kartlar için kalır. — Ürün sahibi (P-58)

## Kütüphanedeki kartı düzenleme (27 Ekim)

- Kütüphanedeki kart ajandaya konmadan düzenlenir: kaydın ekranında **Düzenle** kart formunu açar (başlık "Kartı düzenle"); tarih sorulmaz, saat ve süre değişebilir, parça eklenir / çıkarılır. Paylaşımla gelen video "Gelenlerden al" ile bu karta da eklenir; kaydedilince Gelenler'den kalkar. Kaydın adı kartın başlığıyla değişir; alanları ve türü aynı kalır. — Ürün sahibi (P-59); ayrıntılar: Öneri
- Hatırlatma bu formda sorulmaz; kayıtta varsa korunur (ajandaya eklerken kullanılır). — Öneri

## Listeler tek yerde: Giriş → Listeler (29 Ekim)

- **Liste yalnız Giriş → Listeler'de açılır** (kutunun ve ekranın adı "Listeler"). "+ Yeni liste" kişisel liste kurar (telefonda). Listenin ekranında **Başkalarıyla paylaş** → **Paylaş** sayfası: gruplar ve / veya kişiler (Kişilerim'de bağlı olanlar) seçilir, en az biri gerekir. Paylaşılan liste aynı ekranın altında **Paylaşılan listeler**de durur; başkalarının benimle paylaştığı listeler de orada. Bölüm yalnız paylaşılan liste varsa görünür. — Ürün sahibi (P-60); en az bir seçim: Öneri
- 19 Ekim kararı ("listelerin tek yeri grup") ve P-58'deki "+ Ortak liste" kalktı: Gruplar ekranındaki "Kişilerle listeler" bölümü, grup ekranındaki listeler ve "+ Ekle → Yapılacak → Liste" yok; Yapılacak yalnız iş. Liste yine kişiye açılabilir (19 Ekim'de yalnız gruba açılıyordu). — Ürün sahibi (P-60)
- Paylaşılan listede kuran için: **Paylaşımı düzenle** (ad, gruplar, kişiler), **Paylaşmayı bırak**, **Listeyi sil**. Paylaşmayı bırak (onaylı): liste maddeleriyle telefona döner, yeniden kişisel olur; paylaşılanlar artık görmez. Maddelerin sırası ve işaretleri korunur; tarih yalnız bana ya da kimseye verilmemiş maddede kalır. Paylaşımı düzenlerken herkes çıkarılamaz ("Paylaşmayı bırak"ı kullan). — Ürün sahibi (P-60); ayrıntılar: Öneri
- Ajandadaki süzgeç çipinde "Ortak listeler" → "Listeler". — Öneri

## Vazgeç sorusu iki seçenek; liste çeşitleri (29 Ekim)

- **Vazgeç sorusu (bütün alttan sayfalarda, kart formu dahil):** "Kaydetmeden çıkılsın mı?" — **Kaydetmeden çık** · **Düzenlemeye dön**. Soruda "Kaydet" seçeneği kalktı (kaydetmek için düzenlemeye dönülüp sağ üstteki Kaydet). P-46'daki üç seçeneğin yerine. — Ürün sahibi (P-61)
- **Liste çeşitleri:** listeler davranışla ayrılır; kişisel ve paylaşılan listelerde aynı. — Ürün sahibi (P-61)
  - **Yapılacaklar:** maddeye gün verilir (o gün ajandada); yapılan alta iner. Eski bütün listeler bu çeşit.
  - **Alışveriş:** maddeye miktar; satırın başında yazılan miktar ayrılır ("2 kg domates" → Domates, 2 kg) ve maddenin baş harfi büyük olur. Madde sayfasında **Ne kadar?** (Yok · 1 · 2 · 3 · ½ kg · 1 kg · 1 paket · 1 lt ve elle). Alınan alta iner; altta **Alınanları temizle (N)**. Yazarken önceki alışverişlerden öneri çipleri (bu telefonda yazılanlardan; listede alınmamış duranlar önerilmez).
  - **Hazırlık:** tekrar kullanılır; üstte "3/10 hazır" çubuğu, işaretli madde yerinde kalır; **Baştan başla** (onaylı) yalnız işaretleri siler.
  - **Not listesi:** işaret kutusu yok, tarih ve Kime? yok; yalnız sıralı maddeler.
- Yeni listede ad çipi çeşidi de seçer: Yapılacaklar, Market (Alışveriş), Bayram hazırlığı ve Bavul (Hazırlık), Taşınma (Yapılacaklar), Okunacak kitaplar ve Hediye fikirleri (Not listesi). Altında "Ne tür bir liste?" çipleri ve seçilenin açıklaması; elle yazılan ad Yapılacaklar kalır, çeşit elle değiştirilebilir. — Ürün sahibi (P-61); çip listesi ve eşlemeler: Öneri
- Çeşit sonradan değişir: kişisel listede **Listeyi düzenle** (ad ve çeşit; "Adını değiştir"in yerine), paylaşılanda **Paylaşımı düzenle**. Paylaşınca ve paylaşmayı bırakınca çeşit ve miktarlar korunur. — Öneri
- Sunucuda `liste.cesit` ve `madde.miktar`; çalıştırılması gereken kısa SQL `sunucu/sema.sql`de. — Not

## Kart verme (aile içi) ve görüntülü görüşme bağlantısı (29 Ekim)

- **İzin:** Kişilerim'de her bağlı kişinin altında **Ajandama kart ekleyebilir** anahtarı. İzni olmayan kişiye kart verilmek istenirse veren **İzin iste** der; istek alanın Gelenler'ine düşer (**İzin ver · Hayır**) ve Giriş'teki Gelenler kutusu sayar. Bildirim de gider. — Ürün sahibi (P-62)
- **Kart ver:** grup ekranında **+ Ekle → Kart ver** (Kütüphanem ya da Rites önerilerinden seçilir; kişiler grubun üyeleri), kartın ⋯ menüsünde ve kütüphanedeki kayıtta **Birine ver** (kişiler: bağlı kişilerim). Sayfada Kime? (izin verenler seçilir, birden çok olabilir), **Ne zaman başlasın?** (Bugün · Yarın · takvim) ve **Ver**. — Ürün sahibi (P-62); başlangıç seçimi ve birden çok kişi: Öneri
- **Alan:** kart Gelenler'e değil doğrudan ajandaya, başlangıç gününden itibaren tarihli düşer (uygulama açılınca ve değişiklik olunca). Etiketi **Veren: Elif** (turuncu şerit). İçeriği verenin; alan ⋯ menüsünden **Saati değiştir**, **Hatırlatma** ve **Bırak** (onaylı; kart ajandadan kalkar, veren görür). Kartta "Elif verdi. İçeriğini o belirler; saatini ⋯ menüsünden değiştirebilirsin. Yaptım bilgin ona gider." — Ürün sahibi (P-62)
- **Geri dönen bilgi yalnız Yaptım günleri.** Notlar, ölçümler, fotoğraflar gitmez. — Ürün sahibi (P-62)
- **Veren:** grup ekranında **Verilen kartlar** (grubun üyeleri arasında), Gruplar'da **Verdiğin kartlar**: "Elif · Diş fırçala · Bu hafta 5/7" (tek seferlikte Yapıldı / Bekliyor; Bıraktı). Satıra dokununca son 14 gün ve **Geri al** (onaylı; kart alanın ajandasından da kalkar). — Öneri
- Kaynak adı "Ayşe (koç)" yerine **Veren: Ayşe** (aile kullanımı). — Öneri
- **Görüntülü görüşme:** buluşma formunda isteğe bağlı **Görüntülü görüşme** bağlantısı ve **WhatsApp'ı aç** düğmesi; açıklama: WhatsApp'ta Aramalar → "Arama bağlantısı oluştur" → Görüntülü → kopyala, yapıştır. "https://" eksikse eklenir; Meet, Zoom, FaceTime bağlantıları da olur. Buluşma kartında ve ajandadaki buluşma kartında **Görüşmeye katıl** (bağlantıyı açar). Görüşme Rites'ın içinde değil; Stream gibi bir servisle Rites içinde görüşme sonra düşünülür. — Ürün sahibi (P-62)

## Kart görünümü düzenleme formuyla uyumlu (29 Ekim)

- Kart görünümünün üstü formdaki gibi: solda kartın çeşidi (varsa), **sağ üstte zaman rozeti** ("29 Ekim · 08:00"). Rozete dokununca formdaki **Ne zaman?** sayfası (tarih ve saat) açılır; kart düzenlemeye girmeden başka güne taşınır ya da saati değişir. Tekrarlı kartın sonraki bir gününde formdaki gibi sorulur: Yalnız bu gün · Bu gün ve sonrası. Verilen kartta (P-62) yalnız saat. — Ürün sahibi (P-63); soru ve verilen kart: Öneri
- Başlık daha küçük (26 → 20 pt); solunda **Yaptım** kutusu (açılan gün için; kart o gün yoksa görünmez). Tarih ve saat satırı kalktı, yalnız tekrar yazısı kaldı. — Ürün sahibi (P-63)
- Tek seferlik kart taşınınca "Taşındı: 30 Ekim Cuma" ve görünüm o günü açar; o günün işareti kartla birlikte taşınır (formdaki gibi). — Öneri
- Öteki parçalar (liste, ölçüm…) için görünüm / düzenleme uyumu sonra. — Not

## Sade saat seçimi (29 Ekim)

- Kartın **Ne zaman?** sayfasında saat buluşmadaki gibi: **Saatli · Saat yok** ve küçük saat kutusu (dokununca çark açılır). Sabah / Öğle / Akşam kısayolları, büyük çark ve "Saati kaldır" kalktı; "Saatli" ilk seçilince 09:00. Bölüm başlıkları (Tarih, Saat) küçüldü. Anımsatıcının ve özel hatırlatmanın saati zaten bu küçük kutuydu. — Ürün sahibi (P-64); 09:00: Öneri

## Kartı tasarlayan, görünümde neyin değişeceğini seçer (29 Ekim)

- Düzenleme formunun altında **Kart görünümünde değiştirilebilsin**: Tarih ve saat · Başlık ve açıklama · her içerik parçası (liste, video, talimat, proje adımları, fotoğraf, dosya) için anahtar. Herkes görür (yalnız uzman değil); varsayılan hepsi açık. — Ürün sahibi (P-65)
- Kart görünümünde açık olanın yanında **Değiştir**: o parçayı (ya da başlık ve açıklamayı) tek başına açan küçük form; kapalı olanın yanında küçük kilit, zaman rozeti kilitliyse dokunulmaz. Kayıt parçaları (ölçüm, puan, günün notu…) zaten görünümde doldurulur; anahtarları yok. Bütün kart için üstteki **Düzenle** yerinde (kendi kartında). — Ürün sahibi (P-65); "Değiştir" ile tek parça ve kayıt parçalarının dışarıda kalması: Öneri
- **Verilen kartta verenin ayarı geçerli:** veren hangi alanı açık bıraktıysa alan görünümde onu değiştirir (Düzenle yine yok). Bu sürümden önce verilen kartlarda (ayar yok) eskisi gibi yalnız saat. Ayar kütüphaneye kaydedince ve paylaşınca da kartla gider. — Ürün sahibi (P-65)
- Program kartı ve çeşit tasarımı formunda bu bölüm şimdilik yok. — Not

## Kur ve kullan: kart görünümünde doğrudan düzeltme (29 Ekim)

- **Görünümde "Değiştir" yok, doğrudan düzeltilir** (kuran açık bıraktıysa): başlık yazı gibi görünür, dokununca yazılır; açıklama ve talimat dokununca yerinde biçimli editöre döner (**Bitti**); listenin altında "+ Ekle ve Enter'a bas"; video alanında + Video ekle ve ⚙. Kayıt kendiliğinden (alandan çıkınca / Bitti). Tekrarlı kartta içerik bütün günlere uygulanır, sorulmaz (tarih ya da saat değişince eskisi gibi sorulur). Boş açıklamada "+ Açıklama ekle". Sabit olanın yanında küçük kilit. — Ürün sahibi (P-66); listede yalnız ekleme (madde silme ve düzeltme Kur'da): Öneri
- Üstteki **Düzenle** → **Kur** (parça ekle, sırala, ayarlar). Form başlığı "Kartı kur". — Ürün sahibi (P-66)
- **Kur ekranında her öğenin başlık satırı ve ⋯ menüsü:** açıklama dahil (Açıklama: "Kart açıkken değiştirilebilir" ve Açıklamayı sil); parçalar: değiştirilebilir anahtarı (içerik parçalarında), **↑ Yukarı · ↓ Aşağı**, **Karttan kaldır**. Başlık satırında (zaman rozetinin yanında) tek ⋯: Başlık · Tarih ve saat anahtarları. Formun altındaki "Kart görünümünde değiştirilebilsin" bölümü ve parçaların altındaki "Bunu kaldır" kalktı. Açıklama yerinde kalır (taşınmaz). — Ürün sahibi (P-66); açıklamanın taşınmaması: Öneri
- **Yeni kart kartın kendisi gibi açılır:** "Basit kart" ya da parçasız çeşitte yalnız başlık, zaman rozeti ve açıklama; altta **Kur: parça ekle, süre, hatırlatma** formu genişletir. Parçalı çeşitte doğrudan Kur. Üstte Vazgeç · Kaydet. — Ürün sahibi (P-66)
- P-65'teki görünümde "Değiştir" düğmesi ve formun altındaki anahtar bölümü bu kararla değişti; sabit ayarları (`kart.sabitler`, `blok.sabit`) aynen geçerli, açıklama ayrı bir alan oldu (`aciklama`). — Not

## Zaman satırı: Tarih · Saat · Süre · Hatırlatma (29 Ekim)

- Tekrar (süre) ve hatırlatma artık yalnız Kur'da değil: kartın üstünde ve yeni kart formunda **zaman satırı**, dört hap: **Tarih · Saat · Süre · Hatırlatma**. Her hap kendi küçük sayfasını açar (Tarih sayfasında yalnız takvim, Saat sayfasında Saatli · Saat yok). Kart görünümünde de aynı satır; değişiklik kendiliğinden kaydedilir, tekrarlı kartın sonraki gününde eskisi gibi sorulur. Geçici yerleşim. — Ürün sahibi (P-67)
- **Tarih ve saat izinleri ayrı:** başlık satırındaki ⋯ menüsünde **Başlık · Tarih ve süre · Saat ve hatırlatma** anahtarları. Kapalı olan hap görünümde kilitli (kilit simgesi, kesik çizgi, dokunulmaz). — Ürün sahibi (P-67); süre tarihle, hatırlatma saatle birlikte: Öneri
- Eski kayıttaki tek "Tarih ve saat" kilidi ikisi birden kilitli sayılır; Kur'da açılınca iki anahtara ayrılır. Eski verilen kartta (ayar yok) yine yalnız saat ve hatırlatma. — Öneri
- Kart görünümünün ⋯ menüsündeki ayrı "Hatırlatma" kalktı (satırda). Formun altındaki zaman şeridi yerine **+ Karta ekle**. — Öneri
- **Her parça karta bir kez:** liste, video, talimat, fotoğraf, dosya, ölçüm, puan, sayarak, zamanlayıcı… hepsi. Kartta olan parça **Karta ekle** listesinde görünmez; hepsi eklenince düğme de görünmez. Kilo ve bel gibi iki ölçüm iki kart olur. — Ürün sahibi (P-67)
- Liste ile proje adımları aynı parça sayılır; önceden çift eklenmiş parçalar kartta kalır (silinmez). — Öneri
