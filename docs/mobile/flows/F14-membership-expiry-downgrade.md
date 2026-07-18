# F14 — Membership Expiry Downgrade

1. On login/hydrate, sync expiry (`premiumExpiresAt` vs now)  
2. If expired → set membership `free`, clear paid package fields as web does  
3. UI: locked features + upgrade CTA  
4. IAP/Stripe renew extends expiry without creating duplicate auth user  
