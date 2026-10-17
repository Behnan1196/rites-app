// Yerel bildirimler (expo-notifications). Expo Go'da iPhone'da denendi (7. görev başı):
// bildirimdeki Durdur / Ertele düğmeleri çalışıyor; uygulama kapalıyken düğme
// ancak uygulama açılınca işleniyor. Bu yüzden düğmeler uygulamayı açar ve işlem
// orada yapılır (`10` → Expo Go kararları).

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ERTELEME_SECENEKLERI, erteleMetni, type BildirimVerisi, type PlanliBildirim } from '@/mantik/animsatici';

export const DURDUR = 'durdur';
export const ERTELE = 'ertele';
export const BILDIRIME_DOKUNULDU = Notifications.DEFAULT_ACTION_IDENTIFIER;

const desteklenir = Platform.OS !== 'web';

/** Kategori kimliği; ":" ve "-" kullanılmaz. */
const kategori = (erteleDk: number) => `animsatici${erteleDk}`;

let hazir: Promise<void> | null = null;

/** Gösterme kuralı ve düğmeli kategoriler; bir kez kurulur. */
export function bildirimleriKur(): Promise<void> {
  if (!desteklenir) return Promise.resolve();
  if (hazir) return hazir;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // Sırayla: iOS kategori listesini her kayıtta baştan yazar; aynı anda
  // kaydedilirse biri ötekini siler (denemede görüldü).
  hazir = (async () => {
    for (const dk of ERTELEME_SECENEKLERI) {
      await Notifications.setNotificationCategoryAsync(kategori(dk), [
        { identifier: DURDUR, buttonTitle: 'Durdur', options: { opensAppToForeground: true } },
        { identifier: ERTELE, buttonTitle: erteleMetni(dk), options: { opensAppToForeground: true } },
      ]);
    }
  })().catch((e: unknown) => console.error('Bildirim kategorileri kurulamadı', e));
  return hazir;
}

/** İzin; daha önce sorulmadıysa sorar. */
export async function bildirimIzni(sor: boolean): Promise<boolean> {
  if (!desteklenir) return false;
  const mevcut = await Notifications.getPermissionsAsync();
  if (mevcut.granted) return true;
  if (!sor || !mevcut.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function tarihe(gun: string, saat: string): Date {
  const [y, a, g] = gun.split('-').map(Number);
  const [s, d] = saat.split(':').map(Number);
  return new Date(y!, a! - 1, g!, s!, d!, 0, 0);
}

let sira: Promise<void> = Promise.resolve();

/**
 * Planı uygular: eski planlı bildirimlerin hepsi iptal edilir, liste yeniden
 * kurulur (en çok 60). Çağrılar sıraya girer.
 */
export function planiUygula(plan: readonly PlanliBildirim[]): Promise<void> {
  if (!desteklenir) return Promise.resolve();
  sira = sira
    .then(async () => {
      await bildirimleriKur();
      if (!(await bildirimIzni(plan.length > 0))) return;
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const b of plan) {
        await Notifications.scheduleNotificationAsync({
          identifier: b.id,
          content: {
            title: b.baslik,
            body: b.govde,
            sound: b.sesli ? 'default' : false,
            categoryIdentifier: b.erteleDk ? kategori(b.erteleDk) : undefined,
            data: b.veri,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: b.zamanMs !== undefined ? new Date(b.zamanMs) : tarihe(b.gun, b.saat),
          },
        });
      }
    })
    .catch((e: unknown) => console.error('Bildirimler planlanamadı', e));
  return sira;
}

export interface BildirimYaniti {
  anahtar: string;
  eylem: string;
  veri: BildirimVerisi | null;
}

function yanittan(y: Notifications.NotificationResponse): BildirimYaniti {
  const veri = y.notification.request.content.data as unknown as BildirimVerisi | undefined;
  return {
    anahtar: `${y.notification.request.identifier}|${y.actionIdentifier}|${y.notification.date}`,
    eylem: y.actionIdentifier,
    veri: veri && (veri.tur === 'animsatici' || veri.tur === 'kart') ? veri : null,
  };
}

/** Bildirime ya da düğmesine dokunulunca; uygulama kapalıyken gelen yanıt açılışta bir kez verilir. */
export function yanitlariDinle(isle: (y: BildirimYaniti) => void): () => void {
  if (!desteklenir) return () => undefined;
  const islenen = new Set<string>();
  const ver = (y: Notifications.NotificationResponse) => {
    const yanit = yanittan(y);
    if (islenen.has(yanit.anahtar)) return;
    islenen.add(yanit.anahtar);
    isle(yanit);
  };
  const abonelik = Notifications.addNotificationResponseReceivedListener(ver);
  void Notifications.getLastNotificationResponseAsync().then((y) => {
    if (!y) return;
    ver(y);
    void Notifications.clearLastNotificationResponseAsync();
  });
  return () => abonelik.remove();
}
