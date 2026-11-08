# Sécurité

## Signaler un problème

Ne publie pas de vulnérabilité, de jeton, d’identifiant privé ou de données personnelles dans une issue publique.

Utilise de préférence le signalement privé de vulnérabilité de GitHub. Décris le problème, son impact, les étapes de reproduction et la version concernée sans joindre de secret réel.

## Secrets compromis

Si un jeton Discord a été exposé :

1. régénère-le immédiatement depuis le portail développeur Discord ;
2. remplace la variable correspondante sur l’hébergeur ;
3. redémarre le service ;
4. vérifie les journaux d’audit Discord et ceux de l’hébergeur.

Supprimer un secret d’un commit ne suffit pas : considère toujours un jeton publié comme compromis.
