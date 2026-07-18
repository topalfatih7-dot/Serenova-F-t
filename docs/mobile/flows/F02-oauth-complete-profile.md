# F02 — OAuth → Complete Profile

1. Google (ve iOS’ta Apple) ile giriş  
2. Session var; `members` yok veya profil eksik  
3. Redirect `/onboarding?oauth=1&plan=…`  
4. Step 0: name, phone, gender, legal (email kilitli)  
5. Step 1: plan + pay/register  
6. `completeOAuthMember` / webhook → panel  

Acceptance: şifre alanı gösterilmez; e-posta OAuth provider’dan gelir.
