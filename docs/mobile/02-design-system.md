# 02 — Design System

Marka: **Yeni Form**. Web token kaynakları buraya kopyalanmıştır.

## Tipografi

| Rol | Web font | Expo önerisi |
|-----|----------|--------------|
| Sans / body | Inter | `@expo-google-fonts/inter` |
| Display / başlık | Plus Jakarta Sans | `@expo-google-fonts/plus-jakarta-sans` |

Body default: cream-900 üzerinde cream-50 zemin.

## Renk tokenları (hex)

### Brand
| Token | Hex |
|-------|-----|
| brand-50 | `#f0f7fb` |
| brand-100 | `#dceef7` |
| brand-200 | `#b8dcef` |
| brand-300 | `#7ec0e2` |
| brand-400 | `#4aa3d4` |
| brand-500 | `#2d8fc4` |
| brand-600 | `#2478a8` |
| brand-700 | `#1f6289` |
| brand-800 | `#1d526f` |
| brand-900 | `#1a455c` |

### Sage
| Token | Hex |
|-------|-----|
| sage-50 | `#f2f9f5` |
| sage-100 | `#e0f0e6` |
| sage-200 | `#bfe0cc` |
| sage-300 | `#8fc9a8` |
| sage-400 | `#5fad7f` |
| sage-500 | `#449664` |
| sage-600 | `#357a50` |
| sage-700 | `#2d6242` |

### Warm / Cream / Gold / Mint
| Token | Hex |
|-------|-----|
| warm-50 | `#fff9f5` |
| warm-100 | `#ffede3` |
| warm-200 | `#ffd4bc` |
| warm-400 | `#f4a574` |
| warm-500 | `#e8894f` |
| cream-50 | `#fafbfc` |
| cream-100 | `#f3f6f8` |
| cream-200 | `#e4eaef` |
| cream-300 | `#cdd6de` |
| cream-800 | `#3a4550` |
| cream-900 | `#1a2332` |
| gold-400 | `#d4a853` |
| gold-500 | `#c4923a` |
| mint-50 | `#ecfdf5` |
| mint-400 | `#34d399` |

## Arka plan atmosferi

Panel/public sayfalar düz tek renk değildir. Web: radial mesh (brand/sage/warm) + cream gradient. Mobil: `expo-linear-gradient` ile benzer yumuşak katmanlar; performans için animasyonlu mesh’i sadeleştir.

## Spacing / radius

- Sayfa yatay padding: 16–20  
- Kart radius: 16–24 (`rounded-2xl` eşdeğeri)  
- Primary CTA min height: 48–52  
- Liste satırı min touch: 44  

## Bileşen seti (RN)

`BrandLogo`, `Button` (primary brand-600), `TextField`, `PhoneField`, `GenderSelect`, `Modal`/`BottomSheet`, `Toast`, `Stepper`, `Badge`, `EmptyState`, `LoadingScreen`, `PanelPageHeader`, `ExerciseVideoThumbnail`, `VideoPlayer`, `LegalConsentCheckbox`, `DisclaimerBox`.

## Motion

Web: framer-motion. Mobil: Reanimated — onboarding step geçişi, sheet open, list fade. Abartılı glow/pill yığınından kaçın (mevcut marka diline sadık kal).

## Logo assets

Web: `/brand-logo.png`, `/brand-mark.png`. Mobil bundle’a kopyala; marka adı hero seviyesinde (özellikle public/onboarding).
