// Telefonun alarmları (iOS 26 AlarmKit; `react-native-alarm-scheduler` modülü).
//
// Modül yalnız kendi derlemede vardır: Expo Go'da, web'de, eski derlemede ve
// iOS 26'dan eski telefonlarda "yok" sayılır; o zaman alarmlı anımsatıcı da
// bildirimle gelir.
//
// Alarmdaki Durdur ve Ertele Rites'ı açar; basışı modül telefonda kaydeder,
// Rites açılınca (`bekleyenBasislar`) okunup işlenir.

import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type {
  AlarmAction,
  AlarmPermissionResponse,
  AlarmScheduleInput,
  ScheduledAlarm,
} from 'react-native-alarm-scheduler';

import { ALARM_ERTELEME, alarmFarki, alarmImzasi, saatParcalari, type PlanliAlarm } from '@/mantik/alarm';
import { erteleMetni, saatMetni } from '@/mantik/animsatici';
import { bugun } from '@/mantik/tarih';

interface AlarmModulu {
  getPermissionsAsync(): Promise<AlarmPermissionResponse>;
  requestPermissionsAsync(): Promise<AlarmPermissionResponse>;
  scheduleAlarmAsync(alarm: AlarmScheduleInput): Promise<ScheduledAlarm>;
  cancelAlarmAsync(id: string): Promise<boolean>;
  completeNativeAlarmAsync(alarmId: string): Promise<void>;
  getScheduledAlarmsAsync(): Promise<ScheduledAlarm[]>;
  getPendingAlarmActionsAsync(): Promise<AlarmAction[]>;
  clearPendingAlarmActionsAsync(ids?: string[]): Promise<void>;
  clearPendingNativeAlarmHandoffAsync(): Promise<void>;
  addListener(olay: 'onAlarmAction', dinleyici: (a: AlarmAction) => void): { remove(): void };
}

const modul: AlarmModulu | null =
  Platform.OS === 'ios' ? requireOptionalNativeModule<AlarmModulu>('AlarmScheduler') : null;

export type AlarmIzni = 'var' | 'yok' | 'sorulmadi' | 'desteklenmiyor';

function izne(y: AlarmPermissionResponse): AlarmIzni {
  if (y.status === 'authorized') return 'var';
  if (y.status === 'notDetermined') return 'sorulmadi';
  if (y.status === 'denied') return 'yok';
  return 'desteklenmiyor';
}

/** Telefon alarmı destekliyor mu, izin ne durumda? (Sormaz.) */
export async function alarmIzni(): Promise<AlarmIzni> {
  if (!modul) return 'desteklenmiyor';
  try {
    return izne(await modul.getPermissionsAsync());
  } catch (e) {
    console.error('Alarm izni okunamadı', e);
    return 'desteklenmiyor';
  }
}

/** İzin sorulmadıysa sorar. */
export async function alarmIzniIste(): Promise<AlarmIzni> {
  if (!modul) return 'desteklenmiyor';
  const simdi = await alarmIzni();
  if (simdi !== 'sorulmadi') return simdi;
  try {
    return izne(await modul.requestPermissionsAsync());
  } catch (e) {
    console.error('Alarm izni istenemedi', e);
    return 'desteklenmiyor';
  }
}

function tarihe(gun: string, saat: string): Date {
  const [y, a, g] = gun.split('-').map(Number);
  const { hour, minute } = saatParcalari(saat);
  return new Date(y!, a! - 1, g!, hour, minute, 0, 0);
}

function girdi(p: PlanliAlarm): AlarmScheduleInput {
  const { hour, minute } = saatParcalari(p.saat);
  const tekSeferlik = p.haftaGunleri.length === 0 && p.gun !== null;
  return {
    id: p.id,
    hour,
    minute,
    title: p.baslik,
    weekdays: p.haftaGunleri as AlarmScheduleInput['weekdays'],
    // Tek seferlik alarm belirli tarihte çalar (modüle eklenen yamayla, `patches/`).
    ...(tekSeferlik ? { timestamp: tarihe(p.gun!, p.saat).getTime() } : {}),
    ios: {
      alertTitle: p.baslik,
      stopButtonTitle: 'Durdur',
      stopIntentBehavior: 'openApp',
      ...(p.ertelenebilir
        ? { secondaryButtonTitle: erteleMetni(ALARM_ERTELEME), secondaryButtonBehavior: 'openApp' as const }
        : { secondaryButtonBehavior: 'none' as const }),
      metadata:
        p.kaynak.tur === 'animsatici'
          ? { tur: 'animsatici', animsaticiId: p.kaynak.animsaticiId, saat: p.kaynak.saat, gun: p.gun ?? '' }
          : { tur: 'kart', kartId: p.kaynak.kartId, gun: p.kaynak.gun },
    },
  };
}

let sira: Promise<void> = Promise.resolve();

/**
 * Telefondaki alarmları plana eşitler: planda olmayanlar kaldırılır, eksikler
 * eklenir. Plan boşsa (ya da izin yoksa) Rites'ın bütün alarmları kalkar.
 * Çağrılar sıraya girer.
 */
export function alarmPlaniniUygula(plan: readonly PlanliAlarm[], izinVar: boolean): Promise<void> {
  const m = modul;
  if (!m) return Promise.resolve();
  sira = sira
    .then(async () => {
      const telefondakiler = (await m.getScheduledAlarmsAsync()).map((a) => ({
        id: a.id,
        imza: alarmImzasi(
          saatMetni(a.hour * 60 + a.minute),
          a.weekdays ?? [],
          a.title,
          (a.weekdays ?? []).length ? null : bugun(new Date(a.timestamp)),
        ),
      }));
      const { eklenecek, kaldirilacak } = alarmFarki(izinVar ? plan : [], telefondakiler);
      for (const id of kaldirilacak) await m.cancelAlarmAsync(id);
      for (const p of eklenecek) {
        try {
          await m.scheduleAlarmAsync(girdi(p));
        } catch (e) {
          console.error('Alarm kurulamadı', p.baslik, p.saat, e);
        }
      }
    })
    .catch((e: unknown) => console.error('Alarmlar planlanamadı', e));
  return sira;
}

/**
 * Çalan alarmı susturur. Alarmdaki Ertele düğmesi alarmı kendisi susturmuyor
 * (denemede görüldü, 14 Ekim); susturmak için alarm iptal edilir. Kaydı da
 * silinir ki bir sonraki plan uygulamasında (tekrarlıysa) yeniden kurulsun.
 */
export async function alarmiSustur(id: string): Promise<void> {
  if (!modul) return;
  try {
    await modul.completeNativeAlarmAsync(id);
    await modul.cancelAlarmAsync(id);
  } catch (e) {
    console.error('Alarm susturulamadı', e);
  }
}

export interface AlarmBasisi {
  id: string;
  alarmId: string;
  tur: 'durdur' | 'ertele';
  zamanMs: number;
}

function basisa(a: AlarmAction): AlarmBasisi | null {
  if (a.action === 'nativeStop' || a.action === 'dismiss')
    return {
      id: a.id,
      alarmId: a.alarmId,
      tur: 'durdur',
      zamanMs: a.timestamp,
    };
  if (a.action === 'secondaryOpen' || a.action === 'snooze')
    return {
      id: a.id,
      alarmId: a.alarmId,
      tur: 'ertele',
      zamanMs: a.timestamp,
    };
  return null;
}

/** Alarmda basılıp henüz işlenmemiş düğmeler (eskiden yeniye). */
export async function bekleyenBasislar(): Promise<AlarmBasisi[]> {
  if (!modul) return [];
  const liste = await modul.getPendingAlarmActionsAsync();
  return liste
    .map(basisa)
    .filter((b): b is AlarmBasisi => b !== null)
    .sort((x, y) => x.zamanMs - y.zamanMs);
}

/** İşlenen basışlar silinir (işlenemeyenler de; yeniden denenmez). */
export async function basislariTemizle(): Promise<void> {
  if (!modul) return;
  await modul.clearPendingAlarmActionsAsync();
  await modul.clearPendingNativeAlarmHandoffAsync();
}

/** Uygulama açıkken alarmdaki bir düğmeye basılınca. */
export function basislariDinle(dinleyici: () => void): () => void {
  if (!modul) return () => undefined;
  const abonelik = modul.addListener('onAlarmAction', () => dinleyici());
  return () => abonelik.remove();
}
