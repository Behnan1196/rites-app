import {
  aciklamaVarMi,
  BOS_ACIKLAMA,
  htmlMaddeleri,
  htmldenDuz,
  htmlMi,
  maddelerdenHtml,
  metinDoluMu,
  metniHtml,
} from '../zenginMetin';

describe('biçimli metin (P-50)', () => {
  it('düz metin HTML değildir; editöre paragraf olarak gider', () => {
    expect(htmlMi('Merhaba')).toBe(false);
    expect(metniHtml('Bir <iki>\n\nüç')).toBe('<html><p>Bir &lt;iki&gt;</p><br><p>üç</p></html>');
    expect(metniHtml('  ')).toBe('');
    expect(metniHtml('<html><p>x</p></html>')).toBe('<html><p>x</p></html>');
  });

  it('HTML düz metne: paragraflar, madde işaretleri, numaralar, onay kutuları', () => {
    const h =
      '<html><p><b>Isın</b> &amp; esne</p><ul><li>Kollar</li><li>Bacaklar</li></ul><ol><li>Bir</li><li>İki</li></ol><ul data-type="checkbox"><li checked>Su</li><li>Çay</li></ul></html>';
    expect(htmldenDuz(h)).toBe('Isın & esne\n• Kollar\n• Bacaklar\n1. Bir\n2. İki\n☑ Su\n☐ Çay');
    expect(htmldenDuz('düz')).toBe('düz');
  });

  it('liste: maddeler ↔ onay kutulu HTML', () => {
    const h = maddelerdenHtml(['Kahvaltı', 'Öğle <tok>', ' ']);
    expect(h).toBe('<html><ul data-type="checkbox"><li>Kahvaltı</li><li>Öğle &lt;tok&gt;</li></ul></html>');
    expect(htmlMaddeleri(h)).toEqual(['Kahvaltı', 'Öğle <tok>']);
    expect(htmlMaddeleri('<html><p>Ekmek</p><ul data-type="checkbox"><li>Süt</li></ul><br></html>')).toEqual([
      'Ekmek',
      'Süt',
    ]);
    expect(htmlMaddeleri('a\n\nb')).toEqual(['a', 'b']);
    expect(maddelerdenHtml([])).toBe('');
  });

  it('boş paragraflar boş sayılır', () => {
    expect(metinDoluMu('<html><br><p></p></html>')).toBe(false);
    expect(metinDoluMu('<html><p>a</p></html>')).toBe(true);
  });
});

describe('Boş açıklama kartta kalır (P-75)', () => {
  it('işaret: var ama boş', () => {
    expect(aciklamaVarMi(BOS_ACIKLAMA)).toBe(true);
    expect(metinDoluMu(BOS_ACIKLAMA)).toBe(false);
    expect(htmldenDuz(BOS_ACIKLAMA)).toBe('');
    expect(aciklamaVarMi('')).toBe(false);
    expect(aciklamaVarMi('Su iç')).toBe(true);
  });
});
