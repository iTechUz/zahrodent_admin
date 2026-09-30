# Zahro Dental — admin panel

Zahro Dental stomatologiya klinikasi uchun boshqaruv paneli (SPA). Qabullar, bemorlar,
shifokorlar, xizmatlar, moliya, murojaatlar (lead), xabarnomalar va tahlillar bitta
interfeysda. Panel faqat frontend: barcha ma'lumotlar **zahrodent_backend** (NestJS REST API
+ socket.io) orqali keladi.

- UI tili: o'zbek. Klinika vaqt zonasi: `Asia/Tashkent`.
- Production: Docker image (nginx) **8070** portda, API manzili konteyner ishga tushganda
  beriladi (qayta build shart emas).

## Mundarija

1. [Imkoniyatlar](#imkoniyatlar)
2. [Texnologiyalar](#texnologiyalar)
3. [Loyiha tuzilmasi](#loyiha-tuzilmasi)
4. [Talablar](#talablar)
5. [Lokal ishga tushirish](#lokal-ishga-tushirish)
6. [Skriptlar](#skriptlar)
7. [Muhit o'zgaruvchilari](#muhit-ozgaruvchilari)
8. [API bilan ishlash, autentifikatsiya va refresh](#api-bilan-ishlash-autentifikatsiya-va-refresh)
9. [Rollar va UI ruxsatlari](#rollar-va-ui-ruxsatlari)
10. [Testlar](#testlar)
11. [Docker image](#docker-image)
12. [CI/CD](#cicd)
13. [Deploy bo'yicha eslatmalar](#deploy-boyicha-eslatmalar)
14. [Muammolarni bartaraf etish](#muammolarni-bartaraf-etish)

## Imkoniyatlar

| Bo'lim | Nima qiladi |
|---|---|
| Bosh sahifa | Kunlik ko'rsatkichlar, bugungi qabullar, daromad (faqat admin) |
| Qabullar | Ro'yxat + kalendar (drag & drop bilan ko'chirish), holat almashtirish, filtrlar |
| Bemorlar | Ro'yxat, profil (tish xaritasi, tashriflar, to'lovlar, izohlar), Excel eksport, qarzdorlar filtri, **arxivlash (soft delete) va tiklash** |
| Shifokorlar | Ro'yxat, ish jadvali va dam olish kunlari, samaradorlik statistikasi, oxirgi tashriflar |
| Xizmatlar | Katalog, kategoriyalar, narx/davomiylik, xizmat bo'yicha daromad |
| Moliya | Kirim/chiqim, holat va usul filtrlari, shifokorlar bo'yicha daromad, Excel eksport |
| Murojaatlar | Sotuv varonkasi (Kanban + jadval), Telegram botdan kelgan murojaatlar real vaqtda (socket.io) |
| Xabarnomalar | SMS/Telegram tarixi, eslatmalar va ommaviy yuborish |
| Tahlillar | Oylik dinamika, manbalar bo'yicha statistika |
| Xodimlar | Qabulxona xodimlarini boshqarish |
| Sozlamalar | Klinika ma'lumotlari, SMS/Telegram eslatma shablonlari (jonli namuna bilan), eslatma necha kun oldin yuborilishi, parolni o'zgartirish, qorong'u rejim |

Barcha jadvallar server tomonida saralanadi (sarlavhani bosish) va qidiruv 300 ms debounce bilan
ishlaydi.

## Texnologiyalar

| Soha | Texnologiya |
|---|---|
| Framework | React 18 + TypeScript, Vite 5 (SWC) |
| UI | Tailwind CSS 3, shadcn/ui (Radix), lucide-react, framer-motion, recharts |
| Server holati | TanStack React Query 5 |
| Klient holati | Zustand 5 (sessiya + UI) |
| Formalar | react-hook-form + zod |
| Routing | React Router 6 (lazy sahifalar) |
| Real vaqt | socket.io-client |
| Eksport | xlsx (kerak bo'lganda dinamik yuklanadi) |
| Testlar | Vitest 3 + Testing Library (jsdom) |
| Production | nginx:alpine (Docker), GitHub Actions |

## Loyiha tuzilmasi

```text
src/
  main.tsx, App.tsx        # kirish nuqtasi, routerlar, /auth/me bootstrap, socket
  lib/api/                 # API qatlami (backend bilan yagona aloqa nuqtasi)
    client.ts              #   fetch wrapper: Bearer token, xatolar, 401 → refresh → retry
    auth-token.ts          #   tokenlarni saqlash (localStorage / sessionStorage)
    auth-events.ts         #   client → store hodisalari (refreshed / expired)
    endpoints.ts           #   har bir resurs uchun funksiyalar (patientsApi, authApi, settingsApi …)
    sort-fields.ts         #   backend sortBy whitelist'larining nusxasi
    query-client.ts        #   React Query sozlamalari va xato toast'lari
    query-keys.ts          #   query kalitlari (invalidatsiya prefikslari)
    runtime-config.ts      #   API URL: window.__ENV__ → build-time → localhost
    helpers.ts             #   fetchAllPages (100 talik limitni aylanib o'tish) va boshqalar
  modules/<bo'lim>/        # analytics, auth, bookings, dashboard, doctors, finance, leads,
                           # notifications, patients, services, settings, users
    pages/ components/ hooks/ services/ routes.tsx
  shared/
    components/            # DataTable, SortableHeader, PatientNameLabel, QueryErrorState, …
    config/roles.ts        # rollar → ruxsatlar (can()) va marshrutlar (roleAccess)
    hooks/                 # useServerTable (paginatsiya/saralash/debounce), useSocket, …
    lib/                   # sana (Asia/Tashkent), formatlash, Excel, validatsiya
    layouts/               # DashboardLayout, sidebar, topbar
    types/                 # API tiplari
  components/              # umumiy komponentlar (kalendar, global qidiruv, ProtectedRoute) va ui/ (shadcn)
  hooks/                   # useLogout, useAuthBootstrap
  store/                   # Zustand: authSlice (sessiya), appSlice (UI)
  test/                    # Vitest setup, API mock'lari, yordamchilar
docker/                    # nginx.conf, security-headers.conf, 40-env-config.sh
public/env-config.js       # dev uchun bo'sh runtime config (Docker'da qayta yoziladi)
```

## Talablar

- Node.js **20 LTS** (CI va Docker image shu versiyada), npm 10+
- Ishlab turgan backend (lokal: `http://localhost:3000`)
- Docker 24+ (faqat image yig'ish/ishga tushirish uchun)

## Lokal ishga tushirish

```bash
git clone <repo> && cd zahrodent_admin
npm ci
cp .env.example .env          # VITE_API_URL=http://localhost:3000
npm run dev                   # http://localhost:8070
```

Boshqa portda: `npx vite --port 8080 --strictPort`. `.env` git'ga qo'shilmaydi (`.gitignore`).

Backend CORS'da frontend manzili ruxsat etilgan bo'lishi kerak (backend `CORS_ORIGINS`,
masalan `http://localhost:8070`).

## Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Vite dev server, `0.0.0.0:8070` (port band bo'lsa xato beradi — `strictPort`) |
| `npm run build` | Production build → `dist/` (tip tekshiruvisiz — pastga qarang) |
| `npm run build:dev` | Development rejimidagi build |
| `npm run preview` | `dist/` ni lokal ko'rish |
| `npm run lint` | ESLint (butun loyiha) |
| `npm test` | Vitest, bir marta (`vitest run`) |
| `npm run test:watch` | Vitest watch rejimi |
| `npx tsc --noEmit -p tsconfig.app.json` | TypeScript tekshiruvi (CI shu buyruqni ishlatadi) |

## Muhit o'zgaruvchilari

Frontend'da **bitta** konfiguratsiya o'zgaruvchisi bor: `VITE_API_URL`. U ikki yo'l bilan beriladi:

| O'zgaruvchi | Qayerda | Qachon o'qiladi | Izoh |
|---|---|---|---|
| `VITE_API_URL` | `.env` / `npm run build` muhiti / Docker `--build-arg` | **build vaqtida** (`import.meta.env`) | Bundle ichiga yoziladi. Dev rejimida va Docker'siz deployda ishlatiladi |
| `VITE_API_URL` | konteyner muhiti (`docker run --env-file`) | **konteyner ishga tushganda** → `/env-config.js` (`window.__ENV__`) | Build-time qiymatdan ustun. Bitta image'ni istalgan API'ga ulash mumkin |
| `RUNTIME_ENV_VARS` | konteyner muhiti | ishga tushishda | `window.__ENV__` ga chiqariladigan o'zgaruvchilar ro'yxati (standart: `VITE_API_URL`). **Maxfiy qiymat qo'shmang** — fayl brauzerga ochiq |
| `ENV_CONFIG_PATH` | konteyner muhiti | ishga tushishda | `env-config.js` yo'li (standart: `/usr/share/nginx/html/env-config.js`) |

Ustuvorlik: `window.__ENV__.VITE_API_URL` → build-time `VITE_API_URL` → `http://localhost:3000`.
Protokolsiz qiymatga `https://` qo'shiladi, oxiridagi `/` olib tashlanadi. socket.io ham shu manzilga ulanadi.

Namuna fayllar: [`.env.example`](.env.example) (lokal), [`.env.production.example`](.env.production.example) (server).

## API bilan ishlash, autentifikatsiya va refresh

Barcha so'rovlar `src/lib/api/client.ts` → `apiRequest()` orqali o'tadi.

**Xatolar.** Backend javobi `{ statusCode, message, requestId? }`. `message` (satr yoki massiv)
foydalanuvchiga toast/inline ko'rinishida chiqadi, `requestId` bo'lsa "So'rov ID: …" qo'shiladi
(backend loglaridan qidirish uchun). Tarmoq xatosi (server o'chiq, CORS, internet yo'q) →
"Serverga ulanib bo'lmadi…".

**Kirish.** `POST /auth/login` → `{ access_token, refresh_token, expires_in, user }`.
"Eslab qolish" belgilangan bo'lsa sessiya `localStorage` da (brauzer yopilsa ham qoladi), aks holda
`sessionStorage` da (faqat shu tab). Kalitlar: `zahro_token`, `zahro_refresh`, `zahro_token_exp`, `zahro_user`.

**Ilova ochilganda** saqlangan token bo'lsa `GET /auth/me` chaqiriladi va foydalanuvchi (rol, ism)
serverdan yangilanadi — faqat localStorage'ga ishonilmaydi.

**Refresh (access token muddati tugaganda):**

1. Istalgan so'rov 401 qaytarsa (`/auth/login`, `/auth/refresh`, `/auth/logout` bundan mustasno),
   client `POST /auth/refresh { refresh_token }` ni **bir marta** chaqiradi va asl so'rovni yangi token
   bilan qayta yuboradi.
2. **Single-flight:** bir vaqtda kelgan bir nechta 401 bitta refresh so'rovini kutadi. Bir nechta tab
   bo'lsa refresh Web Locks API bilan navbatga qo'yiladi — backend eski (rotatsiya qilingan) token
   qayta ishlatilsa butun sessiya oilasini bekor qiladi, shuning uchun bu muhim.
3. Access token tugashiga ~60 soniya qolganda refresh oldindan (proaktiv) bajariladi.
4. Refresh rad etilsa (401) — tokenlar o'chiriladi va `/login` ga "Sessiya muddati tugagan, qayta kiring"
   xabari bilan yo'naltiriladi. Tarmoq xatosida sessiya saqlanadi.
5. Yangi token store'ga yoziladi va socket.io shu token bilan qayta ulanadi.

**Chiqish:** `POST /auth/logout { refresh_token }` (server tomonda bekor qilinadi), so'ng lokal sessiya va
React Query keshi tozalanadi.

**Parolni o'zgartirish** (Sozlamalar → Xavfsizlik, barcha rollar): `PATCH /auth/password`. Backend
foydalanuvchining barcha refresh tokenlarini bekor qiladi, shuning uchun panel yangi parol bilan avtomatik
qayta kiradi (sessiya uzilmaydi, boshqa qurilmalar chiqib ketadi). Bu muvaffaqiyatsiz bo'lsa — login
sahifasiga xabar bilan yo'naltiriladi.

**Ro'yxatlar:** `page` (0 dan), `limit` (≤ 100), `search`, `sortBy` (resurs bo'yicha whitelist —
`src/lib/api/sort-fields.ts`, backend `src/*/dto/*-query.dto.ts` bilan bir xil bo'lishi shart), `order`
(`asc` | `desc`). Qidiruv, filtr yoki saralash o'zgarsa sahifa 0 ga qaytadi.

**Bemorni o'chirish** — soft delete (arxiv): tarix (tashrif, to'lov, qabul) saqlanadi, toast'dagi
"Qaytarish" bilan darhol tiklash mumkin. Arxivdagi bemor profili (admin): `/patients/<id>?includeDeleted=true`
→ "Arxivdan tiklash". Moliya va qabullarda arxivlangan bemor nomi yonida "(o'chirilgan)" belgisi chiqadi.

## Rollar va UI ruxsatlari

Manba: `src/shared/config/roles.ts` (`permissions` + `can()`), backend `@Roles(...)` bilan mos.
UI tugmalarni yashiradi, lekin haqiqiy tekshiruv backend'da.

| Amal | Admin | Shifokor | Qabulxona |
|---|:-:|:-:|:-:|
| Bemorlarni ko'rish, izoh yozish | ✅ | ✅ | ✅ |
| Bemor qo'shish | ✅ | — | ✅ |
| Bemorni tahrirlash | ✅ | ✅ (faqat o'z bemorlari) | ✅ |
| Bemorni arxivlash / tiklash | ✅ | — | — |
| Qabullarni ko'rish | ✅ | ✅ (o'ziniki) | ✅ |
| Qabul yaratish / tahrirlash / o'chirish | ✅ | — | ✅ |
| Tashrif qo'shish / tahrirlash | ✅ | ✅ | — |
| Shifokorlarni ko'rish | ✅ | ✅ | ✅ |
| Shifokor qo'shish / tahrirlash / o'chirish, statistikasi | ✅ | — | — |
| Xizmatlarni ko'rish | ✅ | ✅ | ✅ |
| Xizmat qo'shish / tahrirlash / o'chirish | ✅ | — | — |
| Xizmatlar statistikasi | ✅ | — | ✅ |
| Moliya (to'lovlar) | ✅ | — | — |
| Xabarnomalarni ko'rish | ✅ | ✅ (o'ziniki) | ✅ |
| Xabarnoma / eslatma yuborish | ✅ | — | ✅ |
| Murojaatlar (lead) | ✅ | — | ✅ |
| Xodimlarni boshqarish | ✅ | — | — |
| Sozlamalarni ko'rish | ✅ | ✅ | ✅ |
| Sozlamalarni o'zgartirish | ✅ | — (faqat o'qish) | — (faqat o'qish) |
| O'z parolini o'zgartirish | ✅ | ✅ | ✅ |

Menyu / marshrutlar (`roleAccess`):

| Rol | Sahifalar |
|---|---|
| Admin | hammasi |
| Shifokor | Bosh sahifa, Qabullar, Bemorlar, Sozlamalar |
| Qabulxona | Bosh sahifa, Qabullar, Bemorlar, Xizmatlar, Xabarnomalar, Murojaatlar, Sozlamalar |

## Testlar

```bash
npm test                                   # barcha unit/komponent testlar
npx vitest run src/lib/api                 # bitta papka
npx tsc --noEmit -p tsconfig.app.json      # tiplar
npx eslint src                             # lint (0 error bo'lishi shart)
```

- Testlar `src/**/*.test.ts(x)`, muhit jsdom. API `src/test/api-mock.ts` orqali mock qilinadi —
  testlar backend'siz ishlaydi.
- Qamrov: API client (refresh single-flight, retry, cross-tab, redirect), sessiya/store, rollar, jadval
  saralash va debounce, formalar (sozlamalar, parol), hook'lar, formatlash va sana yordamchilari.
- `npm run build` tiplarni tekshirmaydi — shuning uchun CI `tsc` ni alohida ishga tushiradi.

## Docker image

Ikki bosqichli `Dockerfile`:

1. **build** — `node:20-alpine`: `npm ci`, `npm run build`.
2. **runtime** — `nginx:alpine`: `dist/` + `docker/nginx.conf`, port **8070**.

| Parametr | Qiymat |
|---|---|
| Build arg | `VITE_API_URL` (standart `https://api.zahro.iqroagency.uz`) — faqat zaxira qiymat |
| Runtime env | `VITE_API_URL` (asosiy), `RUNTIME_ENV_VARS`, `ENV_CONFIG_PATH` |
| Port | `8070` (IPv4 + IPv6) |
| Healthcheck | `GET /healthz` → `200 ok` (har 30 s) |
| Entrypoint | `docker/40-env-config.sh` nginx'dan oldin `/env-config.js` ni yozadi (qiymatlar JSON-escape qilinadi) |

nginx (`docker/nginx.conf`):

- SPA fallback: noma'lum yo'l → `index.html` (`/patients/123` to'g'ridan-to'g'ri ochiladi);
- `/assets/*` (hash'li fayllar) — 1 yil `immutable` kesh; `index.html` — `no-cache`; `env-config.js` — `no-store`;
- gzip, `server_tokens off`, `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`.

```bash
docker build -t zahro-admin .
docker run -d --name zaxrodent_admin -p 8070:8070 --env-file .env zahro-admin
curl -fsS http://localhost:8070/healthz        # ok
curl -fsS http://localhost:8070/env-config.js  # window.__ENV__ = {"VITE_API_URL":"…"};
```

TLS (HTTPS) konteyner ichida emas — tashqi reverse proxy (nginx/Caddy/Traefik) orqali beriladi.

## CI/CD

`.github/workflows/docker-image.yml` ("Deploy to Server"):

| Job | Qachon | Qadamlar |
|---|---|---|
| `test` | `main` ga push va har bir pull request | `npm ci` → `npx tsc --noEmit -p tsconfig.app.json` → `npx eslint src` → `npm test` |
| `deploy` | faqat `main` ga push, `test` muvaffaqiyatli bo'lsa | image build → Docker Hub (`10449/zaxrodent_admin:<commit sha>`) → SSH orqali serverda `docker pull`, eski `zaxrodent_admin` konteynerini o'chirish, yangisini `-p 8070:8070 --env-file …/.env` bilan ishga tushirish |

Kerakli GitHub secrets: `DOCKERHUB_TOKEN` (Docker Hub `10449` akkaunti), `SSH_PRIVATE_KEY` (serverdagi
`ubuntu` foydalanuvchisi). Image teglari commit SHA — rollback uchun oldingi SHA bilan `docker run` qilish kifoya.

## Deploy bo'yicha eslatmalar

- Serverdagi env fayl: **`/home/ubuntu/projects/zaxro_dent/zahrodent_admin/.env`**. Unda albatta
  `VITE_API_URL=https://<backend-domen>` bo'lishi kerak (namuna: `.env.production.example`). Fayl bo'lmasa
  `docker run` xato beradi; qiymat bo'lmasa build-time standart qiymat ishlatiladi.
- API manzilini o'zgartirish: `.env` ni tahrirlang va konteynerni qayta yarating (`docker rm -f` + `docker run`,
  yoki workflow'ni qayta ishga tushiring). Qayta build kerak emas.
- Backend'da `CORS_ORIGINS` ga panel domeni qo'shilgan bo'lishi shart (masalan `https://admin.zahro.uz`).
- Backend'ning refresh token / soft delete / settings o'zgarishlari (migratsiyalar bilan) panelning shu
  versiyasidan **oldin** yoki bir vaqtda deploy qilinishi kerak: eski backend `refresh_token` qaytarmaydi —
  access token tugagach foydalanuvchi login sahifasiga qaytariladi, Sozlamalar sahifasi esa yuklanmaydi.
- Tavsiya: workflow'dagi `docker run` ga `--restart unless-stopped` qo'shish — hozir server qayta yuklansa
  konteyner o'zi turmaydi.

## Muammolarni bartaraf etish

| Belgi | Sabab va yechim |
|---|---|
| "Serverga ulanib bo'lmadi…" hamma sahifada | Brauzer DevTools → Network. `CORS` xatosi bo'lsa backend `CORS_ORIGINS` ga panel domenini qo'shing. So'rov noto'g'ri hostga ketsa — `VITE_API_URL` ni tekshiring |
| So'rovlar noto'g'ri API ga ketyapti | `curl https://<panel>/env-config.js` — konteyner qaysi `VITE_API_URL` bilan ishga tushganini ko'rsatadi. Bo'sh `{}` bo'lsa `.env` da o'zgaruvchi yo'q (build-time standart ishlatilyapti). `.env` o'zgargach konteynerni qayta yarating |
| Login'dan keyin darhol yana login sahifasi (401 aylanishi) | Backend `JWT_SECRET` bir nechta instance'da bir xilmi; server soati to'g'rimi (token `exp`); `/auth/refresh` ham CORS'dan o'tadimi. Brauzer'da `localStorage`/`sessionStorage` dagi `zahro_*` kalitlarni o'chirib qayta kiring |
| "Sessiya muddati tugagan, qayta kiring" tez-tez chiqadi | Refresh token rad etilyapti: backend `REFRESH_TOKEN_TTL_DAYS` kichik, token qayta ishlatilgan (sessiya oilasi bekor qilinadi) yoki parol boshqa joyda o'zgartirilgan (barcha sessiyalar bekor bo'ladi) |
| Deploy'dan keyin eski versiya ko'rinadi | `index.html` `no-cache` bilan beriladi — oddiy yangilash (F5) yetadi. Oldida CDN/proxy bo'lsa u `index.html` va `env-config.js` ni keshlamasligi kerak. Ochiq qolgan eski tab yangi deploy'dan keyin lazy sahifani yuklay olmasa — sahifani yangilang |
| Real vaqt murojaatlar kelmaydi | socket.io `VITE_API_URL` ga WebSocket orqali ulanadi — reverse proxy'da `Upgrade`/`Connection` header'lari o'tkazilishi kerak |
| Konteyner `unhealthy` | `docker logs zaxrodent_admin`; `docker exec zaxrodent_admin wget -qO- http://127.0.0.1:8070/healthz` |
