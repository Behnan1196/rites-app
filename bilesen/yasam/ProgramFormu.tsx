// Yeni program ve programın bilgileri (alttan sayfa): ad, alanlar (çoklu; kişi
// kendi alanını da ekler), kısa açıklama ya da neden, süre. Kartlar program
// ekranında eklenir.

import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { type AlanAnahtari } from '@/mantik/alanlar';
import { KENDIM, programFormuHatasi, SURELER, type Program } from '@/mantik/program';
import { yeniKimlik } from '@/veri/kimlik';
import { programBilgisiYaz, programKur } from '@/veri/programlar';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';

export type ProgramFormuHedefi = { tur: 'yeni'; alan?: AlanAnahtari } | { tur: 'duzenle'; program: Program };

interface Ozellikler {
  hedef: ProgramFormuHedefi;
  gorunur: boolean;
  onKapat: () => void;
  /** Yeni program kurulunca kimliğiyle. */
  onKuruldu?: (id: string) => void;
}

function ProgramFormu({ hedef, gorunur, onKapat, onKuruldu }: Ozellikler) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const eski = hedef.tur === 'duzenle' ? hedef.program : null;
  const [ilk] = useState(() => ({
    ad: eski?.ad ?? '',
    alanlar: eski ? [...eski.alanlar] : hedef.tur === 'yeni' && hedef.alan ? [hedef.alan] : [],
    neden: eski?.neden ?? '',
    sure: eski ? eski.sure : 21,
  }));
  const [form, setForm] = useState(ilk);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const degisti = JSON.stringify(form) !== JSON.stringify(ilk);

  const kaydet = async () => {
    const h = programFormuHatasi(form.ad);
    if (h) {
      setHata(h);
      return;
    }
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      if (eski) {
        await programBilgisiYaz(kapi, eski.id, form);
        onKapat();
      } else {
        const id = yeniKimlik();
        await programKur(kapi, {
          id,
          ad: form.ad.trim(),
          alanlar: form.alanlar,
          neden: form.neden.trim(),
          sure: form.sure,
          durum: 'hazir',
          baslangic: null,
          yildiz: 0,
          degerlendirme: '',
          kaynak: KENDIM,
          olusturma: new Date().toISOString(),
        });
        onKapat();
        onKuruldu?.(id);
      }
    } catch (e) {
      console.error('Program kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik={eski ? 'Programı düzenle' : 'Yeni program'}
      solVazgec
      degisti={degisti}
      altAlan={<Dugme etiket={eski ? 'Kaydet' : 'Programı oluştur'} onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <GirisAlani
        etiket="Programın adı"
        value={form.ad}
        onChangeText={(ad) => {
          setForm((f) => ({ ...f, ad }));
          if (hata) setHata(null);
        }}
        placeholder="Örneğin: Evde direnç egzersizi"
        hata={hata}
        returnKeyType="done"
        autoFocus={!eski}
      />

      {/* P-133: yaşam alanları kalktı; programın alanı sorulmaz. */}

      <GirisAlani
        etiket="Neden? (isteğe bağlı)"
        value={form.neden}
        onChangeText={(neden) => setForm((f) => ({ ...f, neden }))}
        placeholder="Örneğin: Kas kaybını önlemek, daha güçlü hissetmek"
        multiline
        textAlignVertical="top"
        scrollEnabled={false}
      />

      <Bolum>
        <Yazi kalinlik="kalin">Ne kadar sürecek?</Yazi>
        <View style={stiller.cipler}>
          {SURELER.map((s) => (
            <SecenekHapi
              key={s.etiket}
              etiket={s.etiket}
              secili={form.sure === s.gun}
              onPress={() => setForm((f) => ({ ...f, sure: s.gun }))}
            />
          ))}
        </View>
        <Yazi tur="ikincil">
          {form.sure === null
            ? 'Süresiz program alışkanlık gibidir: sen bitirene kadar sürer.'
            : 'Başlattığın günden itibaren sayılır; tekrarlanan kartlar son günde durur.'}
        </Yazi>
      </Bolum>
    </AltSayfa>
  );
}

/** `const form = useProgramFormu(onKuruldu); form.ac(hedef); {form.oge}` */
export function useProgramFormu(onKuruldu?: (id: string) => void) {
  const [durum, setDurum] = useState<{ no: number; acik: boolean; hedef: ProgramFormuHedefi } | null>(null);
  const ac = useCallback(
    (hedef: ProgramFormuHedefi) => setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true, hedef })),
    [],
  );
  const oge = durum ? (
    <ProgramFormu
      key={durum.no}
      hedef={durum.hedef}
      gorunur={durum.acik}
      onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))}
      onKuruldu={onKuruldu}
    />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yeniAlan: { gap: 8 },
  satir: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
