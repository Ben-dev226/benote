# myNotebook — version web (v0.4)

Plateforme personnelle d'apprentissage (cahier des charges v1.0). **Guide pas à pas : `docs/GUIDE-INSTALLATION.md`.**

## Contenu
- **Apprentissages** : création, édition, objectifs, progression, archivage, suppression, réorganisation (↑↓)
- **Notes** : éditeur Markdown (titres, listes, tableaux, code, liens, images), aperçu, sauvegarde automatique, favoris, étiquettes, recherche, historique avec restauration
- **Connaissances** : liens entre notes (+ rétroliens), liens note ↔ ressource (page PDF / instant audio-vidéo), carte visuelle
- **Bibliothèque** : liens, YouTube, fichiers envoyés **directement du navigateur vers le Google Drive de l'utilisateur** (rien ne passe par Vercel à l'envoi)
- **Lecteurs intégrés** : PDF (pages, zoom, plein écran, signets, note par page), audio/vidéo (vitesse, ±10 s, reprise, note à l'instant), images (zoom, navigation), texte ; la position est sauvegardée
- **Rappels** : ponctuels ou récurrents, bandeau + notifications du navigateur
- **Assistant IA facultatif** : 6 agents, passerelle multi-fournisseurs gratuits (Groq / Gemini / OpenRouter) avec bascule automatique, limite 30 requêtes/heure, désactivable
- **Paramètres** : thème, IA, connexion/révocation Google Drive, vérification des fichiers supprimés
- Recherche globale, tableau de bord, responsive (barre du bas sur mobile)

## Interface (v0.4 — « cahier »)
Identité : papier, encre bleue, surligneur jaune, double trait rouge de marge de cahier ; polices Bricolage Grotesque + Figtree (chargées depuis Google Fonts).
- Barre latérale : « Nouvelle note », recherche (Ctrl/⌘ K), navigation, **tous les apprentissages en onglets de couleur** toujours accessibles
- Palette de commandes Ctrl/⌘ K : cherche notes, ressources, apprentissages et lance les actions
- « Aujourd'hui » : date, reprise de la dernière lecture, rappels du jour, notes et ressources récentes
- Notes : liste + éditeur sur papier ligné, barre d'icônes, aperçu, **mode concentration** (Échap pour sortir), compteur de mots
- Notifications de confirmation (toasts), écrans de chargement, thème clair/sombre, mobile avec barre du bas

## Assistant IA — diagnostic
Si l'assistant échoue, le message affiche maintenant la cause par fournisseur (clé refusée, quota, modèle indisponible). Si un modèle n'existe plus, la passerelle en découvre automatiquement un autre. Après avoir ajouté ou modifié une clé sur Vercel, **redéployer**.

## Sécurité
- RLS sur toutes les tables + vérification en base que chaque référence appartient au même utilisateur (migration 0002)
- Jetons Google chiffrés (AES-256-GCM), table accessible uniquement côté serveur (clé service_role)
- Aucune clé secrète dans le code client ; validation des fichiers (extensions bloquées, 500 Mo max)

## Limites connues (à traiter ensuite)
- Lecture des fichiers Drive : ils transitent par le serveur (le token Google ne doit pas être exposé au navigateur). Pour de très grosses vidéos sur Vercel gratuit, préférer YouTube.
- PDF : pas encore de recherche textuelle ni de surlignage (signets et notes par page : oui)
- Éditeur : Markdown (pas de WYSIWYG) ; YouTube : pas de suivi automatique de la position
- Notifications : navigateur ouvert uniquement (les notifications push arriveront avec l'app mobile / FCM)
- Pas encore de tests automatisés ; CI = typecheck + lint + build
- Hors ligne, synchronisation avancée, quotas IA détaillés : Phase 6
