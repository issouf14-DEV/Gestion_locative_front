# Gestion Locative - Frontend

Application web de gestion locative immobiliere en Cote d'Ivoire. Elle permet aux proprietaires de gerer leurs biens, locataires, loyers, charges et reservations, et aux locataires de consulter leurs factures et effectuer des paiements.

## Apercu

- **Vitrine publique** : catalogue de maisons avec recherche, filtres et details
- **Espace admin** : tableau de bord, gestion des maisons, locataires, loyers, factures, depenses, notifications
- **Espace locataire** : tableau de bord personnel, charges, paiements, prolongation de bail, profil
- **Authentification** : inscription/connexion par email ou Google OAuth 2.0

## Stack technique

| Categorie | Technologies |
|-----------|-------------|
| Framework | React 19, Vite 8 |
| Styling | Tailwind CSS 3, Shadcn/UI (Radix UI) |
| State & Data | TanStack React Query v5, Zustand |
| Formulaires | React Hook Form, Zod |
| Graphiques | Recharts |
| Routing | React Router v7 |
| HTTP | Axios |
| PDF | jsPDF, jspdf-autotable |
| Auth | JWT (access/refresh tokens), Google Identity Services |

## Structure du projet

```
src/
├── assets/              # Images et ressources statiques
├── components/
│   ├── auth/            # AuthDialog (modal connexion/inscription)
│   ├── common/          # Composants reutilisables (StatCard, PageHeader...)
│   ├── layout/          # PublicHeader, AdminLayout, TenantLayout
│   └── ui/              # Composants Shadcn/UI
├── hooks/               # Hooks personnalises (useAuth, useNotifications...)
├── lib/
│   ├── api/
│   │   ├── axios.js     # Instance Axios avec intercepteurs JWT
│   │   ├── endpoints.js # Centralisation des endpoints API
│   │   └── queries/     # Hooks React Query (auth, properties, billing...)
│   ├── store/           # Stores Zustand (auth, notifications)
│   └── utils/           # Fonctions utilitaires (formatters...)
├── pages/
│   ├── admin/           # Dashboard, Maisons, Locataires, Loyers, Factures...
│   ├── public/          # Home, MaisonDetails
│   └── tenant/          # Dashboard, Charges, Paiement, Profil...
└── main.jsx             # Point d'entree
```

## Installation

### Prerequis

- Node.js >= 18
- npm ou yarn
- Backend API en cours d'execution ([voir le repo backend](https://github.com/issouf14-DEV))

### Etapes

1. **Cloner le projet**
   ```bash
   git clone https://github.com/issouf14-DEV/Gestion_locative_front.git
   cd Gestion_locative_front
   ```

2. **Installer les dependances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```
   Remplir les valeurs dans `.env` :
   - `VITE_API_URL` : URL de l'API backend
   - `VITE_GOOGLE_CLIENT_ID` : Client ID Google OAuth (depuis [Google Cloud Console](https://console.cloud.google.com/))
   - `VITE_IMAGE_BASE_URL` : URL de base pour les images

4. **Lancer le serveur de developpement**
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`

5. **Build de production**
   ```bash
   npm run build
   ```

## Fonctionnalites

### Public
- Catalogue de maisons avec vue grille/liste
- Recherche par titre, quartier, commune
- Filtres par commune, prix, nombre de chambres
- Page de details avec galerie d'images et formulaire de reservation

### Administrateur
- Tableau de bord avec KPIs (taux d'occupation, revenus, depenses)
- Graphiques : evolution des revenus, repartition des depenses, locations actives
- Gestion des maisons (CRUD, upload d'images via Cloudinary)
- Gestion des locataires et de leurs baux
- Gestion des loyers et factures (LOYER, SODECI)
- Suivi des depenses par categorie
- Export PDF des rapports mensuels
- Notifications en temps reel

### Locataire
- Tableau de bord personnalise avec solde et echeances
- Consultation et paiement des charges (loyer, eau)
- Demande de prolongation de bail
- Gestion du profil

## Deploiement

L'application peut etre deployee sur **Render**, **Vercel**, **Netlify** ou tout autre service d'hebergement statique.

### Variables d'environnement a configurer sur la plateforme :
- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_IMAGE_BASE_URL`

### Google OAuth en production
Dans la [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials, ajouter l'URL de production dans les **Origines JavaScript autorisees** et les **URI de redirection autorises**.

## Scripts disponibles

| Commande | Description |
|----------|------------|
| `npm run dev` | Serveur de developpement avec HMR |
| `npm run build` | Build de production |
| `npm run preview` | Previsualiser le build |
| `npm run lint` | Linter ESLint |

## Licence

Ce projet est prive et reserve a un usage interne.
