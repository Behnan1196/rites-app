// Biçimli metin (pilot 26 Ekim, P-50): react-native-enriched-html. `ZenginMetinAlani`
// düzenleme alanı (altında küçük araç çubuğu; P-52: Kalın · İtalik · • Liste · 1. Liste ·
// ☑ Liste); `ZenginMetin` görünüm. Saklama biçimi HTML (`mantik/zenginMetin`); eski
// düz metin de gösterilir. `liste` kipinde (Liste, Proje adımları) araç çubuğu yok,
// her satır onay kutulu bir maddedir.
//
// Yazı tipi: kalın / italik telefonun yazı tipinde güvenle çizilsin diye editörde ve
// görünümde sistem yazı tipi kullanılır (Atkinson'un kalını ayrı bir aile).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  EnrichedText,
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeStateEvent,
} from 'react-native-enriched-html';

import { htmlMi, metinDoluMu, metniHtml } from '@/mantik/zenginMetin';

import { useOdakGoster } from './AltSayfa';
import { boyut, renk } from './tema';
import { Yazi } from './Yazi';

const HTML_STILI = {
  ul: { bulletColor: renk.ana, bulletSize: 7, marginLeft: 4, gapWidth: 10 },
  ol: { markerColor: renk.ana, markerFontWeight: '700' as const, marginLeft: 4, gapWidth: 8 },
  ulCheckbox: { boxColor: renk.ana, boxSize: 20, marginLeft: 2, gapWidth: 10 },
};

/** Görünüm: HTML ise biçimli, değilse düz yazı. Boşsa hiçbir şey. */
export function ZenginMetin({ metin, ikincil = false }: { metin: string | null | undefined; ikincil?: boolean }) {
  if (!metinDoluMu(metin)) return null;
  if (!htmlMi(metin)) return <Yazi tur={ikincil ? 'ikincil' : 'govde'}>{metin}</Yazi>;
  return (
    <EnrichedText
      htmlStyle={HTML_STILI}
      style={{
        fontSize: ikincil ? boyut.ikincil : boyut.govde,
        lineHeight: ikincil ? 22 : 24,
        color: ikincil ? renk.ikincil : renk.yazi,
      }}
    >
      {metin!}
    </EnrichedText>
  );
}

type Durum = Pick<OnChangeStateEvent, 'bold' | 'italic' | 'unorderedList' | 'orderedList' | 'checkboxList'>;

/**
 * Düzenleme alanı. Denetimsiz: ilk değer `deger`dir, sonrası `onDegis(html)` ile gelir
 * (her tuşta yeniden yazılmaz). Boşaltılınca '' gelir.
 */
export function ZenginMetinAlani({
  deger,
  onDegis,
  ipucu,
  etiket,
  liste = false,
  kisa = false,
}: {
  deger: string;
  onDegis: (html: string) => void;
  ipucu: string;
  /** Ekran okuyucu için. */
  etiket: string;
  /** Liste / Proje adımları: araç çubuğu yok, her satır onay kutulu madde. */
  liste?: boolean;
  /** Tek iki satırlık alan (açıklama). */
  kisa?: boolean;
}) {
  const ref = useRef<EnrichedTextInputInstance>(null);
  const [ilk] = useState(() => metniHtml(deger));
  const [durum, setDurum] = useState<Durum | null>(null);
  const [odak, setOdak] = useState(false);
  // Editör açılışta kendi biçimine çevirip onChangeHtml gönderebilir; kişi dokunmadan
  // gelen değişiklik sayılmaz (yoksa form "değişti" sanır).
  const dokunuldu = useRef(false);
  const odakGoster = useOdakGoster();
  const kutu = useRef<View>(null);

  const bicimle = (ad: string) => {
    const r = ref.current;
    if (!r) return;
    if (ad === 'kalin') r.toggleBold();
    else if (ad === 'italik') r.toggleItalic();
    else if (ad === 'madde') r.toggleUnorderedList();
    else if (ad === 'numara') r.toggleOrderedList();
    else if (ad === 'kutu') r.toggleCheckboxList(false);
  };

  const dugmeler: {
    ad: string;
    etiket: string;
    ikon?: React.ComponentProps<typeof Ionicons>['name'];
    yazi?: string;
    acik: boolean;
  }[] = [
    { ad: 'kalin', etiket: 'Kalın', yazi: 'K', acik: !!durum?.bold.isActive },
    {
      ad: 'italik',
      etiket: 'İtalik',
      yazi: 'İ',
      acik: !!durum?.italic.isActive,
    },
    {
      ad: 'madde',
      etiket: 'Madde işaretli liste',
      ikon: 'list',
      acik: !!durum?.unorderedList.isActive,
    },
    {
      ad: 'numara',
      etiket: 'Numaralı liste',
      yazi: '1.',
      acik: !!durum?.orderedList.isActive,
    },
    {
      ad: 'kutu',
      etiket: 'Onay kutulu liste',
      ikon: 'checkbox-outline',
      acik: !!durum?.checkboxList.isActive,
    },
  ];

  const cubuk = !liste && (
    <View style={stiller.cubuk} accessibilityRole="toolbar">
      {dugmeler.map((d) => (
        <Pressable
          key={d.ad}
          onPress={() => bicimle(d.ad)}
          accessibilityRole="button"
          accessibilityLabel={d.etiket}
          accessibilityState={{ selected: d.acik }}
          hitSlop={2}
          style={({ pressed }) => [stiller.dugme, d.acik && stiller.dugmeAcik, pressed && { opacity: 0.6 }]}
        >
          {d.ikon ? (
            <Ionicons name={d.ikon} size={22} color={d.acik ? renk.yuzey : renk.ana} />
          ) : (
            <Yazi
              kalinlik="kalin"
              renk={d.acik ? renk.yuzey : renk.ana}
              style={[stiller.dugmeYazi, d.ad === 'italik' && stiller.italik]}
            >
              {d.yazi}
            </Yazi>
          )}
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={[stiller.kap, odak && stiller.kapOdak]} ref={kutu}>
      <EnrichedTextInput
        ref={ref}
        defaultValue={liste && !ilk ? '<html><ul data-type="checkbox"><li></li></ul></html>' : ilk}
        placeholder={ipucu}
        placeholderTextColor={renk.soluk}
        selectionColor={renk.ana}
        cursorColor={renk.ana}
        htmlStyle={HTML_STILI}
        accessibilityLabel={etiket}
        onFocus={() => {
          dokunuldu.current = true;
          setOdak(true);
          odakGoster(kutu.current);
        }}
        onBlur={() => setOdak(false)}
        onChangeState={(e) => setDurum(e.nativeEvent)}
        // P-52: metin seçince çıkan menüde de Kalın / İtalik.
        contextMenuItems={
          liste
            ? []
            : [
                { text: 'Kalın', onPress: () => bicimle('kalin') },
                { text: 'İtalik', onPress: () => bicimle('italik') },
              ]
        }
        onChangeHtml={(e) => {
          if (dokunuldu.current) onDegis(metinDoluMu(e.nativeEvent.value) ? e.nativeEvent.value : '');
        }}
        style={{
          minHeight: kisa ? 52 : 110,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: boyut.govde + 1,
          // P-57: satırlar biraz açık (yazı boyunun ~1,4 katı; "1,2 satır aralığı").
          lineHeight: Math.round((boyut.govde + 1) * 1.4),
          color: renk.yazi,
        }}
      />
      {/* P-52: araç çubuğu altta: seçince çıkan Kopyala / Yapıştır menüsü üstünü örtmesin. */}
      {cubuk}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: {
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 12,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  kapOdak: { borderColor: renk.ana },
  cubuk: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
  },
  dugme: {
    width: 40,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dugmeAcik: { backgroundColor: renk.ana },
  dugmeYazi: { fontSize: 18 },
  italik: { fontStyle: 'italic' },
});
