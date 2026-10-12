import { randomUUID } from 'expo-crypto';

/** Yeni kayıt kimliği (UUID v4). */
export function yeniKimlik(): string {
  return randomUUID();
}
