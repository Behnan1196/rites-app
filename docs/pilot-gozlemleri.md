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
