// Supabase Edge Function: davet-gonder (KS-1).
// Rites'ta olmayan birini kişi olarak ekleyince davet e-postası gönderir.
// Supabase panelinde Edge Functions → "Deploy a new function" → adı
// `davet-gonder`; bu dosyanın içeriği yapıştırılır.
//
// Güvenlik: yalnız oturum açmış kişi çağırabilir ve yalnız kendi eklediği
// (davet tablosunda kaydı olan) e-postaya davet gider.
//
// Not: Bu dosya Deno'da çalışır; uygulamanın tip denetimine girmez.

// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2';

function gizliAnahtar(): string {
  const eski = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (eski) return eski;
  const yeniler = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (yeniler) {
    const nesne = JSON.parse(yeniler) as Record<string, string>;
    const ilk = Object.values(nesne)[0];
    if (ilk) return ilk;
  }
  const tek = Deno.env.get('SUPABASE_SECRET_KEY');
  if (tek) return tek;
  throw new Error('Gizli anahtar bulunamadı');
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const yanit = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), { status: durum, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (istek.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const yonetici = createClient(Deno.env.get('SUPABASE_URL')!, gizliAnahtar(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: kim, error: kimHatasi } = await yonetici.auth.getUser(jwt);
    if (kimHatasi || !kim.user) return yanit({ hata: 'oturum' }, 401);

    const { eposta } = (await istek.json()) as { eposta?: string };
    const e = (eposta ?? '').trim().toLowerCase();
    if (!e) return yanit({ hata: 'eposta' }, 400);

    const { data: davet } = await yonetici
      .from('davet')
      .select('eposta')
      .eq('eposta', e)
      .eq('davet_eden', kim.user.id)
      .maybeSingle();
    if (!davet) return yanit({ hata: 'davet yok' }, 403);

    const { data: ben } = await yonetici.from('kullanici').select('ad').eq('id', kim.user.id).maybeSingle();
    const { error } = await yonetici.auth.admin.inviteUserByEmail(e, { data: { davet_eden_ad: ben?.ad ?? '' } });
    // Daha önce davet edilmiş ya da kayıtlı kişiye ikinci davet e-postası gitmez; bu bir hata sayılmaz.
    if (error && !/already/i.test(error.message)) return yanit({ hata: error.message }, 500);
    return yanit({ gonderildi: !error });
  } catch (e) {
    return yanit({ hata: String(e) }, 500);
  }
});
