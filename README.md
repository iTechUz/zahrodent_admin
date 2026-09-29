# Zahro Dental

Zahro Dental - stomatologiya klinikasi uchun yaratilgan veb-boshqaruv tizimi. Ilova qabul (booking), bemorlar bazasi, shifokorlar, xizmatlar, moliya, tahlillar va bildirishnomalarni bitta panelda boshqarish uchun mo'ljallangan.

## Loyiha tavsifi

### Asosiy imkoniyatlar

- Qabullarni (kalendar asosida) boshqarish
- Bemorlar ro'yxati va profil ko'rinishi
- Shifokorlar va xizmatlar modulini yuritish
- Moliya va analitika sahifalari
- Rolga asoslangan kirish va interfeys cheklovlari
- Mobilga moslashgan (responsive) admin panel

## Texnologiyalar

- **React + TypeScript** — frontend framework
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Shadcn/UI** — UI komponentlar
- **React Query** — server state management
- **Zustand** — client state management

### Texnologik stack

- Frontend: React + TypeScript + Vite
- UI: TailwindCSS + shadcn/ui (Radix komponentlari)
- State management: Zustand
- Routing: React Router
- Test: Vitest, Playwright

## Tez ishga tushirish

### Talablar

- Node.js 18+ (tavsiya: 20 LTS)
- npm 9+

### O'rnatish

```bash
npm install
```

### Development rejimi

```bash
npm run dev
```

Default holatda lokal server `http://localhost:8070` da ishlaydi (`.env` dagi `VITE_API_URL` ishlatiladi).

### Build va preview

```bash
npm run build
npm run preview
```

### Testlar

```bash
npm run test
```

## DevOps qo'llanma

### 0) Docker (production)

Image ikki bosqichli: `node:20-alpine` da `npm ci && npm run build`, so'ng `nginx:alpine`
`dist/` ni **8070** portda beradi (SPA fallback, gzip, `/assets` 1 yil cache, `index.html` no-cache).

API manzili **runtime** da o'qiladi — konteyner ishga tushganda `VITE_API_URL` dan
`/env-config.js` (`window.__ENV__`) yoziladi, shuning uchun bitta image istalgan API ga ulanadi:

```bash
docker build -t zahro-admin .
docker run -p 8070:8070 --env-file .env zahro-admin   # .env: VITE_API_URL=https://api...
```

`--build-arg VITE_API_URL=...` faqat default qiymat (runtime qiymat bo'lmasa ishlatiladi).

### 1) Deployment flow (Docker'siz)

1. Kodni serverga pull qiling
2. `npm ci` bilan dependencylarni toza o'rnating
3. `npm run build` bilan production build qiling
4. `dist/` papkani statik server (Nginx) orqali serve qiling

### 2) CI/CD uchun minimal pipeline qadamlar

```bash
npm ci
npm run lint
npm run test
npm run build
```

Artifact sifatida `dist/` ni publish qiling.

### 3) Nginx konfiguratsiyasi (SPA uchun)

Single Page App bo'lgani uchun fallback route kerak:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/zahro-dental/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4) Versiyalash va release

- `main` branch: productionga tayyor kod
- Tag format: `vX.Y.Z` (masalan: `v1.2.0`)
- Har release uchun changelog yuritish tavsiya etiladi

### 5) Monitoring va operatsion tavsiyalar

- Build vaqtida xatolarni qat'iy tekshirish (`lint` + `test`)
- Frontend error monitoring qo'shish (masalan, Sentry)
- Nginx access/error log rotatsiyasini yoqish
- Uptime monitoring (Uptime Kuma, Better Stack yoki shunga o'xshash)

### 6) Xavfsizlik bo'yicha minimum checklist

- HTTPS (Let's Encrypt) majburiy
- `server_tokens off;` bilan Nginx versiyasini yashirish
- Security headerlar qo'shish:
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Content-Security-Policy` (loyiha ehtiyojiga mos)
- Dependencyni muntazam yangilab borish (`npm audit`)

## Loyiha strukturasi

```text
src/
  components/     # Qayta ishlatiladigan UI komponentlar
  lib/api/        # Backend API client va endpointlar
  shared/config/  # Rol konfiguratsiyasi (UI)
  shared/lib/     # reporting va boshqa yordamchilar
  store/          # Zustand (auth + app)
  modules/        # Sahifalar va feature hooklar
```

## Productionga chiqarish checklist

- [ ] `npm ci` muammosiz o'tdi
- [ ] `npm run lint` yashil
- [ ] `npm run test` yashil
- [ ] `npm run build` muvaffaqiyatli
- [ ] Nginx `try_files ... /index.html` sozlangan
- [ ] HTTPS sertifikat aktiv
- [ ] Monitoring va loglar yoqilgan

## Aloqa

Agar siz DevOps muhandisi sifatida onboarding qilayotgan bo'lsangiz, birinchi navbatda `Build`, `Nginx`, va `Production checklist` bo'limlarini bajaring.
