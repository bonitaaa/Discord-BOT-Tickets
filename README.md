# Tikonita

Service Discord dédié aux tickets et au support. Son mode par défaut est `support`.

## Commandes

- `=wl @membre` : autoriser un membre dans la whitelist interne. Le panneau permet ensuite de créer et gérer son rôle, puis `/perso @membre` sert à le partager.
- `=unwl @membre` : retirer l’autorisation et le rôle personnel enregistré.
- `=delperso @membre` : désenregistrer uniquement le rôle personnel.
- `/perso membre` : ajouter son rôle au membre, ou le retirer s’il le possède déjà.
- `/rank membre role` utilise une liste dynamique : Créateur voit Elite, Premium, Plus et Basic ; Elite voit Premium, Plus et Basic ; Premium voit Plus et Basic ; Plus voit uniquement Basic ; Basic ne peut pas utiliser la commande. Un membre ne peut pas modifier une personne de niveau égal ou supérieur.
- `/to membre durée raison?` : applique une durée libre écrite directement comme `30m`, `2h` ou `3j`, dans la limite Discord de 28 jours. Accessible aux rôles `1564636235333505126`, `1564638261769404428`, `1565034303560355870` et aux quatre gestionnaires globaux. La hiérarchie est protégée et chaque sanction est publiée dans le forum de sécurité.
- Les commandes `/pv` et `/access` sont remplacées par le panneau du salon `1565752911433302096`. Un membre whitelisté avec `=wlpv` peut y créer un unique vocal synchronisé avec les permissions de la catégorie, le renommer, le rendre privé ou public, gérer les accès et le supprimer.
- `+new` : accessible uniquement au propriétaire et au rôle Elite `1565392656970817568`. `+lock` ferme un salon et `+unlock` le rouvre ; ces deux commandes restent également accessibles au rang Premium.
- `+snipe` : accessible au rôle Booster `1556315994614534296`, aux quatre gestionnaires globaux, au rang Premium et au rôle spécial `1565392656970817568`. Affiche le dernier message supprimé récemment dans un embed classique compact, automatiquement supprimé après 20 secondes.
- `+giveaway <durée> <gagnants> <lot>` : accessible aux quatre gestionnaires globaux et au rôle spécial `1565392656970817568`, mais pas au rang Premium. Lance un giveaway persistant à réaction 💎, par exemple `+giveaway 1h30m 2 Nitro`.
- `+gend <id message>` termine immédiatement un giveaway ; `+greroll <id message>` refait le tirage ; `+gcancel <id message>` l’annule ; `+glist` affiche les giveaways actifs.
- `+ghelp` affiche la liste et la syntaxe de toutes les commandes giveaway.

Un rôle personnel doit déjà appartenir à son propriétaire, ne contenir aucune permission et être placé sous le rôle du bot ainsi que sous le rôle plafond `1564627919354069012`. Un même rôle ne peut être enregistré que par une seule personne. Si un rôle personnel enregistré est déplacé au-dessus de ce plafond, le bot le replace automatiquement juste en dessous. Les déplacements réalisés par le propriétaire `317270244815011840` sont ignorés et conservés, y compris après un redémarrage.

Tous les rôles personnels protégés sous le plafond ne peuvent pas être affichés séparément dans la liste des membres ni rendus mentionnables : ces deux réglages sont désactivés automatiquement. Tout nouveau rôle Discord modifiable est placé automatiquement juste au-dessus du rôle `1556315994614534296`.

Tous les rôles non gérés placés sous `1564627919354069012` lors de l’activation sont également protégés. Si un autre utilisateur remonte l’un de ces rôles au-dessus du plafond, le bot le replace automatiquement, applique un timeout de cinq minutes à l’auteur et publie l’incident dans les logs de sécurité. Les nouveaux rôles créés sous le plafond rejoignent automatiquement cette protection.

Lorsqu’un membre possédant `1564627919354069012` reçoit un autre rôle accordant la permission **Gérer les rôles** ou **Administrateur**, le bot lui retire automatiquement `1564627919354069012` devenu inutile.

Lorsqu’un propriétaire quitte le serveur, son rôle personnel est supprimé automatiquement avec sa whitelist et ses données enregistrées.

Le classement vocal comptabilise tous les membres humains présents dans un vocal actif, y compris ceux qui sont mute, casque ou mute serveur. Les bots et le salon AFK restent exclus.

Les membres ayant le rôle `1564627919354069012` peuvent gérer les rôles, mais le bot surveille leurs créations et modifications via les journaux d’audit. L’ajout d’une permission interdite est annulé et entraîne un bannissement automatique. Permissions interdites : Administrateur, Gérer le serveur, Gérer les rôles, Gérer les salons, Bannir, Expulser, Exclure temporairement, Gérer les webhooks et Mentionner tout le monde.

Si un membre PVCool Premium ou PVCool Plus attribue à quelqu’un un rôle contenant l’une de ces permissions interdites, le rôle est immédiatement retiré au destinataire et l’auteur reçoit un timeout de cinq minutes.

Si un gestionnaire surveillé (rôle gestionnaire, PVCool Premium ou PVCool Plus) supprime un rôle ou retire des permissions à un rôle, l’action est restaurée puis son compte est banni et ajouté à une blacklist persistante. S’il est débanni et rejoint de nouveau, le bot le rebannit automatiquement.

Les rôles ordinaires sont sauvegardés avec leurs paramètres et leurs membres. Lorsqu’un humain supprime un rôle, le bot le recrée automatiquement puis le rend à tous ses anciens membres. Les suppressions volontaires effectuées par le bot, `@everyone` et les rôles gérés par Discord ne sont pas restaurés.

Le forum de sécurité `1565402480144023602` est organisé automatiquement avec les posts permanents Rôles, Permissions, Vocal, Sanctions, Blacklist et Restauration. Chaque incident est ajouté comme réponse Components V2 dans le post correspondant, sans créer un nouveau post ni provoquer de mention.

Le forum `1565405625788276796` conserve les posts permanents My Role, Perso, Dog, PV et Access. Clear, TO et Rank ont leurs posts permanents dans `1565406116790141019`. Chaque utilisation est ajoutée comme réponse Components V2 dans son unique post avec l’utilisateur, le salon, les options, le statut et l’heure.

La protection vocale compte les mutes serveur, casques serveur, déplacements et déconnexions forcés identifiés dans les journaux d’audit. Cinq actions en moins de 60 secondes entraînent un timeout de 10 minutes, puis de 30 minutes en cas de récidive dans les 24 heures.

L’antispam textuel ne sanctionne jamais les membres : au-delà de six messages en 5 secondes, de deux messages identiques en 15 secondes ou de trois messages contenant un lien en 10 secondes, seul le message excédentaire est supprimé. Les commandes préfixées, bots, webhooks et messages sans texte sont ignorés. Les suppressions sont regroupées dans le post permanent Antispam du forum de sécurité.

Toutes les réponses utilisent des panneaux Discord Components V2 compacts : titre discret en majuscules, séparateur fin et barre latérale colorée selon le résultat.

## Configuration

```env
DISCORD_TOKEN=token_du_bot
CANDY_DISCORD_TOKEN=token_du_second_bot_flocons
SUPPORT_DISCORD_TOKEN=token_du_troisieme_bot_support
STATS_DISCORD_TOKEN=token_du_quatrieme_bot_statistiques
BOT_MODE=main
CLIENT_ID=id_de_l_application
GUILD_ID=id_du_serveur
```

Ne publie jamais les tokens Discord sur GitHub. Chaque service Railway utilise le même dépôt avec un `BOT_MODE` différent : `main`, `candy`, `support` ou `stats`. Le mode `stats` collecte les messages, le vocal et les duos, actualise les classements et réordonne les rôles personnels selon leur activité.

## Démarrage

```bash
npm install
npm start
```

Le démarrage enregistre les commandes du serveur avant de connecter le bot.

## Railway

Relier ce dépôt à Railway puis créer quatre services à partir du même dépôt. Le quatrième service utilise `BOT_MODE=stats` et `STATS_DISCORD_TOKEN`. Attacher un volume persistant à chaque service ; Railway détecte automatiquement `npm start`.

Activer les intents privilégiés **Message Content Intent** et **Server Members Intent** dans le Discord Developer Portal, section **Bot**. Le premier permet les commandes textuelles ; le second permet la suppression automatique des rôles personnels lors des départs.

Le bot doit posséder **Gérer les rôles**, **Voir les logs du serveur**, **Expulser des membres** et **Bannir des membres**. Son rôle doit être placé au-dessus du rôle des gestionnaires et de tous les rôles qu’il doit restaurer.

## Classements hebdomadaires

Le salon `1564992066696646807` reçoit les images PNG générées et mises à jour toutes les cinq minutes : messages, vocal, duos et rôles personnels. Les statistiques, totaux et identifiants des messages sont conservés sur le volume du service `stats`. La semaine est remise à zéro chaque dimanche à 01:00, heure de Paris.

La police Inter est embarquée directement dans les images et Railpack installe les familles Noto/DejaVu pour couvrir les pseudonymes Unicode, CJK, arabes et les symboles.

Pour conserver les données après un redéploiement, attacher un volume au service. Le bot détecte automatiquement la variable Railway `RAILWAY_VOLUME_MOUNT_PATH` et y stocke `database.json`. Le chemin de montage conseillé est `/app/data`.
