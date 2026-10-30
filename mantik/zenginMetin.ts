// Biçimli metin (pilot 26 Ekim, P-50): talimat ve açıklama kalın, italik, madde işaretli,
// numaralı ve onay kutulu liste olabilir. Saklama biçimi editörün (react-native-enriched-html)
// HTML'i: `<html><p>…</p><ul><li>…</li></ul><ul data-type="checkbox"><li checked>…</li></ul></html>`.
// Eski kartların düz metni de geçerlidir: `<html>` ile başlamayan her şey düz metindir.
// Liste ve Proje adımları aynı editörde onay kutulu yazılır ama maddeler ayrı tutulur
// (günlük işaret ve ilerleme için): HTML ↔ madde dizisi.

const VARLIKLAR: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
};

export function htmlMi(metin: string | null | undefined): boolean {
  return !!metin && /^\s*<html>/i.test(metin);
}

const kacir = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Editöre verilecek değer: HTML olduğu gibi; düz metin satır satır paragraf olur. Boşsa boş. */
export function metniHtml(metin: string | null | undefined): string {
  if (!metin || !metin.trim()) return '';
  if (htmlMi(metin)) return metin;
  return `<html>${metin
    .split('\n')
    .map((s) => (s.trim() ? `<p>${kacir(s)}</p>` : '<br>'))
    .join('')}</html>`;
}

/**
 * HTML → düz metin (arama, kısa gösterim, paylaşımın eski sürümleri için). Her paragraf ve
 * madde ayrı satır; madde işaretli satırın başında "• ", onay kutulunun "☐ " / "☑ ".
 */
export function htmldenDuz(metin: string | null | undefined): string {
  if (!metin) return '';
  if (!htmlMi(metin)) return metin;
  let s = metin
    .replace(/<\/?html>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n\u0000\n')
    .replace(/<ul data-type="checkbox">([\s\S]*?)<\/ul>/gi, (_, ic: string) =>
      ic.replace(/<li(\s+checked[^>]*)?>/gi, (_m: string, isaret?: string) => (isaret ? '☑ ' : '☐ ')),
    )
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, ic: string) => {
      let n = 0;
      return ic.replace(/<li[^>]*>/gi, () => `${++n}. `);
    })
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|li|h[1-6]|blockquote|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  for (const [v, k] of Object.entries(VARLIKLAR)) s = s.split(v).join(k);
  // Boş satırlar atılır; <br> (boş paragraf) tek boş satır olarak kalır.
  return s
    .split('\n')
    .map((x) => x.replace(/\s+$/, ''))
    .filter((x) => x !== '')
    .map((x) => (x === '\u0000' ? '' : x))
    .filter((x, i, d) => x !== '' || (i > 0 && d[i - 1] !== ''))
    .join('\n')
    .trim();
}

/** Liste editörünün HTML'i (ya da eski düz metin) → maddeler: her dolu satır bir madde. */
export function htmlMaddeleri(metin: string | null | undefined): string[] {
  return htmldenDuz(metin)
    .split('\n')
    .map((s) => s.replace(/^(☐|☑|•|\d+\.)\s*/, '').trim())
    .filter((s) => s !== '');
}

/** Maddeler → onay kutulu liste HTML'i (editörde düzenlemek için). */
export function maddelerdenHtml(maddeler: readonly string[]): string {
  const dolu = maddeler.filter((m) => m.trim() !== '');
  if (dolu.length === 0) return '';
  return `<html><ul data-type="checkbox">${dolu.map((m) => `<li>${kacir(m)}</li>`).join('')}</ul></html>`;
}

/** Görünecek bir şey var mı (boş paragraflar sayılmaz). */
export function metinDoluMu(metin: string | null | undefined): boolean {
  return htmldenDuz(metin) !== '';
}

/**
 * P-75: kartta duran ama boş açıklama (kart görünümünde şeritten eklenip boş bırakılan ya da
 * silinen). Boş dize: açıklama yok (şeritte). Gösterilen her yerde `metinDoluMu` ile boş sayılır.
 */
export const BOS_ACIKLAMA = '<html><p></p></html>';

/** Kartta açıklama alanı var mı (boş da olabilir). */
export function aciklamaVarMi(kisa: string | null | undefined): boolean {
  return !!kisa && kisa.trim() !== '';
}
