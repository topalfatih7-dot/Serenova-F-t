# Poyraz — tam hareket kütüphanesi (KİLİTLİ OPS)

> **Durum:** Özel istisna · diğer üyeler program-scoped · izinsiz kopyalama/geri alma yok  
> Kullanıcı “geri al / kaldır” derse bu dosyadaki SQL’i çalıştır.

Üye yalnızca kendi antrenmanındaki hareketleri görür. Poyraz’a **tüm özel kütüphane** (~1594 videolu hareket) açıldı. 1599 hareket takvime basılmadı.

---

## Kim

| Alan | Değer |
|------|--------|
| Ad | Poyraz Efe Tahmaz |
| E-posta | `poyrazefetahmaztahmaz@gmail.com` |
| `members.id` | `b4141933-6cf1-4296-987f-fca5b5790fb9` |
| Üyelik (atama anı) | `vip` / `active` |
| Katalog program | `940773c6-29ab-4a68-969a-05951c4702a0` |
| Program `source` | `library_catalog` |
| Kod commit | `38d2142a` |

## Nasıl çalışır

1. `members.data.fullLibraryAccess = true`
2. `programs` satırı: `type: workout`, `source: library_catalog`, `fullLibraryAccess: true`, **boş `entries`** (takvim şişmez)
3. `/library` → `hasFullLibraryAccess(user, myPrograms)` true ise `allowedIds` yok (tüm katalog)
4. Takvim katalog programı atlar (`programSchedule.js`)
5. Programlarım’da “Kütüphaneyi aç” kartı

Kod: `src/utils/coachProgram.js` (`LIBRARY_CATALOG_SOURCE`, `hasFullLibraryAccess`), `ExerciseLibraryPage.jsx`, `ProgramsPage.jsx`, `programSchedule.js`, `MemberProgramsPanel.jsx`

## Kontrol

```sql
select m.email, m.data->>'fullLibraryAccess' as flag
from members m
where m.id = 'b4141933-6cf1-4296-987f-fca5b5790fb9';

select id, data->>'title' as title, data->>'source' as source
from programs
where id = '940773c6-29ab-4a68-969a-05951c4702a0';
```

Beklenen: flag `true`, program `Hareket Kütüphanesi` / `library_catalog`.

---

## A — Yalnız bu üyenin hakkını geri al (takvim/kütüphane normal)

Kodu geri alma. Poyraz tekrar program-scoped olur (programı yoksa kütüphane boş).

```sql
delete from public.programs
where id = '940773c6-29ab-4a68-969a-05951c4702a0'
  and member_id = 'b4141933-6cf1-4296-987f-fca5b5790fb9';

update public.members
set
  data = (coalesce(data, '{}'::jsonb) - 'fullLibraryAccess'),
  updated_at = now()
where id = 'b4141933-6cf1-4296-987f-fca5b5790fb9';
```

Bildirim kaydı `members.data.notifications` içinde kalabilir; gerekirse ayrıca temizle.

## B — Kütüphane özelliğini koddan da geri al

Başka katalog programı yoksa:

```bash
git revert 38d2142a
```

Sonra A’daki SQL. Kural: `.cursor/rules/poyraz-full-library-locked.mdc` — kullanıcı kapat derse `alwaysApply: false` veya sil.

## C — Hakkı yeniden ver

```sql
update public.members
set
  data = jsonb_set(coalesce(data, '{}'::jsonb), '{fullLibraryAccess}', 'true'::jsonb, true),
  updated_at = now()
where id = 'b4141933-6cf1-4296-987f-fca5b5790fb9';

insert into public.programs (member_id, staff_id, data)
select
  'b4141933-6cf1-4296-987f-fca5b5790fb9'::uuid,
  null,
  jsonb_build_object(
    'type', 'workout',
    'source', 'library_catalog',
    'fullLibraryAccess', true,
    'memberName', 'Poyraz Efe Tahmaz',
    'staffName', 'Yeni Form',
    'title', 'Hareket Kütüphanesi',
    'description', 'Özel kütüphanedeki tüm hareket videolarına erişiminiz açıldı. Hareketleri Kütüphane sayfasından izleyebilirsiniz.',
    'items', jsonb_build_array('Tüm egzersiz kütüphanesi açık — Kütüphane sayfasından izleyin'),
    'entries', '[]'::jsonb,
    'scheduleType', null,
    'createdAt', to_char((now() at time zone 'utc'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )
where not exists (
  select 1 from public.programs
  where member_id = 'b4141933-6cf1-4296-987f-fca5b5790fb9'
    and data->>'source' = 'library_catalog'
);
```

Yeni program id’sini kural dosyasına yaz.

---

## Sorun giderme

| Belirti | Kontrol |
|---------|---------|
| Kütüphane hâlâ boş | Deploy `38d2142a`+ oldu mu? Üye çıkış/giriş. Flag + program SQL. |
| Takvimde binlerce hareket | Katalog `entries` dolu olmamalı; `source` `library_catalog` olmalı |
| Başka üye tüm kütüphaneyi görüyor | O üyede `fullLibraryAccess` veya `library_catalog` program var mı — olmamalı |

Bu istisnayı başka üyeye **yalnızca kullanıcı açıkça isterse** uygula.
