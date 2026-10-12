# Rites

Expo (SDK 57) + TypeScript + expo-router. Şartname: `Desktop\rites-paket`.

## Klasörler

| Klasör | Ne var |
|---|---|
| `app/` | Ekranlar (expo-router). `(sekmeler)/` dört sekme; her sekmenin kendi yığını var. |
| `bilesen/` | Ortak arayüz: tema sabitleri, yazı, düğme, alttan sayfa, üst çubuk, alt menü… |
| `mantik/` | Saf mantık (arayüzden bağımsız, testli). |
| `veri/` | Yerel veritabanı: göçler, **tek yazma kapısı** (`kapi.ts`), değişiklik yayını (`yayin.ts`), kancalar. |

Kural: veritabanına yazan her şey `veri/kapi.ts` üzerinden geçer. Ekranlar `useSorgu` / `useAyar` ile okur ve veri değişince kendiliğinden tazelenir.

## Komutlar

```
npm install          # ilk kez ve paketler değişince
npx expo start       # geliştirme sunucusu; iPhone'da Expo Go ile QR kodu okut
npm run denetim      # tip denetimi + lint + testler
```
