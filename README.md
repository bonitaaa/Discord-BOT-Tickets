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
git clone https://github.com/bonitaaa/Discord-BOT-Tickets.git
cd Discord-BOT-Tickets
npm ci
```

Copie ensuite `.env.example` vers `.env`, puis renseigne au minimum :

```env
SUPPORT_DISCORD_TOKEN=jeton_du_bot
TICKET_PANEL_CHANNEL_ID=identifiant_du_salon_du_panneau
TICKET_CATEGORY_ID=identifiant_de_la_categorie_des_tickets
```

Ne publie jamais ton fichier `.env` ni le jeton de ton bot. Le fichier est déjà exclu par `.gitignore`.

## Démarrage

```bash
npm start
```

Au démarrage, Tikonita enregistre et gère ses commandes avec le compte associé à `SUPPORT_DISCORD_TOKEN`.

Pour vérifier la syntaxe sans démarrer Discord :

```bash
npm run check
```

Pour exécuter les tests de persistance et de rendu :

```bash
npm test
```

## Configuration Discord

Le salon du panneau et la catégorie des tickets se configurent avec `TICKET_PANEL_CHANNEL_ID` et `TICKET_CATEGORY_ID`. Si le salon configuré n’existe plus, le bot tente de retrouver un salon textuel nommé `créer-un-ticket`, `ouvrir-un-ticket` ou `tickets`. Les identifiants des rôles responsables se trouvent actuellement dans `src/index.js` et doivent être adaptés avant un déploiement sur un autre serveur.

Les données d’exécution sont enregistrées dans `data/`. Les fichiers JSON de ce dossier sont volontairement ignorés par Git afin de ne pas publier les données des membres.

## Structure

```text
assets/                 Images utilisées par les cartes de tickets
data/                   Données locales persistantes, non versionnées
src/index.js            Client Discord et logique du bot
src/ticket-card.js      Génération des cartes de tickets
src/store.js            Persistance des données
test/                   Tests autonomes
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
