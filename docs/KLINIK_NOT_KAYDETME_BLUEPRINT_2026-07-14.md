# Klinik Not Kaydetme (Koç & Diyetisyen) — Hata Düzeltme Blueprint

> **Tarih:** 2026-07-14 · **Durum:** 🟡 UYGULANMADI (plan)
> **Hedef ajan:** Cursor / Grok 4.5
> **Amaç:** Diyetisyen ve koçların danışan sağlık profilinde aldığı "Klinik Notlar"ın **kaydedilmemesi** hatasını kök nedeninden düzeltmek.
> **Kural:** Bu dosya bir **uygulama sözleşmesidir**. Uygulamaya başlamadan önce "Ajan Çalışma Kuralları"nı oku.

---

## 0. Ajan Çalışma Kuralları

1. **Kanıtsız değişiklik yapma.** Her `dosya:satır` referansını değişiklikten önce **oku ve doğrula** (satır numaraları kaymış olabilir).
2. **Kök nedeni düzelt, semptomu değil.** Bu bir RLS + `upsert` etkileşimi hatasıdır (aşağıda §2).
3. **Minimal, hedefli düzeltme.** Not akışıyla ilgisiz kod dokunma.
4. **Veri modeli değişmez.** Notlar `members.data.healthStaffNotes` (JSONB dizisi) olarak kalır.
5. **`npm run lint` yeşil kalmalı.** Mümkünse `npm run test:rls` çalıştır.
6. **Türkçe yorumları koru.**

---

## 1. Doğrulanmış Gerçekler (not akışı)

| Adım | Gerçek | Kanıt |
|------|--------|-------|
| UI form | `HealthStaffNotesPanel` — `onSave(nextNotes)` çağırır | `src/components/member/HealthStaffNotesPanel.jsx:22-34` |
| Not ekleme | `appendHealthStaffNote` yeni notu diziye ekler | `src/data/healthStaffNotes.js:29-42` |
| Panel bağlayıcı | `MemberHealthProfilePanel` → `onSaveNotes(nextNotes)` | `src/components/member/MemberHealthProfilePanel.jsx:189-195` |
| Sayfa handler | `handleSaveNotes` → admin ise `adminPatchMember`, değilse `staffPatchMember({ healthStaffNotes })` | `src/pages/shared/MemberHealthProfilePage.jsx:35-50` |
| Context aksiyon | `staffPatchMember` / `adminPatchMember` → `sb.saveMemberPatch(member, patch)` + `reloadRemote()` | `src/context/AppContext.jsx:816-826` |
| Servis | `saveMemberPatch` → `upsertMember(updated)` | `src/services/supabaseDb.js:1000-1040` |
| Persist | `upsertMember` → `supabase.from('members').upsert(row, { onConflict: 'id' })` | `src/services/supabaseDb.js:515-518` |
| JSONB eşleme | `healthStaffNotes` bir kolon değil → `memberData()` ile `data` JSONB'ye yazılır (doğru) | `src/services/supabaseDb.js:57-65` |

### RLS politikaları (`supabase/setup.sql`)

| Politika | Koşul | Kanıt |
|----------|-------|-------|
| `members_insert` (WITH CHECK) | `id = auth.uid() OR is_admin()` | `supabase/setup.sql:343-344` |
| `members_update` (USING) | `is_admin() OR id = auth.uid() OR (atanmış koç/diyetisyen/doktor & e-posta eşleşir)` | `supabase/setup.sql:345-355` |

---

## 2. Kök Neden

`saveMemberPatch` her yaması için `upsertMember` → **`.upsert()`** kullanır. PostgreSQL'de `upsert` = `INSERT ... ON CONFLICT DO UPDATE`. RLS altında bu ifade, satır zaten var olup **UPDATE'e** düşecek olsa bile **önce `INSERT` politikasının `WITH CHECK` koşulunu** gelen satıra uygular.

- **`members_insert` WITH CHECK:** `id = auth.uid() OR is_admin()`.
- Koç/diyetisyen için: `members.id` danışanın id'sidir → `auth.uid()`'e **eşit değil**, ve staff **admin değil** → **`WITH CHECK` başarısız** → `upsert` RLS ile reddedilir → `upsertMember` hata fırlatır → sayfa `catch` → "Not kaydedilemedi".
- **Admin** çalışır çünkü `is_admin()` insert kontrolünü geçer.
- **Üyenin kendi kaydı** çalışır çünkü `id = auth.uid()`.

`members_update` politikası atanmış koç/diyetisyene izin veriyor olsa da, `upsert` yolu **UPDATE'e hiç ulaşmadan** INSERT kontrolünde patlar. **Sonuç: sadece staff (koç/diyetisyen) notu kaydedilemiyor — bildirilen hata.**

---

## 3. Çözüm (tercih edilen): yamalarda `UPDATE` kullan

`saveMemberPatch` **her zaman mevcut** bir üyeyi günceller (yeni üye oluşturmaz). Bu yüzden `upsert` yerine `update` kullanmak, `members_update` politikasını devreye sokar; koç/diyetisyen/üye/admin **hepsi** geçer. Yeni üye oluşturan yollar (`register`, `adminAddMember`, expiry-sync) `upsert`'te kalır.

### Görev 3.1 — `updateMemberRow` yardımcı fonksiyonu

**Dosya:** `src/services/supabaseDb.js`
**Kanıt:** `upsertMember` tanımı `:515-518`.

`upsertMember`'ın hemen altına ekle:

```js
// Var olan üyeyi GÜNCELLER (upsert değil) — staff/diyetisyen yamaları
// members_update RLS politikasını kullanır (members_insert WITH CHECK'e takılmaz).
async function updateMemberRow(member) {
  const { data, error } = await supabase
    .from('members')
    .update(memberToRow(member))
    .eq('id', member.id)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    // RLS satırı gizlediyse veya id yoksa 0 satır döner — sessiz başarısızlığı yakala
    throw new Error('Üye güncellenemedi (yetki veya kayıt yok).')
  }
}
```

> `memberToRow` `updated_at` dahil tüm kolonları + `data` JSONB'yi üretir (`:67-82`). Bu güvenli; UPDATE tüm bu kolonları yazar, davranış upsert ile aynıdır (satır var olduğundan).

### Görev 3.2 — `saveMemberPatch` içinde `update` kullan

**Dosya:** `src/services/supabaseDb.js`
**Kanıt:** `:1038` `await upsertMember(updated)`.

`saveMemberPatch` sonundaki tek çağrıyı değiştir:

```js
// eski:
await upsertMember(updated)
// yeni:
await updateMemberRow(updated)
```

**DOKUNULMAYACAK (upsert kalır):**
- `register` içindeki `upsertMember(member)` — `:684`
- `adminAddMember` / plan ekleme — `:1077`, `:1134`
- admin premium / status — `:1976`, `:2035`
- expiry-sync — `:339`
- `saveSupportSchedule` (`:1057`) — bu da mevcut üyeyi patch'liyor; **isteğe bağlı** olarak `updateMemberRow`'a çevrilebilir ama zorunlu değil (üye kendi kaydını yazar, sorun yok). **Kapsamı dar tut: yalnızca `saveMemberPatch`.**

**Kabul kriterleri:**
- Koç ve diyetisyen, danışanının sağlık profilinde not ekleyip **"Not kaydedildi"** görebilmeli.
- Sayfa yenilenince not kalıcı olmalı (`members.data.healthStaffNotes` içinde).
- Admin notu hâlâ kaydedebilmeli.
- Üyenin kendi profil güncellemeleri (kilo, availability, sağlık testi, tamamlama) **bozulmamalı** — hepsi `saveMemberPatch` → artık `update` yolundan geçer, üye `id = auth.uid()` olduğundan sorunsuz.
- `npm run lint` yeşil.

---

## 4. Alternatif (gerekmezse uygulama): `security definer` RPC

Eğer `update` yaklaşımı bir nedenle yetersiz kalırsa (ör. ileride staff atanmamış üyeye yazması gerekirse), `supabase/migrations/` altına `staff_append_health_note(p_member_id uuid, p_notes jsonb)` gibi bir `security definer` RPC eklenebilir ve `saveMemberPatch` yerine notlar için özel çağrı yapılır. **Bu, §3'e göre daha fazla koddur ve şu an gereksizdir.** Sadece §3 yetersizse başvur; `.cursor/rules/supabase-auto-migrate.mdc` akışını izle.

---

## 5. Doğrulama

### 5.1 Elle
1. `npm run dev`.
2. **Koç** hesabıyla giriş → Danışanlarım → bir danışanın sağlık profili → "Yeni not" yaz → **Notu Kaydet**.
3. "Not kaydedildi" toast'ı ve notun listede görünmesi.
4. Sayfayı yenile → notun kalıcı olduğunu doğrula.
5. **Diyetisyen** ile tekrarla.
6. **Admin** ile tekrarla (regresyon).
7. **Üye** olarak profil/takvim güncellemesi yap (kilo, aktivite işaretle) → hâlâ çalıştığını doğrula (regresyon).

### 5.2 RLS testi
- `npm run test:rls` çalıştır (`scripts/test-rls-policies.mjs`). Mevcut testler kırılmamalı; mümkünse "assigned staff üye `data`'sını UPDATE edebilir" senaryosu eklenip eklenmediğini kontrol et.

---

## 6. Riskler & Notlar

- **RLS sessiz 0 satır:** `.update()` RLS ile filtrelenirse hata yerine 0 satır döner. §3.1'deki `.select('id')` + boş kontrol bunu görünür bir hataya çevirir → "Not kaydedilemedi" toast'ı yanıltıcı olmaz.
- **`updated_at`:** `memberToRow` her yazımda `nowISO()` verir; UPDATE'te de yazılır, sorun yok.
- **Optimistic UI:** Üye tarafı `patchCurrentRemote` optimistic günceller (`AppContext.jsx:635-`), staff tarafı `reloadRemote()` yapar (`:820`,`:826`); düzeltme sonrası staff notu artık gerçekten kaydolduğundan reload doğru veriyi getirir.
- **Kapsam disiplini:** Yalnızca `supabaseDb.js` içindeki `saveMemberPatch` çağrısı + yeni `updateMemberRow` helper'ı değişir. Başka dosya dokunma.
