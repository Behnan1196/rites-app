# Supabase kurulumu (9. görev)

Bir kez yapılır; hepsi bitmeden e-postayla giriş çalışmaz. Supabase artık e-posta
şablonlarının değiştirilmesi için kendi gönderim servisini (SMTP) istiyor; bu yüzden önce SMTP.

## 0. E-posta gönderimi (SMTP) — Gmail ile

1. Google hesabında **2 Adımlı Doğrulama** açık olmalı.
2. https://myaccount.google.com/apppasswords → uygulama adı `Supabase Rites` → **Oluştur**.
   Çıkan 16 harfli uygulama şifresini bir yere not et (kimseyle paylaşma).
3. Supabase → **Authentication → Emails → SMTP Settings** → **Enable custom SMTP**:
   - Sender email: `behnan.ozturkmen@gmail.com`
   - Sender name: `Rites`
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `behnan.ozturkmen@gmail.com`
   - Password: 2. adımdaki uygulama şifresi (boşluksuz)
   - **Save**
4. Supabase → **Authentication → Rate Limits** → e-posta sınırı saatte 30 civarı olmalı (varsayılan).

Kendi SMTP'yle e-postalar herkese gider; ekip üyesi olma şartı kalkar.
Gmail'in günlük gönderim sınırı (yaklaşık 500) deneme ve küçük kullanım için yeterli.
Gerçek yayından önce Rites'a ait bir alan adı ve gönderim servisi (ör. Brevo, Resend) düşünülmeli.

## 1. Şema

Supabase → **SQL Editor** → **New query** → `sunucu/sema.sql` dosyasının tamamını yapıştır → **Run**.
"Success. No rows returned" görmelisin. Dosyayı yeniden çalıştırmak güvenlidir.

## 2. E-posta şablonları (kod gönderilsin, bağlantı değil)

Supabase → **Authentication** → **Emails** → **Templates**.

**Confirm signup** ve **Magic Link** şablonlarının ikisine de aynısını koy:

- Konu: `Rites giriş kodun`
- İçerik:

```html
<h2>Rites giriş kodun</h2>
<p>Kodun: <strong style="font-size: 24px">{{ .Token }}</strong></p>
<p>Bu kodu Rites'ta açık olan "E-postanla devam et" sayfasına yaz.</p>
<p>Kodu sen istemediysen bu e-postayı yok sayabilirsin.</p>
```

**Invite user** şablonu:

- Konu: `Rites'a davet edildin`
- İçerik:

```html
<h2>Rites'a davet edildin</h2>
<p>{{ .Data.davet_eden_ad }} seni Rites'ta kişilerine eklemek istiyor.</p>
<p>Rites'ı açıp "E-postanla devam et" ile bu e-posta adresinle girdiğinde bağlanırsınız.</p>
```

## 3. Davet işlevi (Edge Function)

Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.

- Ad: `davet-gonder`
- `sunucu/davet-gonder/index.ts` dosyasının içeriğini yapıştır → **Deploy**.
- "Verify JWT" açık kalsın (varsayılan).

## 4. Uygulamanın ayarı

Proje klasöründe `.env.local` dosyası (depoya girmez):

```
EXPO_PUBLIC_SUPABASE_URL=https://vglxjkouvpghftmdzqcs.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Değiştirdikten sonra `npx expo start -c` ile yeniden başlat.

## Denetim

`npm run sunucu-denemesi` şemayı yerelde gerçek bir Postgres (PGlite) üzerinde, Supabase'e benzer bir ortamda dener:
yetki kuralları, davetin isteğe dönmesi, 5 kişi sınırı, Hesabımı sil.
