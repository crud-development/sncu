# Deploy pe Render

Aplicația (`app/`) rulează ca un singur **Web Service** Docker: NestJS servește
API-ul pe `/api` și SPA-ul React buildat pe `/app`. Landing-ul WordPress
(`wordpress/`) se instalează separat pe site-ul bioecolab.ro.

## 1. Baza de date (MongoDB Atlas)

Render nu oferă MongoDB gestionat. Creează un cluster gratuit pe
[MongoDB Atlas](https://www.mongodb.com/atlas), adaugă un user și permite accesul
(IP `0.0.0.0/0` sau IP-urile Render). Copiază connection string-ul în `MONGO_URI`.

## 2. Serviciul Render

Repo-ul conține [`render.yaml`](render.yaml) (Blueprint). În Render:

1. **New → Blueprint**, conectează `crud-development/sncu`, branch `main`.
2. Render detectează `render.yaml` și creează serviciul `sncu-app` (Docker,
   `app/Dockerfile`, context `app/`).
3. Completează variabilele marcate ca *secret* (`sync:false`):
   - `MONGO_URI` — din Atlas
   - `APP_URL` — URL-ul public, ex. `https://sncu-app.onrender.com`
   - `ADMIN_LOGIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
   - Oblio: `OBLIO_EMAIL`, `OBLIO_API_TOKEN`, `OBLIO_CIF`, `OBLIO_INVOICE_SERIES`
   - SMTP: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`
   - `JWT_SECRET` se generează automat.
4. Deploy. Health check: `/api/health`.

> Fără cheile Stripe/Oblio/SMTP, aplicația pornește în **mod mock** (plată
> simulată, factură mock, emailuri logate) — utilă pentru un mediu de staging.

## 3. Stripe webhook

După deploy, în Stripe Dashboard → Webhooks adaugă endpoint-ul:
`https://<APP_URL>/api/payments/webhook`, eveniment `payment_intent.succeeded`,
și pune secretul în `STRIPE_WEBHOOK_SECRET`.

## 4. Landing WordPress → aplicație

În pagina landing (plugin BioEcoLab), tab *General* → **URL aplicație (bază)**
setează `APP_URL`-ul Render (ex. `https://sncu-app.onrender.com`). Toate butoanele
„Generează contract" / „Autentificare" vor duce la aplicație.

## Build local (verificare)

```bash
cd app
docker build -t sncu-app .
docker run --rm -p 3000:3000 -e MONGO_URI="..." sncu-app
```
