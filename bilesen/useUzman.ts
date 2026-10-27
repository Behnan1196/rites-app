// Uzman görünümü açık mı (P-51; Ayarlar → Uzman görünümü). Normal kullanıcının kart formu
// sadedir: "Karta ekle"de Liste · Fotoğraf · Video; programda "N. gün" düzeni yok.
// Uzman bütün parçaları (talimat, zamanlayıcı, ölçüm, sayarak, puan, soru…) ve seri,
// gün düzeni ayarlarını görür. Kart çeşidi yayınlamak ayrıca sunucudaki tasarımcı yetkisidir.

import { useAyar } from '@/veri/kancalar';

export function useUzman(): boolean {
  return useAyar('uzman_gorunumu').veri === true;
}
