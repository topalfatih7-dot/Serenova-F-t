# SEO doğrulama

```bash
curl -sI -A Googlebot https://www.yeniform.com/sitemap.xml
# 200, content-type application/xml

curl -sS -A Googlebot https://www.yeniform.com/online-diyetisyen | grep -i 'Online Diyetisyen'
curl -sS -A Googlebot https://www.yeniform.com/kilo-verme | grep -i 'kilo'
curl -sS https://www.yeniform.com/llms.txt | head
```

- Rich Results: FAQ + Service (sahte Review beklenmez)
- PageSpeed: `/`, `/online-diyetisyen`, `/kilo-verme` — LCP < 2.5s
- GSC: Coverage sitemap hatası; Performance pozisyon 11–20 quick win
- Prerender H1 = React H1
