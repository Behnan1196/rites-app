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
