================================================================================
SITE ACTEUR & SCÉNARISTE — GUIDE D'INSTALLATION ET DE DÉPLOIEMENT
================================================================================

CONTENU DE L'EXPORT
-------------------
frontend/   Application React (interface publique + panneau admin)
backend/    API FastAPI (Python) + connexion MongoDB
README.txt  Ce fichier

NOTE SÉCURITÉ : les fichiers .env réels ne sont PAS inclus dans cet export
(ils contiennent vos clés secrètes). Utilisez les fichiers .env.example
fournis et remplissez vos propres valeurs (voir section 2).


================================================================================
1. INSTALLATION EN LOCAL
================================================================================

Prérequis : Node.js 18+ (avec yarn ou npm), Python 3.10+, MongoDB en local
(mongodb://localhost:27017) ou une URL MongoDB Atlas.

--- Backend (FastAPI) ---
cd backend
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # puis remplissez les valeurs (section 2)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

L'API répond sur http://localhost:8001/api

--- Frontend (React) ---
cd frontend
yarn install                    # ou : npm install
cp .env.example .env            # puis renseignez REACT_APP_BACKEND_URL
yarn start                      # ou : npm run start

Le site tourne sur http://localhost:3000

(Note : ce projet utilise "yarn start" / "npm run start" — il n'y a pas de
script "npm run dev", c'est l'équivalent pour ce stack Create React App.)

--- Panneau admin ---
URL : http://localhost:3000/admin
Email et mot de passe : ceux définis dans backend/.env (ADMIN_EMAIL /
ADMIN_PASSWORD). Le compte admin est créé automatiquement au premier
démarrage du backend.


================================================================================
2. VARIABLES D'ENVIRONNEMENT
================================================================================

backend/.env :
  MONGO_URL            URL de connexion MongoDB (ex: mongodb://localhost:27017)
  DB_NAME              Nom de la base (ex: exauce_site)
  JWT_SECRET           Clé secrète longue et aléatoire (64 caractères hex)
  ADMIN_EMAIL          Email du compte administrateur
  ADMIN_PASSWORD       Mot de passe du compte administrateur
  FRONTEND_URL         URL publique du frontend (ex: http://localhost:3000)
  EMERGENT_LLM_KEY     Clé pour les fonctions IA (assistant d'écriture + chat)
                       et le stockage de fichiers (uploads images/PDF)
  INTEGRATION_PROXY_URL  (optionnel) URL du proxy de stockage ; par défaut
                       https://integrations.emergentagent.com

frontend/.env :
  REACT_APP_BACKEND_URL  URL publique du backend, SANS /api
                         (ex: http://localhost:8001 en local,
                          https://votre-api.com en production)


================================================================================
3. DÉPLOIEMENT SUR VERCEL
================================================================================

IMPORTANT : Vercel héberge le FRONTEND (site statique React). Le backend
FastAPI doit être hébergé séparément (Railway, Render, ou un VPS) — Vercel
ne fait pas tourner une API Python persistante avec MongoDB sans adaptation.

--- Étape A : déployer le backend d'abord (ex: Railway / Render) ---
1. Poussez le dossier backend/ sur GitHub.
2. Créez un service Web : commande de démarrage
   "uvicorn server:app --host 0.0.0.0 --port $PORT"
3. Ajoutez TOUTES les variables backend/.env dans les réglages du service,
   avec FRONTEND_URL = l'URL Vercel de votre frontend (étape B).
4. Notez l'URL publique obtenue (ex: https://votre-api.up.railway.app).

--- Étape B : déployer le frontend sur Vercel ---
1. Poussez le dossier frontend/ sur GitHub (racine du repo = frontend/).
2. Sur vercel.com : "Add New Project" > importez le repo.
3. Framework preset : Create React App (détecté automatiquement).
   Build command : yarn build     Output directory : build
4. Variables d'environnement à ajouter dans Vercel :
   REACT_APP_BACKEND_URL = https://votre-api.up.railway.app
5. Ajoutez un fichier vercel.json à la racine de frontend/ pour le routage
   SPA (déjà inclus dans cet export) :
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
6. Deploy. Votre site est en ligne.

--- Étape C : vérifications après déploiement ---
- Le site s'ouvre et communique avec l'API (les scénarios s'affichent).
- /admin accessible avec vos identifiants ADMIN_EMAIL / ADMIN_PASSWORD.
- Les uploads d'images et les fonctions IA nécessitent EMERGENT_LLM_KEY
  valide côté backend.


================================================================================
4. REMPLACER LE CONTENU D'EXEMPLE
================================================================================
Tout le contenu (nom, photos, bande démo YouTube, fiche technique, scénarios,
CV PDF, liens) se modifie depuis /admin — aucune modification de code
nécessaire. La bande démo actuelle est une vidéo placeholder : collez l'URL
de votre vidéo YouTube non répertoriée dans Admin > Contenu acting.

Support Emergent : https://emergent.sh
