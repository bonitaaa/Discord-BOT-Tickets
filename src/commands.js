import { SlashCommandBuilder } from 'discord.js';

export const RANK_IDS = [
  '1565392656970817568',
  '1564636248499429446',
  '1564638261769404428',
  '1564636235333505126',
];

export function buildCommands(roleNames = {}) {
  return [
    new SlashCommandBuilder()
      .setName('perso')
      .setDescription('Ajouter ou retirer ton rôle personnel à un membre')
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Le membre concerné')
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName('rank')
      .setDescription('Choisir ou retirer ton rank')
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Le membre concerné')
        .setRequired(true))
      .addStringOption((option) => option
        .setName('role')
        .setDescription('Le rank concerné')
        .setRequired(true)
        .setAutocomplete(true)),
    new SlashCommandBuilder()
      .setName('dog')
      .setDescription('Mettre un membre en laisse ou le libérer')
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Le membre concerné')
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Supprimer des messages dans ce salon')
      .addIntegerOption((option) => option
        .setName('nombre')
        .setDescription('Nombre de messages à supprimer (20 par défaut)')
        .setMinValue(1)
        .setMaxValue(100))
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Ne supprimer que les messages de ce membre')),
    new SlashCommandBuilder()
      .setName('to')
      .setDescription('Exclure temporairement un membre')
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Le membre à exclure temporairement')
        .setRequired(true))
      .addStringOption((option) => option
        .setName('duree')
        .setDescription('Durée libre : 30m, 2h ou 3j')
        .setRequired(true)
        .setMaxLength(30))
      .addStringOption((option) => option
        .setName('raison')
        .setDescription('Raison du timeout')
        .setMaxLength(500)),
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Soumettre un bannissement au vote des juges')
      .addStringOption((option) => option
        .setName('raison')
        .setDescription('Motif détaillé du bannissement')
        .setMinLength(3)
        .setMaxLength(500)
        .setRequired(true))
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Utilisateur concerné, même s’il vient de quitter')
        .setRequired(false))
      .addStringOption((option) => option
        .setName('identifiant')
        .setDescription('ID ou mention si le compte ne figure plus dans la liste')
        .setMinLength(17)
        .setMaxLength(22)
        .setRequired(false))
      .addAttachmentOption((option) => option
        .setName('preuve')
        .setDescription('Capture facultative servant de preuve')
        .setRequired(false)),
    new SlashCommandBuilder()
      .setName('baninfo')
      .setDescription('Afficher les informations d’un bannissement')
      .addStringOption((option) => option
        .setName('utilisateur')
        .setDescription('Identifiant ou mention du compte banni')
        .setMinLength(17)
        .setMaxLength(23)
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName('wakeup')
      .setDescription('Réveiller un membre en le déplaçant pendant 30 secondes')
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Le membre actuellement connecté en vocal')
        .setRequired(true)),
    new SlashCommandBuilder()
      .setName('lockname')
      .setDescription('Verrouiller, modifier ou libérer le pseudo d’un membre')
      .addUserOption((option) => option
        .setName('membre')
        .setDescription('Membre à verrouiller')
        .setRequired(true))
      .addStringOption((option) => option
        .setName('nom')
        .setDescription('Pseudo à imposer (refaire la commande pour déverrouiller)')
        .setMinLength(1)
        .setMaxLength(32)
        .setRequired(true)),
  ].map((command) => command.toJSON());
}
