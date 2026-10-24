// Sarı not sayfası (N-3): düzenle, "Giriş'e iğnele" (pilot 21 Ekim), "Karta çevir", "Notu sil".
// P-35 (24 Ekim): "Bugünün ajandasına al" yerine "Karta çevir": kart formu dolu açılır
// (ilk satır başlık; uzun metin talimat, ses kaydı dosya bloğu), zamanı seçilir;
// kart kaydedilince not silinir.

import { useCallback, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { notKartTaslagi } from '@/mantik/karakter';
import { AY_ADLARI } from '@/mantik/tarih';
import { sesliNotuPaylas } from '@/veri/dosyalar';
import { notIgnele, notMetniniDegistir, notSil, type Not } from '@/veri/notlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { useKartFormu, type KartTaslagi } from '../kart/KartFormu';
import { useKisaMesaj } from '../KisaMesaj';
import { boyut, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { SesOynatici } from './SesOynatici';

/** "21 Ekim 11.22" */
function dosyaZamani(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const s = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${AY_ADLARI[d.getMonth()]} ${s(d.getHours())}.${s(d.getMinutes())}`;
}

function NotSayfasi({
  not,
  gorunur,
  onKapat,
  onKartaCevir,
}: {
  not: Not;
  gorunur: boolean;
  onKapat: () => void;
  onKartaCevir: (taslak: KartTaslagi) => void;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [metin, setMetin] = useState(not.metin);
  const [silmeSorusu, setSilmeSorusu] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);

  const degisti = metin.trim() !== not.metin;

  const calistir = async (is: () => Promise<void>) => {
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      await is();
    } catch (e) {
      console.error('Not işlemi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  const kaydet = () =>
    calistir(async () => {
      await notMetniniDegistir(kapi, not.id, metin);
      onKapat();
    });

  const karta = () => {
    onKapat();
    onKartaCevir(notKartTaslagi({ ...not, metin: metin.trim() || not.metin }));
  };

  const sil = () =>
    calistir(async () => {
      setSilmeSorusu(false);
      await notSil(kapi, not.id);
      kisaMesaj('Not silindi');
      onKapat();
    });

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Not"
      solVazgec
      sagEylem={{ etiket: 'Kaydet', onPress: () => void kaydet(), pasif: !degisti || metin.trim() === '' }}
      degisti={degisti}
      zemin={renk.notSayfaZemin}
      onay={
        silmeSorusu
          ? {
              baslik: 'Not silinsin mi?',
              aciklama: 'Bu işlem geri alınamaz.',
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void sil() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilmeSorusu(false) },
              ],
            }
          : null
      }
    >
      {not.sesli && not.sesYolu && (
        <>
          <SesOynatici uri={not.sesYolu} />
          <Dugme
            tur="ikincil"
            yaziRengi={renk.ana}
            etiket="Ses kaydını paylaş ya da kaydet"
            onPress={() =>
              void sesliNotuPaylas(not.sesYolu!, `${metin.trim() || 'Sesli not'} ${dosyaZamani(not.olusturma)}`).catch(
                (e: unknown) => {
                  console.warn(e);
                  kisaMesaj('Paylaşılamadı.');
                },
              )
            }
          />
        </>
      )}
      <TextInput
        accessibilityLabel="Not metni"
        value={metin}
        onChangeText={setMetin}
        multiline
        selectionColor={renk.ana}
        style={[stiller.metin, yazi('normal')]}
      />
      <Dugme
        tur="ikincil"
        yaziRengi={renk.ana}
        etiket={not.igneli ? "Giriş'ten kaldır" : "Giriş'e iğnele"}
        pasif={calisiyor}
        onPress={() =>
          void calistir(async () => {
            await notIgnele(kapi, not.id, !not.igneli);
            kisaMesaj(not.igneli ? "Giriş'ten kaldırıldı" : "Giriş'e iğnelendi");
            onKapat();
          })
        }
      />
      <Dugme etiket="Karta çevir" onPress={karta} pasif={calisiyor} />
      <Yazi tur="ikincil">
        Not, ajandanda bir kart olur; günü, saati ve tekrarı sen seçersin. Kart kaydedilince not silinir.
      </Yazi>
      <Dugme tur="tehlike" etiket="Notu sil" onPress={() => setSilmeSorusu(true)} />
    </AltSayfa>
  );
}

/** `const notSayfasi = useNotSayfasi(); notSayfasi.ac(not); {notSayfasi.oge}` */
export function useNotSayfasi() {
  const [durum, setDurum] = useState<{ no: number; not: Not; acik: boolean } | null>(null);
  const bugunGun = useBugun();
  const kartFormu = useKartFormu();
  const ac = useCallback((not: Not) => setDurum((d) => ({ no: (d?.no ?? 0) + 1, not, acik: true })), []);
  const oge = (
    <>
      {durum && (
        <NotSayfasi
          key={durum.no}
          not={durum.not}
          gorunur={durum.acik}
          onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))}
          onKartaCevir={(taslak) => kartFormu.ac({ tur: 'yeni', gun: bugunGun, taslak })}
        />
      )}
      {kartFormu.oge}
    </>
  );
  return { ac, oge };
}

const stiller = StyleSheet.create({
  metin: {
    minHeight: 120,
    backgroundColor: renk.notZemin,
    borderWidth: 2,
    borderColor: renk.notCizgi,
    borderRadius: 14,
    padding: 14,
    fontSize: boyut.govde + 1,
    color: renk.yazi,
    textAlignVertical: 'top',
  },
});
