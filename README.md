# Tikonita

Bot Discord de tickets et de support construit avec Node.js et discord.js.

Tikonita fournit un parcours complet pour ouvrir, prendre en charge et fermer des tickets privés. Le projet comprend également des cartes visuelles générées côté serveur et une persistance locale des données.

## Fonctionnalités

- panneau de création avec plusieurs sujets de ticket ;
- salons privés avec permissions adaptées au demandeur et à l’équipe responsable ;
- prise en charge, libération et fermeture d’un ticket ;
- ajout d’un membre à un ticket avec `/ticket add` ;
- fermeture rapide avec `/ticket close` ;
- génération d’un transcript ;
- sanctions temporaires avec `/punish` et retrait avec `/unpunish` ;
- statistiques persistantes sur les tickets et les avis ;
- cartes d’ouverture et de prise en charge générées avec Sharp ;
- restauration des boutons après un redémarrage.

## Prérequis

- Node.js 20 ou plus récent ;
- une application Discord avec un bot ;
- les intents et permissions nécessaires à la gestion des salons, messages et rôles.

## Installation

```bash
git clone https://github.com/bonitaaa/tikonita.git
cd tikonita
npm ci
```

Copie ensuite `.env.example` vers `.env`, puis renseigne au minimum :

```env
BOT_MODE=support
SUPPORT_DISCORD_TOKEN=jeton_du_bot
```

Ne publie jamais ton fichier `.env` ni le jeton de ton bot. Le fichier est déjà exclu par `.gitignore`.

## Démarrage

```bash
npm start
```

En mode `support`, le bot enregistre et gère les commandes de tickets avec le compte associé à `SUPPORT_DISCORD_TOKEN`.

Pour vérifier la syntaxe sans démarrer Discord :

```bash
npm run check
```

## Configuration Discord

La configuration propre au serveur (salon du panneau, catégorie des tickets et rôles responsables) se trouve actuellement dans `src/index.js`. Avant un déploiement sur un autre serveur, remplace les identifiants Discord concernés par ceux de ton serveur.

Les données d’exécution sont enregistrées dans `data/`. Les fichiers JSON de ce dossier sont volontairement ignorés par Git afin de ne pas publier les données des membres.

## Structure

```text
assets/                 Images utilisées par les cartes de tickets
data/                   Données locales persistantes, non versionnées
src/index.js            Client Discord et logique du bot
src/leaderboard.js      Génération des visuels
src/store.js            Persistance des données
src/commands.js         Commandes du mode principal historique
.env.example            Exemple de configuration
railpack.json           Configuration de déploiement Railway
```

## Déploiement

Le dépôt contient un fichier `railpack.json` compatible avec Railway. Configure les variables d’environnement dans l’hébergeur, sans ajouter de secrets au dépôt.

## Sécurité et confidentialité

- les jetons doivent rester dans les variables d’environnement ;
- les données Discord générées dans `data/*.json` ne sont pas versionnées ;
- une installation publique doit utiliser ses propres identifiants de serveur et de salons ;
- consulte [SECURITY.md](SECURITY.md) avant de signaler une vulnérabilité.

## Licence

Aucune licence de réutilisation n’est accordée pour le moment. Le code est consultable publiquement, mais tous les droits restent réservés à son auteur.
