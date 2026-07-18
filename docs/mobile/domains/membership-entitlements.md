# Domain — Membership & Entitlements

## Plan katalogu

### free (Basic)
- Fiyat: 0  
- 48 saat deneme programları; temel video; sağlık analizi  
- Yok: koç/diyet görüşmesi, manuel/foto kalori (kapı fonksiyonlarına göre)

### eko
- Görüşme: 0/0/0  
- Manuel kalori: evet · Foto: hayır · Tam video: hayır (sınırlı)  
- AI program yenilemeleri (eko)

### diyet
- Ayda 2 diyetisyen; doktor alanı paket config’de  
- Manuel + foto kalori  

### spor
- Ayda 2 koç  
- Manuel + foto kalori · Tam video  

### doktor
- Tek seferlik 1 doktor görüşmesi (`doctorSessionsTotal: 1`, `billingType: one_time`)  
- Manuel/foto kalori: hayır  

### vip
- Ayda 2 koç + 2 diyetisyen  
- Manuel + foto · Tam video · VIP rozet  

## Kapı fonksiyonları (mobil kopyala)

```
hasManualCalorieAccess(m):
  false if m in (free, doktor, kurucu); else true

hasPhotoCalorieAccess(m):
  m in (diyet, spor, vip, platinum, premium)

hasFullVideoAccess(m):
  m in (spor, vip, platinum, premium)
```

## PACKAGE_BY_PLAN

| plan | coach/mo | dietitian/mo | doctor notes |
|------|----------|--------------|--------------|
| eko | 0 | 0 | 0 |
| diyet | 0 | 2 | 1 |
| spor | 2 | 0 | 1 |
| doktor | 0 | 0 | doctorSessionsTotal 1 |
| vip | 2 | 2 | 1 |
| kurucu (legacy) | 2 | 2 | 0 |

Helpers: `packageIncludesCoach`, `packageIncludesDietitian`, `sanitizeStaffForPackage`, `memberNeedsStaffAssignment`.

## Süre / expiry

- `durationMonths` 1|3|6  
- `premiumExpiresAt` = start + N calendar months  
- Expiry sync → membership `free`  

## Staff assignment

Paid plans with meeting quotas get `assigned_coach_id` / `assigned_dietitian_id` / `assigned_doctor_id`. Plan değişince `sanitizeStaffForPackage` paket dışı rolleri temizler.
