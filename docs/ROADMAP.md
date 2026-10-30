# Zahro Denta — yaxshilash rejasi

Maqsad: loyihani avval Zahro Denta uchun mukammallashtirish, keyin SaaS qilib ko'proq markazlarga sotish.
Tartib ta'sir kattaligi bo'yicha. Holat: hammasi **rejada** (hali qilinmagan), aks holda ko'rsatilgan.

Tavsiya etilgan ketma-ketlik: 10 → 9 → 1 → 3 → 2 → 5 → 7 → 8

## A. Klinikaga eng ko'p foyda

1. **Qarzdorlar sahifasi va to'lov eslatmasi** — backendda qarz hisobi bor, alohida ro'yxat yo'q. Kim, qancha, qachondan qarzdor; Telegram orqali eslatma tugmasi. *Foyda:* yo'qolgan pul qaytadi, daftar yuritish kerak emas.
2. **Bemorga fayl yuklash (rentgen, tahlil, oldin/keyin rasm)** — hozir yo'q. *Foyda:* hamma narsa bir joyda, qog'oz/galereya kerak emas.
3. **Audit log (kim nimani o'zgartirdi)** — hozir faqat bronlarda status logi bor; bemor, to'lov, foydalanuvchilarda yo'q. *Foyda:* pul va ma'lumot nizolari yo'qoladi.
4. **Chek/kvitansiya va retseptni PDF chop etish** (logotip bilan). *Foyda:* rasmiy ko'rinish, qog'oz retsept holatlari.

## B. Kundalik qulaylik

5. **Bronlar uchun Kanban doska** (Kutilmoqda → Keldi → Yakunlandi, sudrab status o'zgartirish, log bilan). Statuslar logi va dropdown allaqachon bor.
6. **Tezkor harakatlar va klaviatura qisqa yo'llari** (`Ctrl+K` qidiruv bor; yangi bemor/bron qo'shish).
7. **Bo'sh ro'yxat, yuklanish (skeleton) va xato holatlari** — hamma sahifada bir xil.
8. **Saqlanmagan o'zgarishlar ogohlantirishi** (yarim yozilgan bemor/retsept yopilib ketmasin).

## C. Ishonchlilik va xavfsizlik

9. **Dev saytni avtomatik joylash** — CD hozir faqat `main` uchun; dev sayt eskirib qoladi (2026-10-30 da aniqlandi). Dev server ulanish ma'lumotlari kerak.
10. **Admin parolini almashtirish** — dev admin paroli chatda ochiq yozilgan.
11. **Baza zaxirasi (backup) tekshiruvi** — bor-yo'qligi noma'lum.

## D. O'sish (keyinroq)

12. **Hisobotlar** — shifokor bo'yicha tushum, top xizmatlar, murojaat → bemor konversiyasi, Excel eksport.
13. **Bemorga avtomatik xabarlar** — qabul eslatmasi bor; tashrifdan keyin baholash, 6 oydan keyin tekshiruv eslatmasi.

## E. SaaS ga tayyorlash (yangi, rejalashtirish kerak)

- Ko'p klinika (multi-tenant): har klinikaning ma'lumoti ajratilgan, o'z logotipi/nomi/sozlamalari.
- Obuna va to'lov (tarif rejalari), klinika qo'shish (onboarding) jarayoni.
- Har klinika uchun alohida Telegram bot / SMS sozlamasi.
- Brend nomi — `BRAND-NAMES.md` ga qarang.

## Allaqachon qilinganlar (dev'da)

- Elektron retseptlar: shifokor yozadi, apteka kod/telefon bilan topib "berildi" deydi.
- Bron statuslari + o'zgarish logi (kim, qachon, sabab).
- Bemor qo'shish/tahrirlashda yosh o'rniga tug'ilgan yil.
- O'chirish/bekor qilishda tasdiq oynalari (murojaat, retsept, apteka).
- Ikonkali tugmalarda tooltip.
