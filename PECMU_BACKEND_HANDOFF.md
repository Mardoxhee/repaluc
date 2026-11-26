# PECMU FONOPS — Guide d’intégration backend

Ce guide décrit les requêtes qu’émet le frontend pour les retours de `fonops_feedback.docx`. Les chemins HTTP sont relatifs à `NEXT_PUBLIC_API_BASE_URL`. La page du navigateur est `/reparations/pecmu`. Les chemins ci-dessous correspondent aux appels du client. Les ajouts décrits pour le serveur sont à implémenter ou à vérifier sur l’API de recette. Les exemples utilisent des identifiants de recette.

## Ordre de livraison

1. Préparer le stockage des sources ordonnées, de l’auteur de la fiche, du type d’admission et des fichiers de facture. Conserver les anciens identifiants et les données existantes.
2. Exposer les droits du demandeur dans les listes, les détails et le workflow. Les contrôler sur les écritures et les téléchargements.
3. Adapter les écritures et lectures F2, la détection des doublons et les statistiques personnelles.
4. Rendre éditables le médecin et la date de décision. Livrer la création des épisodes de soins, les transferts, les réadmissions et leurs factures.
5. Vérifier les champs de psychologie et la réponse de téléchargement. Exécuter la recette en fin de document avec deux comptes de recette.

Le client envoie le jeton Bearer via `authenticatedFetch`. Les requêtes JSON utilisent `Content-Type: application/json`. Les dépôts de fichiers utilisent un champ multipart `file` avec la frontière définie par le navigateur. Renvoyer les erreurs avec un code HTTP d’échec et un objet JSON comprenant `code` et `message` (chaîne ou tableau de messages). Les réponses déjà prises en charge sont détaillées ci-dessous.

## Lecture des dossiers créés par un autre agent

Le frontend lit le droit renvoyé par le serveur dans `PecmuModulePage.tsx`, `PecmuDossierModal.tsx` et `PecmuPsychologicalCare.tsx` sous `app/reparations/pecmu/`. Les types et le chargement se trouvent dans `app/reparations/services/pecmuApi.ts` et `app/reparations/services/pecmuWorkflowApi.ts`.

1. À la création d'une fiche, rattacher son auteur au sujet authentifié, côté serveur. Pour les anciennes fiches, utiliser l'information de création existante ou définir l'auteur à partir de l'audit disponible. En cas d'auteur indéterminé, donner la lecture seule aux lecteurs autorisés.
2. Calculer les droits pour le demandeur sur chaque fiche. Un agent autorisé à consulter le dossier d'un autre agent reçoit `canRead: true, canEdit: false`. Pour le créateur, appliquer les habilitations d'écriture métier existantes. Déduire l'auteur et les droits de la session serveur.
3. Dans `GET /fiche-pecmu` et `GET /fiche-pecmu/by-victime/:id`, inclure sur chaque entrée visible le champ `access: { canRead: boolean, canEdit: boolean }`. Appliquer le même périmètre à la pagination, aux compteurs et aux suggestions de doublons. Exemple de fiche en liste ou dans `GET /fiche-pecmu/42` : `{"id":42,"status":"BROUILLON","access":{"canRead":true,"canEdit":false}}`.
4. Dans `GET /fiche-pecmu/42/workflow`, retourner par exemple `{"fiche":{"id":42,"status":"BROUILLON"},"access":{"canRead":true,"canEdit":false},"currentStatus":"CERTIFICATION_PENDING","nextActions":[],"consents":[],"medicalCare":[],"followUps":[]}`. Les habilitations et le cycle métier sont deux informations distinctes. Un lecteur accède aux onglets, aux documents, aux rapports et aux historiques via les GET autorisés. Une fiche hors périmètre donne HTTP 403 ou 404. Le backend doit toujours émettre les deux booléens. Pendant le déploiement, les anciennes réponses sans champ access conservent le comportement d'édition existant sous contrôle du backend.
5. Sur toutes les mutations d'une fiche et de ses ressources enfants (brouillon, certification, rattachement, consentement, soins, transfert, factures, réadmission, psychologie, suivis, orientations, fichiers), vérifier les droits sur la fiche parente avant écriture, y compris en cas d'appel direct. Exemple de réponse à `PATCH /fiche-pecmu/42` avec `{"status":"SOUMIS"}` par un lecteur : HTTP 403 et `{"statusCode":403,"code":"INSUFFICIENT_PERMISSIONS","message":"Ce dossier est en lecture seule."}`.
6. Recette avec deux comptes. A crée un brouillon et le retrouve avec « Voir » et « Éditer ». B, lecteur du dossier, retrouve « Voir » et ouvre tous les onglets, les fiches de soins et les pièces jointes. Les actions de modification et de dépôt sont masquées. Un PATCH direct de B retourne 403 et l'état reste inchangé. A peut enregistrer ses modifications et soumettre le brouillon. Aucun câblage frontend supplémentaire après livraison de ces réponses.

## Sources multiples de l’alerte

1. Étendre les DTO de création et de modification de fiche. Le frontend envoie `alertSources` au POST `/fiche-pecmu` (F2 soumis ou brouillon), au PUT `/fiche-pecmu/:id` (édition F2) et au PATCH/PUT de ce même chemin (édition dans Identification et alerte). Le tableau est ordonné et remplace **toutes** les sources lorsqu’il est fourni. L’omission de ce champ conserve la liste, notamment avec le PATCH de soumission qui contient uniquement le statut.
2. Exemple de corps (extrait) : `{"alertSources":[{"structureType":"ONG","structureName":"Association A","contactName":"Contact A","phone":"+243…","relationship":"Relais","address":"Quartier A"},{"structureType":"AUTRE","otherStructureType":"Famille","contactName":"Contact B"}]}`. Chaque propriété de source est une chaîne. Le frontend omet les champs vides et les lignes entièrement vides. Sur une fiche soumise, exiger au moins une source et un `structureType` parmi `STRUCTURE_MEDICALE|ONG|RELAIS_COMMUNAUTAIRE|SERVICE_PUBLIC|AUTRE` par ligne. Exiger `otherStructureType` si `AUTRE`. Nom de structure, personne, téléphone, relation et adresse restent facultatifs. Pour BROUILLON, accepter liste vide et sources partielles. Valider les données persistées à la soumission du brouillon, répondre 400/422 avec le détail si incomplet.
3. Conserver l’ordre. Dans les écritures anciennes, accepter les colonnes scalaires lorsqu’aucun tableau n’est fourni. Migrer les lignes existantes avec les correspondances `alertSourceStructureName→structureName`, `alertSourceStructureType→structureType`, `alertSourceOtherStructureType→otherStructureType`, `alertSourceFullName→contactName`, `alertSourcePhone→phone`, `alertSourceRelationship→relationship`, `alertSourceAddress→address`. Pour les anciennes lignes dont la migration serait différée, renvoyer les colonnes historiques et omettre alertSources. Une liste [] explicite est prioritaire.
4. Après POST, retourner 201 avec le champ numérique id. Renvoyer `alertSources` dans la liste paginée, la liste par victime, le détail et la fiche du workflow. L’éditeur se préremplit depuis ces réponses. Pour la mise à jour par PUT, retourner 200 et une fiche JSON (le client attend un corps). Exemple de fiche : `{"id":42,"status":"BROUILLON","alertSources":[{"structureType":"ONG","structureName":"Association A"}]}`.
5. Recette : saisir une structure et un relais, les sauvegarder en brouillon, éditer et supprimer l’une des sources; après rechargement, contrôler les détails et la vue en lecture seule. Reprendre également un ancien brouillon local ou un dossier à source scalaire. Le backend doit bloquer les écritures sans droit.
Frontend : app/reparations/services/pecmuAlertSources.ts, app/reparations/services/pecmuApi.ts, app/reparations/pecmu/PecmuAlertSources.tsx, PecmuModulePage.tsx et PecmuDossierModal.tsx.

## Avertissement de doublon

1. Au POST /fiche-pecmu (soumission immédiate) et au PATCH /fiche-pecmu/:id de passage à SOUMIS, comparer aux **autres fiches soumises et actives** selon l'identité (même identifiant de victime (`victimeId`) quand disponible, sinon même nom normalisé et province), date/période des faits et au moins une violation commune. Si identité, période ou violation insuffisante, ignorer le rapprochement automatique. Comparer les dates calendaires exactes (une date = début et fin identiques), normaliser espaces, accents et casse, découper les violations sur « ; ». Ne comparer que dans le périmètre de lecture autorisé. Ce critère opérationnel est celui retenu pour la recette. Le backend calcule les correspondances.
2. En l’absence de correspondance, traiter la mutation normalement. Sinon répondre **avant toute écriture** HTTP 409 et JSON `{"code":"PECMU_POSSIBLE_DUPLICATE","message":"Une fiche similaire existe déjà.","matches":[{"id":42},{"id":57}]}`. Au PATCH, vérifier la fiche enregistrée et exclure son propre identifiant. L’enregistrement ou l’édition d’un brouillon doit pouvoir se faire sans avertissement.
3. L’interface montre les identifiants et deux choix. Annuler conserve la saisie. Confirmer rejoue la même requête avec le même corps, même route et même méthode, avec **X-Confirm-Duplicate: true**. Autoriser cet en-tête dans le CORS/API gateway. Il lève seulement l’avertissement, toutes les permissions et validations métier sont toujours appliquées. Le PATCH de soumission reste `{"status":"SOUMIS"}`, accepte 200 ou 204. Les autres erreurs ne déclenchent aucune nouvelle tentative automatique.
4. Recette : même victime, mêmes dates et violation → 409, aucun dossier écrit; annuler conserve le formulaire et les données; confirmer crée une seule nouvelle fiche (ou change le statut du même brouillon); une autre période passe normalement. Un utilisateur ne voit que des identifiants dans son périmètre.
Frontend : app/reparations/pecmu/PecmuModulePage.tsx (withDuplicateConfirmation), app/reparations/services/pecmuApi.ts (createFichePecmu / submitFichePecmu). Aucun endpoint de précontrôle requis.

## Brouillons, identité et statistiques personnelles

| Action | Requête | Résultat attendu |
|---|---|---|
| Saisie locale de la nouvelle alerte | IndexedDB dans le navigateur | Reprise du F2 sur le même appareil et le même compte. Le bouton « Enregistrer le brouillon » est l’action qui crée la fiche serveur. |
| Enregistrer un brouillon incomplet | `POST /fiche-pecmu` avec `"status":"BROUILLON"` et les champs saisis | 201 avec la fiche et son `id`. La fiche réapparaît comme brouillon dans les listes. |
| Reprendre une modification locale de brouillon | IndexedDB, par compte et par identifiant de fiche | Le formulaire propose de reprendre les modifications sur cet appareil. « Mettre à jour » les transmet au serveur. |
| Mettre à jour les champs | `PUT /fiche-pecmu/:id` avec les valeurs éditées et `"status":"BROUILLON"` | 200 avec la fiche. Conserver le statut. |
| Soumettre le brouillon enregistré | `PATCH /fiche-pecmu/:id` avec exactement `{"status":"SOUMIS"}` | 200 ou 204 après validation des données déjà enregistrées. La même fiche passe à SOUMIS. |
| Soumettre directement un nouveau F2 | `POST /fiche-pecmu` avec les données complètes, sans statut explicite | 201 avec `id`. Attribuer SOUMIS. |
| Afficher les compteurs de l’encodeur | `GET /fiche-pecmu/statistics` | Inclure par exemple `{"submitted":3,"drafts":2,"total":17}` dans la réponse de statistiques existante. |

La copie locale d’un brouillon en édition reste sur l’appareil si le PUT échoue. L’utilisateur peut reprendre ses modifications ou reprendre la version serveur. Si les valeurs serveur ont changé depuis la copie, le formulaire le signale avant restauration. Le PATCH de soumission porte sur la version enregistrée du dossier.

Dans le F2, `age` est un nombre d’années entre 0 et 120 inclus. Autoriser `0` et `0.5` en stockage et en lecture. À la création, un âge inconnu est omis. Un `PUT` avec `{"age":null}` parmi les champs du brouillon efface l’âge précédent. Sur ce PUT, accepter également une chaîne vide pour effacer un texte facultatif. `careStructureName` est une chaîne libre au stade de l’alerte. Un acte de soins utilise ensuite la sélection des structures partenaires. Une fiche liée à une victime maître envoie `victimeId` et l’API renseigne son identité. Les violations multiples utilisent le champ existant `violationType`, séparées par « ; ».

Pour les deux nouveaux compteurs, compter les fiches actives distinctes créées par l’auteur authentifié. `submitted` compte SOUMIS et `drafts` compte BROUILLON. Rattacher les anciennes fiches effectivement soumises au statut SOUMIS lors de la migration. Retourner des entiers, y compris zéro. Les dossiers en lecture seule d’autres agents restent consultables dans leur périmètre. Le tableau affiche un tiret quand le compteur est absent. Les autres indicateurs continuent de suivre leur définition existante.

**Recette.** Avec A, créer un brouillon comportant un âge de 0,5 an, l’éditer, puis le soumettre. Après actualisation du tableau de bord PECMU, le compteur de brouillons d’A diminue de un et celui des dossiers soumis augmente de un. Les deux compteurs de B restent identiques.

**Frontend.** `app/reparations/pecmu/PecmuModulePage.tsx`, `app/utils/pecmuDraftCache.ts`, `app/reparations/services/pecmuApi.ts`, `app/reparations/components/DashboardVictimesPecmu.tsx`.

## Décision du pool médical

Le formulaire propose l’encodeur connecté et la date locale du jour pour une première décision. L’agent peut modifier ces deux champs. Une décision existante recharge le médecin, la date, l’éligibilité et la motivation enregistrés.

1. Accepter la création et la correction sur l’action existante `POST /fiche-pecmu/:id/medical-decision`. Exemple de corps JSON :

   ```json
   {"eligible":true,"comment":"Avis du pool","decisionMakerName":"Médecin de garde","decisionDate":"2026-10-23"}
   ```

2. `eligible` est un booléen. `comment` et `decisionMakerName` sont des chaînes non vides. `decisionDate` est une date calendaire `YYYY-MM-DD`. `decisionMakerFunction` est une chaîne facultative. Conserver l’identité de l’agent authentifié dans l’audit séparément du médecin saisi. Enregistrer la correction sur la décision du dossier.
3. Accepter la mutation avec un statut 2xx. Renvoyer ces mêmes données sous `medicalDecision` dans `GET /fiche-pecmu/:id/workflow`. Appliquer les règles existantes de permission et de transition.
4. Recette : saisir le nom du médecin et une date antérieure, enregistrer, fermer et rouvrir le dossier. Ces deux valeurs doivent être identiques à celles saisies. Un lecteur peut les consulter.

**Frontend.** `app/reparations/pecmu/PecmuDossierModal.tsx`, onglet « Pool médical ».

## Soins, transfert et réadmission en cas de rechute

Dans le dossier PECMU, « Ouvrir une prise en charge » ouvre le formulaire de création ou de transfert dans une fenêtre superposée. « Enregistrer une réadmission » ouvre le même formulaire depuis l’onglet « Réadmission ». À la fermeture, l’agent retrouve le dossier et l’onglet d’origine. Les anciens liens `/reparations/pecmu/[ficheId]/soins/[mode]` ouvrent aussi ce parcours pour les modes `nouveau`, `transfert` et `readmission`. Le transfert préremplit la structure receveuse, sa province, sa zone et les informations cliniques de l’épisode précédent. La réadmission est disponible dès qu’un épisode précédent existe, même sur dossier clôturé. L’historique médical conserve tous les actes antérieurs. Consulter `app/reparations/pecmu/PecmuNewCareModal.tsx`, `PecmuDossierModal.tsx`, `PecmuEvolutionForm.tsx`, `useMedicalCareFields.ts`, `PecmuCareCard.tsx` et `app/reparations/services/pecmuWorkflowApi.ts`.

1. Étendre le DTO de création existant `POST /acte-medical-pecmu` (JSON) avec `admissionType: "STANDARD" | "TRANSFER" | "READMISSION"` et `previousCareId?: number`. Rendre `previousCareId` obligatoire pour transfert et réadmission et contrôler que l’épisode appartient à la même fiche. Le type facultatif pour les anciens clients vaut `STANDARD`. Préserver les transferts existants via le lien de filiation et l’issue `TRANSFERRED` de l’épisode parent. Le front n’infère pas une réadmission à partir d’un ancien lien de transfert.
2. Pour une création autorisée, ajouter une ligne avec son propre `id`, un `sequenceNumber` croissant dans la fiche et le lien précédent. Une réadmission accepte un dossier antérieurement clôturé pour rechute et réactive son suivi (`currentStatus: "IN_CARE"`), en préservant l’historique et les pièces des épisodes précédents. Autoriser l’ajout aux rédacteurs de ce dossier, refuser toute écriture en lecture seule (403). Validation de parent invalide (400), transition devenue impossible ou épisode concurrent (409), avec `message` lisible. Traiter l’en-tête `Idempotency-Key` envoyé au POST de création et l’autoriser en CORS : pour le même utilisateur, la même fiche et la même clé, une nouvelle tentative après coupure doit retourner l’acte déjà créé. Ne pas créer un second épisode si l’appel est rejoué.
3. Exemple de requête, avec `Content-Type: application/json` et `Idempotency-Key: 86af682f-472a-4927-948c-0e7ec7767d76` :
   ```json
   {"fichePecmuId":42,"admissionType":"READMISSION","previousCareId":83,"careMode":"OUTPATIENT","careDate":"2026-11-26","careProvince":"Kinshasa","careHealthZone":"Nsele","careStructureName":"Structure partenaire","supervisorName":"Médecin responsable","complaints":"Plaintes consignées","bilanParaclinique":"Résultats consignés","cout":40}
   ```
   Répondre HTTP 201, `{"id":91}` (ou `{"data":{"id":91}}`). Le numéro est un entier positif. L’issue optionnelle reste enregistrée par le PUT existant `/acte-medical-pecmu/:id`, la clôture par `POST /fiche-pecmu/:id/close`. En cas de transfert, envoyer `"admissionType":"TRANSFER"` sur le nouveau POST et conserver les champs ordinaires du DTO existant. Extrait de `GET /fiche-pecmu/42/workflow` après une réadmission `{"medicalCare":[{"id":91,"fichePecmuId":42,"sequenceNumber":2,"admissionType":"READMISSION","previousCareId":83,"documents":[]}],"currentStatus":"IN_CARE"}`. Dans les anciennes réponses, les épisodes sans type restent visibles dans la liste générale.
4. **Recette.** Depuis l’onglet des soins d’un dossier avec un acte transféré, ouvrir « Ouvrir une prise en charge ». Vérifier que le dossier reste visible derrière le formulaire et que la structure receveuse est préremplie. Fermer le formulaire, vérifier que le même dossier reste ouvert, puis recommencer et enregistrer. Les soins affichent les deux actes. Depuis « Réadmission » sur un dossier clôturé, enregistrer un épisode et vérifier qu’il apparaît dans l’onglet. Les pièces de l’épisode précédent restent consultables. Ouvrir également un ancien lien direct avec un compte autorisé à modifier puis avec un compte en lecture seule. Vérifier le dossier ciblé et les droits d’enregistrement.

**Référentiel des structures.** La sélection des soins et celle du transfert utilisent la même liste de partenaires. L’API existante `GET /partenaires` peut retourner par exemple `[{"id":71,"nom":"Structure de recette","province":"Kongo-Central","zoneSante":"Muanda"}]`. La liste embarquée complète les réponses du serveur. Le formulaire filtre les structures par province puis zone et conserve les libellés historiques, y compris quand l’orthographe d’une zone du partenaire diffère de celle du référentiel national. La sélection des superviseurs réutilise `GET /acte-medical-pecmu/supervisors/options`. Conserver les deux routes existantes.

## Pièces jointes (factures) des prises en charge

1. La route `POST /acte-medical-pecmu/:id/documents/:type` est déjà utilisée pour les autres pièces. Autoriser la valeur `INVOICE`. Le front envoie **une requête par fichier** sur `POST /acte-medical-pecmu/91/documents/INVOICE`, en `multipart/form-data`, champ binaire `file` (PDF, JPEG, PNG). Les factures s’ajoutent à la collection du soin. Ne pas écraser la précédente. Le frontend réutilise le même en-tête `Idempotency-Key` quand la même sélection est rejouée : renvoyer le résultat précédent en cas de réponse perdue. Un second envoi du même contenu vers le même épisode et le même type après interruption doit renvoyer la pièce existante (déduplication du contenu dans ce périmètre). Appliquer les permissions et validations de pièces médicales habituelles (type réel, taille maximale et autorisation d’écriture).
2. Répondre 201 avec par exemple `{"id":354,"type":"INVOICE","originalName":"facture.pdf","mimeType":"application/pdf","size":17921,"url":"https://stockage.exemple/facture.pdf"}`. Exposer la même métadonnée dans `medicalCare[].documents[]` de `GET /fiche-pecmu/:id/workflow`. Le front ouvre directement la valeur `url`. Fournir une URL HTTPS de consultation pour le lecteur autorisé, renouvelée au chargement du dossier si elle expire.
3. **Frontend livré.** `PecmuInvoiceInput.tsx` accepte la sélection multiple durant la création ou la mise à jour. `PecmuNewCareModal.tsx` conserve le numéro de l’acte après création réussie pour reprendre une soumission partielle sans créer un nouvel acte. `PecmuDossierModal.tsx` affiche et ouvre les factures de l’épisode concerné et peut aussi en ajouter depuis une fiche de soins plus ancienne. `uploadCareInvoices` de `pecmuWorkflowApi.ts` retourne les erreurs avec le nom du fichier. Aucun branchement frontend supplémentaire.
4. **Recette.** Enregistrer un acte sans issue avec deux factures : deux documents sont attachés au même `id`, visibles et consultables après réouverture. Ajouter une troisième facture sans écraser les deux premières. Simuler une erreur lors de la deuxième pièce : le message désigne la pièce et l’acte, un nouvel essai dans le même formulaire ne recrée ni l’épisode ni la première facture. Une réponse 403 ou 400 ne doit produire aucun succès pour la pièce rejetée.

## Suivi psychologique et téléchargement du rapport

L’onglet « Prise en charge psychologique » utilise le préfixe `/prise-en-charge-psychologique-pecmu`. La lecture précède l’ouverture du formulaire. Pour une fiche sans suivi, répondre 404 avec le code `PSYCHOLOGICAL_CARE_NOT_FOUND`. Le frontend propose alors de commencer le suivi aux agents autorisés.

| Méthode et chemin (après le préfixe) | Données du parcours |
|---|---|
| GET `/by-fiche/:ficheId` | Dossier psychologique avec son identifiant, les champs d’évaluation, `therapySessions`, `therapyCount`, `homeVisits`, `report`, `closureDate`, `closureNotes` et `isClosed` ou `status`. |
| POST à la racine | `fichePecmuId` (entier), `supervisorName`, `complaints`, `initialEvaluation`, `diagnosticHypothesis` et `therapiesReceived` (chaînes, potentiellement vides à l’ouverture). |
| PUT `/:id` | Accepter les mises à jour partielles, y compris `{"postTherapyEvaluation":"Évolution constatée"}`. Conserver les champs absents. |
| POST `/:id/therapy-sessions` | `{"date":"2026-10-23","therapy":"Séance individuelle","notes":""}`. Retourner le nombre de séances effectuées dans `therapyCount` à la relecture. |
| POST `/:id/home-visits` | `{"date":"2026-10-27","observations":"Visite effectuée"}`. |
| POST `/:id/report` | Multipart `file`. Joindre le rapport au dossier psychologique. |
| POST `/:id/close` | `{"postTherapyEvaluation":"Évaluation finale","closureDate":"2026-11-26","closureNotes":""}`. Retourner la clôture et le rapport à la relecture. |

Pour les rapports nouveaux et historiques, renvoyer dans la réponse GET un objet de la forme suivante. `url` ouvre l’aperçu et `downloadUrl` télécharge le même fichier avec `Content-Disposition: attachment` et un nom de fichier approprié. Générer des URL HTTP(S) utilisables dans le navigateur, après vérification des droits de lecture. Utiliser `ficheId` pour la recherche initiale et l’identifiant du dossier psychologique retourné pour les mises à jour.

```json
{"id":61,"fichePecmuId":42,"therapyCount":2,"postTherapyEvaluation":"Évolution constatée","report":{"originalName":"rapport.pdf","mimeType":"application/pdf","url":"https://stockage.example/rapport-apercu","downloadUrl":"https://stockage.example/rapport-telechargement"}}
```

**Recette.** Depuis le dossier PECMU, enregistrer une séance, l’évaluation post-thérapie, puis une visite. Déposer le rapport, clôturer, rouvrir et télécharger le fichier en tant que lecteur autorisé. Le courriel du 29 octobre 2026 cité dans le Word n’a pas été fourni. Le périmètre psychologique documenté ici couvre les observations lisibles dans le Word.

**Frontend.** `app/reparations/pecmu/PecmuPsychologicalCare.tsx`, `app/reparations/services/pecmuWorkflowApi.ts`.

## Vérifications de non-régression à la livraison

- Depuis une ancienne fiche, vérifier l’affichage de la source historique puis l’ajout d’une deuxième source. Le retrait d’une source doit rester effectif après relecture.
- Soumettre un cas similaire, annuler sur l’avertissement, vérifier l’absence d’écriture, puis confirmer et contrôler qu’une seule fiche a été créée.
- Refaire le parcours avec un encodeur et un lecteur. Tester les réponses 403 pour les mutations de fiche, de soin, de suivi et de fichier directement dans l’API de recette.
- Saisir deux consentements pour la même fiche. Chaque consentement conserve son fichier via `POST /acte-consentement-pecmu`, puis `POST /acte-consentement-pecmu/:id/file`. Le workflow retourne les deux enregistrements dans `consents`.
- Vérifier l’historique dans « Suivis et rendez-vous » via `GET /suivi-accompagnement/by-fiche/:id`. Chaque entrée porte `id`, `createdAt` (date d’enregistrement), `avis` (commentaire) et éventuellement `dateProchainRdv`. Les champs de rendez-vous enregistrés sur un épisode médical restent également consultables sur sa fiche.
- Tester un transfert, une réadmission et un dépôt de plusieurs factures. Contrôler la persistance des pièces, le lien avec le bon épisode et la reprise après une erreur de dépôt.
