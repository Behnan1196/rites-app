# Pilot gözlemleri

Pilot kullanıcılarının söyledikleri ve denemede görülenler, **ham haliyle**. Yorum ve çözüm burada değil, `kararlar.md`de yazılır; oradaki kayıt buradaki numaraya bağlanır.

Biçim:

```
### P-<no> · <tarih> · <kim> (ör. Behnan, Kullanıcı A) · <cihaz / sürüm>
Ne dedi / ne oldu: …
Nerede: <ekran>
Sonuç: → kararlar.md (<başlık>) | bekliyor | değişiklik gerekmedi
```

Kişisel bilgi yazılmaz; kullanıcılar takma adla anılır.

---

### P-1 · 13 Ekim 2026 · Behnan · iPhone, Expo Go
Ne dedi: "Çıkış yaptığımda hâlâ bana aynı isimle sesleniyor; aynı telefona başkasının hesabı ile girmesini istemiyorduk sanırım."
Nerede: Profil → Çıkış yap
Sonuç: → kararlar.md (Görev 9: "Telefon tek kişiye bağlı")

### P-2 · 12 Ekim 2026 · Behnan · iPhone, Expo Go
Ne dedi: "Bu anımsatmaların bildirim tarzında gelmesi zorunlu mu, yoksa yalnız Expo Go'da mı böyle?"
Nerede: Anımsatıcılar
Sonuç: → kararlar.md (Görev 7: bildirimle devam; AlarmKit ileride)

### P-3 · 14 Ekim 2026 · Behnan · iPhone, Rites Dev
Ne dedi: "İlaç gibi önemli anımsatıcılar ekleyeceğim, yalnız bildirim şeklinde gelmesi çok yardımcı olmuyor, alarm gibi bir yapı olabilir mi?"
Nerede: Anımsatıcılar
Sonuç: → kararlar.md (Alarm olarak çalan anımsatıcı)

### P-4 · 14 Ekim 2026 · Behnan · iPhone, Rites Dev 1.1.0
Ne dedi: "Ekran kilitliyken alarm çalmaya başlıyor, ertele diyorum uygulama açılıyor ve Ertelendi yazıyor ama alarm susmuyor, Durdur seçeneği de yoktu. Sanırım telefonun soldaki tuşuna basınca sustu."
Nerede: Kilit ekranında alarm
Sonuç: → kararlar.md (Alarm olarak çalan anımsatıcı: Ertele susturmuyordu)

### P-5 · 14 Ekim 2026 · Behnan · iPhone, Rites Dev 1.1.0
Ne dedi: "Anımsatıcılar ekranını basitleştirelim. Sadece eklediğim anımsatıcılar listelensin ve edit edilebilsin."
Nerede: Giriş → Anımsatıcılar
Sonuç: → kararlar.md (Anımsatıcılar ekranı sadeleşti)

### P-6 · 16 Ekim 2026 · Behnan · iPhone, Rites Dev 1.1.0
Ne dedi: "Ajanda kartındaki bildirim çeşidi olarak alarm da kurabilir miyiz?"
Nerede: Kart formu → Hatırlat
Sonuç: → kararlar.md (Kart alarmı, paylaşım Gelenler'e, gömülü video)

### P-7 · 16 Ekim 2026 · Behnan · iPhone, Rites Dev 1.1.0
Ne dedi: "YouTube videolarını paylaş ile alıyorduk, ajandada dolu bir kart olarak açıyordu; doğrusu paylaşıldığında Gelenler kutusunda hazır bir kart olması olacak. Ve yine bu video (YouTube ise) kartın içinde embed olarak oynatılabilmeli."
Nerede: YouTube → Paylaş → Rites; kart görünümü
Sonuç: → kararlar.md (Kart alarmı, paylaşım Gelenler'e, gömülü video)

### P-8 · 16 Ekim 2026 · Behnan · iPhone, Rites Dev
Ne dedi: "Liste maddelerinin yapılma durumu her gün sıfırlanıyor. Böyle bir durum olması doğru, ancak bir de sıfırlanmadan devam etmesi, yani küçük proje gibi davranması gerekir." / "Buradan bir rutin vs proje ayrımına gitmek istiyorum; Yaşam Tarzım sekmesinde program ile proje mantığı birleştirildi ve karışık oldu. Kart bloğu olarak Liste dışında farklı bir adla, şimdilik 'proje adımları', yeni bir blok deneyelim; geliştirip gerçekten mini proje haline getirebilir miyiz?"
Nerede: Kart formu → Liste bloğu
Sonuç: → kararlar.md (Rutin ve proje: "Proje adımları" bloğu)

### P-9 · 16 Ekim 2026 · Behnan · iPhone, Rites Dev
Ne dedi: "Kartı açtığımda altta çıkan Yaptım butonu yanıltıcı oluyor; listede zaten Yaptım diyebiliyor. Kartı silmek için Düzenle moduna geçmek gerekiyor ve en altta Sil var; Sil'i kartın görünümüne koyalım, Paylaş gibi fonksiyonları da bir menüde toplayalım."
Nerede: Kart görünümü, kart formu
Sonuç: → kararlar.md (Kart görünümü sadeleşti)

### P-10 · 17 Ekim 2026 · Behnan · iPhone
Ne dedi: Anımsatıcı ekleme karışık: açıklama ajandaya kart eklemekten bahsediyor; saat ekleme (hazır 09:00, seçicide 13:00, "Saat ekle", "Günde 2/3 kez") gereksiz karışık; "Hangi günler" yerine ajanda kartındaki gibi hafta günleri seçilmeli; "Sesli uyar" bildirim gibi bir şey olmalı, alarm seçilince erteleme seçenekleri kapanıp 5 dk'ya sabitleniyor; Kaydet Notlar'daki gibi sağ üstte olmalı. İki senaryo: ilaç saatleri (ad ve dozla, 1 dakika hassasiyet) ve "20 dakika sonra ocağın altını kapat" gibi hızlı alarm (saat seçimi o anki saatten, ad gerekmeyebilir).
Nerede: Giriş → Anımsatıcılar → Ekle
Sonuç: → kararlar.md (Anımsatıcı sadeleşti: "Süre sonra" ve "Saatinde")

### P-11 · 17 Ekim 2026 · Behnan · iPhone
Ne dedi: Ajandam'ın üstü sadeleşmeli: hafta şeridi ve oklar arasındaki yazılar küçülsün; "Bugün · 17 Ekim Cumartesi", "Yarın/Dün" yazmasın, bugün değilse yalnız yanında bugüne dön simgesi çıksın. Yeni kartta alttaki tarih/saat şeridine basınca açılan sayfalar ve Blok ekle klavyenin altında kalıyor; şeridin altında açılan bir alanla çözülebilir.
Nerede: Ajandam üst kısmı; kart formu
Sonuç: → kararlar.md (Ajandam üst kısmı ve kart formunda zamanlama)

### P-12 · 17 Ekim 2026 · Behnan · iPhone
Ne dedi: "Bir tek sorun alarm 2 tane geldi, 15 dk önce uyar demiştim. Hatırlatma olabilmesi için saat belirlenmesi şart olmamalı; hatırlatma birkaç gün önce de olabilecek bir şey, istenen tarih ve saatin seçilebilmesi gerekecek."
Nerede: Kart formu → Hatırlat
Sonuç: → kararlar.md (Kart hatırlatması: saat şart değil, "Başka zaman"); çift alarm: bekliyor (ayrıntı soruldu)

### P-13 · 17 Ekim 2026 · Behnan · iPhone
Ne dedi: "Ajanda listesinde > işareti var kartın sağında, artık ona gerek kalmadı çünkü tüm kartları görünüm modunda açıyor. Şu anda saati olanlara göre bir sıralama yapıyor ancak çoğu kartın saati olmayacak ve notlarda olduğu gibi sürükleyerek yerlerini değiştirebilmeliyiz. Notlarda sürüklemek için solunda tutamaç var; ajandaya da konulabilir ama alan kaybına neden olacak, uzun basarak sürükleme yapsak notlardaki gibi akıcı olur mu, olmazsa tutamaç koymamız gerekecek."
Nerede: Ajandam, Gün görünümü
Sonuç: → kararlar.md (Ajandam: elle sıralama, ">" kalktı); uzun basma telefonda denenecek

### P-14 · 17 Ekim 2026 · Behnan · iPhone
Ne dedi: "Karta bir fotoğraf eklediğimde ya da kameradan çektiğimde, özellikle görünüm modunda detay görebilmek için fotoğrafı büyütme şansım olabilir mi?"
Nerede: Kart görünümü, Fotoğraf bloğu
Sonuç: → kararlar.md (Kartta fotoğraf büyütülür)

### P-15 · 18 Ekim 2026 · Behnan · iPhone
Ne dedi: "Bir ortak liste ekliyoruz; aslında ortak yapılacak etkinlikler çeşitlendirilebilir mi, çünkü liste sanki hep alışveriş listesi hazırlanacakmış gibi geliyor. Rites web sürümü denememde Ortak iş, Birinden iste, Liste, Buluşma, Birlikte rutin başlıklarını düşünmüştük." Sonra: "Hepsini sırayla uygulayalım. Ortak listeler Giriş ekranında diye düşünüldü ama belki öncelikle yaşaması gereken yer Gruplar."
Nerede: Gruplar, Giriş → Ortak listeler
Sonuç: → kararlar.md (Gruplar: ortak etkinlikler çeşitlenir; listelerin yeri Gruplar); Buluşma, Birlikte rutin, Nöbet / sıra, İş, Karar / oylama (18 Ekim, hepsi yapıldı)

### P-16 · 19 Ekim 2026 · Behnan · iPhone
Ne dedi: "Notlar'da sürükleme ajandadaki gibi olsun. Bir de notlar kapalı iken, ulaşmak için ajandada bir link çıkmasına gerek yok bence."
Nerede: Giriş → Notlar; Ajandam üstü
Sonuç: → kararlar.md (Notlar: ajandadaki gibi sürükleme; ajandadaki "Notlarım" bağlantısı kalktı)

### P-17 · 19 Ekim 2026 · Behnan · iPhone
Ne dedi: "Grupları test ediyorum, çalışıyor ancak yönetmesi, uygulaması zor olacak gibi. Öncelikle bizim ortak listelerimizle karışıyor, ayrı bir liste ekleme, gruba girince ayrı daha çok seçenek. Gelenleri bu amaçla henüz kullanmıyoruz, belki bir çözüm olabilir, tabi yönetici için takip sorunu da var."
Nerede: Gruplar, grup ekranı, Gelenler
Sonuç: → kararlar.md (Gruplar sadeleşti: Gelenler, takip, üç ana tür, listelerin yeri grup)

### P-18 · 19 Ekim 2026 · Behnan · iPhone
Ne dedi: "Birine görev verirken, karşı taraf görevi aldıysa 'xxx aldı' demeyelim, 'xxx görevi kabul etti' diyelim; o xxx ajandasına eklemiş oldu, tamamlarsa 'xxx görevi tamamladı' diye yazdırabilir miyiz. Bir de genel bir sorun: mesaj gelecek sekmeyi yenilemezsem (başka sekmeye gidip gelip) mesajı görmüyorum, yani real time update etmiyor."
Nerede: Grup ekranı / Gelenler (iş), bütün grup ekranları
Sonuç: → kararlar.md (İş metinleri ve anında güncelleme)

### P-19 · 19 Ekim 2026 · Behnan · iPhone (Rites ve Rites Dev)
Ne dedi: "Ajandadaki bir kartı Paylaş dediğimde Rites çöküyor." Rites Dev günlüğü: `useOturumAc, OturumSaglayici içinde kullanılmalı` (PaylasSayfasi → OturumGerekli).
Nerede: Kart görünümü → ⋯ → Paylaş (oturum kapalıyken)
Sonuç: Hata düzeltildi: Paylaş sayfası üst katmanda çizildiği için oturum sağlayıcısına ulaşamıyordu; oturum açma işlevi sayfaya özellik olarak verildi. "E-postanla devam et" Paylaş'ı kapatıp giriş sayfasını açar.
Ek (aynı gün): Oturum açıktı; çökme, oturum "yükleniyor"dayken giriş kutusu çizildiği için oluyordu (aynı düzeltmeyle çözüldü). Sonra Gönder: `new row violates row-level security policy for table "gelen"` — sunucu bu kişiyle bağlantı görmüyor. Paylaş artık açılınca Kişilerim'i sunucuyla eşleştirir, yalnız sunucuda bağlı olanları listeler; ret gelirse "… ile bağlantın sunucuda görünmüyor" der ve listeyi yeniler. Bağlantının neden eksik olduğu bekliyor (Supabase'de `baglanti` tablosuna bakılacak).

### P-20 · 19 Ekim 2026 · Behnan · iPhone
Ne dedi: "Kişilerime eklemek için bir kişiyi davet ettiğimde de Gelenler'den kabul etsin."
Nerede: Gruplar → + Kişi ekle; karşı tarafın Gelenler'i
Sonuç: → kararlar.md (Kişi ekleme istekleri Gelenler'de)

### P-21 · 19 Ekim 2026 · Behnan · iPhone
Ne dedi: "Anımsatıcılarda ayarlanan bildirimin üstüne basılı tutup gelen menüde durdur veya ertele diyoruz, ancak bu kullanıcıların pek anlamayacağı bir davranış, sadece bildirim olması yeterli. Peki bildirim sesini farklı farklı yapabiliyor muyuz? Bir de Gelenler kutusunda, sadece gelenler için bildirim açıp kapatma yapabilir miyiz?"
Nerede: Anımsatıcı bildirimi; Gelenler
Sonuç: → kararlar.md (Anımsatıcı bildirimi sadeleşti; Bildirim sesleri ve Gelenler bildirimi, sürüm 1.3.0)

### P-22 · 20 Ekim 2026 · Behnan
Ne dedi: "Yaşam Tarzı'nın şu anki karmaşıklığını iş projelerini de rutinlerle birlikte yürütebilmek istediğimden ben yarattım. Asıl amaca dönmemiz lazım." Anlattığı kullanım: kişi bir videoda direnç egzersizinin yararını görür, videoları Rites'a alır, izleyip not alır, ne yapacağına karar verir (evde egzersiz, kreatin, protein), ajandada süre tutan, ölçüm alan kartlarla 3 haftalık bir program kurar, uygular; ara vermek zorunda kalınca iyi araştırdığı programı sonra başlatmak ya da başkasıyla paylaşmak için kütüphaneye kaydeder. Sonra Sosyal bağlar için doğrudan program kurar (haftada bir eski bir arkadaşını ara, bir etkinliğe katıl), uygularken yeni kart ekler ya da ajandadaki kartı programa ekler. Alanlar yön göstermek için; puan kişinin kendi değerlendirmesi, programlara bağlı olmamalı; amaç bir konuya ağırlık verirken Sosyal bağlar gibi alanları da gözönünde tutmak. Uygulanmış programa yıldız verilsin.
Nerede: Yaşam Tarzım, Kütüphanem
Sonuç: → kararlar.md (Yaşam Tarzım: planlar yerine programlar)

### P-23 · 20 Ekim 2026 · Behnan · iPhone
Ne dedi: "Bir program oluşturduk, adını, etiketini tekrar nereden değiştireceğim?" (Düzenle "⋯" menüsündeydi.) "Bir ara hangi menü nerede yer alır çalışması yaparız, şu an pek standart değil; mümkünse konu başlığının hizasında sağda olabilir."
Nerede: Program ekranı; genel olarak ekranların üst satırı
Sonuç: Program ekranının sağ üstüne görünür "Düzenle" kondu. Menü yerleşimi çalışması sonraya (ürün sahibi önerisi: düzenle / menü, ekranın başlığıyla aynı hizada sağda).

### P-24 · 20 Ekim 2026 · Behnan
Ne dedi: "Yaşam Tarzı'nda belirlediğimiz alanlarda öneri program veya kartlar var; onları kütüphanede hazır kaydedilmiş olarak kullanıcıya sunsak nasıl olur? Bu hiç bitmeyecek bir çalışma, uzmanlık ve deneyim de gerektirebilir; alanların, programların ve kartların ileride bir uzmanla yeniden belirlenmesi durumunda bunları indirilebilir hale getirebilir miyiz?"
Nerede: Kütüphanem, Yaşam Tarzım
Sonuç: → kararlar.md (Rites önerileri Kütüphanem'de; içerik kataloğu indirilebilir)

### P-25 · 21 Ekim 2026 · Behnan
Ne dedi: "Notlarda altında Göster düğmesi var ve 2 notu görebiliyoruz, daha fazlası için tümüne ulaşıyoruz. Girişteki widget'larda ilgili modüle gitmek için bir ikon bulunsun: notlarda sticky note gibi bir ikonla notlar açılabilsin, Bugün sırada ajanda ikonuyla ajandayı açabilsin. Son iki notu göstermek yerine iğnelenen notlar ana ekranda bulunabilir."
Nerede: Giriş
Sonuç: → kararlar.md (Giriş: kutularda modül simgesi; Giriş'te iğneli notlar)

### P-26 · 21 Ekim 2026 · Behnan
Ne dedi: "Notlarda ses kayıt ikonu ile klavyede çıkan mikrofon (sesi dikte eden) karışıyor. Doğrudan ses dikteyi açmamız mümkün mü?" Sonra: "2 simge olması daha uygun. Kayda başladığında İptal düğmesi de olmalı. Bir beste ilhamı geldi ve kaydetti; kaydedilmiş sesli notun örneğin mp3 olarak paylaş (ya da kaydet) seçeneği güzel olur."
Nerede: Giriş → Hızlı Not; not sayfası
Sonuç: → kararlar.md (Hızlı Not: söyleneni yazıya çeviren mikrofon ve ayrı ses kaydı; sesli notu paylaşma)

### P-27 · 21 Ekim 2026 · Behnan · iPhone (1.4.0)
Ne dedi: "Girişteki widget'larda gideceği uygulamanın ikonunun sağda değil solda en başta olması daha iyi olacak. Ses kayıt belki not giriş kutusunun içinde değil, sağında ayrı ya da üstte dursa; ses kaydına not giriş kutusunda bir isim verebilir miyiz? Bir de dikte sırasında bir şeyler söylüyorum, kutuya yazıyor; biraz ara verip devam ettiğimde eskisini kaybedip yeniden yazıyor."
Nerede: Giriş, Hızlı Not
Sonuç: → kararlar.md (Hızlı Not: ses kaydı başlık satırında…; dikte duraklamada silinmez)

### P-28 · 21 Ekim 2026 · Behnan
Ne dedi: "Giriş ekranında görünecek widget'ları seçtiğimiz ekranda widget adları da aynı ikonu kullansın; uyumluluk açısından sıralarını değiştirme de üstüne basılı tutarak başlatılsın. Bir de Bugün Sırada'da yapılacak iş daha kart gibi görünse, belki Yaptım da o kartın üzerinde olur."
Nerede: Giriş, Giriş ayarı
Sonuç: → kararlar.md (Giriş ayarı ve Bugün sırada kartı)

### P-29 · 21 Ekim 2026 · Behnan
Ne dedi: "Karta bastığımızda açılan görünüm ekranının hiç stili yok; daha uzun bir kart görünümünde, sahip olduğu blokların belli olduğu bir yapıda olabilir mi? Kart görünümünde yapılabilecekleri testler sırasında ayrıca konuşuruz."
Nerede: Kart görünümü
Sonuç: → kararlar.md (Kart görünümü: tek uzun kart, bloklar bölüm bölüm)

### P-30 · 23 Ekim 2026 · Behnan
Ne dedi: "Ana ekrandaki anımsatıcılarda 'Süre sonra' kısmı var. Onu daha hoş bir timer haline getirsek iyi olacak, şu an hassas da değil. Mesela widget'tan Timer Ekle desek ve bir tane oluşturup kurabilsek." Seçimler: hazır süreler + tekerlek; saniye saniye geri sayım ve dolan halka, Duraklat / Devam, +1 dk, İptal; adı "Zamanlayıcı".
Nerede: Giriş, Anımsatıcılar
Sonuç: → kararlar.md (Zamanlayıcı: "Süre sonra"nın yerine)

### P-31 · 23 Ekim 2026 · Behnan
Ne dedi: "Zamanlayıcı diğerlerinden farklı olabilir, bitiş saati yazmasın, zaten yanıltıcı; tek Alarm tipi olabilir. Şu an alarm çıkınca 1 dk erteleyebiliyoruz, oysa giriş ekranında 5 dk ertele var. Acaba hiç detay form çıkmadan, timer ekle dediğimizde doğrudan giriş ekranına çıkan şık bir zamanlayıcıyı set edebilsek." Seçimler: kutuda açılır, Başlat'la; ertele ikisinde de 1 dk.
Nerede: Giriş, Anımsatıcılar
Sonuç: → kararlar.md (Zamanlayıcı: form yok, kutuda kurulur; yalnız alarm; ertele 1 dk)

### P-32 · 23 Ekim 2026 · Behnan
Ne dedi: "Daha da iyi oldu ama hâlâ hayal ettiğim şey değil. Bir Timer ikonu var ve ona bastığımda 5 dk'ya ayarlı (ya da 0 dk) bir timer bloğu oluşuyor, Başlat tuşu içinde (şu andaki gibi daire içinde olabilir); tek çözülmesi gereken görsel olarak başka bir dakika ayarı vermek, timer en çok 1 saat ile sınırlandırılabilir. Keşke analog düğme gibi ayarlayabilsek." Tartışmadaki önerilerin hepsi kabul: 5 dk açılış, çalışırken çevirme yok, başlayanlar küçük satıra iner, simge başlık satırında, en çok 60 dk.
Nerede: Giriş, Anımsatıcılar
Sonuç: → kararlar.md (Zamanlayıcı kadranı: mutfak zamanlayıcısı gibi)

### P-33 · 23 Ekim 2026 · Behnan
Ne dedi: "Hatırlatma saati geldiğinde bir YT videosunu başlatmasını istesem… örneğin Pazar sabahı seçtiğim bir YT müziğiyle uyanmak, dokunmaya gerek kalmadan." (Olmayacağı konuşulunca:) "Gerek yok, Apple Saat uygulamasını kullanırım; ya da ileride ev otomasyonuna bağlarım. Ajanda kartlarından kurulacak bir alarmda alarm sesini seçme şansım nedir, kaç farklı alarm sesi kurulabilir?" Öneri kabul: alarmda ses seçimi (telefonun alarm sesi + 5 Rites sesi), önce telefonda denenecek.
Nerede: Kart formu (Zamanlama), Anımsatıcı formu
Sonuç: → kararlar.md (Alarmın sesi seçilir)

### P-34 · 23 Ekim 2026 · Behnan
Ne dedi: "Gruplarda Kişiler bölümü var, bence mantıken üstte olması ancak hep açık olmaması, böylece rahatça gruplar yaratabilmeliyiz. Sağ üstteki avatar menüsüne mi geçirsek… bir yandan da avatar sadece Giriş sekmesindeyken olmalı, diğerlerinde o alan başka amaçlarla kullanılır ya da boş bırakılır. Ajandam'da başlık sığmadığı için kaldırmıştık; avatarı kaldırıp filtre, gün/hafta görünümü gibi tuşları toparlayan, kart ekleyi de üstte bir tuş olarak yerleştiren bir tasarıma gidebiliriz." Önerilerin hepsi kabul ("kullanımda bazı ayarlar yaparız").
Nerede: Üst satır (bütün sekmeler), Ajandam, Gruplar, Yaşam Tarzım
Sonuç: → kararlar.md (Üst satır düzeni ve Kişilerim)

### P-35 · 24 Ekim 2026 · Behnan
Ne dedi: "Kart yapımıza ve kullanımına odaklanalım. Beni ilk rahatsız eden Düzenle ekranı; orada hem içeriği düzenliyoruz hem yapıyı. Kart tasarımı da yapıyoruz orada; kartlara isim (şablon) belirlemek bir alternatif ama onun da eksileri var. Notlar, sesli not da önceden biçimlendirilmiş kartlar gibi. Ne zaman streak olacağı, veri alanlarının ne zaman toplanacağı gibi sorunlar da var." Cevaplar: en çok içerikle yapının bir arada olması rahatsız ediyor; geçmiş şimdilik kartın içinde; notlar için "Karta çevir" yeterli; karakter kuralı ve sıra kabul ("deneyelim").
Nerede: Kart görünümü, kart formu
Sonuç: → kararlar.md (Kart: içerik ile yapı ayrıldı)

### P-36 · 24 Ekim 2026 · Behnan
Ne dedi: (Kartın içerik / yapı ayrımı ve hazır biçimler için) "Pek hoş görünmüyor… kullanıcı dostu olmamasını kastettim; çoğu kullanıcı 50+ olduğu için sade bir tasarım gerekiyor." Önerilen yön (tek "Düzenle", tek sayfa form, teknik sözcük yok, seri anahtarı formdan çıksın) kabul.
Nerede: Kart görünümü, kart formu
Sonuç: → kararlar.md (Kart: 50+ kullanıcı için sade düzen)

### P-37 · 24 Ekim 2026 · Behnan
Ne dedi: "Daha güzel oldu, zaman şeridini de basitleştirebilsek iyi olur, aynı yaklaşımla."
Nerede: Kart formu (zaman)
Sonuç: → kararlar.md (Kart formunda zaman: soru satırları)

### P-38 · 24 Ekim 2026 · Behnan
Ne dedi: (Kart modeli konuşması) "Zamanlayıcı aynı zamanda ölçüm kaydı da olabilir… Peki bunu kartımıza nasıl uygulayacağız?" Tek yerleşim ve adım sırası kabul; "Yapıldı'yı kendi işaretlesin."
Nerede: Kart görünümü
Sonuç: → kararlar.md (Kartın tek yerleşimi; zamanlayıcı süreyi kaydeder; Yaptım kartta); kart-modeli.md

### P-39 · 24 Ekim 2026 · Behnan
Ne dedi: "Devam edelim; 'kendi işaretlesin' derken ajandadaki küçük kartta işaretlesin sadece."
Nerede: Kart görünümü, Karta ekle
Sonuç: → kararlar.md (Yaptım yalnız ajandada; yeni kayıt türleri)

### P-40 · 24 Ekim 2026 · Behnan
Ne dedi: "Kalanları da tamamlayalım; ancak bu işi tam çözebilmek için pilot uygulamada isimli kart çeşitleri tanımlamayı / tasarlamayı düşünüyorum."
Nerede: Kart görünümü; kart modeli
Sonuç: → kararlar.md (Süre ve cevapların geçmişi kartta); kart-modeli.md §8 (isimli kart çeşitleri, taslak)

### P-41 · 24 Ekim 2026 · Behnan
Ne dedi: "İsimli kartlar için düşündüğüm, belirli alanlara göre tasarlamak, örneğin beslenme… öğün listesi, yemek tarifi (… farklı olsun, başka işe de yarar), tartı, tabağım, su gibi. Bunun tasarlanacağı ayrı bir yer olabilir." Sorulara: Ayarlar → Kart çeşitleri; Tabağım tek fotoğraf ("gerekirse öğünleri ayrı hazırlarız"); öğün listesi "hem bir plan değişmeyen, ama altında farklıysa ne yedi ve miktarı… serbestçe girsin"; Beslenme ile başlansın.
Nerede: Yeni kart, Yaşam Tarzım → alan, Ayarlar
Sonuç: → kararlar.md (İsimli kart çeşitleri: Beslenme); kart-modeli.md §8

### P-42 · 25 Ekim 2026 · Behnan
Ne dedi: "Ana sayfadaki timer için düşündüğüm, tek bir timer olsun, yani ekle demeyelim. Bu timer default olarak alarm çalsın, +1 dk da olmasın. Kompakt bir panel, sadece bir ayar düğmesi, oradan ses ve bildirim tipi gibi ayarları yaparız. Hatta ayarlardan bunu dijital bir timer'a değiştirmek olsa çok da hoş olur." Sorulara: Anımsatıcılar kutusunda; dijitalde dakika ve saniye çarkı; en son kurulan süre gelsin.
Nerede: Giriş → Anımsatıcılar kutusu
Sonuç: → kararlar.md (Giriş'te tek zamanlayıcı)

### P-43 · 25 Ekim 2026 · Behnan
Ne dedi: "Timer'ın her zaman görünür olmasını istemiştim, bir de dijital olanın kurulması için ayrı bir form olması gerekmeyebilir."
Nerede: Giriş → Anımsatıcılar kutusu
Sonuç: → kararlar.md (Giriş'te tek zamanlayıcı: her zaman görünür)

### P-44 · 25 Ekim 2026 · Behnan
Ne dedi: "Kullanışlı ve hoş görünümlü olsun. Şu an dijital olan daha iyi durumda, ama sanırım bir set düğmesi olmalı ve ona basınca ayarlanmalı, kadran içinde bir set düğmesi olabilir, yalnız kadranı set ederken başlat düğmesi olmasın… Ayrıca kadran modunda duraklat dediğimizde Duraklat yazısı eklendiği için yüksekliği büyüyor, baştan o yüksekliğe sahip olabilir."
Nerede: Giriş → Anımsatıcılar kutusu → zamanlayıcı
Sonuç: → kararlar.md (Giriş'te tek zamanlayıcı: Ayarla düğmesi)

### P-45 · 25 Ekim 2026 · Behnan
Ne dedi: "Yaşam tarzında Beslenme alanına girdiğimde kartları görüyorum, yeni program oluştur diyorum beslenme alanındayken ve kart ekleyeceğim, ama beslenme kartlarından seçme şansım yok sanırım." Ayrıca zamanlayıcı: "bir ara Başlat, Ayarla düğmeleri ile ayar ikonunu daha düzgün (kompakt) yerleştiririz."
Nerede: Yaşam Tarzım → program → + Yeni kart
Sonuç: → kararlar.md (Programa kart eklerken de çeşitler); zamanlayıcı yerleşimi sonraya

### P-46 · 25 Ekim 2026 · Behnan
Ne dedi: "Kartlarda ne zaman soruları bence çok yer kaplıyor ve dikkati dağıtıyor, bir de karttan vazgeç ile çıkmaya çalıştığımda sorduğu Devam et, Sil ve Kapat seçenekleri beni rahatsız ediyor, özellikle Sil sözü." Sorulara: Kaydet / Kaydetmeden çık; tek satır özet.
Nerede: Kart formu; bütün alttan sayfalar
Sonuç: → kararlar.md (Kart formu: zaman özeti ve Vazgeç sorusu)

### P-47 · 26 Ekim 2026 · Behnan
Ne dedi: "Zamanlama ile ilgili sorular tam oturmadı. Görünümde zaman bilgisini en tepede özetliyoruz; düzenleme modunda tarih ve saat kartın sağ üstünde yer alabilir, yeni kartta zaten bugünün tarihi, saat her zaman kullanılmıyor ancak set edilecek yeri belirtmek için ..:.. konulabilir. Buradan açılacak takvimle tarih ve istenirse saat set edilebilir, aynı zamanda kartı taşımak için de kullanılmış olur." Soruya: Tekrar ve Hatırlatma aynı takvim sayfasında.
Nerede: Kart formu
Sonuç: → kararlar.md (Zaman sağ üstte)

### P-48 · 26 Ekim 2026 · Behnan
Ne dedi: "Bence sadece saat kaçta gibi sorulara gerek yok, saat seçim alanı olması yeterli. Tekrar etsin mi demek yerine de süre ve hangi günler olacağını seçsin."
Nerede: Kart formu → Ne zaman? sayfası
Sonuç: → kararlar.md (Zaman sayfasında soru yok)

### P-49 · 26 Ekim 2026 · Behnan
Ne dedi: "Üstte ne yapacaksın diye soruyoruz, biz bilgi kartı da düzenliyoruz, o başlığa gerek yok. Tekrar varsa her zaman seri mi olmalı (streak)? Örneğin beslenmede öğünler bir seri değil bence, başka örneklerde de olacak. Bir de önce tekrar günlerini soruyoruz sonra süreyi; bence tekrar demek yerine süre desek, bir günden fazla ise başka soruları sorarız."
Nerede: Kart formu → Ne zaman?; seri
Sonuç: → kararlar.md (Kart formu: başlık, süre ve seri)

### P-50 · 26 Ekim 2026 · Behnan
Ne dedi: "Talimat bir textbox, liste ve proje adımları birer checklist, bir de açıklama alanımız var, o da textbox. Daha önce web'de uygulamıştım, stilli textbox için kütüphaneler var: bold, bullet, numaralı, checklist gibi, onlardan kullansak iyi olacak." Sorulara: Enriched; liste ve adımlar aynı editörde onay kutulu.
Nerede: Kart formu (talimat, açıklama, liste, proje adımları)
Sonuç: → kararlar.md (Biçimli metin); sürüm 1.5.0

### P-51 · 27 Ekim 2026 · Behnan
Ne dedi: "Kart çeşitliliği açısından normal kullanıcılar ile uzmanları ayırmak, normal kullanıcı kartlarını oldukça sadeleştirebilir… normal kullanıcılar için karmaşık hale gelmesi daha büyük sorun olabilir." Ücretli sürüm konuşuldu: "ücretli kısmı hiç düşünmeyelim, ayrımı uzman ve normal kullanıcı olarak yapalım." Sorulara: açıklama talimat yerine; takip için tek liste; video ve fotoğraf; sade program; uzman Ayarlar'da anahtar; zamanlayıcı Giriş'teki yeter; dosya olmasın; liste davranışı süreden, çok günlükte seçim.
Nerede: Kart formu, program, Ayarlar
Sonuç: → kararlar.md (Normal kullanıcı ve uzman); kart-modeli.md §9

### P-52 · 27 Ekim 2026 · Behnan
Ne dedi: "1. Kart eklerken önce 'Karta bir şey ekle' var, ona basınca 'Karta ekle'ye dönüşüyor, gereksiz bir ara durum. 2. Kart eklerken bazı alanlar ve modallar klavye açıksa arkada kalıyor. 3. Not editöründe başlığı seçtiğimde gelen menü (Paste, Select vs) editörün üst menüsünü kapatıyor."
Nerede: Kart formu, biçimli editör, alttan sayfalar
Sonuç: → kararlar.md (Küçük düzeltmeler, 27 Ekim)

### P-53 · 27 Ekim 2026 · Behnan
Ne dedi: "Çoklu video konusuna gelelim. 1. Video ekle dediğimizde video boyutunda koyu bir placeholder, altında + video ekle. 2. Video ekleye basınca placeholder içinde bağlantı adresi, isteğe bağlı başlık, başlama ve bitiş; altında Vazgeç, Ekle. 3. URL ve başlık için ayrı caption yok, Başla: ve Bitiş: aynı satırda. 4. İlk video eklendikten sonra altında ayar ikonu ve + Video ekle. 5. Ayar ikonuyla url, başlık, başlama, bitiş düzenlenebilecek. 6. İkinci video eklenirse üstte Video 1, Video 2 butonları. 7. Video eklenince doğrudan embed oynayabilecek. 8. Başlıkları seçicide yazdırmayalım."
Nerede: Kart formu → Video; kart görünümü
Sonuç: → kararlar.md (Çoklu video)

### P-54 · 27 Ekim 2026 · Behnan
Ne dedi: "YouTube'da aç demene gerek yok, zaten içinde çıkıyor. Onun yerine bir Yansıt düğmesi ile doğrudan bağlı bir televizyona görüntü aktarmayı araştırabilirsin. YouTube'dan paylaş deyip Rites'a aktardığım videoların bazılarının tek kartta toplanmasını yapabiliriz: paylaştıklarımız Gelenlere düşüyor; video ekle derken 'Gelenlerden al' seçeneği olup gelenlerdeki video kartları listelenir ve seçilenin videosu bu karta eklenir."
Nerede: Kart formu → Video; video oynatıcı
Sonuç: → kararlar.md (Videolar: Gelenlerden al, Yansıt)

### P-55 · 27 Ekim 2026 · Behnan
Ne dedi: "AirPlay kullanırım, bir şey yapmaya gerek yok. Gelenlerden alma da güzel çalıştı… Instagram için de aynı şeyler geçerli olacak, tabi onda başlama bitiş süreleri olamıyor. Bir süredir Hesabı sil'i deniyorum, hep 'Şu an bağlanamıyor, daha sonra yeniden dene' diyor."
Nerede: Video; Ayarlar → Profil → Hesabımı sil
Sonuç: → kararlar.md (Instagram videoları; Hesabımı sil hatası)

### P-56 · 27 Ekim 2026 · Behnan
Ne dedi: Hesabımı sil'in yeni hata iletisi: "cannot delete from table "liste_erisim" because it does not have a replica identity and publishes deletes"
Nerede: Hesabımı sil (sunucu)
Sonuç: → kararlar.md (Hesabımı sil düzeldi); sema.sql

### P-57 · 27 Ekim 2026 · Behnan
Ne dedi: "Stilli editörde satırlar çok bitişik, satır aralığını 1,2 yapsak. Zaman şeridimize basınca tarih ve saat dışında çıkan Süre ve Hatırlatma orada kayboluyor ve sayfayı fazla uzatıyor; o ikisi için ayrı bir şerit mi yapsak, hatta Karta ekle butonu da o şeritte olabilir."
Nerede: Kart formu; biçimli editör
Sonuç: → kararlar.md (Kart formu: ikinci şerit; editörde satır aralığı)

### P-58 · 27 Ekim 2026 · Behnan
Ne dedi: "Tarihsiz bir listenin ajandada olması garip… Gruplarda ortak listeler var; kimseyle paylaşmazsam benim listem." Kararlar: kişisel liste telefonda dursun; yalnız listeden ibaret kartlar kendiliğinden taşınsın; tarihsiz liste yalnız Listelerim'den.
Nerede: Ajanda; Giriş → Ortak listeler
Sonuç: → kararlar.md (Listelerim: kişisel listeler telefonda)

### P-59 · 27 Ekim 2026 · Behnan
Ne dedi: "Kütüphaneye kaydettiğim bir karta, paylaş ile gelen videoyu eklemek istiyorum, ancak kütüphanedeki kartı açabilmem için ajandaya koymak zorunda olmamam lazım."
Nerede: Yaşam Tarzım → Kütüphanem → kayıt
Sonuç: → kararlar.md (Kütüphanedeki kartı düzenleme)

### P-60 · 29 Ekim 2026 · Behnan
Ne dedi: "Şu an Giriş'te Listeler'den hem liste hem ortak liste yarat var; gruplarda grup içinden yaratılır diyor ama grup içinde Yapılacak, Buluşma, Birlikte rutin var; Gruplar ana ekranında ortak liste var. Benim fikrim: sadece Giriş'te Listeler olsun, bir liste yaratsın; isterse onu bir grup veya kişi ile paylaştığında altta Paylaşılan listeler olarak listelensin." Kararlar: grup ekranında liste hiç görünmesin; paylaşmayı bırakınca liste yeniden kişisel olsun; ad "Listeler".
Nerede: Giriş → Listelerim; Gruplar; grup ekranı
Sonuç: → kararlar.md (Listeler tek yerde)

### P-61 · 29 Ekim 2026 · Behnan
Ne dedi: "Liste kurarken Vazgeç dediğimde Kaydetmeden çık ve Düzenlemeye dön diye soruyor; bence 2 soru güzel, diğerlerinde de, örneğin ajanda kartlarında da 3 seçenek değil bu 2 seçenek olsun. … Yeni liste dediğimde yapılacaklar, market, bayram hazırlığı vb. çipler var, ancak bu sadece isim öneriyor; altyapıda listeler hep aynı davranıyor. Listeleri yapısal olarak çeşitlendirebilir miyiz?" Kararlar: dört çeşit (Yapılacaklar, Alışveriş, Hazırlık, Not listesi); ad çipi çeşidi de seçsin; paylaşılan listelerde de geçerli.
Nerede: Bütün alttan sayfalar; Giriş → Listeler
Sonuç: → kararlar.md (Vazgeç sorusu iki seçenek; liste çeşitleri). Ajanda kartlarındaki Liste parçasına ayrıca bakılacak.

### P-62 · 29 Ekim 2026 · Behnan
Ne dedi: "Yaptım bilgisi şu an yeterli ancak atanan kartlar Gelenler'e değil doğrudan ajandaya ve tarihli olarak düşmeli. Şu an aile içi kullanımı düşünelim, belki bu kişi doğrudan ajandama atayabilir iznini vermeli. Video görüşmeyi WhatsApp'a bağlamayı önce uygulayalım, nasıl olacağını görelim. Bu arada daha önce yaptığım stream.io ile 100 aynı anda konuşma ücretsizdi, hâlâ öyleyse ve gerekliyse tekrar kurabiliriz." Kararlar: anahtar + İzin iste; grup ve kart menüsü; alan saati değiştirir, içeriği değil.
Nerede: Gruplar, grup ekranı, Kişilerim, Gelenler, kart görünümü, buluşma formu
Sonuç: → kararlar.md (Kart verme ve görüntülü görüşme bağlantısı)

### P-63 · 29 Ekim 2026 · Behnan
Ne dedi: "Ajanda kartlarında görünüm modunu biraz düzenleme modu ile uyumlu yapmamızda yarar var, öncelikle tarih ve saat alanı benzer konumda olmalı, hatta görünüm modunda tarih ve saat değiştirilebilmeli; şu an bir kartı başka tarihe taşımak için kartı açıp düzenleme moduna girmemiz gerekiyor. Ayrıca kart başlığının fontunu görünümde biraz düşürelim ve Yaptım checkbox'ı görünümden de işaretlenebilsin. Diğer kart elemanları için de benzeri bir çalışma yaparız."
Nerede: Kart görünümü
Sonuç: → kararlar.md (Kart görünümü düzenleme formuyla uyumlu)

### P-64 · 29 Ekim 2026 · Behnan
Ne dedi: "Tarih saat seçerken saat çok yer kaplıyor, fazla açıklama olmadan tarih ve saati değiştirmesi yeterli; gruplardaki buluşmada kullanılan saat oldukça sade ve kullanışlı, bu hem kartta hem de alarmın saatinin ayarlanmasında kullanılmalı. … Düzeltme modunda kartla alanlar eklemek, yerlerini değiştirmek yanında hangi alanın görünüm modunda değiştirilmesini istemediğimizi söylesek nasıl olurdu; sanki bir koçun kart tasarlaması böyle olur."
Nerede: Kartın Ne zaman? sayfası; kart tasarımı
Sonuç: → kararlar.md (Sade saat seçimi); görünümde değiştirilebilirlik ayrıca konuşuluyor

### P-65 · 29 Ekim 2026 · Behnan
Ne dedi: (P-64'ün devamı) görünümde neyin değiştirilemeyeceğini düzenleme modunda söylemek. Kararlar: kilit ayarı herkeste; varsayılan hepsi açık; verilen kartta verenin ayarı geçerli.
Nerede: Kart formu, kart görünümü
Sonuç: → kararlar.md (Kartı tasarlayan, görünümde neyin değişeceğini seçer)

### P-66 · 29 Ekim 2026 · Behnan
Ne dedi: "Karta basınca açılan görünümde ayrıca Değiştir butonuna ihtiyaç duymadan doğrudan düzeltebilsin, eğer kurulumda açık bırakılmışsa. Sorun şu ki kullanıcı kart ekle dediğinde kurulum modunda mı gelecek, yoksa varsayılan alanlarla çalışacaksa kur diyene kadar bir şey gözükmesin. Kur ekranı ile ilgili olarak da açıklama dahil içindeki elemanların bir başlık satırı ve ⋯ gibi bir menüsü olsun; burada değiştirmeye izin, sil ve taşı (yukarı aşağı) olabilir." Kararlar: yeni kart kartın kendisi; kendiliğinden kayıt; başlık satırında tek ⋯; tekrarlıda içerik bütün günlere.
Nerede: Kart görünümü, kart formu (Kur), yeni kart
Sonuç: → kararlar.md (Kur ve kullan)

### P-67 · 29 Ekim 2026 · Behnan
Ne dedi: "Tekrar ve bildirim şu anda Kur'da var sadece, öncelikle onların yerini tarih saatin satırına alalım geçici de olsa. Kullanıcının tarihi değiştirmesini istemeyiz ama aynı anda saate karışmayabilir, o yüzden tarih ve saat izinleri ayrı olmalı. Bir fikrim de acaba liste, video gibi elemanlar sadece bir tane mi eklense; kullanım senaryolarında birden fazla olması ne zaman var irdeleyelim, uzman kullanıcının ekleyeceği alanlara da bakmak lazım."
Nerede: Kart görünümü, yeni kart / Kur
Sonuç: → kararlar.md (Zaman satırı); karar: her parça karta bir kez

### P-68 · 29 Ekim 2026 · Behnan
Ne dedi: "+ Karta ekle butonunu kaldıralım, kartın en altına hafif koyu arkaplanlı bir şeritte Açıklama, Liste, Video ve Dosya için ikonlar koyalım, onlara basınca alanlar eklensin; ilk başta açıklama ikonu olmayacak çünkü varsayılan olarak gelecek. Bu durumda açıklama da diğerleri gibi kaldırılabilecek. Uzman için More.. gibi bir ikonla gerekli eklenecek bileşenlere ulaşılacak."
Nerede: Yeni kart / Kur
Sonuç: → kararlar.md (Kartın altında parça şeridi)

### P-69 · 29 Ekim 2026 · Behnan
Ne dedi: "Kartın içinde diyoruz ama açıklamayı yukarıda tutuyoruz, bence kartın içinde lafını veya ne yapacaksın laflarını tamamen kaldıralım. Liste ikonu listenin checkboxları ile karışıyor, ikon ve liste yazısı da gereksiz olabilir."
Nerede: Kur, kart görünümü
Sonuç: → kararlar.md (Sade parça başlıkları)

### P-70 · 30 Ekim 2026 · Behnan
Ne dedi: "Giriş sayfasında Anımsatıcı ve zamanlayıcıya bakalım. Zamanlayıcının hızlı bir anımsatıcı olduğunu belli etmemiz lazım, önce sadeleştirelim: 1. Sadece dijital olsun ve 1 saat ile sınırlı olmak zorunda değiliz artık. 2. Ayarlama dijital rakamların üstüne basınca yapılabilsin. 3. Bu durumda Ayarla butonu kalkıyor, başlat ve options düğmeleri de mümkünse aynı satırda olsun. 4. Bildirimleri erteleme şansımız yok, bildirim modunda sadece bir kere bildirim gelip otomatik dursun."
Nerede: Giriş · Anımsatıcılar kutusu, Anımsatıcılar ekranı
Sonuç: → kararlar.md (Sade zamanlayıcı)

### P-71 · 30 Ekim 2026 · Behnan
Ne dedi: "Ayar düğmesi sanki saat ayarı da yapacak gibi duruyor, o zaman onu açtığımızda en üstte de ayar yapabilelim. Zamanlayıcının farklı durması konusunda, saatin altında yazan zamanlayıcı yazısını saatin üstüne bold olarak ve arka planı farklı renkte koyabiliriz. Anımsatıcıları açtığımızda zamanlayıcının orada da gözükmesi gerekir mi?" Karar: hiç görünmesin.
Nerede: Giriş · zamanlayıcı, Anımsatıcılar ekranı
Sonuç: → kararlar.md (Sade zamanlayıcı)

### P-72 · 30 Ekim 2026 · Behnan
Ne dedi: "Ajanda da + ya bastığımızda, normal kullanıcıda doğrudan yeni kartı açsın. Yukarıda zaman chipleri var, bunlar tek satıra sığmalı, bunun için belki bildirimi aşağı alabiliriz yani en alttaki kart bileşenleri şeridine. Ve kart bileşenleri şeridi, kaydettiğimiz kartı açtığımızda da en altta olsun ve çalışsın, buradan alan eklemekte farklılıklar olabilir onlara bakarız."
Nerede: Ajandam +, yeni kart, kart görünümü
Sonuç: → kararlar.md (Ajandada sade yeni kart, şerit kartın kendisinde)

### P-73 · 30 Ekim 2026 · Behnan
Ne dedi: "Biraz ekranı toparlamamız lazım. Zamanlama bilgileri chip değil de bir şerit gibi olsa daha güzel durabilir. Eğer süre bir günden fazla ise sadece onu belirtsin, seçili günler varsa alt satırda gösterilebilir. Bir süre varsa çıkan Kayıt: ve seri gösterimi kartta olmayabilir, eğer bir alışkanlık oturtmak istiyorsak o alışkanlıkların gidişatını gösteren ayrı bir ekran yapabiliriz."
Nerede: Kart görünümü, yeni kart / Kur
Sonuç: → kararlar.md (Zaman şeridi; kartta seri kutusu yok); alışkanlık ekranı açık

### P-74 · 30 Ekim 2026 · Behnan
Ne dedi: "Ben genelde eski adıyla görünüm modunda çalışıyorum, sadece başlığını yazıp kaydettiğim kartta. 1. Açıklama kısmında Bitti düğmesi olması şart mı? 2. Liste başlıksız olunca kötü duruyor, değiştirilebilir bir Liste yazısı olsa."
Nerede: Kart görünümü
Sonuç: → kararlar.md (Görünümde Bitti yok, listenin başlığı)

### P-75 · 30 Ekim 2026 · Behnan
Ne dedi: "Açıklama alanının bir başlık kısmı (header) olsun, orada açıklama yazsın, sağında da 2 ikon, biri Aa ve basıldığında formatlama şeridi görünsün, normalde görünmesin. Bir de açıklamada hiçbir şey girilmemişse veya silinmişse bileşen kalkmasın, şu an kapatılmış gibi alt şeride gidiyor. '...'yı menü için ayırdım, belki bir süre sonra Kur'a gerek kalmayacak."
Nerede: Kart görünümü
Sonuç: → kararlar.md (Açıklama başlık satırlı öğe)

### P-76 · 30 Ekim 2026 · Behnan
Ne dedi: "Tamam diğerlerine de başlık satırını uygulayalım. Acaba alttaki şerit ekranın en altına sabitlenebilir mi, kart boş olsa da görsel açıdan iyi olur."
Nerede: Kart görünümü
Sonuç: → kararlar.md (Her parçanın başlık satırı; şerit ekranın altında)

### P-77 · 31 Ekim 2026 · Behnan
Ne dedi: "Bence onları da taşıyıp, sonra kartın görünümünün sadeleştirilmesi için çalışmalara devam etmemiz iyi olur." (Kur'da kalanlar: ayarlı parçaların kurulumu, başlık ve zaman izinleri, liste maddelerini düzeltme / silme.)
Nerede: Kart görünümü
Sonuç: → kararlar.md (Kur'daki son işler kartın içinde)

### P-78 · 31 Ekim 2026 · Behnan
Ne dedi: "Serilerin, gelişimin gösterilmesi konusuna bakalım; asıl amaç alışkanlık yerleştirme ya da belirli süreli bir programı sıkı uygulama. Alışkanlık tipi kartlar ajandada fazla kalabalık bir görünüme neden oluyor. Alışkanlıkları diğer yazılımlarda olduğu gibi bir miktar ayrı tutabiliriz … Rites alışkanlık yerleştirmeyi yaşam tarzı alanlarına bağlamaya çalışıyor ve uygulanan programlar zaten ana ekranda bir widget olarak görünüyor … ajandayı rahatlatmak için alışveriş listesini Listeler'e taşıdım, alışkanlıklar da bu mantıkla gidecek ve ajandada göster seçeneği ile ajandayı gerektiğinde rahatlatırız." Kararlar: Devam edenler genişlesin; ajandada varsayılan kapalı; seçilen + programdakiler.
Nerede: Giriş → Devam edenler, Alışkanlıklar ekranı, Ajandam, kart görünümü
Sonuç: → kararlar.md (Alışkanlıklar ayrı yerde; ajanda rahatlar)

### P-79 · 31 Ekim 2026 · Behnan
Ne dedi: "Telefonda Rites hesabını silerek verileri sıfırlamak ve belirli senaryolarla ilerlemek istiyorum. Yaşam tarzındaki Rites önerileri (gereksiz kalmış olabilir) ve Kütüphane kullanımını da gözden geçirmek." Kararlar: tek kartlı programlar alışkanlık önerisi; tekrarlı öneri kartı alışkanlık olarak eklenir; öneri kartları saatsiz, etiketsiz; öneriler Kütüphanem'den ayrı.
Nerede: Yaşam Tarzım, Kütüphanem, öneri ekranı
Sonuç: → kararlar.md (Rites önerileri sade ve ayrı); deneme senaryoları sıfırlamadan sonra

### P-80 · 31 Ekim 2026 · Behnan
Ne dedi: "Çoklu video oynatıcımıza bakalım: 1. Video ekle'de Gelenlerden al varsa klavye bazı kontrollerin üzerinde kalıyor. 2. Alttaki Vazgeç ve Ekle düğmeleri, Gelenlerden al'ı açarsam yanıltıcı oluyor; listedeki küçük +'ya basmam gerektiği belli olmuyor. 3. Başka bir telefonda Instagram videosunu yarım saniye başlatıp duruyor gibi; YouTube için kaldırdığımız uygulamada oynat seçeneğini Instagram için koymamız gerekecek."
Nerede: Kart görünümü ve Kur'da video parçası
Sonuç: → kararlar.md (Video eklerken Gelenler; Instagram'da aç)

### P-81 · 1 Kasım 2026 · Behnan
Ne dedi: "Kart görünümünün sade durması için önce kullanım senaryolarına göre düşünebiliriz … yeni bir kullanıcı Rites önerilerine bakar, kendi ihtiyaçlarına göre ajandaya aktararak bir genel program oluşturabilir: günde 6-8 bardak su, sabah 10 dk tai chi, haftada en az 2 kez balık, saat 11'de yatmayı alışkanlık haline getirmek … su iç kartımız yeterli değil, su sayacı şeklinde olmalı; şükran kartı başka alan olmadan sade bir kart olmalı. Rites önerilerini gözden geçirip sırayla en uygun kartları yaratmalı … Kartın tepesine tarih yazmamıza gerek olmayabilir … altta bileşenleri ve bildirimi içeren şerit bottom-nav'a benziyor ve yanıltıcı … Kart yerleşimini ayrıca konuşacağız." Kararlar: süre yok, tek tek ajandaya; haftada N kez şimdilik yok; öneriler kart kart (sebze ve resim çıktı, programlar kalktı).
Nerede: Rites önerileri, kart görünümü
Sonuç: → kararlar.md (Senaryo: kendi düzenini kurmak; öneriler kart kart)

### P-82 · 1 Kasım 2026 · Behnan
Ne dedi: "Rites önerilerinden Günde 8 bardak suyu açtım, dediğim gibi önce bunu ajandama eklemek istiyorum, bir program yapmak zorunda değilim. Seçenekler Alışkanlık olarak ekle, Programa ekle. Şu an alışkanlık değil, ajandama ekleyip süreyi de 1 hafta vereceğim ve kullanacağım."
Nerede: Rites önerileri → öneri ekranı
Sonuç: → kararlar.md (Öneri önce ajandaya)

### P-83 · 1 Kasım 2026 · Behnan
Ne dedi: "Karttaki zaman ve bileşenlerin yerleşimi konusunda önerin nedir, yeni alan ekleme konusunda alttaki şerit bence normal kullanıcı için gereksiz oldu gibi, eğer ilk kayıtta başlık ve açıklama geliyorsa, bir tek liste eklemek için bir şeride gerek yok, hmm bu arada ajanda kartında listenin kullanım ihtiyaçlarını ve çeşitlerini de irdeleyelim." Seçimler: zaman tek sessiz satır; kartın sonunda "+ Ekle"; sade parça başlıkları (Kur ⋯ menüsüne); listede Adımlar, Günlük kontrol, Bilgi listesi, Listeler'den bağla.
Nerede: Kart görünümü ve Kur
Sonuç: → kararlar.md (Kart yerleşimi sadeleşti; listenin dört kullanımı)

### P-84 · 1 Kasım 2026 · Behnan
Ne dedi: "Sadelik güzel olmaya başladı. Sanırım Açıklama eskide kaldı, onu da uyarlayalım. Bir de +Ekle dediğimde gelen şeridi kapayamıyoruz"
Nerede: Kart görünümü ve Kur
Sonuç: → kararlar.md (Açıklama da sade başlıklı; şeritte Kapat)

### P-85 · 1 Kasım 2026 · Behnan
Ne dedi: "Liste bileşeninde Günlük kontrol tipini göremedim"
Nerede: Kart görünümü → + Ekle → Liste
Sonuç: → kararlar.md (Günlük kontrol tek seferlik kartta da seçilir). Sebep: seçenek yalnız tekrarlı kartta gösteriliyordu.

### P-86 · 1 Kasım 2026 · Behnan
Ne dedi: "3 çeşit listemiz oldu. 1. Eklediğimiz bir maddeyi nasıl değiştireceğiz veya sileceğiz. 2. Bence Girişteki listelerde bu üçünden oluşsun ve sade olsun. Alışveriş listesindeki miktarların hem kullanımı zor hem de isteyeceğimiz birimler her zaman olmayabiliyor, o tip bir liste yerine ileride tablo yapmayı deneyebiliriz, mesela 2 kolonlu" Seçimler: uzun bas, yerinde düzelt; kartla aynı üç çeşit; miktarlar silinsin; Listeler'de de uzun bas.
Nerede: Kartın listeleri, Giriş → Listeler
Sonuç: → kararlar.md (Listelerde üç çeşit; maddeyi yerinde düzeltme)

### P-87 · 4 Kasım 2026 · Behnan
Ne dedi: "Rites'ı günlük hayatta kullanmaya çalışıyorum, günlük kaç bardak su içtiğimi, çay kahve tüketimimi ve bunlarda yapacağım değişikliklerin genel iyilik durumuma nasıl etki ettiğini anlamaya çalışıyorum … deneysel açıdan az sayıda parametrenin etkisini görmenin daha anlamlı olacağını düşündüm … sayaçların her karta tek bir tane eklenmesi yetmiyor, günlük ölçümler adında bir kartın içine hem su, hem kahve, belki yapılan nefes egzersizi, ayrıca kilo, uyku süresi, enerji durumu gibi … ölçümü almam gerekecek … enerjik olma, zihin açıklığı, günlük tuvalete çıkma sıklığı gibi konulara etkisini nasıl basitçe görebileceğimi henüz bilemiyorum" Seçimler: tek kartta alt alta; önce yan yana şerit; Gidişat kartın ⋯ menüsünde; + Ekle'de Ölçüm normal kullanıcıda da.
Nerede: Kart görünümü, yeni Gidişat ekranı
Sonuç: → kararlar.md (Günlük ölçümler ve gidişat)

### P-88 · 4 Kasım 2026 · Behnan
Ne dedi: "Girişteki anımsatıcı ve zamanlayıcı ile ilgili bir kaç şey yapalım. 1. Zamanlayıcı alarm olarak çalmaya başladığında, bir şey yapılmazsa sürekli çalıyor, belki bir 20 sn çaldıktan sonra susmalı ve otomatik ertelenmiş kabul etmeli. Bu arada erteleme süresini seçemiyoruz, 5 dk mantıklı bir süre. 2. Anımsatıcıda Ajanda hatırlatmalarının sesi diye bir bölüm var, gereksiz kalmış olabilir, zaten kartlarda ayarlayabiliyoruz 3. Anımsatıcılarda, son kurulan anımsatıcıda seçilen Nasıl uyarsın ve Ses seçeneklerini hatırlasın."
Nerede: Giriş → Zamanlayıcı, Anımsatıcılar
Sonuç: → kararlar.md (Zamanlayıcı ve anımsatıcı ayarları). 20 sn susma yalnız Rites açıkken (iOS sınırı).

### P-89 · 4 Kasım 2026 · Behnan
Ne dedi: "Listelerle ilgili, ajanda kartında bir listeyi bağla seçeneği var, pratik bir yararını göremedim, sence işe yarar mı" (öneri: kaldıralım) → "Kaldıralım. Bir de Gruplar sekmesinin üst sağında Kişiler için ikon var, ama zaten ilk sıradaki Kişilerim kartı aynı işi yapıyor, o yüzden ikonu kaldıralım"
Nerede: Kartın listesi, Gruplar sekmesi
Sonuç: → kararlar.md (Kartta "Listelerimden" kalktı; Gruplar'da kişi simgesi kalktı)

### P-90 · 4 Kasım 2026 · Behnan
Ne dedi: "Biraz önce yaptığımız ölçüm kartı, alışkanlıklar, programlar ile ilgili genel olarak konuşmak istiyorum … ölçümler kartında hedefimiz bir alışkanlık dahil yaşam tarzı değişikliklerinin etkisini görmek. Şu an onu da tam bir hedef olmaksızın izliyoruz … süt ürünlerini, en azından bir süre, tamamen kesmek, ayrıca mümkün olduğunca terlemek … bir çeşit detoks programı gibi düşünüyorum … 2 hafta yaptıklarıma dikkat edeceğim. Bunu ajanda üzerinden mi yapmalı yoksa bir program gibi düşünüp, örneğin Giriş'den mi takip etmeli" → öneri: program = deney → "Evet belirli süre için denemeye değer. Başlayalım"
Nerede: Program ekranı, Gidişat
Sonuç: → kararlar.md (Program = deney)

### P-91 · 5 Kasım 2026 · Behnan
Ne dedi: "Günlük ölçümler için bir kart oluşturdum, topluca oradan giriyorum. Başka kartlarda da ölçüm olabiliyor, tabi bu biraz karışıklık yaratıyor. Acaba ölçümleri girişde bir çeşit kart olarak mı tanımlasak, sadece buradaki ölçümleri dikkate almamız uygun olabilir belki. Ölçümler tarihsel olacağı için giriş ekranındaki modülde tarih seçimi de olsa, ayrıca ajanda da göster diyerek istenildiğinde ajandadan da kullanılabilse. Ancak amaç hem ajandayı rahatlatmak, hem kolay girişi sağlamak, hem de günlük (bazıları haftalık) ölçümlerin özel bir kart olmasını, yani ikinci aynı veya benzeri adlı karttan farklı olmasını sağlamak" Seçimler: kartlardaki ölçümler kalsın ama değerlendirmeye girmesin; Ölçümlerim boş başlasın; her ölçüme sıklık; kutunun içinde girilsin.
Nerede: Giriş, Gidişat, program değerlendirmesi
Sonuç: → kararlar.md (Ölçümlerim: Giriş'te tek ölçüm defteri)

### P-92 · 5 Kasım 2026 · Behnan
Ne dedi: "Güzel, yalnız ölçüm çeşidi genelde fazla, giriş'de açık durmasın, widgetden ulaşalım."
Nerede: Giriş → Ölçümlerim
Sonuç: → kararlar.md (Giriş'te Ölçümlerim küçük kutu)

### P-93 · 5 Kasım 2026 · Behnan
Ne dedi: "Güzel, bir tek Bugüne dön yazısı yerine ajanda da uyguladığımız bugüne dön ikonunu koyabiliriz. Ajanda da her gün ilk kartım Sabah rutini, bu kartta yaklaşık 8-10 madde var bir liste olarak, sırasıyla yaptım diye maddeleri işaretliyorum ancak bazıları egzersiz olduğu için video'ya gerek var. Bu tip ihtiyaçlar olacağını düşünerek sanırım kartlardan oluşan bir kartta (rutin) oluşturmamız gerekecek, hatta içindeki maddeleri Giriş deki Bugün sırada da görüp işaretleyebilmeliyim" Seçimler: kartlardan oluşan kart; Bugün sırada sıradaki adım; maddeler adım kartlarına çevrilsin; adımlar rutinle aynı günler.
Nerede: Ajanda, kart görünümü, Giriş → Bugün sırada, Ölçümlerim
Sonuç: → kararlar.md (Rutin: kartlardan oluşan kart)

### P-94 · 5 Kasım 2026 · Behnan
Ne dedi: "Listenin kartlardan oluşması güzel oldu, biraz kullanayım, yeni fikirler doğabilir"
Nerede: Rutin
Sonuç: Kullanımda deneniyor; karar yok.

### P-95 · 5 Kasım 2026 · Behnan
Ne dedi: "Ölçüm kartıyla ilgili, sayarak olanların altında çıkan "Son ölçümler" bilgilerini kaldıralım. En çok sorunu, değer girmede yaşıyorum, klavye açılıyor, onu kapatmak için dışarıda bir yere basayım derken yanlışlıkla ölçüm girebiliyorum. Diğer yandan, bizim Yaşam tarzındaki alanlarımız ile bu ölçümlerin aslında ilişkisi var, orada verdiğim puan genel ama … uyguladığım yeni bir faaliyet ile ölçümleri karşılaştırırken, o alanlarda vereceğim puanları da hesaba katmam gerekebilir. Örneğin beslenmem kötü ise veya çok iyi ise … bu durum sonucu etkileyecektir." Seçimler: alan puanı bir ölçüm olsun; haftada bir, Pazar.
Nerede: Ölçümlerim, Yaşam Tarzım → alan
Sonuç: → kararlar.md (Ölçüm girişi kolaylaştı; yaşam alanlarının puanı ölçüm oldu)

### P-96 · 5 Kasım 2026 · Behnan
Ne dedi: "Ölçümlere yaşam alanlarını bağlamamız pek doğru olmadı." Seçimler: tamamen geri al; nedenler: ölçümler kalabalıklaştı, alan puanı ölçüm değil.
Nerede: Ölçümlerim, Yaşam Tarzım
Sonuç: → kararlar.md (Yaşam alanlarının puanı ölçüm değil; P-95'in o kısmı geri alındı)

### P-97 · 5 Kasım 2026 · Behnan
Ne dedi: "Yaşam alanlarını ayırmamın nedenini açıklayayım. Bu alanları kullanıcı kendisi de belirliyor, hatta bendeki standart haliyle de bazı alanların ölçümde görünmesi aykırı duruyor. Örneğin, uyku, beslenme, hareket ölçümlerle uyumlu görünse de, her zaman uyumlu olmayabilir. Ben ölçümlere istersem Uyku Kalitesi diye yine dereceli bir ölçüm koyabilirim ve başladığım bir müdahale etkinliği ile ilişkisine odaklanabilirim. Kaldı ki, yaşam alanları ölçümlerinin, örneğin sosyal bağlarla veya anlamla uykunun olası etkileşimini analiz etmek çok zor ve yanıltıcı olabilir. Yaşam alanlarını tanımladık ama henüz etkin kullanamadık, kişinin kendini değerlendirmesi ve eksiklerini tamamlaması için başlatıldı ama en azından ben testlerde kullanamadım."
Nerede: Yaşam Tarzım → alanlar
Sonuç: P-96'nın gerekçesi. Yaşam alanlarının kullanımı (öz değerlendirme ve eksikleri tamamlama) ayrıca konuşulacak; açık konu.

### P-98 · 5 Kasım 2026 · Behnan
Ne dedi: "Evet, pusula doğru tanım oldu. Ölçümlerimi ajanda da gösterdiğimizde ve düzenlediğimizde "Ajanda da gösterme seçeneği" var, ayrıca Sil seçeneği de, burada ölçüm için sil seçeneği olmasın, sadece girişden ulaşıldığında silinebilsin."
Nerede: Ajanda → Ölçümlerim kartı → ⋯
Sonuç: → kararlar.md (Ölçümlerim ajandadan açıldığında Sil yok)

### P-99 · 5 Kasım 2026 · Behnan
Ne dedi: "Ölçümlerde Düzenle dediğimizde fazladan Yukarı Aşağı ve Kaldır yapılabiliyor, bir de açıklama, liste vb alanlar eklenebiliyor. Eğer, ölçümün başlığına uzun basılarak çıkan formda bunları yapabiliriz ve Düzenle modunda yukarıdaki ... menüsünü de direk ölçüm kartının yukarısına koyabiliriz. Bir de Puan için (1-5) gelen daireler fazla büyük, biraz küçültebiliriz."
Nerede: Ölçümlerim
Sonuç: → kararlar.md (Ölçümlerim'de Düzenle kalktı; puan daireleri küçüldü)

### P-100 · 5 Kasım 2026 · Behnan
Ne dedi: "Daire boyutu iyi ancak araları açılabilir. Yine "Sayarak"da da fontu biraz küçültebiliriz."
Nerede: Ölçümlerim (Puan, Sayarak)
Sonuç: → kararlar.md (Puan dairelerinin arası açıldı; Sayarak'ın sayısı küçüldü)

### P-101 · 6 Kasım 2026 · Behnan
Ne dedi: "Listelere dönelim, liste maddelerinin, özellikle kart tipi ise sıralanmasını sürükleyerek sağlayabilir miyiz."
Nerede: Rutin (kartlardan oluşan liste)
Sonuç: → kararlar.md (Rutinin adımları sürükleyerek sıralanır)

### P-102 · 6 Kasım 2026 · Behnan
Ne dedi: "Anımsatıcıyı alarm verdiğinde, (sanırım) rites kapalı iken, gelen menüde kapatmama rağmen, ritesı açtığımda anımsatıcı çalıyor görünüyor ve Durdur diye görünüyor, oysa kapatmıştım"
Nerede: Giriş → Anımsatıcılar (alarm)
Sonuç: Hata. → kararlar.md (Telefonda durdurulan alarm Rites'ta "Şimdi çalıyor" kalmaz)

### P-103 · 6 Kasım 2026 · Behnan
Ne dedi: "Bir şey sorayım, listelerde kart tipi (rutin) daha güzel oldu, hem sürüklenip hem detayına girip değişiklik yapılıyor. Tabi içine girince kartın tüm olanaklarının olması doğru olmayabilir, ama sanki sakıncası da yok."
Nerede: Rutin → adımın kartı
Sonuç: Soru; adımın ⋯ menüsünün sadeleştirilmesi önerildi.

### P-104 · 6 Kasım 2026 · Behnan
Ne dedi: "Şimdilik adım kartının menüsünü sadeleştirelim. Burada rastladığım bir sorun, listenin adımları girişde ajandanın Sıradaki işi oluyor, oysa ben sadece liste yaptım her zaman adım değil. Ancak zaten sıradaki iş widgeti en azından benim kullanım şeklimde çok yararlı değil, o yüzden liste maddelerinin kart olmasında sakınca yok, yapısal olarak sence de yoksa hemen tüm liste adımları kısa kart şeklinde olsun" Seçimler: Bugün sırada tamamen kalksın; kart listeleri adım kartı olsun, eskiler de çevrilsin.
Nerede: Rutin, Giriş
Sonuç: → kararlar.md (adım menüsü sade; Bugün sırada kalktı); bütün listelerin çevrilmesi için yapısal plan onaya sunuldu.

### P-105 · 6 Kasım 2026 · Behnan
Ne dedi: "Eski listeleri çevirmeyelim, ben o listeleri tamamen silip yeniden kurarım. Rutin diyoruz ama aslında listenin 3 şekli kalacak, + Ekle ile yine sorsun."
Nerede: Kart → + Ekle → Liste
Sonuç: → kararlar.md (listenin üç çeşidi, maddeleri kart; eskiler çevrilmez).

### P-106 · 6 Kasım 2026 · Behnan
Ne dedi: "Bir deneyim. Bu arada, Hızlı not ile not ekleyebiliyoruz ama Notlar ekranından not eklemeyi hiç yapmamışız"
Nerede: Giriş → Notlar
Sonuç: → kararlar.md (Notlar'ın üstünde yazma kutusu).

### P-107 · 7 Kasım 2026 · Behnan
Ne dedi: "Anımsatıcı bildirim yolladığında, sanırım eskiden kalma, yani bildirimin durdur veya ertele menüsü olduğu zamandan kalma bir şekilde, giriş ekranında Durdur Ertele yazıyor, sanırım hiç gerek yok ona"
Nerede: Giriş → Anımsatıcılar kutusu
Sonuç: → kararlar.md (Şimdi çalıyor yalnız alarmda).

### P-108 · 7 Kasım 2026 · Behnan
Ne dedi: "Hemen düzeltme, ama ajanda kartlarında Kur ekranı Listeleri görmüyor. Hemen yapma dedim çünkü bu kur ile ayarlama, bazı alanları değiştirmeye kilitleme, sıralama gibi konuları yeniden ele almamız lazım, kur'u kaldırmak için bir miktar çalışma yapmıştık ama henüz bitiremedik."
Nerede: Kart → ⋯ → Kur
Sonuç: Bekliyor; Kur'un geleceği (ayarlar, kilitler, sıralama) birlikte ele alınacak. → kararlar.md (not).

### P-109 · 7 Kasım 2026 · Behnan
Ne dedi: "Tamam, düşündüğüm şu; Rites'ın uzman kullanıcıları olacağını söylemiştik, bu kişiler diyetisyen, sınav koçu, fitness hocası gibi kişiler olacak, kartları profesyonel olarak tasarlayıp kullananlar onlar olacak. Örneğin başlık ve zaman kilitleri onlar için gerekli, sıralama ve istenen bileşenleri tasarlayıp koyma da onların işi. Burada ilk sorgulamamız gereken, normal kullanıcıların ne kadar esnekliğe ihtitacı olduğu. Bir sonraki adımda, örneğin diyetisyenler için, aynı supabase üzerinde bir web uygulaması kurmayı, orada istediğimiz esnekliği vererek kartları, paket programları oluşturmasını konuşabiliriz" Seçimler: Kur gizli dursun; kilitler yalnız uzmanda; Uzman görünümü web gelene kadar kalsın; önce telefondaki sadeleşme.
Nerede: Kart → ⋯ → Kur; uzman
Sonuç: → kararlar.md (Normal kullanıcının esnekliği ve uzmanın yeri).

### P-110 · 7 Kasım 2026 · Behnan
Ne dedi: "ok, normal kullanıcı gözüyle biraz bakayım. Bu arada Listeler konusunda kafam biraz karışık. Girişde listelerimiz var, bir de alışkanlıklar. Ajanda da liste elemanımız, kartın içinde ama kendiside kartlardan oluşuyor. … Ajandada bir sabah rutinim vardı, 8-10 maddeden oluşan bir liste içeriyordu, ancak bazı maddelere videoda koyabileceğimiz gibi ihtiyaçlarla listemizi kart içerecek şekilde düzenledik. Ayrıca sabah rutinini bir alışkanlık haline getirdim, istersem ajanda da göstermeyebiliyorum. Güzel ama bir yandan da, rutin tam olarak bir alışkanlık mı, yoksa içinde alışkanlık mı içerebiliyor bu net değil. Diğer yandan ajanda da tuttuğum günlük kullandığım takviyeleri içeren listeyi, asıl giriş ekranında ki listelerde tutayım dedim, ama listelerde ajanda da göster seçeneği yok. Onu da Alışkanlıklarda oluşturup, istediğimde ajanda da göstermem gerekir ama ona alışkanlık demek istemedim, çünkü alışkanlıklarda yaptığım gün sayısını takip ediyor ama hem takviyeler, hem sabah rutini için kartın tamamını yapmayabilirim veya hespsini yaptım desem bile, alışkanlık değil bu. Burada durayım, rutin, liste, alışkanlık karıştı biraz" Seçimler: takviyeler Giriş Listeleri'nde (ajandada göster); "Sabah rutini iyi bir örnek değil"; rutinin maddesi alışkanlık olabilsin; tek liste kavramı; rutin de maddeler de alışkanlık olabilsin; eski listeler kendiliğinden çevrilsin; maddeye gün verme kalsın; iki adımda.
Nerede: Giriş → Listeler, Alışkanlıklar, Ajanda
Sonuç: → kararlar.md (Liste, rutin, alışkanlık). 1. adım yapıldı; maddenin alışkanlığı 2. adım.

### P-111 · 7 Kasım 2026 · Behnan
Ne dedi: "ok devam edelim"
Nerede: P-110 2. adım
Sonuç: → kararlar.md (listenin maddesi alışkanlık olarak izlenir).

### P-112 · 8 Kasım 2026 · Behnan
Ne dedi: "Kartlarda başlıktan önce yaptım check markı var, örneğin bilgi listesinin bir kartında yaptım olmayacak, burada asıl istediğim, yaptım ın yanında olunca başlık text'inin değiştirilmesi (ya da yazılması) diğer text girişlerinden farklı oluyor, acaba başlık ayrı bir text alanı gibi giriliyor olsa daha hoş olmaz mı" Seçim: dokununca çerçeveli alan.
Nerede: Kart → başlık
Sonuç: → kararlar.md.
