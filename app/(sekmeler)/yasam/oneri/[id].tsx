// Rites önerisi (içerik kataloğundan; pilot 20 Ekim): program ya da kart.
// Program: "Programlarıma ekle" (kopyası kişinin programı olur; öneri Kütüphanem'de
// artık görünmez). Kart: "Bugün Ajandama ekle", "Programa ekle". İkisinde de
// "Önerilerden gizle" / "Yeniden göster". Eski tür etiketi (Egzersiz, Bilgi…) yok (P-79).
// P-82 (1 Kasım): öneri önce sıradan kart olarak ajandaya girer ("Ajandama ekle"; alışkanlık ya da
// program sonra, kartın ⋯ menüsünden); eklenince kart açılır, süresi ve günleri orada ayarlanır.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { KartIcerigiGorunumu } from '@/bilesen/kutuphane/KartIcerigi';
import { Bolum } from '@/bilesen/Secim';
import { renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi } from '@/bilesen/yasam/parcalar';
import { ProgramSecSayfasi } from '@/bilesen/yasam/ProgramSayfalari';
import { tekrarMetni } from '@/mantik/gorunurluk';
import { kutuphanedenKart } from '@/mantik/kutuphane';
import {
  alanlarMetni,
  kartZamanMetni,
  onerdenProgram,
  oneriAnahtari,
  oneriBul,
  oneriKartBul,
  oneriKartIcerigi,
  sureMetni,
} from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { gizliOneriler, oneriGizle } from '@/veri/katalog';
import { yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { programKartiEkle, programKur } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function OneriEkrani() {
  const { id, tur } = useLocalSearchParams<{ id: string; tur?: string }>();
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [calisiyor, setCalisiyor] = useState(false);
  const [programSec, setProgramSec] = useState(0);
  const gizli = useSorgu(['ayar', 'kutuphane'], (o) => gizliOneriler(o), []);
  const kartMi = tur === 'kart';
  const program = kartMi ? undefined : oneriBul(id ?? '');
  const kart = kartMi ? oneriKartBul(id ?? '') : undefined;
  const anahtar = oneriAnahtari(kartMi ? 'kart' : 'program', id ?? '');
  const gizlendi = gizli.veri?.has(anahtar) ?? false;

  const calistir = async (is: () => Promise<void>) => {
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      await is();
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  const gizleGoster = () =>
    calistir(async () => {
      await oneriGizle(kapi, anahtar, !gizlendi);
      kisaMesaj(gizlendi ? 'Öneri yeniden görünür' : 'Öneri gizlendi');
      if (!gizlendi) router.back();
    });

  if (!program && !kart) {
    return (
      <EkranKabi geri="Geri">
        <Yazi tur="ikincil">Bu öneri artık yok.</Yazi>
      </EkranKabi>
    );
  }

  const alanlar = (program ?? kart)!.alanlar;
  const gizleDugmesi = (
    <Dugme
      tur="yazi"
      etiket={gizlendi ? 'Önerilerde yeniden göster' : 'Önerilerden gizle'}
      onPress={() => void gizleGoster()}
    />
  );

  return (
    <EkranKabi geri="Geri">
      <View style={stiller.ust}>
        <AlanSimgesi alan={alanlar[0] ?? ''} buyuk />
        <View style={stiller.esnek}>
          <Yazi tur="ekranBasligi" accessibilityRole="header">
            {program ? program.ad : kart!.baslik}
          </Yazi>
          <Yazi tur="ikincil">
            {[
              program ? 'Rites programı' : 'Rites önerisi',
              alanlarMetni(alanlar),
              program ? sureMetni(program.sure) : kart!.tekrar ? tekrarMetni(kart!.tekrar) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Yazi>
        </View>
      </View>

      {program && (
        <>
          {!!program.aciklama && <Yazi>{program.aciklama}</Yazi>}
          <Bolum>
            <Yazi kalinlik="kalin">{`Kartlar (${program.kartlar.length})`}</Yazi>
            {program.kartlar.map((k, i) => (
              <View key={i} style={stiller.kart}>
                <Yazi kalinlik="yariKalin">{k.baslik}</Yazi>
                <Yazi tur="ikincil">{kartZamanMetni(k)}</Yazi>
              </View>
            ))}
          </Bolum>
          <Dugme
            etiket="Programlarıma ekle"
            pasif={calisiyor}
            onPress={() =>
              void calistir(async () => {
                const { program: p, kartlar } = onerdenProgram(program, yeniKimlik);
                await programKur(kapi, p, kartlar);
                await oneriGizle(kapi, anahtar, true);
                kisaMesaj('Programlarına eklendi');
                router.replace({ pathname: '/yasam/program/[id]', params: { id: p.id } });
              })
            }
          />
          <Yazi tur="ikincil">Eklediğin kopya senindir: kart ekler, çıkarır, süresini değiştirir, başlatırsın.</Yazi>
        </>
      )}

      {kart && (
        <>
          <KartIcerigiGorunumu c={{ ...kart, hatirlatma: kart.hatirlatma ?? null }} />
          <Dugme
            etiket="Ajandama ekle"
            pasif={calisiyor}
            onPress={() =>
              void calistir(async () => {
                const a = kutuphanedenKart({ ...kart, hatirlatma: kart.hatirlatma ?? null }, bugunGun, yeniKimlik);
                await yeniKartKaydet(kapi, a.kart, a.bloklar, yeniKimlik);
                kisaMesaj(`Ajandana eklendi: ${kart.baslik}`);
                // Kart açılır: süresi, günleri, saati orada ayarlanır.
                router.push({ pathname: '/kart/[id]', params: { id: a.kart.id, gun: bugunGun, geri: 'Öneri' } });
              })
            }
          />
          <Dugme
            tur="ikincil"
            yaziRengi={renk.ana}
            etiket="Programa ekle"
            onPress={() => setProgramSec((n) => n + 1)}
          />
          <Yazi tur="ikincil">
            {kart.tekrar
              ? 'Bugünden başlar, süresiz. Eklediğin kart senindir: süresini, günlerini kartta değiştirirsin; istersen ⋯ menüsünden alışkanlık olarak izlersin.'
              : 'Eklediğin kart senindir; istediğin gibi değiştirirsin.'}
          </Yazi>
        </>
      )}

      {gizleDugmesi}

      {kart && programSec > 0 && (
        <ProgramSecSayfasi
          key={programSec}
          baslik={kart.baslik}
          gorunur
          onKapat={() => setProgramSec(0)}
          onSec={(programId) => {
            setProgramSec(0);
            void calistir(async () => {
              const { sira: _s, ...icerik } = oneriKartIcerigi(kart);
              await programKartiEkle(kapi, programId, icerik, bugunGun, yeniKimlik);
              kisaMesaj(`Programa eklendi: ${kart.baslik}`);
            });
          }}
        />
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  esnek: { flex: 1 },
  kart: { gap: 2, paddingVertical: 4 },
});
