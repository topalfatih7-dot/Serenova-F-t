---
name: yeniform-mobile-spec
description: >-
  Writes and updates self-contained Yeni Form mobile handoff specs under
  docs/mobile. Use when creating or editing mobil spesifikasyon, handoff,
  screen inventory, flows, API contracts, or docs/mobile files for Expo/React
  Native without requiring repo access for the reader.
---

# Yeni Form Mobile Spec Writer

## Goal

Produce **self-contained** markdown in `docs/mobile/` so a team **without web repo access** can build the Expo app.

## Before writing

1. Read `docs/mobile/IMPLEMENTATION-LOCK.md` (anti-hallucination rules).
2. Read `docs/mobile/README.md` and the screen/flow template rules below.
3. Re-read the corresponding web page/service (`src/pages/…`, `api/…`) — do not invent.
4. Cross-link domains/contracts; never say “see source code” as the only instruction — embed behavior.
5. Prefer **IMPLEMENTATION LOCK** screen sections: exact strings, exact JSON, exact validation.

## Directory map

```
docs/mobile/
  README.md, 00–05 foundations
  flows/F*.md
  screens/{public,member,staff,admin}/*.md
  domains/*.md
  contracts/*.md
  appendices/*.md
```

## Screen file template (required sections)

```markdown
# {Screen name}
- Expo route / web route / priority (P0–P3)
- Purpose
- Preconditions (auth, role, plan, gates)
- Layout (top→bottom wireframe)
- Component tree
- Data load (shape + source)
- Interactions table (gesture → API → result)
- Form schema (if any)
- Plan / feature gates
- Empty / loading / error / offline
- Push / deep link
- Native permissions
- Acceptance criteria
- Risks
```

## Flow file template

E2E: actors → steps → APIs → DB writes → failure branches → acceptance.

## Quality bar

- [ ] JSON request/response examples (happy + 1 error)
- [ ] Membership IDs for locks (`free|eko|diyet|spor|doktor|vip`)
- [ ] No “bakınız src/…” as sole instruction
- [ ] Turkish UI strings for CTAs/errors where critical

## Related

- Router: `yeniform-mobile-router`
- Detail: [reference.md](reference.md)
