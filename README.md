# Formation Platform

Plateforme de formation en ligne complète avec quiz, vidéos, groupes et calendrier de planification.

## Fonctionnalités

### Pour les apprenants
- Accès aux formations assignées
- Suivi de progression en temps réel
- Quiz interactifs avec résultats immédiats
- Calendrier des formations planifiées
- Système de badges et certifications
- Mode sombre

### Pour les formateurs
- Création de formations modulaires
- Éditeur de contenu (texte, vidéo, PDF)
- Création de quiz avec différents types de questions
- Suivi de la progression des apprenants
- Rapports et statistiques

### Pour les administrateurs
- Gestion des utilisateurs et des rôles
- Création et gestion des groupes
- Attribution de formations aux groupes
- Planification sur calendrier
- Tableaux de bord et analytics
- Journalisation des actions (audit)

## Stack technique

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de données**: PostgreSQL (Azure Flexible Server)
- **Authentification**: NextAuth.js avec Azure AD
- **Stockage**: Azure Blob Storage (vidéos, images, documents)
- **Monitoring**: Azure Application Insights
- **Infrastructure**: Terraform
- **CI/CD**: GitHub Actions

## Prérequis

- Node.js 20+
- PostgreSQL 15+
- Compte Azure (pour le déploiement)
- Application Azure AD configurée

## Installation locale

1. Cloner le repository
```bash
git clone https://github.com/anthonyshell9/formation-platform.git
cd formation-platform
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

4. Générer le client Prisma
```bash
npx prisma generate
```

5. Appliquer les migrations
```bash
npx prisma migrate dev
```

6. Lancer le serveur de développement
```bash
npm run dev
```

L'application est accessible sur http://localhost:3000

## Déploiement Azure

### Infrastructure avec Terraform

1. Se connecter à Azure
```bash
az login
```

2. Initialiser Terraform
```bash
cd infra
terraform init
```

3. Créer les ressources
```bash
terraform plan
terraform apply
```

### Configuration Azure AD

1. Créer une application dans Azure AD
2. Configurer les URLs de redirection
3. Récupérer les credentials (Client ID, Secret, Tenant ID)
4. Configurer les secrets GitHub

### Secrets GitHub requis

- `AZURE_CREDENTIALS`: Credentials du Service Principal
- `DATABASE_URL`: URL de connexion PostgreSQL
- `NEXTAUTH_SECRET`: Clé secrète NextAuth
- `NEXTAUTH_URL`: URL de l'application
- `AZURE_AD_CLIENT_ID`: ID de l'application Azure AD
- `AZURE_AD_CLIENT_SECRET`: Secret de l'application
- `AZURE_AD_TENANT_ID`: ID du tenant Azure AD

## Structure du projet

```
formation-platform/
├── .github/workflows/     # CI/CD GitHub Actions
├── infra/                 # Infrastructure Terraform
├── prisma/               # Schéma et migrations Prisma
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React
│   ├── lib/              # Utilitaires et configuration
│   └── types/            # Types TypeScript
└── public/               # Assets statiques
```

## API Routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/courses` | GET, POST | Liste et création de formations |
| `/api/courses/[id]` | GET, PUT, DELETE | Détail, modification, suppression |
| `/api/courses/[id]/modules` | GET, POST | Modules d'une formation |
| `/api/courses/[id]/enroll` | POST, DELETE | Inscription/désinscription |
| `/api/quizzes` | GET, POST | Liste et création de quiz |
| `/api/quizzes/[id]/attempt` | POST, PUT | Tentatives de quiz |
| `/api/groups` | GET, POST | Liste et création de groupes |
| `/api/groups/[id]/members` | GET, POST, DELETE | Membres d'un groupe |
| `/api/assignments` | GET, POST | Assignations de formations |
| `/api/upload` | POST | Upload de fichiers |

## Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| ADMIN | Accès total, gestion utilisateurs |
| TRAINER | Création formations et quiz |
| MANAGER | Gestion groupes et assignations |
| LEARNER | Consultation et progression |

## Scripts npm

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run lint` - Vérification ESLint
- `npm test` - Exécution des tests
- `npx prisma studio` - Interface Prisma Studio

## Licence

MIT
