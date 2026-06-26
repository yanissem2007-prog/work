# Déploiement de WORK — guide pas à pas (100% gratuit)

Architecture en prod :

| Brique | Hébergeur | Gratuit |
|---|---|---|
| Frontend (Next.js) | **Vercel** | ✅ |
| Backend (Express + Socket.io + BullMQ) | **Render** | ✅ |
| Base de données | **MongoDB Atlas** | ✅ |
| Redis (jobs + sockets) | **Upstash** | ✅ |
| IA | **Groq** | ✅ |

> Ordre important : DB + Redis d'abord → Backend → Frontend → on relie les URLs.

---

## 0. Pousser le code sur GitHub

Le repo existe déjà (`github.com/yanissem2007-prog/work`). Il faut juste pousser la dernière version :

```bash
git add -A
git commit -m "chore: prep deployment (render blueprint, AI key support)"
git push origin main
```

> Le fichier `.env` n'est **pas** poussé (il est dans `.gitignore`). Les secrets se mettent dans les dashboards.

---

## 1. MongoDB Atlas (base de données)

1. Va sur **https://www.mongodb.com/cloud/atlas/register** → crée un compte (sans carte).
2. **Create a cluster** → choisis **M0 (Free)** → région la plus proche (ex. Paris/Frankfurt).
3. **Database Access** → *Add New Database User* → user + mot de passe (note-les).
4. **Network Access** → *Add IP Address* → **0.0.0.0/0** (autorise Render).
5. **Database → Connect → Drivers** → copie l'URI :
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/work?retryWrites=true&w=majority
   ```
   ⚠️ remplace `USER`/`PASSWORD` et ajoute `/work` (le nom de la base) avant le `?`.
   → c'est ton **`MONGODB_URI`**.

---

## 2. Upstash (Redis)

1. Va sur **https://console.upstash.com** → crée un compte (sans carte).
2. **Create Database** → type **Redis** → région proche → *Free*.
3. Onglet du Redis → section **Connect / `redis://`** → copie l'URL **TLS** :
   ```
   rediss://default:XXXXX@eu1-xxxx.upstash.io:6379
   ```
   → c'est ton **`REDIS_URL`** (bien `rediss://` avec deux « s »).

---

## 3. Render (backend API)

1. Va sur **https://render.com** → *Sign up with GitHub* (sans carte).
2. **New → Blueprint** → sélectionne le repo `work`. Render lit `render.yaml` et crée le service `work-api`.
3. Dans l'onglet **Environment**, renseigne les variables marquées « à définir » :
   | Variable | Valeur |
   |---|---|
   | `MONGODB_URI` | (étape 1) |
   | `REDIS_URL` | (étape 2) |
   | `OPENAI_API_KEY` | ta clé Groq `gsk_...` |
   | `CORS_ORIGIN` | *(laisse vide pour l'instant — on revient à l'étape 5)* |
   | `OAUTH_CALLBACK_BASE` | *(optionnel, voir plus bas)* |
   - `JWT_*`, `OPENAI_BASE_URL`, `AI_MODEL` sont déjà remplis automatiquement.
4. **Deploy**. Attends le build (~3-5 min). Quand c'est vert, copie l'URL publique :
   ```
   https://work-api.onrender.com
   ```
   Teste : ouvre `https://work-api.onrender.com/health` → doit répondre `{"ok":true,...}`.

> ⏱️ Le plan gratuit Render **s'endort après 15 min** d'inactivité. Le 1er appel après une pause prend ~30 s à réveiller, puis c'est rapide. Pour un MVP c'est OK.

---

## 4. Vercel (frontend)

1. Va sur **https://vercel.com** → *Sign up with GitHub* (sans carte).
2. **Add New → Project** → importe le repo `work`.
3. **Root Directory** → clique *Edit* → choisis **`apps/web`**.
   - Framework: *Next.js* (auto-détecté). Build/Install : laisser par défaut.
4. **Environment Variables** → ajoute :
   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://work-api.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://work-api.onrender.com` |
5. **Deploy**. À la fin tu obtiens :
   ```
   https://work-xxxx.vercel.app
   ```

---

## 5. Relier les deux (CORS) — étape à NE PAS oublier

Le backend doit autoriser le domaine du frontend, sinon le navigateur bloque tout.

1. Retourne sur **Render → work-api → Environment**.
2. Mets :
   ```
   CORS_ORIGIN = https://work-xxxx.vercel.app
   ```
   (le domaine Vercel exact de l'étape 4 ; sans `/` final). Plusieurs domaines = séparés par virgule.
3. (Optionnel OAuth) `OAUTH_CALLBACK_BASE = https://work-api.onrender.com/api/v1/auth/oauth`.
4. **Save** → Render redéploie tout seul.

---

## 6. Vérification finale

- `https://work-api.onrender.com/health` → `{ ok: true }` ✅
- Ouvre le site Vercel → crée un compte → connecte-toi.
- Va sur le chat IA → le bot répond avec le **vrai modèle** (Groq Llama 3.3 70B).
- Ouvre la console du navigateur (F12) : aucune erreur **CORS** ni **socket**.

---

## Variables d'environnement — récap

**Render (backend) :**
```
NODE_ENV=production
CORS_ORIGIN=https://work-xxxx.vercel.app
MONGODB_URI=mongodb+srv://...
REDIS_URL=rediss://...
JWT_ACCESS_SECRET=(auto)
JWT_REFRESH_SECRET=(auto)
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.3-70b-versatile
```

**Vercel (frontend) :**
```
NEXT_PUBLIC_API_URL=https://work-api.onrender.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://work-api.onrender.com
```

## Optionnel (fonctionnent sans, mais à activer plus tard)
- **Uploads d'avatars** : compte **Cloudinary** (gratuit) → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` sur Render.
- **Emails** (vérif/reset) : **Mailtrap** ou un SMTP → `MAILTRAP_*` sur Render.
- **Login Google/GitHub** : créer les OAuth apps → `GOOGLE_*` / `GITHUB_*` sur Render.

## Alternative payante (si tu veux éviter les cold starts)
**Railway** (~5 $/mois) héberge backend + Redis + Mongo ensemble (always-on). Sinon le combo gratuit ci-dessus reste parfait pour démarrer.

## Dépannage
- **CORS error** → `CORS_ORIGIN` ne correspond pas exactement au domaine Vercel (pas de `/` final).
- **502 / lent au 1er chargement** → Render gratuit qui se réveille (~30 s). Normal.
- **Socket ne connecte pas** → vérifie `NEXT_PUBLIC_SOCKET_URL` (sans `/api/v1`).
- **Redis quota** (Upstash gratuit) → si les jobs saturent, passe Redis en payant ou héberge sur Railway.
- **Mongo auth failed** → mot de passe mal copié ou IP non autorisée (0.0.0.0/0).
