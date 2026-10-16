// Bu telefonda alarm seçeneği gösterilsin mi (iOS 26 ve kendi derleme)?
// İzin sorulmamış ya da verilmemiş olsa da seçenek görünür; izin seçilince istenir.

import { useEffect, useState } from 'react';

import { alarmIzni, alarmIzniIste } from '@/veri/alarmlar';

import { useKisaMesaj } from './KisaMesaj';

export const ALARM_IZNI_YOK =
  "Alarm izni kapalı. Ayarlar → Rites'tan açabilirsin; o zamana kadar bildirim olarak gelir.";

export function useAlarmDestegi() {
  const kisaMesaj = useKisaMesaj();
  const [destek, setDestek] = useState(false);
  useEffect(() => {
    let iptal = false;
    void alarmIzni().then((d) => {
      if (!iptal) setDestek(d !== 'desteklenmiyor');
    });
    return () => {
      iptal = true;
    };
  }, []);
  /** Alarm seçilince izni ister; verilmediyse kısa mesajla söyler. */
  const izinIste = async () => {
    if ((await alarmIzniIste()) === 'yok') kisaMesaj(ALARM_IZNI_YOK);
  };
  return { destek, izinIste };
}
