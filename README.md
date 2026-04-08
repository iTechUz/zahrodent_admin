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

Default holatda lokal server `http://localhost:8080` da ishlaydi.

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

### 1) Deployment flow (tavsiya etilgan)

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
  pages/          # Sahifalar (Dashboard, Analytics, va h.k.)
  store/          # Zustand store
  mock/           # Demo/mock data
  layouts/        # Layout komponentlari
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
