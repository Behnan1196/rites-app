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
