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
