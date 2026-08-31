# Endpoints victimes et photos

Ce document reprend les routes utiles pour récupérer les informations d'une
victime, notamment son nom, ses informations complètes et sa photo.

Les routes ci-dessous utilisent `NEXT_PUBLIC_API_BASE_URL` comme base URL côté
frontend. Exemple :

```http
https://api.exemple.com/victime/paginate/filtered?page=1&limit=20
```

## Base URL et variables `.env`

Pour intégrer ces endpoints dans une autre application front-end, reprendre les
variables d'environnement de la production et remplir au minimum
`NEXT_PUBLIC_API_BASE_URL`.

Template `.env` recommandé :

```bash
# API principale : victimes, documents, photos MinIO
NEXT_PUBLIC_API_BASE_URL=

# Authentification / vérification de session si l'autre app reprend le login existant
NEXT_PUBLIC_CORE_BASE_URL=

# Optionnel : upload de photos, seulement si l'autre app doit envoyer/modifier une photo
NEXT_PUBLIC_UPLOAD_ENDPOINT=

# Optionnel : redirection login/logout si l'autre app reprend le parcours d'auth
NEXT_PUBLIC_CORE_LOGIN_URL=
NEXT_PUBLIC_LOGOUT_URL=
```

Valeurs de développement/fallback repérées dans le projet :

```bash
NEXT_PUBLIC_API_BASE_URL=http://10.140.0.106:8006
NEXT_PUBLIC_API_PLANVIE_URL=http://10.140.0.104:8007
NEXT_PUBLIC_LOGOUT_URL=http://10.140.0.106:4201/login
NEXT_PUBLIC_UPLOAD_ENDPOINT=https://360.fonasite.app:5521/minio/files/upload
```

Pour les routes de ce document :

| Variable | Usage | Obligatoire |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL pour `/victime/*` et `/minio/files/*` | Oui |
| `NEXT_PUBLIC_CORE_BASE_URL` | API d'authentification, utilisée par `/auth/login` et `/auth/verify-token` | Si l'app gère aussi le login |
| `NEXT_PUBLIC_UPLOAD_ENDPOINT` | Upload MinIO, utilisé uniquement pour envoyer une nouvelle photo | Non pour la lecture |
| `NEXT_PUBLIC_CORE_LOGIN_URL` | Base URL du login côté interface | Non pour la lecture |
| `NEXT_PUBLIC_LOGOUT_URL` | URL complète de redirection logout/login | Non pour la lecture |

L'application actuelle envoie l'authentification via le client `authenticatedFetch`.
Dans une autre application, il faut donc reprendre le même mécanisme
d'authentification, généralement un jeton `Authorization: Bearer ...` ou la
session attendue par l'API.

## Champs importants

Les endpoints qui retournent des victimes renvoient généralement un objet victime
avec les champs suivants, selon les données disponibles :

```ts
{
  id: number;
  nom?: string;
  postnom?: string;
  prenom?: string;
  dateNaissance?: string;
  age?: number;
  sexe?: string;
  categorie?: string;
  nationalite?: string;
  etatMatrimonial?: string;
  adresse?: string;
  commune?: string;
  province?: string;
  territoire?: string;
  village?: string;
  provinceOrigine?: string;
  communeOrigine?: string;
  territoireOrigine?: string;
  villageOrigine?: string;
  groupement?: string;
  nomPere?: string;
  nomMere?: string;
  provinceIncident?: string;
  communeIncident?: string;
  territoireIncident?: string;
  lieuIncident?: string;
  dateIncident?: string;
  typeViolation?: string;
  prejudicesSubis?: string;
  mention?: string;
  status?: string;
  dossier?: string;
  photo?: string | null;
  commentaire?: string;
  variablesSpecifiques?: Record<string, unknown>;
}
```

Pour afficher le nom complet, utiliser de préférence :

```ts
const nomComplet = [victime.nom, victime.postnom, victime.prenom]
  .filter(Boolean)
  .join(' ');
```

## 1. Liste paginée des victimes

```http
GET /victime/paginate/filtered?page=1&limit=20
```

Cette route permet de récupérer une liste paginée de victimes avec leurs
informations principales, dont le champ `photo` quand il existe.

Paramètres courants :

| Paramètre | Exemple | Description |
| --- | --- | --- |
| `page` | `1` | Page à récupérer |
| `limit` | `20` | Nombre de victimes par page |
| `nom` | `Jean` | Recherche par nom |
| `mention` | `LUC` | Filtre par mention : `LUC`, `MPU`, `PECMU`, etc. |
| `agentReparation` | `Diane Asele` | Filtre par agent de réparation |
| `province` | `Kinshasa` | Filtre géographique |
| `territoire` | `Boma` | Filtre géographique |
| `sexe` | `Femme` | Filtre par sexe |
| `categorie` | `Victime directe` | Filtre par catégorie |
| `prejudiceFinal` | `Perte de vie` | Filtre par préjudice final |
| `status` | `Confirmé` | Filtre par statut |

Exemples :

```http
GET /victime/paginate/filtered?page=1&limit=20
GET /victime/paginate/filtered?page=1&limit=20&mention=LUC
GET /victime/paginate/filtered?page=1&limit=20&nom=Jean
GET /victime/paginate/filtered?page=1&limit=20&province=Kinshasa&mention=LUC
```

Réponse attendue :

```json
{
  "data": [
    {
      "id": 123,
      "nom": "Kabasele",
      "postnom": "Mbuyi",
      "prenom": "Jean",
      "mention": "LUC",
      "province": "Kinshasa",
      "territoire": "Funa",
      "photo": "photos/victim_photo_123.jpg"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## 2. Liste paginée des victimes ayant une photo

```http
GET /victime/paginate/photo-not-null?page=1&limit=20
```

Cette route permet de récupérer uniquement les victimes dont le champ `photo`
est renseigné.

Exemples :

```http
GET /victime/paginate/photo-not-null?page=1&limit=20
GET /victime/paginate/photo-not-null?page=1&limit=20&mention=LUC
GET /victime/paginate/photo-not-null?page=1&limit=20&nom=Jean
```

La structure de réponse est la même que `/victime/paginate/filtered`.

## 3. Détail complet d'une victime

```http
GET /victime/:id
```

Cette route sert à récupérer les informations complètes d'une victime précise.
Elle est utile après avoir sélectionné une victime depuis une liste paginée.

Exemple :

```http
GET /victime/123
```

Réponse possible :

```json
{
  "id": 123,
  "nom": "Kabasele",
  "postnom": "Mbuyi",
  "prenom": "Jean",
  "mention": "LUC",
  "dateNaissance": "1980-01-01",
  "sexe": "Homme",
  "province": "Kinshasa",
  "territoire": "Funa",
  "village": "Non renseigné",
  "typeViolation": "Atteinte à l'intégrité physique",
  "prejudicesSubis": "Préjudice corporel",
  "indemnisation": 4320,
  "photo": "photos/victim_photo_123.jpg",
  "variablesSpecifiques": {}
}
```

Selon les endpoints, la réponse peut aussi être enveloppée ainsi :

```json
{
  "data": {
    "id": 123,
    "nom": "Kabasele",
    "photo": "photos/victim_photo_123.jpg"
  }
}
```

## 4. Victimes filtrées par agent de réparation

```http
GET /victime/agent-reparation?page=1&limit=20&agentReparation=Diane%20Asele
GET /victime/filtre/agent-reparation?agentReparation=Diane%20Asele&page=1&limit=20
```

Ces routes permettent de récupérer les victimes associées à un agent de
réparation. Elles retournent des objets victimes et peuvent donc contenir le
champ `photo`.

Variante utilisée pour la LUC :

```http
GET /victime/filtre/agent-reparation/LUC?agentReparation=Diane%20Asele&page=1&limit=20
```

## 5. Victimes recontactées PECMU

```http
GET /victime/recontacte/PECMU?page=1&limit=20
```

Cette route est utilisée pour récupérer des victimes PECMU recontactées. Dans
l'application actuelle, une victime est considérée recontactée lorsqu'elle a une
photo et/ou une pièce, mais pour l'exploitation photo il faut vérifier le champ
`photo` de chaque victime retournée.

## 6. Résolution de la photo

Le champ `photo` d'une victime peut être :

- une URL directe commençant par `http` ;
- une image locale/base64 commençant par `data:` ;
- une clé ou un chemin de fichier MinIO.

Si `photo` est déjà une URL directe ou un `data:`, elle peut être utilisée
directement comme source d'image.

Si `photo` est une clé MinIO, résoudre le fichier avec :

```http
GET /minio/files/:photo
```

Exemple :

```http
GET /minio/files/photos/victim_photo_123.jpg
```

Réponse utilisée par le frontend :

```json
{
  "data": {
    "src": "https://signed-url-ou-url-publique/image.jpg"
  }
}
```

Ensuite, afficher l'image avec :

```html
<img src="data.src" alt="Photo de la victime" />
```

## 7. Exemple d'intégration

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL doit être configurée');
}

async function getVictimesLucAvecPhoto(token: string) {
  const response = await fetch(
    `${API_BASE_URL}/victime/paginate/photo-not-null?page=1&limit=20&mention=LUC`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const payload = await response.json();
  return payload.data ?? [];
}

async function resolvePhotoSrc(photo: string, token: string) {
  if (!photo) return null;
  if (photo.startsWith('http') || photo.startsWith('data:')) return photo;

  const response = await fetch(`${API_BASE_URL}/minio/files/${photo}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  return payload?.data?.src ?? null;
}
```

## 8. Exemple de client API réutilisable

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiGet(path: string, token: string) {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL doit être configurée');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur API ${response.status}`);
  }

  return response.json();
}

export function getVictimesAvecPhoto(page = 1, limit = 20, mention = 'LUC') {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    mention,
  });

  return `/victime/paginate/photo-not-null?${params.toString()}`;
}

export function getPhotoUrl(photo: string) {
  if (photo.startsWith('http') || photo.startsWith('data:')) {
    return photo;
  }

  return `/minio/files/${photo}`;
}
```

## Routes à privilégier

Pour une autre application qui veut afficher les victimes avec leurs noms,
informations et photos :

1. Utiliser `GET /victime/paginate/photo-not-null?page=1&limit=20&mention=LUC`
   si seules les victimes avec photo sont nécessaires.
2. Utiliser `GET /victime/paginate/filtered?page=1&limit=20&mention=LUC`
   pour toutes les victimes LUC, puis filtrer localement celles qui ont `photo`.
3. Utiliser `GET /victime/:id` pour ouvrir une fiche détaillée.
4. Utiliser `GET /minio/files/:photo` seulement quand le champ `photo` n'est pas
   déjà une URL directe.
