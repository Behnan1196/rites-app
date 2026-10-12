import { Redirect } from 'expo-router';

// Uygulama her açılışta Giriş'te başlar (İS-2).
export default function Baslangic() {
  return <Redirect href="/giris" />;
}
