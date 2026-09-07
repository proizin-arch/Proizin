# İzinPro Cloudflare yayını

Canlı sürüm doğrudan Cloudflare üzerinde çalışır:

- Ön yüz: Cloudflare Workers Static Assets
- Backend: Cloudflare Worker üzerinde Node.js/Express
- Veritabanı ve oturumlar: Cloudflare D1
- Canlı adres: `https://proizin.izinpro.workers.dev`

Netlify canlı sistemin hiçbir isteğinde veya veri işleminde kullanılmaz.

## İlk kurulum

```powershell
npm install
npm run build:cloudflare
npx wrangler login
npx wrangler d1 migrations apply proizin-db --remote --config cloudflare/wrangler.jsonc
npx wrangler secret put SESSION_SECRET --config cloudflare/wrangler.jsonc
npx wrangler secret put TEMP_PASSWORD_KEY --config cloudflare/wrangler.jsonc
```

## Yayınlama

```powershell
npm run deploy:cloudflare
```

Demo hesapları ve kayıtlar D1 migration dosyalarıyla hazırlanır. Canlı ortamda
yapılan yeni kullanıcı, departman, pozisyon ve izin işlemleri D1 veritabanına
kalıcı olarak kaydedilir.
