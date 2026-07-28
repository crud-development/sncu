# BioEcoLab SNCU — aplicație fullstack

Backend **NestJS + MongoDB** care servește și frontendul **React + Vite (SPA)** buildat.
SPA-ul rulează din root (ex: `/login`, `/inregistrare`), legat de butoanele CTA
din landing page-ul WordPress. API-ul este pe `/api`.

## Structură

```
app/
├── docker-compose.yml   # MongoDB (host :27018) + mongo-express (:8082)
├── .env.example         # toate cheile (Mongo, JWT, Stripe, Oblio, SMTP, prețuri)
├── backend/             # NestJS — API + servire SPA din ../frontend/dist
└── frontend/            # React + Vite (portal client + admin)
```

## Rulare în dezvoltare

```bash
cd app
cp .env.example .env            # ajustează cheile (Stripe/Oblio/SMTP) după caz

docker compose up -d mongo      # MongoDB pe localhost:27018

# Backend (terminal 1)
cd backend && npm install && npm run start:dev   # http://localhost:3000

# Frontend (terminal 2) — dev server cu HMR + proxy /api → :3000
cd frontend && npm install && npm run dev        # http://localhost:5173/
```

> Notă: portul host Mongo este **27018** (27017 poate fi ocupat de alt proiect local).
> Vezi `MONGO_PORT` în `.env`.

## Build de producție (un singur server)

```bash
cd frontend && npm run build     # generează frontend/dist
cd ../backend && npm run build && npm run start:prod
# → NestJS servește API pe /api ȘI SPA-ul din root, pe http://localhost:3000
```

## Email în dev

Fără `SMTP_HOST` configurat, `MailService` doar loghează emailurile în consolă
(linkurile de activare/reset apar în log-ul backendului) — util pentru testare locală.

## Stare implementare

| Modul | Stare |
| ----- | ----- |
| Config, MongoDB, servire SPA | ✅ |
| MailService (SMTP / fallback log) | ✅ |
| Auth: register → activare → login → /me, JWT, reset parolă | ✅ |
| Portal: login, înregistrare, activare, reset, dashboard | ✅ |
| Profil firmă + administrator (precondiție contract) | ✅ |
| Puncte de lucru — CRUD, limită puncte plătite (US-04, US-05) | ✅ |
| Contracte — generare draft, semnătură electronică, PDF, serie+expirare (US-05) | ✅ |
| Settings — serie/numerotare contracte + comenzi, template-uri | ✅ |
| Comenzi — plasare cu toate câmpurile, statusuri, notificări, PDF, export CSV (US-06/07/08) | ✅ |
| Panou admin — clienți (+OP, impersonare), comenzi (status, cost), contracte (filtre, anulare, export), setări (secțiunea 4) | ✅ |
| Payments — Stripe Subscription anual + webhook, fallback mock | ✅ |
| Invoicing — Oblio (TVA din env, OP + Stripe, listă/retry admin) | ✅ |

## Plată (Stripe) + facturare (Oblio)

Fluxul de cumpărare (formularul din landing) funcționează cap-coadă și **fără chei**:
- Fără `STRIPE_SECRET_KEY` → mod **mock**: formularul afișează un buton de plată simulată;
  confirmarea creează contul `inactiv`, emite factură mock prin Oblio și trimite emailurile.
- Cu chei Stripe → **abonament anual** (Subscription) + Payment Element; la succes, webhook-ul
  (`/api/payments/webhook`) declanșează crearea contului + factura.
- Cu credențiale Oblio → factura se emite real (TVA = `VAT_RATE`) și se atașează pe email.
- Prelungirile OP din admin emit factură Oblio; eșecurile apar în **Admin → Facturi** (retry).

Preț fix anual: `PRICE_BASE` (default 330) lei + TVA `VAT_RATE` (default 0.21) → **399,30 lei/an**.
Provisioning-ul este idempotent (re-confirmarea nu creează cont dublu).

## Cont admin

La prima pornire se creează automat un cont de administrator (vezi log-ul backendului):
`office@bioecolab.ro` / `admin1234` (configurabil prin `ADMIN_LOGIN_EMAIL` / `ADMIN_PASSWORD`).
Adminul se loghează pe `/login` și e redirecționat în panoul de administrare.

## Flux auth (validat cap-coadă)

`POST /api/auth/register` → cont `inactiv` + email activare ·
`POST /api/auth/activate` (token + parolă) → cont `activ` + JWT ·
`POST /api/auth/login` → JWT · `GET /api/auth/me` (Bearer) → date cont.
