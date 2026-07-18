# IMPLEMENTATION LOCK — Uydurma yasağı

Bu dosya, uygulayıcı yapay zeka / geliştirici için **zorunlu** kurallardır. `docs/mobile/**` ve `.cursor/skills/**` ile çelişen hiçbir şey yapılamaz.

## 0. Temel yasa

1. **Spec’te yoksa ekleme.** Yeni ekran, endpoint, tablo kolonu, JSONB key, renk, font, paket id uydurma.
2. **Web’den farklı davranış uydurma.** Parity varsayılanı web’dir; sapma yalnızca bu klasörde “MOBILE DIFF” başlığıyla yazılıysa.
3. **Emin değilsen dur.** `appendices/G-open-questions-resolved.md` güncelle veya kullanıcıya sor — tahmin etme.
4. **Önce oku:** ilgili `screens/*`, `flows/*`, `contracts/*`, `domains/*`, sonra kod.

## 1. UI / tasarım

| İzinli | Yasak |
|--------|-------|
| `02-design-system.md` hex tokenları | Yeni mor/gradient tema, rastgele radius |
| Screen dosyasındaki layout sırası | “Daha modern” diye kart/hero eklemek |
| `C-copy-strings.md` + screen string tabloları | İngilizce veya uydurma TR metin |
| Mevcut bileşen map (`B-component-map`) | Keyfi UI kit değiştirmek |

## 2. Veri / API

| İzinli | Yasak |
|--------|-------|
| `contracts/*` body/response | Yeni `/api/foo` |
| `supabase-tables.md` + mapper key’leri | `members.data.xyz` icat |
| Plan id: free\|eko\|diyet\|spor\|doktor\|vip | gumus/altin UI’da birincil id (legacy map yalnızca query’de) |

## 3. Ödeme

- Mobil dijital abonelik: **yalnızca** RevenueCat/IAP yolu (`04-payments-iap.md`).
- Stripe Checkout body: `contracts/api-stripe.md` — mobilde IAP yerine Stripe’a yönlendirme **yapma** (red riski), web parity ayrı.

## 4. Auth

- Production password login/signup: `POST /api/auth` — raw `signInWithPassword` production’da yok.
- `pending_registration` metadata şekli onboarding lock dosyasında birebir.
- `hasRegisteredMember` false iken panel chrome’da sahte isim yok.

## 5. Uygulama sırası (zorunlu)

```
1. yeniform-mobile-router skill
2. İlgili domain skill
3. docs/mobile screen + flow + contract
4. (İsteğe bağlı) web src dosyasını doğrula
5. Kod
6. Acceptance checklist screen dosyasından
```

## 6. Gap protokolü

Spec eksikse:

```
GAP: <dosya yolu> — <ne eksik>
Öneri: <tek cümle>
Durum: blocked | needs-user
```

Kod yazmaya devam etme.
