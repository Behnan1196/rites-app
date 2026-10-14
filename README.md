# Rites

Expo (SDK 57) + TypeScript + expo-router. Başlangıç şartnamesi: `Desktop\rites-paket` (sürüm 0). Güncel ürün belgeleri ve karar günlüğü: `docs/`.

## Klasörler

| Klasör | Ne var |
|---|---|
| `app/` | Ekranlar (expo-router). `(sekmeler)/` dört sekme; her sekmenin kendi yığını var. |
| `bilesen/` | Ortak arayüz: tema sabitleri, yazı, düğme, alttan sayfa, üst çubuk, alt menü… |
| `mantik/` | Saf mantık (arayüzden bağımsız, testli). |
| `veri/` | Yerel veritabanı: göçler, **tek yazma kapısı** (`kapi.ts`), değişiklik yayını (`yayin.ts`), kancalar. |
| `sunucu/` | Supabase istemcisi ve şeması (`KURULUM.md`). |
| `docs/` | Ürün, karar günlüğü, pilot gözlemleri, teknik yapı. |

Kural: veritabanına yazan her şey `veri/kapi.ts` üzerinden geçer. Ekranlar `useSorgu` / `useAyar` ile okur ve veri değişince kendiliğinden tazelenir.

## Komutlar

```
npm install          # ilk kez ve paketler değişince
npx expo start       # geliştirme sunucusu; geliştirme derlemesi (Rites) açılır. Expo Go için: s tuşu
npm run denetim      # tip denetimi + lint + testler
```

## EAS (derleme ve dağıtım)

```
eas build --profile development --platform ios        # geliştirme derlemesi (kendi iPhone'un)
eas build --platform ios --auto-submit                # TestFlight'a derleme
eas update --channel production --environment production --message "…"   # yalnız JS düzeltmesi
```

Ayrıntı: `docs/teknik.md` → Derleme ve dağıtım.
