import { baslangicTutar, birlestir } from '../dikte';

it('parçaları birleştirir', () => {
  expect(birlestir('', 'Ekmek al')).toBe('Ekmek al');
  expect(birlestir('Ekmek al.', ' süt de ')).toBe('Ekmek al. süt de');
  expect(birlestir('Ekmek', '')).toBe('Ekmek');
});

it('ara sonuç devam mı, yeni parça mı', () => {
  expect(baslangicTutar('Yarın sabah', 'Yarın sabah markete git')).toBe(true);
  expect(baslangicTutar('yarın sabah', 'Yarın, sabah')).toBe(true);
  expect(baslangicTutar('Yarın sabah markete git', 'Süt de al')).toBe(false);
  expect(baslangicTutar('', 'Süt')).toBe(true);
});
