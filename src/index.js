import 'dotenv/config';
import { readFileSync } from 'node:fs';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AuditLogEvent,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  Collection,
  ContainerBuilder,
  EmbedBuilder,
  Events,
  FileUploadBuilder,
  GatewayIntentBits,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  Partials,
  PermissionFlagsBits,
  PermissionsBitField,
  RoleSelectMenuBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThumbnailBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import { getGuildData, loadStore, saveStore } from './store.js';
import { buildCommands } from './commands.js';
import { HALLOWEEN_TRIVIA } from './trivia-questions.js';
import {
  awardCandies,
  awardCandiesBatch,
  handleLeaderboardButton,
  handleCandyReaction,
  initializeCandyLeaderboard,
  initializeLeaderboards,
  recordLeaderboardMessage,
  recordVoiceState,
  registerCandyDrop,
  renderCandyProfileImage,
  renderCandyKissImage,
  renderCandyShopItemImage,
  renderCandyBuildingsImage,
  renderFamilyTreeImage,
  renderLoveCompatibilityImage,
  renderTicketCard,
} from './leaderboard.js';

function readOptionalAsset(path) {
  try {
    return readFileSync(new URL(path, import.meta.url));
  } catch {
    return null;
  }
}

const CANDY_RPS_GIF = readOptionalAsset('../assets/candy-rps.gif');
const CANDY_ROULETTE_GIF = readOptionalAsset('../assets/candy-roulette.gif');
const wikipediaIllustrationCache = new Map();
const WIKIPEDIA_FALLBACK_ILLUSTRATION = {
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Wikipedia-logo-v2.svg/512px-Wikipedia-logo-v2.svg.png',
  page: 'https://fr.wikipedia.org/',
};

const WHITELIST_MANAGERS = new Set([
  '1526355772831957012',
  '317270244815011840',
  '333362689453850625',
  '1543273307439243367',
]);
const OWNER_COMMAND_USER_ID = '317270244815011840';
const CHANNEL_MANAGEMENT_USER_IDS = new Set([
  '317270244815011840',
  '1526355772831957012',
]);
const BAN_VOTE_REQUIRED = 4;
const BAN_VOTE_DURATION_MS = 30 * 60 * 1000;
const BAN_JUDGMENT_CHANNEL_ID = '1565977805303578644';
const banVoteTimers = new Map();
const activeWakeups = new Map();
const WAKEUP_ABUSE_LIMIT = 3;
const WAKEUP_ABUSE_WINDOW_MS = 10 * 60 * 1000;
const SNIPE_ROLE_ID = '1556315994614534296';
const PROFILE_PANEL_CHANNEL_ID = '1565741452707893278';
const PROFILE_BUTTON_ID = 'member_access_profile';
const VOICE_PANEL_CHANNEL_ID = '1565752911433302096';
const VOICE_PANEL_IDS = {
  create: 'voice-panel:create',
  rename: 'voice-panel:rename',
  privacy: 'voice-panel:privacy',
  access: 'voice-panel:access',
  delete: 'voice-panel:delete',
  accessMemberSelect: 'voice-panel:access-member-select',
  accessRoleSelect: 'voice-panel:access-role-select',
  createModal: 'voice-panel:create-modal',
  createInput: 'voice-panel:create-input',
  renameModal: 'voice-panel:rename-modal',
  renameInput: 'voice-panel:rename-input',
};
const PERSONAL_ROLE_PANEL_CHANNEL_ID = '1566461084712312852';
const PERSONAL_ROLE_PANEL_IDS = {
  open: 'personal-role-panel:open',
  rename: 'personal-role-panel:rename',
  colors: 'personal-role-panel:colors',
  icon: 'personal-role-panel:icon',
  iconUploadButton: 'personal-role-panel:icon-upload-button',
  iconEmojiButton: 'personal-role-panel:icon-emoji-button',
  iconEmojiPage: 'personal-role-panel:icon-emoji-page',
  iconEmojiSelect: 'personal-role-panel:icon-emoji-select',
  iconRemoveButton: 'personal-role-panel:icon-remove-button',
  blocked: 'personal-role-panel:blocked',
  delete: 'personal-role-panel:delete',
  solid: 'personal-role-panel:solid',
  gradient: 'personal-role-panel:gradient',
  solidSelect: 'personal-role-panel:solid-select',
  gradientSelect: 'personal-role-panel:gradient-select',
  holographic: 'personal-role-panel:holographic',
  resetColor: 'personal-role-panel:reset-color',
  blockedSelect: 'personal-role-panel:blocked-select',
  deleteConfirm: 'personal-role-panel:delete-confirm',
  deleteCancel: 'personal-role-panel:delete-cancel',
  renameModal: 'personal-role-panel:rename-modal',
  renameInput: 'personal-role-panel:rename-input',
  solidModal: 'personal-role-panel:solid-modal',
  solidInput: 'personal-role-panel:solid-input',
  gradientModal: 'personal-role-panel:gradient-modal',
  gradientPrimary: 'personal-role-panel:gradient-primary',
  gradientSecondary: 'personal-role-panel:gradient-secondary',
  iconModal: 'personal-role-panel:icon-modal',
  iconUpload: 'personal-role-panel:icon-upload',
};

const PERSONAL_ROLE_SOLID_COLORS = [
  ['Rouge', 'ED4245', '🔴'], ['Rose', 'EB459E', '🩷'], ['Violet', '9B59B6', '🟣'],
  ['Bleu', '5865F2', '🔵'], ['Bleu ciel', '3498DB', '🩵'], ['Turquoise', '1ABC9C', '💠'],
  ['Vert', '57F287', '🟢'], ['Jaune', 'FEE75C', '🟡'], ['Orange', 'E67E22', '🟠'],
  ['Blanc', 'FFFFFF', '⚪'], ['Gris', '95A5A6', '🩶'], ['Noir', '1E1F22', '⚫'],
];
const PERSONAL_ROLE_GRADIENTS = [
  ['Coucher de soleil', 'FF6B6B:FFB347', '🌅'], ['Océan', '5865F2:36D1DC', '🌊'],
  ['Aurore', '8E54E9:57F287', '🌌'], ['Bonbon', 'EB459E:9B59B6', '🍬'],
  ['Feu', 'ED4245:FEE75C', '🔥'], ['Glace', '74EBD5:9FACE6', '❄️'],
];
const PERSONAL_ROLE_EDIT_COOLDOWN_MS = 5_000;
const personalRoleEditCooldowns = new Map();
const authorizedPersonalRoleAssignments = new Map();

async function enforcePersonalRoleEditCooldown(interaction) {
  const key = `${interaction.guildId}:${interaction.user.id}`;
  const now = Date.now();
  const availableAt = personalRoleEditCooldowns.get(key) ?? 0;
  if (availableAt > now) {
    const remaining = Math.max(1, Math.ceil((availableAt - now) / 1000));
    await interaction.reply(panel(
      'warning',
      'Modification trop rapide',
      `Attends encore **${remaining} seconde${remaining > 1 ? 's' : ''}** avant de modifier de nouveau ton rôle.`,
      true,
    ));
    return false;
  }
  personalRoleEditCooldowns.set(key, now + PERSONAL_ROLE_EDIT_COOLDOWN_MS);
  return true;
}

function authorizePersonalRoleAssignment(guildId, memberId, roleId) {
  const key = `${guildId}:${memberId}:${roleId}`;
  const previousTimer = authorizedPersonalRoleAssignments.get(key);
  if (previousTimer) clearTimeout(previousTimer);
  const timer = setTimeout(() => authorizedPersonalRoleAssignments.delete(key), 15_000);
  authorizedPersonalRoleAssignments.set(key, timer);
}

function consumePersonalRoleAssignmentAuthorization(guildId, memberId, roleId) {
  const key = `${guildId}:${memberId}:${roleId}`;
  const timer = authorizedPersonalRoleAssignments.get(key);
  if (!timer) return false;
  clearTimeout(timer);
  authorizedPersonalRoleAssignments.delete(key);
  return true;
}

const RANKS = [
  { roleId: '1565392656970817568', linkedRoleId: null },
  { roleId: '1564636248499429446', linkedRoleId: null },
  { roleId: '1564638261769404428', linkedRoleId: null },
  { roleId: '1564636235333505126', linkedRoleId: null },
];
const CREATOR_ROLE_ID = '1565034303560355870';
const ELITE_ROLE_ID = '1565392656970817568';
const PREMIUM_ROLE_ID = '1564636248499429446';
const PLUS_ROLE_ID = '1564638261769404428';
const BASIC_ROLE_ID = '1564636235333505126';

function prestigeRoleForGuild(guild) {
  return guild?.roles.cache.find((role) => {
    const name = role.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return name === 'prestige' || name === 'pvcool prestige' || name.endsWith(' prestige');
  }) ?? null;
}
const TICKET_PANEL_CHANNEL_ID = '1563907534119633019';
const TICKET_CATEGORY_ID = '1566175178445291691';
const TICKET_SELECT_ID = 'ticket-panel:select';
const TICKET_CLAIM_ID = 'ticket:claim';
const TICKET_CLOSE_ID = 'ticket:close';
const TICKET_RELEASE_ID = 'ticket:release';
const TICKET_TRANSCRIPT_ID = 'ticket:transcript';
const SUPPORT_COMMANDS = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gérer le ticket actuel')
    .addSubcommand((command) => command
      .setName('add')
      .setDescription('Ajouter un membre au ticket')
      .addUserOption((option) => option.setName('membre').setDescription('Membre à ajouter').setRequired(true)))
    .addSubcommand((command) => command.setName('close').setDescription('Fermer le ticket dans quelques secondes')),
  new SlashCommandBuilder()
    .setName('punish')
    .setDescription('Interdire temporairement à un membre d’ouvrir des tickets')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à sanctionner').setRequired(true))
    .addStringOption((option) => option.setName('duree').setDescription('Exemples : 30m, 2h ou 3j').setRequired(true)),
  new SlashCommandBuilder()
    .setName('unpunish')
    .setDescription('Rétablir immédiatement l’accès d’un membre aux tickets')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à réautoriser').setRequired(true)),
].map((command) => command.toJSON());
const ROLE_MANAGER_ID = '1564627919354069012';
const MUSIC_BOT_ROLE_NAME = /^(?:Jockie Music(?: \([1-3]\))?|.*ND Player(?: [23])?)$/i;
const MUSIC_BOT_READ_ONLY_CATEGORY_ID = '1555872641070407770';
const MUSIC_BOT_WRITABLE_CHANNEL_ID = '1564379084535111730';
const MUSIC_BOT_BLOCKED_CATEGORY_IDS = new Set([
  '1563907366301204500',
  '1564293268768825487',
  '1563883943147610132',
]);
const MUSIC_BOT_PERMISSIONS = new PermissionsBitField([
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.UseExternalEmojis,
  PermissionFlagsBits.UseExternalStickers,
  PermissionFlagsBits.UseApplicationCommands,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.Stream,
  PermissionFlagsBits.UseVAD,
  PermissionFlagsBits.UseSoundboard,
  PermissionFlagsBits.UseExternalSounds,
  PermissionFlagsBits.RequestToSpeak,
]);
const personalRolePositionTimers = new Map();
const PROTECTED_ROLE_ASSIGNERS = new Set([
  '1565392656970817568', // PVCool Elite
  '1564636248499429446', // PVCool Premium
  '1564638261769404428', // PVCool Plus
]);
const FORBIDDEN_ROLE_TIMEOUT_MS = 5 * 60 * 1000;
const TIMEOUT_ROLE_IDS = new Set([
  '1564636235333505126',
  '1564638261769404428',
  '1565034303560355870',
]);
const TIMEOUT_UNITS = {
  minutes: { multiplier: 60 * 1000, singular: 'minute', plural: 'minutes' },
  hours: { multiplier: 60 * 60 * 1000, singular: 'heure', plural: 'heures' },
  days: { multiplier: 24 * 60 * 60 * 1000, singular: 'jour', plural: 'jours' },
};
const TIMEOUT_UNIT_ALIASES = {
  m: 'minutes', min: 'minutes', minute: 'minutes', minutes: 'minutes',
  h: 'hours', heure: 'hours', heures: 'hours',
  j: 'days', d: 'days', jour: 'days', jours: 'days', day: 'days', days: 'days',
};
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;
const SMASH_OR_PASS_CHANNEL_ID = '1565028083965108294';
const IMAGE_THREAD_CHANNEL_ID = '1563884576550690887';
const HALLOWEEN_CANDY_CHANNEL_ID = '1564379007414181928';
const BOOSTER_CANDY_CAMPAIGN_KEY = 'booster-gift-2026-10-31';
const BOOSTER_CANDY_REWARD = 100;
const CANDY_PROFILE_BUTTON_ID = 'candy:profile';
const CANDY_SHOP_BUTTON_ID = 'candy:shop';
const CANDY_BUILDINGS_BUTTON_ID = 'candy:buildings';
const CANDY_RENT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CANDY_HOLDER_ROLE_NAME = 'Bimo';
const CANDY_HOLDER_ROLE_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CANDY_SOCIAL_CHANNEL_ID = '1564379140088664094';
const CANDY_SHOP_ITEMS = {
  x2: { label: 'Potion ×2', price: 150, multiplier: 2, emoji: '🧪', image: 'potion', advantage: 'Double ton prochain gain de flocons.' },
  x3: { label: 'Chapeau ×3', price: 350, multiplier: 3, emoji: '🎩', image: 'hat', advantage: 'Triple ton prochain gain de flocons.' },
  x5: { label: 'Cristal ×5', price: 750, multiplier: 5, emoji: '💎', image: 'crystal', advantage: 'Multiplie ton prochain gain de flocons par cinq.' },
  badge: { label: 'Badge Collectionneur', price: 1200, badge: '❄️ Collectionneur', emoji: '💀', image: 'skull', advantage: 'Débloque un badge permanent affiché sur ton profil.' },
};
const CANDY_SHOP_ITEM_IDS = Object.keys(CANDY_SHOP_ITEMS);
const CANDY_BUILDINGS = {
  kiosk: { label: 'Kiosque', price: 800, rent: 25, emoji: '🏪' },
  house: { label: 'Maison', price: 2500, rent: 70, emoji: '🏠' },
  building: { label: 'Immeuble', price: 6500, rent: 160, emoji: '🏢' },
  hotel: { label: 'Hôtel', price: 15000, rent: 340, emoji: '🏨' },
};
const CANDY_RENT_MALUSES = [
  { label: 'Frais d’entretien', rate: 0.15, threshold: 0.15 },
  { label: 'Taxe foncière', rate: 0.25, threshold: 0.25 },
  { label: 'Logement vacant', rate: 0.40, threshold: 0.30 },
];
const WELCOME_CHANNEL_ID = '1565022361160388689';
const PRIVATE_VOICE_CATEGORY_ID = '1555872641070407771';
const PRIVATE_VOICE_INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;
const PRIVATE_VOICE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const PROTECTED_CHANNEL_CATEGORY_NAMES = ['chat', 'information', 'pvcool', 'quete et evenements'];
const OWNER_LOCKED_CATEGORY_IDS = new Set([
  '1555872641070407770',
  '1563883943147610132',
  '1564293268768825487',
  '1563907366301204500',
  '1565402188316942536',
]);
const restoringOwnerLockedCategories = new Set();
const authorizedChannelDeletions = new Set();
const SECURITY_FORUM_ID = '1565402480144023602';
const COMMAND_LOG_TAGS = ['My Role', 'Rôles perso', 'Perso', 'Rank', 'Dog', 'Clear', 'TO', 'PV', 'Access', 'Salons perso'];
const LEGACY_COMMAND_LOG_TAGS = new Set(['PV', 'Access']);
const LEGACY_COMMAND_LOG_NAMES = new Set(['modèle — /pv', 'modèle — /access']);
const COMMAND_LOG_FORUMS = [
  {
    id: '1565405625788276796',
    tags: ['Rôles perso', 'Perso', 'Dog', 'Salons perso'],
  },
  {
    id: '1565406116790141019',
    tags: ['Clear', 'TO', 'Rank'],
  },
];
const COMMAND_LOG_PRESENTATION = {
  'Rôles perso': {
    command: 'panneau-rôle-personnel',
    threadName: 'Modifications des rôles perso',
    icon: '🎨',
    color: 0x9B72FF,
    options: 'création · nom · couleurs · icône · interdictions · suppression',
    description: 'Historique centralisé des créations et modifications effectuées depuis le panneau des rôles personnels.',
  },
  Perso: { command: '/perso', icon: '✨', color: 0xEB459E, options: 'membre concerné', description: 'Ajout ou retrait d’un rôle personnel à un membre.' },
  Rank: { command: '/rank', icon: '🏅', color: 0xF1C40F, options: 'membre · rank sélectionné', description: 'Attribution, remplacement ou retrait d’un rank.' },
  Dog: { command: '/dog', icon: '🐕', color: 0xE67E22, options: 'membre concerné', description: 'Mise en laisse ou libération d’un membre.' },
  Clear: { command: '/clear', icon: '🧹', color: 0x3498DB, options: 'nombre facultatif · membre facultatif', description: 'Suppression groupée de messages dans un salon.' },
  TO: { command: '/to', icon: '⏳', color: 0xED4245, options: 'membre · durée (30m, 2h ou 3j) · raison facultative', description: 'Exclusion temporaire appliquée à un membre.' },
  'Salons perso': {
    command: 'salons-personnalises',
    threadName: 'Logs — salons personnalisés',
    icon: '🔊',
    color: 0x5865F2,
    options: 'création · renommage · privé/public · accès · suppression',
    description: 'Historique centralisé de toutes les actions effectuées depuis le panneau vocal.',
  },
};
const VOICE_ABUSE_LIMIT = 5;
const VOICE_ABUSE_WINDOW_MS = 60 * 1000;
const VOICE_ABUSE_FIRST_TIMEOUT_MS = 10 * 60 * 1000;
const VOICE_ABUSE_REPEAT_TIMEOUT_MS = 30 * 60 * 1000;
const VOICE_ABUSE_REPEAT_PERIOD_MS = 24 * 60 * 60 * 1000;
const voiceModerationActions = new Map();
const processedVoiceAuditEntries = new Map();
const processedBanAuditEntries = new Map();
const halloweenCandyActivity = new Map();
const halloweenTriviaActivity = new Map();
const triviaExpirationTimers = new Map();
const voiceCandyTimers = new Map();
const inviteSnapshots = new Map();
const inviteJoinQueues = new Map();
const antispamActivity = new Map();
const antispamLogCooldowns = new Map();
const DANGEROUS_LINK_DOMAINS = new Set([
  'grabify.link', 'grabify.org', 'iplogger.org', 'iplogger.com', '2no.co',
  'yip.su', 'blasze.com', 'ipgrabber.ru', 'ps3cfw.com', 'bmwforum.co',
]);
const TRUSTED_BRAND_DOMAINS = {
  discord: ['discord.com', 'discord.gg', 'discordapp.com', 'discord.gift', 'discordstatus.com', 'discord.dev', 'discord.js.org', 'discordpy.readthedocs.io'],
  steam: ['steampowered.com', 'steamcommunity.com', 'steamdb.info'],
  roblox: ['roblox.com', 'rbxcdn.com'],
  paypal: ['paypal.com', 'paypalobjects.com'],
  epicgames: ['epicgames.com'],
};
const deletedMessageCache = new Map();
const badwordDeletedMessageIds = new Set();
const SNIPE_CACHE_MS = 5 * 60 * 1000;
const SNIPE_DISPLAY_MS = 20 * 1000;
const giveawayTimers = new Map();
const BAN_ABUSE_LIMIT = 4;
const BAN_ABUSE_WINDOW_MS = 60 * 1000;
const BAN_ABUSE_TIMEOUT_MS = 10 * 60 * 1000;
const BAN_ABUSE_STRIKE_TTL_MS = 24 * 60 * 60 * 1000;
const TRIVIA_DIFFICULTIES = {
  easy: { label: 'Facile', min: 1, max: 2, color: 0x57F287 },
  medium: { label: 'Moyenne', min: 3, max: 4, color: 0xFEE75C },
  hard: { label: 'Difficile', min: 5, max: 7, color: 0xED4245 },
};
const YES_NO_TRIVIA = [
  { level: 'easy', question: 'Halloween est fêté le 31 octobre.', correct: true },
  { level: 'easy', question: 'Une araignée possède six pattes.', correct: false },
  { level: 'easy', question: 'La citrouille est associée à Halloween.', correct: true },
  { level: 'easy', question: 'L’hiver vient juste après le printemps.', correct: false },
  { level: 'easy', question: 'La neige est constituée de cristaux de glace.', correct: true },
  { level: 'easy', question: 'Paris est la capitale de l’Italie.', correct: false },
  { level: 'easy', question: 'Le dauphin est un mammifère.', correct: true },
  { level: 'easy', question: 'Le Soleil est une planète.', correct: false },
  { level: 'medium', question: 'Le symbole chimique de l’or est Au.', correct: true },
  { level: 'medium', question: 'Canberra est la capitale de l’Australie.', correct: true },
  { level: 'medium', question: 'La chauve-souris est un oiseau.', correct: false },
  { level: 'medium', question: 'Un blizzard est une violente tempête de neige.', correct: true },
  { level: 'medium', question: 'Le Nil traverse le Brésil.', correct: false },
  { level: 'medium', question: 'Le corps humain adulte possède généralement 206 os.', correct: true },
  { level: 'medium', question: 'Le Japon se trouve en Europe.', correct: false },
  { level: 'medium', question: 'Frankenstein a été écrit par Mary Shelley.', correct: true },
  { level: 'medium', question: 'Le mercure est solide à température ambiante.', correct: false },
  { level: 'medium', question: 'Une pieuvre possède trois cœurs.', correct: true },
  { level: 'hard', question: 'Samhain est une fête celtique liée aux origines d’Halloween.', correct: true },
  { level: 'hard', question: 'La couche d’ozone se situe principalement dans la troposphère.', correct: false },
  { level: 'hard', question: 'Le nombre atomique de l’or est 79.', correct: true },
  { level: 'hard', question: 'La fosse des Mariannes se trouve dans l’océan Atlantique.', correct: false },
  { level: 'hard', question: 'Le cercle polaire arctique se situe dans l’hémisphère Nord.', correct: true },
  { level: 'hard', question: 'Vivaldi a composé Les Quatre Saisons.', correct: true },
  { level: 'hard', question: 'Le Machu Picchu a été construit par les Aztèques.', correct: false },
  { level: 'hard', question: 'Le permafrost est un sol gelé durablement.', correct: true },
  { level: 'hard', question: 'Bram Stoker est l’auteur de Dracula.', correct: true },
  { level: 'hard', question: 'L’être humain possède normalement 48 chromosomes.', correct: false },
];
const GENERATED_YES_NO_TRIVIA = HALLOWEEN_TRIVIA.map((entry, index, questions) => {
  const correct = index % 2 === 0;
  const proposedAnswer = correct
    ? entry.answers[0]
    : questions[(index + 37) % questions.length].answers[0];
  return {
    level: entry.level,
    question: `À la question « ${entry.question} », la réponse serait « ${proposedAnswer} ».`,
    correct,
    wikiQuery: entry.answers[0],
  };
});
const ALL_YES_NO_TRIVIA = [...YES_NO_TRIVIA, ...GENERATED_YES_NO_TRIVIA];
const TRIVIA_MIN_MESSAGE_COUNT = 25;
const TRIVIA_MAX_MESSAGE_COUNT = 45;
const TRIVIA_AUTO_COOLDOWN_MS = 0;
const TRIVIA_EXPIRATION_MS = 60 * 1000;
const CANDY_GAMES_ENABLED = true;
// Conservé pour une reprise ultérieure, mais entièrement désactivé pour le moment.
const CANDY_FAMILY_ENABLED = false;
const VOICE_CANDY_MIN_DELAY_MS = 2 * 60 * 1000;
const VOICE_CANDY_MAX_DELAY_MS = 8 * 60 * 1000;
const VOICE_CANDY_MIN_REWARD = 1;
const VOICE_CANDY_MAX_REWARD = 3;
const MAX_GIVEAWAY_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const SECURITY_FORUM_SECTIONS = [
  { key: 'voice', tag: 'Vocal', title: 'Vocal', icon: '🔊', color: 0x9B59B6, description: 'Série de mutes, casques serveur ou déplacements forcés.' },
  { key: 'sanctions', tag: 'Sanctions', title: 'Sanctions', icon: '🔨', color: 0xED4245, description: 'Timeout, expulsion ou bannissement appliqué automatiquement.' },
  { key: 'blacklist', tag: 'Blacklist', title: 'Blacklist', icon: '⛔', color: 0x992D22, description: 'Compte ajouté à la blacklist persistante ou rebanni.' },
  { key: 'spam', tag: 'Antispam', title: 'Antispam', icon: '🧹', color: 0x3498DB, description: 'Messages excédentaires, doublons et liens supprimés automatiquement.' },
];
const FORBIDDEN_ROLE_PERMISSIONS = new PermissionsBitField([
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.MentionEveryone,
]);

const botMode = (process.env.BOT_MODE ?? 'support').trim().toLowerCase();
if (!['all', 'main', 'candy', 'support', 'stats'].includes(botMode)) {
  throw new Error(`BOT_MODE invalide : ${botMode}. Utilise main, candy, support ou stats.`);
}
const mainModeActive = botMode === 'all' || botMode === 'main';
const candyModeActive = botMode === 'all' || botMode === 'candy';
const supportModeActive = botMode === 'all' || botMode === 'support';
const statsModeActive = botMode === 'all' || botMode === 'stats';
if (mainModeActive && !process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN est manquant pour le bot principal.');
if (botMode === 'candy' && !process.env.CANDY_DISCORD_TOKEN) throw new Error('CANDY_DISCORD_TOKEN est manquant pour le bot Flocons.');
if (botMode === 'support' && !process.env.SUPPORT_DISCORD_TOKEN) throw new Error('SUPPORT_DISCORD_TOKEN est manquant pour le bot Support.');
if (botMode === 'stats' && !process.env.STATS_DISCORD_TOKEN) throw new Error('STATS_DISCORD_TOKEN est manquant pour le bot Statistiques.');

const token = process.env.DISCORD_TOKEN?.trim().replace(/^Bot\s+/i, '') || null;
const candyToken = process.env.CANDY_DISCORD_TOKEN?.trim().replace(/^Bot\s+/i, '') || null;
const supportToken = process.env.SUPPORT_DISCORD_TOKEN?.trim().replace(/^Bot\s+/i, '') || null;
const statsToken = process.env.STATS_DISCORD_TOKEN?.trim().replace(/^Bot\s+/i, '') || null;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});
const candyClient = candyModeActive && candyToken ? new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
}) : null;
const candyRuntimeClient = candyClient ?? client;
const supportClient = supportModeActive && supportToken ? new Client({
  intents: [GatewayIntentBits.Guilds],
}) : null;
const supportRuntimeClient = supportClient ?? client;
const statsClient = statsModeActive && statsToken ? new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
}) : null;
const statsRuntimeClient = statsClient ?? client;

const isWhitelisted = (guildData, userId) => guildData.whitelist.includes(userId);

function rankTierForRole(role) {
  if (!role) return null;
  const normalizedName = role.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalizedName.includes('elite')) return 0;
  if (normalizedName.includes('premium')) return 1;
  if (normalizedName.includes('plus')) return 2;
  if (normalizedName.includes('basic')) return 3;
  const fallbackIndex = RANKS.findIndex(({ roleId }) => roleId === role.id);
  return fallbackIndex >= 0 ? fallbackIndex : null;
}

function memberStandardRankRole(member) {
  return RANKS
    .map(({ roleId }) => member.guild.roles.cache.get(roleId))
    .filter((role) => role && member.roles.cache.has(role.id))
    .sort((left, right) => (
      (rankTierForRole(left) ?? 99) - (rankTierForRole(right) ?? 99)
    ))[0] ?? null;
}

function memberRankTier(member) {
  if (!member) return null;
  if (member.roles.cache.has(CREATOR_ROLE_ID)) return -1;
  return rankTierForRole(memberStandardRankRole(member));
}

function hasPremiumAccess(member) {
  const tier = memberRankTier(member);
  return tier !== null && tier <= 1;
}

function canUseOwnerChannelCommands(member) {
  return member?.id === OWNER_COMMAND_USER_ID || hasPremiumAccess(member);
}

function canUseNewCommand(member) {
  return member?.id === OWNER_COMMAND_USER_ID
    || member?.roles.cache.has(ELITE_ROLE_ID);
}

function canUseLockCommand(member) {
  return canUseOwnerChannelCommands(member);
}

function canUseUnbanCommand(member) {
  return member?.roles.cache.has(ELITE_ROLE_ID)
    || member?.roles.cache.has(CREATOR_ROLE_ID);
}

function canManageBlacklist(member) {
  return member?.roles.cache.has(CREATOR_ROLE_ID);
}

function parseUserId(rawTarget) {
  const mentionMatch = rawTarget?.match(/^<@!?(\d{17,20})>$/);
  return mentionMatch?.[1] ?? (/^\d{17,20}$/.test(rawTarget ?? '') ? rawTarget : null);
}

const PANEL_STYLES = {
  success: { color: 0x57F287, icon: '✓' },
  error: { color: 0xED4245, icon: '✕' },
  warning: { color: 0xFEE75C, icon: '!' },
  info: { color: 0x5865F2, icon: '•' },
};

function panel(style, title, description, privateReply = false) {
  const selected = PANEL_STYLES[style] ?? PANEL_STYLES.info;
  const container = new ContainerBuilder()
    .setAccentColor(selected.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${selected.icon} ${title.toUpperCase()}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description),
    );

  const flags = MessageFlags.IsComponentsV2
    | (privateReply ? MessageFlags.Ephemeral : 0);
  return { components: [container], flags };
}

function profilePanelMessage() {
  const embed = new EmbedBuilder()
    .setColor(0x76569B)
    .setTitle('Profil et accès')
    .setDescription('Consulte ton rang, tes whitelists et les commandes auxquelles tu as accès.')
    .setFooter({ text: 'Les informations affichées sont visibles uniquement par toi.' });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(PROFILE_BUTTON_ID)
      .setLabel('Voir mon profil')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row] };
}

async function ensureProfilePanel(guild) {
  const guildData = getGuildData(guild.id);
  const channel = await guild.channels.fetch(PROFILE_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) {
    console.error(`Le salon de profil ${PROFILE_PANEL_CHANNEL_ID} est introuvable ou incompatible.`);
    return;
  }

  let message = guildData.profilePanelMessageId
    ? await channel.messages.fetch(guildData.profilePanelMessageId).catch(() => null)
    : null;
  if (message) {
    await message.edit(profilePanelMessage());
    return;
  }
  message = await channel.send(profilePanelMessage());
  guildData.profilePanelMessageId = message.id;
  await saveStore();
}

async function ghostPingRankedMember(guild, memberId) {
  const channel = await guild.channels.fetch(PROFILE_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return;
  const ping = await channel.send({
    content: `<@${memberId}>`,
    allowedMentions: { users: [memberId], roles: [], repliedUser: false },
  });
  await ping.delete().catch(() => null);
}

function memberProfileData(member, guildData) {
  const rankRole = memberStandardRankRole(member);
  const displayedAccessRole = rankRole;
  const hasPremiumRoleAccess = hasPremiumAccess(member);
  const isCreator = member.roles.cache.has(CREATOR_ROLE_ID);
  const isManager = WHITELIST_MANAGERS.has(member.id);
  const personalRoleId = guildData.personalRoles[member.id];
  const personalRole = personalRoleId ? member.guild.roles.cache.get(personalRoleId) : null;
  const hasPerso = isWhitelisted(guildData, member.id);
  const hasPv = guildData.pvWhitelist.includes(member.id);
  const hasDog = guildData.dogWhitelist.includes(member.id);
  const hasSpamWhitelist = guildData.spamWhitelist.includes(member.id);
  const hasBanWhitelist = guildData.banWhitelist.includes(member.id);
  const hasWakeupWhitelist = guildData.wakeupWhitelist.includes(member.id);
  const hasLocknameWhitelist = guildData.locknameWhitelist.includes(member.id);
  const hasQuizWhitelist = guildData.quizWhitelist.includes(member.id);
  const rankTier = memberRankTier(member);
  const hasRank = rankTier !== null && rankTier < 3;
  const hasClear = isCreator || (rankTier !== null && rankTier < 3);
  const hasTimeout = isManager || hasPremiumRoleAccess
    || member.roles.cache.some((role) => TIMEOUT_ROLE_IDS.has(role.id));
  const hasSnipe = isManager || hasPremiumRoleAccess || member.roles.cache.has(SNIPE_ROLE_ID);
  const hasNew = canUseNewCommand(member);
  const hasLock = canUseLockCommand(member);
  const hasUnban = canUseUnbanCommand(member);
  const hasBlacklist = canManageBlacklist(member);
  const hasTicketCommands = member.id === OWNER_COMMAND_USER_ID
    || member.roles.cache.has(CREATOR_ROLE_ID)
    || member.roles.cache.has(ELITE_ROLE_ID)
    || member.roles.cache.has(PLUS_ROLE_ID);
  const hasTicketPunish = canPunishTicketMember(member);
  const commandAccess = [
    { label: '/perso', allowed: hasPerso },
    { label: '/dog', allowed: hasDog },
    { label: '/rank', allowed: hasRank },
    { label: '/clear', allowed: hasClear },
    { label: '/to', allowed: hasTimeout },
    { label: '/ban', allowed: hasBanWhitelist },
    { label: '/wakeup', allowed: hasWakeupWhitelist },
    { label: '/lockname', allowed: hasLocknameWhitelist },
    { label: '/ticket add', allowed: hasTicketCommands },
    { label: '/ticket close', allowed: hasTicketCommands },
    { label: '/punish', allowed: hasTicketPunish },
    { label: '/unpunish', allowed: hasTicketPunish },
    { label: '+quiz', allowed: hasQuizWhitelist },
    { label: '+snipe', allowed: hasSnipe },
    { label: '+giveaway', allowed: isManager || member.roles.cache.has(ELITE_ROLE_ID) },
    { label: '+new', allowed: hasNew },
    { label: '+lock', allowed: hasLock },
    { label: '+unlock', allowed: hasLock },
    { label: '+unban', allowed: hasUnban },
    { label: '+blacklist', allowed: hasBlacklist },
    { label: '+unblacklist', allowed: hasBlacklist },
    { label: '+badword', allowed: canManageBadwords(member) },
  ];
  const importantPermissions = [
    ['Administrateur', PermissionFlagsBits.Administrator],
    ['Gérer le serveur', PermissionFlagsBits.ManageGuild],
    ['Gérer les rôles', PermissionFlagsBits.ManageRoles],
    ['Gérer les salons', PermissionFlagsBits.ManageChannels],
    ['Gérer les messages', PermissionFlagsBits.ManageMessages],
    ['Gérer les pseudos', PermissionFlagsBits.ManageNicknames],
    ['Voir les logs', PermissionFlagsBits.ViewAuditLog],
    ['Expulser', PermissionFlagsBits.KickMembers],
    ['Bannir', PermissionFlagsBits.BanMembers],
    ['Exclure temporairement', PermissionFlagsBits.ModerateMembers],
    ['Mute vocal', PermissionFlagsBits.MuteMembers],
    ['Deafen vocal', PermissionFlagsBits.DeafenMembers],
    ['Déplacer en vocal', PermissionFlagsBits.MoveMembers],
    ['Mentionner everyone', PermissionFlagsBits.MentionEveryone],
    ['Gérer les webhooks', PermissionFlagsBits.ManageWebhooks],
  ];
  const rankDetails = isCreator
    ? member.guild.roles.cache.get(CREATOR_ROLE_ID)?.name ?? 'Créateur'
    : (rankRole?.name ?? 'Aucun rang');
  const rankRoleId = isCreator ? CREATOR_ROLE_ID : rankRole?.id;

  return {
    member,
    accent: displayedAccessRole?.hexColor || '#76569B',
    rank: rankDetails,
    rankMention: rankRoleId ? `<@&${rankRoleId}>` : 'Aucun rang',
    personalRole: personalRole?.name ?? 'Non configuré',
    commands: commandAccess,
    permissions: importantPermissions.map(([label, permission]) => ({
      label,
      allowed: member.permissions.has(permission),
    })),
    whitelists: [
      { label: 'Perso', allowed: hasPerso },
      { label: 'PV', allowed: hasPv },
      { label: 'Dog', allowed: hasDog },
      { label: 'Antispam', allowed: hasSpamWhitelist },
      { label: 'Ban', allowed: hasBanWhitelist },
      { label: 'Wakeup', allowed: hasWakeupWhitelist },
      { label: 'Lockname', allowed: hasLocknameWhitelist },
      { label: 'Quiz', allowed: hasQuizWhitelist },
    ],
  };
}

function memberProfilePanel(profile) {
  const { member, commands, permissions, whitelists } = profile;
  const enabledCommands = commands.filter(({ allowed }) => allowed).map(({ label }) => `\`${label}\``);
  const disabledCommands = commands.filter(({ allowed }) => !allowed).map(({ label }) => `~~${label}~~`);
  const enabledPermissions = permissions.filter(({ allowed }) => allowed).map(({ label }) => label);
  const disabledPermissions = permissions.filter(({ allowed }) => !allowed).map(({ label }) => label);
  const whitelistLine = whitelists
    .map(({ label, allowed }) => `${allowed ? '✅' : '❌'} ${label}`)
    .join('　');
  const details = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `## Profil de ${member.displayName}`,
        `-# ${member.user.username} · ${member.id}`,
        '',
        `**Rang** — ${profile.rankMention}`,
        `**Rôle personnel** — ${profile.personalRole}`,
      ].join('\n')),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(member.displayAvatarURL({ size: 256 }))
        .setDescription(`Avatar de ${member.displayName}`),
    );
  const container = new ContainerBuilder()
    .setAccentColor(Number.parseInt(profile.accent.slice(1), 16) || 0x76569B)
    .addSectionComponents(details)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Whitelists — ${whitelists.filter(({ allowed }) => allowed).length}/${whitelists.length}\n${whitelistLine}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `### Commandes disponibles — ${enabledCommands.length}/${commands.length}`,
        enabledCommands.length ? enabledCommands.join(' · ') : '-# Aucune commande spéciale.',
        disabledCommands.length ? `-# Non disponibles : ${disabledCommands.join(' · ')}` : '-# Toutes les commandes sont disponibles.',
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `### Permissions Discord — ${enabledPermissions.length}/${permissions.length}`,
        enabledPermissions.length ? enabledPermissions.map((label) => `\`${label}\``).join(' · ') : '-# Aucune permission sensible.',
        disabledPermissions.length ? `-# Inactives : ${disabledPermissions.join(' · ')}` : '-# Toutes les permissions importantes sont actives.',
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${member.guild.name} · Informations mises à jour automatiquement`),
    );
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  };
}

async function handleProfileButton(interaction) {
  if (interaction.customId !== PROFILE_BUTTON_ID) return false;
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const guildData = getGuildData(interaction.guild.id);
  await interaction.reply(memberProfilePanel(memberProfileData(member, guildData)));
  return true;
}

function voicePanelMessage() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(VOICE_PANEL_IDS.create).setLabel('Créer').setEmoji('➕').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(VOICE_PANEL_IDS.rename).setLabel('Renommer').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(VOICE_PANEL_IDS.privacy).setLabel('Privé / Public').setEmoji('🔒').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(VOICE_PANEL_IDS.access).setLabel('Accès').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(VOICE_PANEL_IDS.delete).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  );
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '## 🔊 Salon vocal personnel',
        '-# Crée et contrôle ton vocal depuis un seul endroit.',
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '**Gestion rapide**',
        '・Crée un vocal synchronisé avec la catégorie',
        '・Renomme-le et choisis son accès privé ou public',
        '・Autorise des membres ou des rôles, ou supprime le salon',
      ].join('\n')),
    )
    .addActionRowComponents(row)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '-# Whitelist PV requise · un seul vocal par membre · suppression après 7 jours sans activité.',
        '-# Pas encore autorisé ? Ouvre un ticket owner dans <#1563907534119633019>.',
      ].join('\n')),
    );
  return {
    content: null,
    embeds: [],
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}

async function ensureVoicePanel(guild) {
  const guildData = getGuildData(guild.id);
  const channel = await guild.channels.fetch(VOICE_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) {
    console.error(`Le salon du panneau vocal ${VOICE_PANEL_CHANNEL_ID} est introuvable ou incompatible.`);
    return;
  }
  let message = guildData.voicePanelMessageId
    ? await channel.messages.fetch(guildData.voicePanelMessageId).catch(() => null)
    : null;
  if (message && (message.author.id !== guild.client.user.id || !message.flags.has(MessageFlags.IsComponentsV2))) {
    await message.delete().catch(console.error);
    message = null;
  }
  if (message) {
    await message.edit(voicePanelMessage());
    return;
  }
  message = await channel.send(voicePanelMessage());
  guildData.voicePanelMessageId = message.id;
  await saveStore();
}

function personalRolePanelMessage() {
  const firstRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.open).setLabel('Ouvrir mon espace').setEmoji('🎨').setStyle(ButtonStyle.Primary),
  );
  const container = new ContainerBuilder()
    .setAccentColor(0x9B72FF)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      '-# ✦ ESPACE PERSONNEL',
      '## Ton rôle, à ton image',
      'Crée et personnalise ton rôle depuis un espace privé et sécurisé.',
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      '**Personnalisation**',
      'Nom · couleur unie ou dégradée · icône · membres interdits',
      '',
      '**Partage du rôle**',
      'Utilise `/perso @membre` pour l’ajouter ou le retirer à quelqu’un.',
      '-# Toute attribution manuelle est automatiquement annulée par le bot.',
      '',
      '**Classement des rôles perso**',
      'Les rôles les plus actifs montent dans la hiérarchie chaque semaine.',
      'Consulte le classement dans <#1564992066696646807> avec le bouton **🎨 Rôles perso**.',
      '-# Une meilleure position donne un avantage pour `/dog` et les actions soumises à la hiérarchie des rôles.',
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(firstRow)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      '-# Whitelist Perso requise · permissions protégées · un seul rôle par membre',
      '-# Besoin d’un accès ? Ouvre un ticket **owner** dans <#1563907534119633019>.',
    ].join('\n')));
  return { content: null, embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 };
}

function personalRoleManagementMenu(role, created = false) {
  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.rename).setLabel('Nom').setEmoji('✏️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.colors).setLabel('Couleurs').setEmoji('🎨').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.icon).setLabel('Icône').setEmoji('🖼️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.blocked).setLabel('Interdits').setEmoji('🚫').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.delete).setLabel('Supprimer').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  );
  const container = new ContainerBuilder()
    .setAccentColor(role.color || 0x9B72FF)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `## ${created ? '✨ Ton rôle a été créé' : '✨ Modifier ton rôle'}`,
      `${role} · choisis l’élément que tu souhaites modifier.`,
      '-# Tes permissions restent protégées · utilise `/perso @membre` pour partager ce rôle.',
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(actions);
  return {
    content: null, embeds: [], components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    allowedMentions: { parse: [] },
  };
}

async function openOrCreatePersonalRole(interaction) {
  const guildData = getGuildData(interaction.guild.id);
  if (!isWhitelisted(guildData, interaction.user.id)) {
    await interaction.reply(panel(
      'error',
      'Whitelist Perso requise',
      'Tu dois posséder la whitelist Perso pour créer ou gérer un rôle personnel. Ouvre un ticket **owner** dans <#1563907534119633019> pour faire une demande.',
      true,
    ));
    return;
  }
  const registeredId = guildData.personalRoles[interaction.user.id];
  let role = registeredId ? await interaction.guild.roles.fetch(registeredId).catch(() => null) : null;
  if (role) {
    await interaction.reply(personalRoleManagementMenu(role));
    return;
  }
  if (registeredId) {
    delete guildData.personalRoles[interaction.user.id];
    delete guildData.personalRoleBlockedUsers[registeredId];
    await saveStore();
  }
  const botMember = interaction.guild.members.me;
  const anchorRole = interaction.guild.roles.cache.get(SNIPE_ROLE_ID);
  const ceilingRole = interaction.guild.roles.cache.get(ROLE_MANAGER_ID);
  if (!botMember || !anchorRole || !ceilingRole) {
    await interaction.reply(panel('error', 'Configuration incomplète', 'Le bot ne trouve pas le rôle de placement nécessaire.', true));
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  role = await interaction.guild.roles.create({
    name: `perso · ${interaction.user.globalName ?? interaction.user.username}`.slice(0, 100),
    permissions: 0n,
    hoist: false,
    mentionable: false,
    reason: `Rôle personnel créé depuis le panneau par ${interaction.user.tag}`,
  });
  try {
    const maximumPosition = Math.min(ceilingRole.position - 1, botMember.roles.highest.position - 1);
    await role.setPosition(Math.max(1, Math.min(anchorRole.position + 1, maximumPosition)), 'Placement du nouveau rôle personnel');
    const member = await interaction.guild.members.fetch(interaction.user.id);
    authorizePersonalRoleAssignment(interaction.guild.id, member.id, role.id);
    await member.roles.add(role, 'Attribution du nouveau rôle personnel');
  } catch (error) {
    await role.delete('Annulation de la création incomplète du rôle personnel').catch(() => null);
    throw error;
  }
  guildData.personalRoles[interaction.user.id] = role.id;
  guildData.roleHolders[role.id] = [interaction.user.id];
  guildData.personalRoleBlockedUsers[role.id] = [];
  await saveStore();
  void sendPersonalRoleModificationLog(interaction.guild, 'Rôle créé', interaction.user, role).catch(console.error);
  const response = personalRoleManagementMenu(role, true);
  response.flags = MessageFlags.IsComponentsV2;
  await interaction.editReply(response);
}

async function ensurePersonalRolePanel(guild) {
  const guildData = getGuildData(guild.id);
  const channel = await guild.channels.fetch(PERSONAL_ROLE_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) {
    console.error(`Le salon du panneau des rôles personnels ${PERSONAL_ROLE_PANEL_CHANNEL_ID} est introuvable ou incompatible.`);
    return;
  }
  let message = guildData.personalRolePanelMessageId
    ? await channel.messages.fetch(guildData.personalRolePanelMessageId).catch(() => null)
    : null;
  if (message && (message.author.id !== guild.client.user.id || !message.flags.has(MessageFlags.IsComponentsV2))) {
    await message.delete().catch(() => null);
    message = null;
  }
  if (message) await message.edit(personalRolePanelMessage());
  else {
    message = await channel.send(personalRolePanelMessage());
    guildData.personalRolePanelMessageId = message.id;
    await saveStore();
  }
}

async function personalRoleForInteraction(interaction) {
  const guildData = getGuildData(interaction.guild.id);
  if (!isWhitelisted(guildData, interaction.user.id)) {
    await interaction.reply(panel(
      'error',
      'Whitelist Perso requise',
      'Tu dois posséder la whitelist Perso pour gérer ce rôle. Ouvre un ticket **owner** dans <#1563907534119633019> pour faire une demande.',
      true,
    ));
    return null;
  }
  const roleId = guildData.personalRoles[interaction.user.id];
  if (!roleId) {
    await interaction.reply(panel('warning', 'Rôle non configuré', 'Utilise le panneau pour créer ton rôle personnel.', true));
    return null;
  }
  const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    delete guildData.personalRoles[interaction.user.id];
    delete guildData.personalRoleBlockedUsers[roleId];
    await saveStore();
    await interaction.reply(panel('error', 'Rôle introuvable', 'Le rôle a été désenregistré. Utilise de nouveau le panneau.', true));
    return null;
  }
  const botMember = interaction.guild.members.me;
  if (!role.editable || !botMember || role.position >= botMember.roles.highest.position) {
    await interaction.reply(panel('error', 'Hiérarchie insuffisante', 'Place le rôle du bot au-dessus de ton rôle personnel.', true));
    return null;
  }
  return { role, guildData };
}

function parseHexColor(value) {
  const normalized = value.trim().replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized, 16) : null;
}

function roleColorActions() {
  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.solid).setLabel('Unie').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.gradient).setLabel('Dégradée').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.holographic).setLabel('Holographique').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.resetColor).setLabel('Réinitialiser').setStyle(ButtonStyle.Secondary),
  );
  const container = new ContainerBuilder().setAccentColor(0x9B72FF)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      '## 🎨 Couleurs du rôle',
      'Choisis le type de couleur à appliquer.',
      '-# Les dégradés dépendent des fonctionnalités disponibles sur le serveur.',
    ].join('\n')))
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
    .addActionRowComponents(actions);
  return {
    content: null, embeds: [], components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
  };
}

async function personalRoleEmojiPicker(guild, requestedPage = 0) {
  const emojis = [...(await guild.emojis.fetch()).values()]
    .filter((emoji) => emoji.available)
    .sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '', 'fr'));
  if (!emojis.length) return null;
  const pageSize = 25;
  const pageCount = Math.ceil(emojis.length / pageSize);
  const page = Math.max(0, Math.min(requestedPage, pageCount - 1));
  const visibleEmojis = emojis.slice(page * pageSize, (page + 1) * pageSize);
  const select = new StringSelectMenuBuilder()
    .setCustomId(PERSONAL_ROLE_PANEL_IDS.iconEmojiSelect)
    .setPlaceholder(`Choisis un emoji · page ${page + 1}/${pageCount}`)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(visibleEmojis.map((emoji) => ({
      label: (emoji.name || `Emoji ${emoji.id}`).slice(0, 100),
      value: emoji.id,
      emoji: { id: emoji.id, animated: emoji.animated },
      description: 'Utiliser comme icône du rôle',
    })));
  const container = new ContainerBuilder().setAccentColor(0x9B72FF)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      '## 😀 Emojis du serveur',
      'Choisis l’emoji qui deviendra l’icône de ton rôle personnel.',
      `-# ${emojis.length} emoji(s) disponible(s) · page ${page + 1}/${pageCount} · liste actualisée en temps réel`,
    ].join('\n')))
    .addActionRowComponents(new ActionRowBuilder().addComponents(select));
  if (pageCount > 1) {
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${PERSONAL_ROLE_PANEL_IDS.iconEmojiPage}:${page - 1}`)
        .setLabel('Précédent').setEmoji('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId(`${PERSONAL_ROLE_PANEL_IDS.iconEmojiPage}:${page + 1}`)
        .setLabel('Suivant').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(page === pageCount - 1),
    ));
  }
  return container;
}

async function handlePersonalRolePanelButton(interaction) {
  if (!interaction.customId.startsWith('personal-role-panel:')) return false;
  if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.open) {
    await openOrCreatePersonalRole(interaction);
    return true;
  }
  if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.deleteCancel) {
    const response = panel('info', 'Suppression annulée', 'Ton rôle personnel est conservé.', true);
    delete response.flags;
    await interaction.update(response);
    return true;
  }
  const context = await personalRoleForInteraction(interaction);
  if (!context) return true;
  const { role, guildData } = context;
  if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.rename) {
    const modal = new ModalBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.renameModal).setTitle('Renommer le rôle')
      .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
        .setCustomId(PERSONAL_ROLE_PANEL_IDS.renameInput).setLabel('Nouveau nom').setStyle(TextInputStyle.Short)
        .setRequired(true).setMinLength(1).setMaxLength(100).setValue(role.name)));
    await interaction.showModal(modal);
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.colors) {
    await interaction.reply(roleColorActions());
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.solid) {
    const select = new StringSelectMenuBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.solidSelect)
      .setPlaceholder('Choisis une couleur')
      .addOptions(
        ...PERSONAL_ROLE_SOLID_COLORS.map(([label, value, emoji]) => ({ label, value, emoji })),
        { label: 'Couleur personnalisée', value: 'custom', emoji: '🎨', description: 'Saisir un code précis' },
      );
    const container = new ContainerBuilder().setAccentColor(0x5865F2)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🎨 Couleur unie\nChoisis directement une couleur dans la palette.'))
      .addActionRowComponents(new ActionRowBuilder().addComponents(select));
    await interaction.reply({ content: null, embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.gradient) {
    if (!interaction.guild.features.includes('ENHANCED_ROLE_COLORS')) {
      await interaction.reply(panel('warning', 'Dégradé indisponible', 'Cette fonctionnalité Discord n’est pas activée sur ce serveur.', true));
      return true;
    }
    const select = new StringSelectMenuBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.gradientSelect)
      .setPlaceholder('Choisis un dégradé')
      .addOptions(
        ...PERSONAL_ROLE_GRADIENTS.map(([label, value, emoji]) => ({ label, value, emoji })),
        { label: 'Dégradé personnalisé', value: 'custom', emoji: '🎨', description: 'Saisir deux couleurs précises' },
      );
    const container = new ContainerBuilder().setAccentColor(0x9B59B6)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🌈 Couleur dégradée\nChoisis un mélange déjà préparé dans la palette.'))
      .addActionRowComponents(new ActionRowBuilder().addComponents(select));
    await interaction.reply({ content: null, embeds: [], components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.holographic) {
    if (!interaction.guild.features.includes('ENHANCED_ROLE_COLORS')) {
      await interaction.reply(panel('warning', 'Holographique indisponible', 'Cette fonctionnalité Discord n’est pas activée sur ce serveur.', true));
      return true;
    }
    if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
    await role.setColors({ primaryColor: 11127295, secondaryColor: 16759788, tertiaryColor: 16761760 }, `Style holographique choisi par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Couleur holographique appliquée', interaction.user, role).catch(console.error);
    await interaction.reply(panel('success', 'Style appliqué', `${role} utilise maintenant le style holographique.`, true));
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.resetColor) {
    if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
    await role.setColors({ primaryColor: 0, secondaryColor: null, tertiaryColor: null }, `Couleur réinitialisée par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Couleur réinitialisée', interaction.user, role).catch(console.error);
    await interaction.reply(panel('success', 'Couleur réinitialisée', `La couleur de ${role} a été retirée.`, true));
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.icon) {
    const iconActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.iconUploadButton)
        .setLabel(role.icon ? 'Remplacer' : 'Ajouter').setEmoji('📤').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.iconEmojiButton)
        .setLabel('Emoji du serveur').setEmoji('😀').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.iconRemoveButton)
        .setLabel('Retirer l’icône').setEmoji('🗑️').setStyle(ButtonStyle.Danger).setDisabled(!role.icon && !role.unicodeEmoji),
    );
    const iconContainer = new ContainerBuilder().setAccentColor(0x9B72FF)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent([
        '## 🖼️ Icône du rôle',
        role.icon
          ? 'Tu peux remplacer l’icône actuelle ou la retirer complètement.'
          : 'Ton rôle ne possède pas encore d’icône. Envoie une image ou choisis un emoji du serveur.',
      ].join('\n')))
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addActionRowComponents(iconActions);
    await interaction.reply({
      content: null, embeds: [], components: [iconContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.iconUploadButton) {
    if (!interaction.guild.features.includes('ROLE_ICONS')) {
      await interaction.reply(panel('warning', 'Icônes indisponibles', 'Les icônes de rôle ne sont pas activées sur ce serveur.', true));
      return true;
    }
    const modal = new ModalBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.iconModal).setTitle('Icône du rôle')
      .addLabelComponents(new LabelBuilder().setLabel('Image').setDescription('PNG, JPG, WEBP ou GIF · 256 Ko maximum')
        .setFileUploadComponent(new FileUploadBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.iconUpload).setRequired(true).setMinValues(1).setMaxValues(1)));
    await interaction.showModal(modal);
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.iconEmojiButton) {
    if (!interaction.guild.features.includes('ROLE_ICONS')) {
      await interaction.reply(panel('warning', 'Icônes indisponibles', 'Les icônes de rôle ne sont pas activées sur ce serveur.', true));
      return true;
    }
    const emojiPicker = await personalRoleEmojiPicker(interaction.guild, 0);
    if (!emojiPicker) {
      await interaction.reply(panel('warning', 'Aucun emoji disponible', 'Ce serveur ne possède aucun emoji utilisable.', true));
      return true;
    }
    await interaction.reply({
      content: null, embeds: [], components: [emojiPicker],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  } else if (interaction.customId.startsWith(`${PERSONAL_ROLE_PANEL_IDS.iconEmojiPage}:`)) {
    const requestedPage = Number.parseInt(interaction.customId.split(':').at(-1), 10) || 0;
    const emojiPicker = await personalRoleEmojiPicker(interaction.guild, requestedPage);
    if (!emojiPicker) {
      const response = panel('warning', 'Aucun emoji disponible', 'Les emojis du serveur ne sont plus disponibles.', true);
      delete response.flags;
      await interaction.update(response);
      return true;
    }
    await interaction.update({ content: null, embeds: [], components: [emojiPicker], allowedMentions: { parse: [] } });
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.iconRemoveButton) {
    if (!role.icon && !role.unicodeEmoji) {
      await interaction.reply(panel('info', 'Aucune icône', 'Ce rôle ne possède déjà plus d’icône.', true));
      return true;
    }
    if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
    await role.setIcon(null, `Icône retirée par ${interaction.user.tag}`);
    if (role.unicodeEmoji) await role.setUnicodeEmoji(null, `Emoji de rôle retiré par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Icône retirée', interaction.user, role).catch(console.error);
    await interaction.reply(panel('success', 'Icône retirée', `L’icône de ${role} a été supprimée.`, true));
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.blocked) {
    const blocked = guildData.personalRoleBlockedUsers[role.id] ?? [];
    const select = new UserSelectMenuBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.blockedSelect)
      .setPlaceholder('Ajouter ou retirer un membre interdit').setMinValues(1).setMaxValues(1);
    const blockedContainer = new ContainerBuilder().setAccentColor(0xED4245)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🚫 Membres interdits\nSélectionne un membre pour basculer son accès.\n-# ${blocked.length} membre(s) actuellement interdit(s).`))
      .addActionRowComponents(new ActionRowBuilder().addComponents(select));
    await interaction.reply({
      content: null, embeds: [], components: [blockedContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.delete) {
    const deleteActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.deleteConfirm).setLabel('Supprimer définitivement').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.deleteCancel).setLabel('Annuler').setStyle(ButtonStyle.Secondary),
    );
    const deleteContainer = new ContainerBuilder().setAccentColor(0xED4245)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🗑️ Supprimer ${role.name} ?\nCette action retire définitivement le rôle à tous ses membres.`))
      .addActionRowComponents(deleteActions);
    await interaction.reply({
      content: null, embeds: [], components: [deleteContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral, allowedMentions: { parse: [] },
    });
  } else if (interaction.customId === PERSONAL_ROLE_PANEL_IDS.deleteConfirm) {
    if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
    await interaction.deferUpdate();
    const deletedRole = { id: role.id, name: role.name };
    await role.delete(`Rôle personnel supprimé par son propriétaire ${interaction.user.tag}`);
    delete guildData.personalRoles[interaction.user.id];
    delete guildData.personalRoleBlockedUsers[role.id];
    delete guildData.roleHolders[role.id];
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions.filter((id) => id !== role.id);
    await saveStore();
    void sendPersonalRoleModificationLog(interaction.guild, 'Rôle supprimé', interaction.user, deletedRole).catch(console.error);
    await interaction.editReply(panel('success', 'Rôle supprimé', 'Ton rôle personnel a été supprimé définitivement.', true));
  }
  return true;
}

async function handlePersonalRoleBlockedSelect(interaction) {
  if (interaction.customId !== PERSONAL_ROLE_PANEL_IDS.blockedSelect) return false;
  const context = await personalRoleForInteraction(interaction);
  if (!context) return true;
  const { role, guildData } = context;
  const targetId = interaction.values[0];
  if (targetId === interaction.user.id) {
    await interaction.reply(panel('warning', 'Action refusée', 'Tu ne peux pas t’interdire ton propre rôle.', true));
    return true;
  }
  if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
  const blocked = new Set(guildData.personalRoleBlockedUsers[role.id] ?? []);
  const target = await interaction.guild.members.fetch(targetId).catch(() => null);
  let isBlocked;
  if (blocked.has(targetId)) {
    blocked.delete(targetId);
    isBlocked = false;
  } else {
    blocked.add(targetId);
    isBlocked = true;
    if (target?.roles.cache.has(role.id)) await target.roles.remove(role, `Interdit par le propriétaire ${interaction.user.tag}`);
    guildData.roleHolders[role.id] = (guildData.roleHolders[role.id] ?? []).filter((id) => id !== targetId);
  }
  guildData.personalRoleBlockedUsers[role.id] = [...blocked];
  await saveStore();
  void sendPersonalRoleModificationLog(
    interaction.guild,
    isBlocked ? 'Membre interdit' : 'Interdiction retirée',
    interaction.user,
    role,
    [`**Membre concerné** — <@${targetId}> · ID ${targetId}`],
  ).catch(console.error);
  const select = new UserSelectMenuBuilder().setCustomId(PERSONAL_ROLE_PANEL_IDS.blockedSelect)
    .setPlaceholder('Ajouter ou retirer un membre interdit').setMinValues(1).setMaxValues(1);
  const container = new ContainerBuilder().setAccentColor(isBlocked ? 0xED4245 : 0x57F287)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `## ${isBlocked ? '🚫 Membre interdit' : '✅ Interdiction retirée'}`,
      `<@${targetId}> ${isBlocked ? 'ne peut plus recevoir' : 'peut de nouveau recevoir'} ${role}.`,
      `-# ${blocked.size} membre(s) interdit(s).`,
    ].join('\n')))
    .addActionRowComponents(new ActionRowBuilder().addComponents(select));
  await interaction.update({ content: null, embeds: [], components: [container], allowedMentions: { parse: [] } });
  return true;
}

async function handlePersonalRoleColorSelect(interaction) {
  const ids = PERSONAL_ROLE_PANEL_IDS;
  if (interaction.customId === ids.iconEmojiSelect) {
    const context = await personalRoleForInteraction(interaction);
    if (!context) return true;
    const { role } = context;
    if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
    const emoji = await interaction.guild.emojis.fetch(interaction.values[0]).catch(() => null);
    if (!emoji?.available) {
      await interaction.reply(panel('warning', 'Emoji introuvable', 'Cet emoji n’est plus disponible sur le serveur.', true));
      return true;
    }
    const response = await fetch(emoji.imageURL({ extension: 'png', size: 256 })).catch(() => null);
    if (!response?.ok) {
      await interaction.reply(panel('error', 'Image indisponible', 'Impossible de récupérer l’image de cet emoji.', true));
      return true;
    }
    const icon = Buffer.from(await response.arrayBuffer());
    await role.setIcon(icon, `Emoji ${emoji.name ?? emoji.id} choisi par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(
      interaction.guild,
      'Icône modifiée avec un emoji du serveur',
      interaction.user,
      role,
      [`**Emoji choisi** — ${emoji} · ID ${emoji.id}`],
    ).catch(console.error);
    const success = panel('success', 'Emoji appliqué', `${emoji} est maintenant l’icône de ${role}.`, true);
    delete success.flags;
    await interaction.update(success);
    return true;
  }
  if (![ids.solidSelect, ids.gradientSelect].includes(interaction.customId)) return false;
  const context = await personalRoleForInteraction(interaction);
  if (!context) return true;
  const { role } = context;
  const value = interaction.values[0];
  if (value === 'custom') {
    if (interaction.customId === ids.solidSelect) {
      const modal = new ModalBuilder().setCustomId(ids.solidModal).setTitle('Couleur personnalisée')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
          .setCustomId(ids.solidInput).setLabel('Code de la couleur').setPlaceholder('Exemple : 5865F2')
          .setStyle(TextInputStyle.Short).setRequired(true).setMinLength(6).setMaxLength(7)));
      await interaction.showModal(modal);
    } else {
      const modal = new ModalBuilder().setCustomId(ids.gradientModal).setTitle('Dégradé personnalisé')
        .addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(ids.gradientPrimary)
            .setLabel('Première couleur').setPlaceholder('Exemple : 5865F2').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(7)),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(ids.gradientSecondary)
            .setLabel('Deuxième couleur').setPlaceholder('Exemple : EB459E').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(7)),
        );
      await interaction.showModal(modal);
    }
    return true;
  }
  if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
  if (interaction.customId === ids.solidSelect) {
    await role.setColors({ primaryColor: Number.parseInt(value, 16), secondaryColor: null, tertiaryColor: null }, `Couleur choisie par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Couleur unie modifiée', interaction.user, role).catch(console.error);
    const response = panel('success', 'Couleur appliquée', `${role} utilise maintenant la couleur **${PERSONAL_ROLE_SOLID_COLORS.find(([, color]) => color === value)?.[0] ?? 'sélectionnée'}**.`, true);
    delete response.flags;
    await interaction.update(response);
  } else {
    const [primary, secondary] = value.split(':').map((color) => Number.parseInt(color, 16));
    await role.setColors({ primaryColor: primary, secondaryColor: secondary, tertiaryColor: null }, `Dégradé choisi par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Dégradé modifié', interaction.user, role).catch(console.error);
    const response = panel('success', 'Dégradé appliqué', `${role} utilise maintenant le dégradé **${PERSONAL_ROLE_GRADIENTS.find(([, colors]) => colors === value)?.[0] ?? 'sélectionné'}**.`, true);
    delete response.flags;
    await interaction.update(response);
  }
  return true;
}

async function handlePersonalRolePanelModal(interaction) {
  const ids = PERSONAL_ROLE_PANEL_IDS;
  if (![ids.renameModal, ids.solidModal, ids.gradientModal, ids.iconModal].includes(interaction.customId)) return false;
  const context = await personalRoleForInteraction(interaction);
  if (!context) return true;
  const { role } = context;
  if (!await enforcePersonalRoleEditCooldown(interaction)) return true;
  if (interaction.customId === ids.renameModal) {
    const name = interaction.fields.getTextInputValue(ids.renameInput).trim();
    const previousName = role.name;
    await role.setName(name, `Nom choisi par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Rôle renommé', interaction.user, role, [`**Ancien nom** — ${previousName}`]).catch(console.error);
    await interaction.reply(panel('success', 'Rôle renommé', `Ton rôle s’appelle maintenant **${name}**.`, true));
  } else if (interaction.customId === ids.solidModal) {
    const color = parseHexColor(interaction.fields.getTextInputValue(ids.solidInput));
    if (color === null) await interaction.reply(panel('error', 'Couleur invalide', 'Utilise un code hexadécimal comme `#5865F2`.', true));
    else {
      await role.setColors({ primaryColor: color, secondaryColor: null, tertiaryColor: null }, `Couleur choisie par ${interaction.user.tag}`);
      void sendPersonalRoleModificationLog(interaction.guild, 'Couleur unie modifiée', interaction.user, role).catch(console.error);
      await interaction.reply(panel('success', 'Couleur appliquée', `La couleur de ${role} a été mise à jour.`, true));
    }
  } else if (interaction.customId === ids.gradientModal) {
    const primaryColor = parseHexColor(interaction.fields.getTextInputValue(ids.gradientPrimary));
    const secondaryColor = parseHexColor(interaction.fields.getTextInputValue(ids.gradientSecondary));
    if (primaryColor === null || secondaryColor === null) await interaction.reply(panel('error', 'Couleur invalide', 'Utilise deux codes hexadécimaux comme `#5865F2`.', true));
    else {
      await role.setColors({ primaryColor, secondaryColor, tertiaryColor: null }, `Dégradé choisi par ${interaction.user.tag}`);
      void sendPersonalRoleModificationLog(interaction.guild, 'Dégradé modifié', interaction.user, role).catch(console.error);
      await interaction.reply(panel('success', 'Dégradé appliqué', `Le dégradé de ${role} a été mis à jour.`, true));
    }
  } else {
    const attachment = interaction.fields.getUploadedFiles(ids.iconUpload, true).first();
    if (!attachment?.contentType?.startsWith('image/') || attachment.size > 256 * 1024) {
      await interaction.reply(panel('error', 'Fichier invalide', 'Envoie une image PNG, JPG, WEBP ou GIF de 256 Ko maximum.', true));
      return true;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error(`Téléchargement de l’icône impossible (${response.status}).`);
    await role.setIcon(Buffer.from(await response.arrayBuffer()), `Icône choisie par ${interaction.user.tag}`);
    void sendPersonalRoleModificationLog(interaction.guild, 'Icône ajoutée ou remplacée', interaction.user, role).catch(console.error);
    await interaction.editReply(panel('success', 'Icône appliquée', `L’icône de ${role} a été mise à jour.`, true));
  }
  return true;
}

const TICKET_TYPES = {
  help: {
    label: 'Besoin d’aide',
    emoji: '❓',
    description: 'Obtenir l’aide de l’équipe PVCool.',
    channelPrefix: 'aide',
    roleIds: [PREMIUM_ROLE_ID, ELITE_ROLE_ID],
    color: 0x5865F2,
  },
  owner: {
    label: 'Contacter un owner',
    emoji: '👑',
    description: 'Échanger en privé avec la direction.',
    channelPrefix: 'owner',
    roleIds: [],
    color: 0xED4245,
  },
};

function ticketPanelMessage(guild) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(TICKET_SELECT_ID)
    .setPlaceholder('Quel est le sujet de ta demande ?')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(...Object.entries(TICKET_TYPES).map(([value, ticket]) => ({
      value,
      label: ticket.label,
      description: ticket.description,
      emoji: ticket.emoji,
    })));
  const header = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      '-# PVCOOL · CENTRE D’ASSISTANCE',
      '## 🎫 Comment pouvons-nous t’aider ?',
      'Choisis le sujet correspondant à ta demande. Un salon privé sera créé avec la bonne équipe.',
    ].join('\n')))
    .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild.client.user.displayAvatarURL({ size: 256 })));
  const container = new ContainerBuilder()
    .setAccentColor(0x8B5CF6)
    .addSectionComponents(header)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '### ❓ Besoin d’aide',
        'Une question, un problème ou besoin d’un accompagnement sur le serveur.',
        '-# Équipe autorisée · Premium · Elite · Prestige · Créateur',
        '',
        '### 👑 Contacter un owner',
        'Une demande privée ou importante destinée à la direction de PVCool.',
        '-# Équipe autorisée · Prestige · Créateur',
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('**Sélectionne ton type de ticket**'))
    .addActionRowComponents(new ActionRowBuilder().addComponents(select));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent([
    '-# 🔒 Conversation privée · un seul ticket ouvert par membre',
    '-# Explique clairement ta demande après l’ouverture pour recevoir une réponse plus rapidement.',
  ].join('\n')));
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

async function ensureTicketPanel(guild) {
  const guildData = getGuildData(guild.id);
  guildData.tickets ??= {};
  await Promise.all(Object.keys(guildData.tickets).map(async (channelId) => {
    const ticketChannel = await guild.channels.fetch(channelId).catch(() => null);
    if (!ticketChannel) return;
    await syncTicketWritePermissions(ticketChannel, guildData.tickets[channelId]).catch(console.error);
  }));
  const channel = await guild.channels.fetch(TICKET_PANEL_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) {
    console.error(`Le salon du panneau tickets ${TICKET_PANEL_CHANNEL_ID} est introuvable ou incompatible.`);
    return;
  }
  let message = guildData.ticketPanelMessageId
    ? await channel.messages.fetch(guildData.ticketPanelMessageId).catch(() => null)
    : null;
  if (!message) {
    const recent = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    message = recent?.find((candidate) => (
      candidate.author.id === guild.client.user.id
      && JSON.stringify(candidate.components).includes(TICKET_SELECT_ID)
    )) ?? null;
    if (message) guildData.ticketPanelMessageId = message.id;
  }
  if (message) {
    await message.edit(ticketPanelMessage(guild))
      .catch((error) => console.error(`Impossible de modifier le panneau tickets permanent ${message.id}:`, error));
  }
  else {
    message = await channel.send(ticketPanelMessage(guild));
    guildData.ticketPanelMessageId = message.id;
    await saveStore();
  }
}

function ticketChannelName(type, member) {
  const cleanName = member.user.username.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 35) || 'membre';
  return `${TICKET_TYPES[type].channelPrefix}-${cleanName}`;
}

function ticketStaffIds(type) {
  return TICKET_TYPES[type]?.roleIds ?? [];
}

const TICKET_FULL_ACCESS_ROLE_IDS = [CREATOR_ROLE_ID];
function ticketFullAccessRoleIds(guild) {
  return [...TICKET_FULL_ACCESS_ROLE_IDS, prestigeRoleForGuild(guild)?.id].filter(Boolean);
}
const TICKET_READ_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.ReadMessageHistory,
];
const TICKET_WRITE_PERMISSIONS = [
  ...TICKET_READ_PERMISSIONS,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
];

async function deleteTicketClaimMessage(channel, ticket) {
  if (!ticket.claimMessageId || !channel?.isTextBased() || !('messages' in channel)) return;
  const oldMessage = await channel.messages.fetch(ticket.claimMessageId).catch(() => null);
  if (oldMessage) await oldMessage.delete().catch(() => null);
  delete ticket.claimMessageId;
}

async function syncTicketWritePermissions(channel, ticket, previousClaimedBy = null) {
  const elevatedRoles = new Set(ticketFullAccessRoleIds(channel.guild));
  const visibleStaffRoles = new Set([...ticketStaffIds(ticket.type), ...elevatedRoles]);
  const knownTicketRoles = new Set([
    CREATOR_ROLE_ID,
    ELITE_ROLE_ID,
    PREMIUM_ROLE_ID,
    PLUS_ROLE_ID,
    BASIC_ROLE_ID,
    prestigeRoleForGuild(channel.guild)?.id,
  ].filter(Boolean));

  for (const roleId of knownTicketRoles) {
    if (visibleStaffRoles.has(roleId)) continue;
    await channel.permissionOverwrites.delete(roleId, 'Retrait d’un accès non autorisé pour ce type de ticket').catch(() => null);
  }
  if (ticket.ownerId !== OWNER_COMMAND_USER_ID && ticket.claimedBy !== OWNER_COMMAND_USER_ID) {
    await channel.permissionOverwrites.delete(
      OWNER_COMMAND_USER_ID,
      'Retrait de l’ancien accès individuel aux tickets',
    ).catch(() => null);
  }

  for (const roleId of visibleStaffRoles) {
    await channel.permissionOverwrites.edit(roleId, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: elevatedRoles.has(roleId),
      AttachFiles: elevatedRoles.has(roleId),
      EmbedLinks: elevatedRoles.has(roleId),
    }, { reason: 'Synchronisation des accès du ticket' });
  }

  await channel.permissionOverwrites.edit(ticket.ownerId, {
    ViewChannel: true,
    ReadMessageHistory: true,
    SendMessages: true,
    AttachFiles: true,
    EmbedLinks: true,
  }, { reason: 'Accès du demandeur au ticket' });

  if (previousClaimedBy && previousClaimedBy !== ticket.claimedBy && previousClaimedBy !== ticket.ownerId) {
    await channel.permissionOverwrites.delete(previousClaimedBy, 'Fin de la prise en charge du ticket').catch(() => null);
  }
  if (ticket.claimedBy) {
    await channel.permissionOverwrites.edit(ticket.claimedBy, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: true,
      AttachFiles: true,
      EmbedLinks: true,
    }, { reason: 'Responsable actuel du ticket' });
  }
}

function canManageTicket(member, ticket) {
  return member.id === OWNER_COMMAND_USER_ID
    || ticketFullAccessRoleIds(member.guild).some((roleId) => member.roles.cache.has(roleId))
    || ticketStaffIds(ticket.type).some((roleId) => member.roles.cache.has(roleId));
}

async function ticketWelcomeMessage(guild, ticket, includeFlags = true, renderCard = true) {
  const type = TICKET_TYPES[ticket.type];
  const status = ticket.claimedBy
    ? `🟢 Pris en charge par <@${ticket.claimedBy}>`
    : '🟠 En attente de prise en charge';
  const container = new ContainerBuilder()
    .setAccentColor(ticket.claimedBy ? 0x57F287 : type.color)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://ticket-card.png'),
      ),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        ...(includeFlags ? ['@everyone', ''] : []),
        `<@${ticket.ownerId}>`,
        `Bienvenue <@${ticket.ownerId}>. Explique ta demande, l’équipe va te répondre dès que possible.`,
        '',
        `**Statut** — ${status}`,
        `-# Ticket ouvert <t:${Math.floor(ticket.createdAt / 1000)}:R>`,
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addActionRowComponents(new ActionRowBuilder().addComponents(
      ...(ticket.claimedBy ? [
        new ButtonBuilder().setCustomId(TICKET_RELEASE_ID).setLabel('Libérer').setEmoji('📌').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(TICKET_TRANSCRIPT_ID).setLabel('Transcript').setEmoji('📄').setStyle(ButtonStyle.Secondary),
      ] : [
        new ButtonBuilder().setCustomId(TICKET_CLAIM_ID).setLabel('Prendre en charge').setEmoji('🎯').setStyle(ButtonStyle.Primary),
      ]),
      new ButtonBuilder().setCustomId(TICKET_CLOSE_ID).setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    ));
  const payload = {
    components: [container],
    allowedMentions: {
      parse: includeFlags ? ['everyone'] : [],
      users: [ticket.ownerId, ...(ticket.claimedBy ? [ticket.claimedBy] : [])],
    },
  };
  if (renderCard) {
    payload.files = [{
      attachment: await renderTicketCard(
        guild,
        ticket.ownerId,
        { ...ticket, claimedBy: null },
        {
          created: ticket.createdCount ?? ticket.stats?.created ?? 1,
          vouchesGiven: ticket.vouchesGiven ?? ticket.stats?.vouchesGiven ?? 0,
        },
      ),
      name: 'ticket-card.png',
    }];
  }
  if (includeFlags) payload.flags = MessageFlags.IsComponentsV2;
  else if (renderCard) payload.attachments = [];
  return payload;
}

function ticketClaimedPendingMessage(ticket) {
  const container = new ContainerBuilder()
    .setAccentColor(0xED4245)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `## Bonjour <@${ticket.ownerId}>.`,
        `<@${ticket.claimedBy}> prend en charge ton ticket.`,
        '',
        '-# Préparation de la fiche du membre du staff…',
      ].join('\n')),
    );
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: [ticket.ownerId, ticket.claimedBy] },
  };
}

async function ticketClaimedMessage(guild, ticket) {
  const container = new ContainerBuilder()
    .setAccentColor(0xED4245)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## Bonjour <@${ticket.ownerId}>.`),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL('attachment://ticket-staff.png'),
      ),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `<@${ticket.claimedBy}> prend en charge ton ticket.`,
        '',
        '*Tu peux maintenant échanger avec ce membre du staff dans ce salon privé.*',
      ].join('\n')),
    );
  return {
    components: [container],
    files: [{
      attachment: await renderTicketCard(guild, ticket.claimedBy, ticket, {
        claimed: ticket.stats?.claimed ?? 1,
        rating: ticket.stats?.rating ?? 0,
        ratingsCount: ticket.stats?.ratingsCount ?? 0,
      }),
      name: 'ticket-staff.png',
    }],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { users: [ticket.ownerId, ticket.claimedBy] },
  };
}

async function createTicketTranscript(channel) {
  const messages = [];
  let before;
  while (messages.length < 1000) {
    const batch = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!batch.size) break;
    messages.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }
  return Buffer.from(messages.reverse().map((message) => {
    const timestamp = new Date(message.createdTimestamp).toISOString();
    const attachments = [...message.attachments.values()].map((attachment) => attachment.url).join(' ');
    return `[${timestamp}] ${message.author.tag}: ${message.content || '[message sans texte]'}${attachments ? ` ${attachments}` : ''}`;
  }).join('\n'), 'utf8');
}

async function sendTicketClosureDm(guild, channel, ticket, closedBy) {
  const owner = await guild.client.users.fetch(ticket.ownerId).catch(() => null);
  if (!owner) return;
  const transcript = await createTicketTranscript(channel).catch(() => Buffer.from('Transcript indisponible.', 'utf8'));
  const closedAt = Date.now();
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setAuthor({ name: guild.name, iconURL: guild.iconURL({ extension: 'png', size: 128 }) ?? undefined })
    .setTitle('🔒 Ticket fermé')
    .setDescription(ticket.claimedBy
      ? 'Merci pour ton retour. Note le membre du staff avec les étoiles ci-dessous.'
      : 'Ton ticket a été fermé. Le transcript est joint à ce message.')
    .addFields(
      { name: '🆔 ID', value: channel.id, inline: true },
      { name: '✅ Ouvert par', value: `<@${ticket.ownerId}>`, inline: true },
      { name: '❌ Fermé par', value: `<@${closedBy.id}>`, inline: true },
      { name: '🗑️ Salon supprimé', value: `<t:${Math.floor(closedAt / 1000)}:F>`, inline: true },
      { name: '⏱️ Temps ouvert', value: `<t:${Math.floor(ticket.createdAt / 1000)}:R>`, inline: true },
      { name: '🎟️ Catégorie', value: TICKET_TYPES[ticket.type]?.label ?? 'Support', inline: true },
      { name: '#️⃣ Nom du ticket', value: channel.name, inline: false },
    )
    .setTimestamp(closedAt);
  const components = ticket.claimedBy ? [
    new ActionRowBuilder().addComponents(
      ...[1, 2, 3, 4, 5].map((stars) => new ButtonBuilder()
        .setCustomId(`tr:${guild.id}:${ticket.claimedBy}:${ticket.ownerId}:${channel.id}:${stars}`)
        .setLabel(String(stars))
        .setEmoji('⭐')
        .setStyle(ButtonStyle.Secondary)),
    ),
  ] : [];
  await owner.send({
    embeds: [embed],
    components,
    files: [{ attachment: transcript, name: `transcript-${channel.name}.txt` }],
  }).catch(() => null);
}

async function handleTicketRating(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('tr:')) return false;
  const [, guildId, staffId, ownerId, ticketId, starsValue] = interaction.customId.split(':');
  const stars = Number(starsValue);
  if (interaction.user.id !== ownerId || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    await interaction.reply({ content: 'Tu ne peux pas noter ce ticket.' }).catch(() => null);
    return true;
  }
  const guildData = getGuildData(guildId);
  guildData.ticketStats ??= { created: {}, claimed: {}, ratings: {}, ratedTickets: {} };
  guildData.ticketStats.ratings ??= {};
  guildData.ticketStats.ratedTickets ??= {};
  if (guildData.ticketStats.ratedTickets[ticketId]) {
    await interaction.reply({ content: 'Ce ticket a déjà été évalué.' }).catch(() => null);
    return true;
  }
  const rating = guildData.ticketStats.ratings[staffId] ?? { total: 0, count: 0 };
  rating.total += stars;
  rating.count += 1;
  guildData.ticketStats.ratings[staffId] = rating;
  guildData.ticketStats.ratedTickets[ticketId] = { stars, ownerId, staffId, ratedAt: Date.now() };
  await saveStore();
  const disabledRow = new ActionRowBuilder().addComponents(
    ...[1, 2, 3, 4, 5].map((value) => new ButtonBuilder()
      .setCustomId(`rated:${value}`)
      .setLabel(String(value))
      .setEmoji(value <= stars ? '⭐' : '☆')
      .setStyle(value === stars ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(true)),
  );
  await interaction.update({ components: [disabledRow] });
  await interaction.followUp({ content: `Merci, ta note de **${stars}/5** a été enregistrée.` });
  return true;
}

async function handleTicketSelect(interaction) {
  if (!interaction.isStringSelectMenu() || interaction.customId !== TICKET_SELECT_ID) return false;
  const typeKey = interaction.values[0];
  const type = TICKET_TYPES[typeKey];
  if (!type) return false;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guildData = getGuildData(interaction.guildId);
  guildData.tickets ??= {};
  guildData.ticketPunishments ??= {};
  const punishment = guildData.ticketPunishments[interaction.user.id];
  if (punishment?.until > Date.now() && interaction.user.id !== OWNER_COMMAND_USER_ID) {
    await interaction.editReply(`Tu ne peux plus ouvrir de ticket jusqu’au <t:${Math.floor(punishment.until / 1000)}:F> (<t:${Math.floor(punishment.until / 1000)}:R>).`);
    return true;
  }
  if (punishment) {
    delete guildData.ticketPunishments[interaction.user.id];
    await saveStore();
  }
  const existing = Object.entries(guildData.tickets)
    .find(([, ticket]) => ticket.ownerId === interaction.user.id);
  if (existing && interaction.user.id !== OWNER_COMMAND_USER_ID) {
    const existingChannel = await interaction.guild.channels.fetch(existing[0]).catch(() => null);
    if (existingChannel) {
      await interaction.editReply(`Tu as déjà un ticket ouvert : ${existingChannel}.`);
      return true;
    }
    delete guildData.tickets[existing[0]];
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const botMember = interaction.guild.members.me;
  const permissionOverwrites = [
    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: member.id,
      allow: TICKET_WRITE_PERMISSIONS,
    },
    ...type.roleIds.map((roleId) => ({
      id: roleId,
      allow: ticketFullAccessRoleIds(interaction.guild).includes(roleId) ? TICKET_WRITE_PERMISSIONS : TICKET_READ_PERMISSIONS,
    })),
  ];
  for (const roleId of ticketFullAccessRoleIds(interaction.guild)) {
    if (!permissionOverwrites.some((overwrite) => overwrite.id === roleId)) {
      permissionOverwrites.push({ id: roleId, allow: TICKET_WRITE_PERMISSIONS });
    }
  }
  if (botMember) permissionOverwrites.push({
    id: botMember.id,
    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages],
  });
  const channel = await interaction.guild.channels.create({
    name: ticketChannelName(typeKey, member),
    type: ChannelType.GuildText,
    parent: TICKET_CATEGORY_ID,
    topic: `${type.label} · ouvert par ${member.user.tag} (${member.id})`,
    permissionOverwrites,
    reason: `Ticket ${type.label} ouvert par ${member.user.tag}`,
  });
  const ticket = {
    ownerId: member.id,
    type: typeKey,
    typeLabel: type.label,
    createdAt: Date.now(),
    claimedBy: null,
  };
  guildData.ticketStats ??= { created: {}, claimed: {}, ratings: {}, ratedTickets: {} };
  guildData.ticketStats.created[member.id] = (guildData.ticketStats.created[member.id] ?? 0) + 1;
  ticket.createdCount = guildData.ticketStats.created[member.id];
  ticket.vouchesGiven = Object.values(guildData.ticketStats.ratedTickets ?? {})
    .filter((entry) => entry?.ownerId === member.id)
    .length;
  ticket.stats = { created: ticket.createdCount, vouchesGiven: ticket.vouchesGiven };
  guildData.tickets[channel.id] = ticket;
  await saveStore();
  const welcome = await channel.send(await ticketWelcomeMessage(interaction.guild, ticket));
  ticket.welcomeMessageId = welcome.id;
  await saveStore();
  await interaction.editReply(`Ton ticket a été créé : ${channel}.`);
  return true;
}

async function handleTicketButton(interaction) {
  if (!interaction.isButton() || ![TICKET_CLAIM_ID, TICKET_CLOSE_ID, TICKET_RELEASE_ID, TICKET_TRANSCRIPT_ID].includes(interaction.customId)) return false;
  const guildData = getGuildData(interaction.guildId);
  const ticket = guildData.tickets?.[interaction.channelId];
  if (!ticket) {
    await interaction.reply(panel('error', 'Ticket introuvable', 'Ce salon n’est plus enregistré comme ticket.', true));
    return true;
  }
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  if (interaction.customId === TICKET_CLAIM_ID) {
    if (!canManageTicket(actor, ticket)) {
      await interaction.reply(panel('error', 'Accès refusé', 'Tu ne fais pas partie de l’équipe autorisée pour ce sujet.', true));
      return true;
    }
    if (ticket.claimedBy) {
      await interaction.reply(panel('warning', 'Déjà pris en charge', `Ce ticket est déjà géré par <@${ticket.claimedBy}>.`, true));
      return true;
    }
    await interaction.deferUpdate();
    await deleteTicketClaimMessage(interaction.channel, ticket);
    ticket.claimedBy = actor.id;
    ticket.claimedAt = Date.now();
    guildData.ticketStats ??= { created: {}, claimed: {}, ratings: {}, ratedTickets: {} };
    guildData.ticketStats.claimed[actor.id] = (guildData.ticketStats.claimed[actor.id] ?? 0) + 1;
    const staffRating = guildData.ticketStats.ratings?.[actor.id];
    ticket.stats = {
      claimed: guildData.ticketStats.claimed[actor.id],
      rating: staffRating?.count ? staffRating.total / staffRating.count : 0,
      ratingsCount: staffRating?.count ?? 0,
    };
    await interaction.editReply(await ticketWelcomeMessage(interaction.guild, ticket, false, false));
    const claimMessage = await interaction.channel.send(ticketClaimedPendingMessage(ticket));
    ticket.claimMessageId = claimMessage.id;
    await saveStore();
    const [, claimedPayload] = await Promise.all([
      syncTicketWritePermissions(interaction.channel, ticket),
      ticketClaimedMessage(interaction.guild, ticket),
    ]);
    await claimMessage.edit(claimedPayload);
    return true;
  }

  if (interaction.customId === TICKET_RELEASE_ID) {
    if (!canManageTicket(actor, ticket)) {
      await interaction.reply(panel('error', 'Accès refusé', 'Seule l’équipe autorisée peut libérer ce ticket.', true));
      return true;
    }
    await interaction.deferUpdate();
    const previousClaimedBy = ticket.claimedBy;
    await deleteTicketClaimMessage(interaction.channel, ticket);
    ticket.claimedBy = null;
    ticket.claimedAt = null;
    ticket.stats = { created: ticket.createdCount ?? 1 };
    await syncTicketWritePermissions(interaction.channel, ticket, previousClaimedBy);
    await saveStore();
    await interaction.editReply(await ticketWelcomeMessage(interaction.guild, ticket, false));
    await interaction.followUp(panel('warning', 'Ticket libéré', `${actor} ne prend plus en charge cette demande.`));
    return true;
  }

  if (interaction.customId === TICKET_TRANSCRIPT_ID) {
    if (actor.id !== ticket.ownerId && !canManageTicket(actor, ticket)) {
      await interaction.reply(panel('error', 'Accès refusé', 'Tu ne peux pas exporter ce ticket.', true));
      return true;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const transcript = await createTicketTranscript(interaction.channel);
    await interaction.editReply({
      content: 'Voici le transcript actuel du ticket.',
      files: [{ attachment: transcript, name: `transcript-${interaction.channel.name}.txt` }],
    });
    return true;
  }

  if (actor.id !== ticket.ownerId && !canManageTicket(actor, ticket)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Seul le demandeur ou l’équipe autorisée peut fermer ce ticket.', true));
    return true;
  }
  await interaction.reply(panel('success', 'Ticket fermé', `Fermeture demandée par ${actor}. Le salon va être supprimé.`));
  await sendTicketClosureDm(interaction.guild, interaction.channel, ticket, actor);
  delete guildData.tickets[interaction.channelId];
  await saveStore();
  setTimeout(() => interaction.channel.delete(`Ticket fermé par ${actor.user.tag}`).catch(console.error), 2_000);
  return true;
}

function canPunishTicketMember(member) {
  return member.id === OWNER_COMMAND_USER_ID
    || member.roles.cache.has(CREATOR_ROLE_ID)
    || member.roles.cache.has(ELITE_ROLE_ID);
}

async function handleSupportCommand(interaction) {
  if (!interaction.isChatInputCommand() || !['ticket', 'punish', 'unpunish'].includes(interaction.commandName)) return false;
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const guildData = getGuildData(interaction.guildId);
  guildData.tickets ??= {};
  guildData.ticketPunishments ??= {};

  if (interaction.commandName === 'punish') {
    if (!canPunishTicketMember(actor)) {
      await interaction.reply(panel('error', 'Accès refusé', 'Cette commande est réservée à PVCool Elite, Créateur et au propriétaire.', true));
      return true;
    }
    const target = interaction.options.getMember('membre')
      ?? await interaction.guild.members.fetch(interaction.options.getUser('membre', true).id).catch(() => null);
    const duration = parseTimeoutDuration(interaction.options.getString('duree', true));
    if (!target || !duration || duration.milliseconds > MAX_TIMEOUT_MS) {
      await interaction.reply(panel('warning', 'Durée invalide', 'Utilise une durée comme `30m`, `2h` ou `3j` (28 jours maximum).', true));
      return true;
    }
    if (target.id === OWNER_COMMAND_USER_ID) {
      await interaction.reply(panel('error', 'Action impossible', 'Le propriétaire des bots ne peut pas être sanctionné.', true));
      return true;
    }
    guildData.ticketPunishments[target.id] = {
      until: Date.now() + duration.milliseconds,
      by: actor.id,
      createdAt: Date.now(),
    };
    await saveStore();
    await interaction.reply(panel('success', 'Accès aux tickets suspendu', `${target} ne peut plus ouvrir de ticket pendant **${duration.label}**.`));
    return true;
  }

  if (interaction.commandName === 'unpunish') {
    if (!canPunishTicketMember(actor)) {
      await interaction.reply(panel('error', 'Accès refusé', 'Cette commande est réservée à PVCool Elite, Créateur et au propriétaire.', true));
      return true;
    }
    const targetUser = interaction.options.getUser('membre', true);
    const punishment = guildData.ticketPunishments[targetUser.id];
    if (!punishment) {
      await interaction.reply(panel('warning', 'Aucune sanction active', `<@${targetUser.id}> n’est pas interdit d’ouvrir des tickets.`, true));
      return true;
    }
    delete guildData.ticketPunishments[targetUser.id];
    await saveStore();
    await interaction.reply(panel('success', 'Accès aux tickets rétabli', `<@${targetUser.id}> peut de nouveau ouvrir des tickets.`));
    return true;
  }

  const ticket = guildData.tickets[interaction.channelId];
  if (!ticket) {
    await interaction.reply(panel('error', 'Salon incompatible', 'Cette commande doit être utilisée dans un ticket actif.', true));
    return true;
  }
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'add') {
    if (!canManageTicket(actor, ticket)) {
      await interaction.reply(panel('error', 'Accès refusé', 'Seule l’équipe autorisée peut ajouter un membre.', true));
      return true;
    }
    const target = interaction.options.getMember('membre')
      ?? await interaction.guild.members.fetch(interaction.options.getUser('membre', true).id).catch(() => null);
    if (!target) {
      await interaction.reply(panel('error', 'Membre introuvable', 'Ce membre n’est plus sur le serveur.', true));
      return true;
    }
    await interaction.channel.permissionOverwrites.edit(target.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    }, { reason: `Ajout au ticket par ${actor.user.tag}` });
    ticket.addedMembers ??= [];
    if (!ticket.addedMembers.includes(target.id)) ticket.addedMembers.push(target.id);
    await saveStore();
    await interaction.reply(panel('success', 'Membre ajouté', `${target} a maintenant accès à ce ticket.`));
    return true;
  }

  if (subcommand === 'close' && actor.id !== ticket.ownerId && !canManageTicket(actor, ticket)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Seul le demandeur ou l’équipe autorisée peut fermer ce ticket.', true));
    return true;
  }

  await interaction.reply(panel('success', 'Ticket fermé', `Fermeture demandée par ${actor}. Suppression dans 5 secondes.`));
  await sendTicketClosureDm(interaction.guild, interaction.channel, ticket, actor);
  delete guildData.tickets[interaction.channelId];
  await saveStore();
  setTimeout(() => interaction.channel.delete(`Ticket fermé par ${actor.user.tag}`).catch(console.error), 5_000);
  return true;
}

async function cleanupLegacyPrivateVoices(guild) {
  const guildData = getGuildData(guild.id);
  if (guildData.voicePanelCleanupDone) return;

  const channels = await guild.channels.fetch();
  const legacyVoiceChannels = channels.filter((channel) => (
    channel?.parentId === PRIVATE_VOICE_CATEGORY_ID
    && channel.isVoiceBased()
  ));
  for (const channel of legacyVoiceChannels.values()) {
    await channel.delete('Réinitialisation unique des salons PV pour le nouveau panneau');
  }

  guildData.privateVoices = {};
  guildData.voicePanelCleanupDone = true;
  await saveStore();
  console.log(`${legacyVoiceChannels.size} ancien(s) salon(s) PV supprimé(s) sur ${guild.name}.`);
}

async function ownedPanelVoice(guild, ownerId) {
  const guildData = getGuildData(guild.id);
  for (const [channelId, privateVoice] of Object.entries(guildData.privateVoices)) {
    if (privateVoice.ownerId !== ownerId) continue;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (channel?.isVoiceBased() && channel.parentId === PRIVATE_VOICE_CATEGORY_ID) {
      if (!privateVoice.managedPanel) {
        privateVoice.managedPanel = true;
        await saveStore();
      }
      return { channel, privateVoice };
    }
    delete guildData.privateVoices[channelId];
    await saveStore();
  }
  return null;
}

async function requireVoicePanelAccess(interaction) {
  const guildData = getGuildData(interaction.guild.id);
  if (guildData.pvWhitelist.includes(interaction.user.id)) return true;
  await interaction.reply(panel(
    'error',
    'Whitelist PV requise',
    'Tu dois posséder la whitelist PV pour créer ou gérer un salon vocal personnel. Ouvre un ticket **owner** dans <#1563907534119633019> pour faire une demande.',
    true,
  ));
  return false;
}

async function setPanelVoicePrivacy(guild, channel, privateVoice, makePrivate, actorTag) {
  if (makePrivate) {
    privateVoice.originalEveryoneConnect = overwritePermissionValue(
      channel,
      guild.roles.everyone.id,
      PermissionFlagsBits.Connect,
    );
    privateVoice.ownerOriginal = {
      connect: overwritePermissionValue(channel, privateVoice.ownerId, PermissionFlagsBits.Connect),
      viewChannel: overwritePermissionValue(channel, privateVoice.ownerId, PermissionFlagsBits.ViewChannel),
    };
    await channel.permissionOverwrites.edit(
      guild.roles.everyone,
      { Connect: false },
      { reason: `Vocal rendu privé par ${actorTag}` },
    );
    await channel.permissionOverwrites.edit(
      privateVoice.ownerId,
      { Connect: true, ViewChannel: true },
      { reason: 'Propriétaire du vocal personnel' },
    );
    for (const userId of privateVoice.access ?? []) {
      await channel.permissionOverwrites.edit(
        userId,
        { Connect: true, ViewChannel: true },
        { reason: 'Accès au vocal personnel privé' },
      ).catch(console.error);
    }
    for (const roleId of privateVoice.roleAccess ?? []) {
      await channel.permissionOverwrites.edit(
        roleId,
        { Connect: true, ViewChannel: true },
        { reason: 'Accès de rôle au vocal personnel privé' },
      ).catch(console.error);
    }
    privateVoice.isPrivate = true;
    return;
  }

  await channel.permissionOverwrites.edit(
    guild.roles.everyone,
    { Connect: privateVoice.originalEveryoneConnect ?? null },
    { reason: `Vocal rendu public par ${actorTag}` },
  );
  const userIds = new Set([privateVoice.ownerId, ...(privateVoice.access ?? [])]);
  for (const userId of userIds) {
    const original = userId === privateVoice.ownerId
      ? privateVoice.ownerOriginal
      : privateVoice.accessOriginal?.[userId];
    await channel.permissionOverwrites.edit(
      userId,
      {
        Connect: original?.connect ?? null,
        ViewChannel: original?.viewChannel ?? null,
      },
      { reason: `Vocal rendu public par ${actorTag}` },
    ).catch(console.error);
  }
  for (const roleId of privateVoice.roleAccess ?? []) {
    const original = privateVoice.roleAccessOriginal?.[roleId];
    await channel.permissionOverwrites.edit(
      roleId,
      {
        Connect: original?.connect ?? null,
        ViewChannel: original?.viewChannel ?? null,
      },
      { reason: `Vocal rendu public par ${actorTag}` },
    ).catch(console.error);
  }
  privateVoice.isPrivate = false;
}

async function handleVoicePanelButton(interaction) {
  if (!Object.values(VOICE_PANEL_IDS).includes(interaction.customId)
    || interaction.customId === VOICE_PANEL_IDS.accessMemberSelect
    || interaction.customId === VOICE_PANEL_IDS.accessRoleSelect
    || interaction.customId === VOICE_PANEL_IDS.renameModal
    || interaction.customId === VOICE_PANEL_IDS.renameInput) return false;
  if (!await requireVoicePanelAccess(interaction)) return true;
  const guildData = getGuildData(interaction.guild.id);
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const owned = await ownedPanelVoice(interaction.guild, actor.id);

  if (interaction.customId === VOICE_PANEL_IDS.create) {
    if (owned) {
      await interaction.reply(panel('info', 'Vocal déjà créé', `Tu possèdes déjà ${owned.channel}.`, true));
      return true;
    }
    const defaultName = `Vocal de ${actor.displayName}`.slice(0, 100);
    const modal = new ModalBuilder()
      .setCustomId(VOICE_PANEL_IDS.createModal)
      .setTitle('Créer ton vocal')
      .addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(VOICE_PANEL_IDS.createInput)
          .setLabel('Nom du salon vocal')
          .setStyle(TextInputStyle.Short)
          .setMinLength(1)
          .setMaxLength(100)
          .setValue(defaultName)
          .setPlaceholder(defaultName)
          .setRequired(true),
      ));
    await interaction.showModal(modal);
    return true;
  }

  if (!owned) {
    await interaction.reply(panel('warning', 'Aucun vocal', 'Commence par créer ton salon vocal personnel.', true));
    return true;
  }

  if (interaction.customId === VOICE_PANEL_IDS.rename) {
    const modal = new ModalBuilder()
      .setCustomId(VOICE_PANEL_IDS.renameModal)
      .setTitle('Renommer ton vocal')
      .addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(VOICE_PANEL_IDS.renameInput)
          .setLabel('Nouveau nom')
          .setStyle(TextInputStyle.Short)
          .setMinLength(1)
          .setMaxLength(100)
          .setValue(owned.channel.name)
          .setRequired(true),
      ));
    await interaction.showModal(modal);
    return true;
  }

  if (interaction.customId === VOICE_PANEL_IDS.privacy) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const makePrivate = !owned.privateVoice.isPrivate;
    await setPanelVoicePrivacy(interaction.guild, owned.channel, owned.privateVoice, makePrivate, actor.user.tag);
    await configureMusicBotChannel(owned.channel);
    await saveStore();
    await interaction.editReply(panel(
      'success',
      makePrivate ? 'Vocal privé' : 'Vocal public',
      `${owned.channel} est maintenant **${makePrivate ? 'privé' : 'public'}**.`,
      true,
    ));
    await sendPersonalVoiceLog(
      interaction.guild,
      makePrivate ? 'Salon rendu privé' : 'Salon rendu public',
      interaction.user,
      owned.channel,
    );
    return true;
  }

  if (interaction.customId === VOICE_PANEL_IDS.access) {
    const memberRow = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId(VOICE_PANEL_IDS.accessMemberSelect)
        .setPlaceholder('Choisir un membre')
        .setMinValues(1)
        .setMaxValues(1),
    );
    const roleRow = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId(VOICE_PANEL_IDS.accessRoleSelect)
        .setPlaceholder('Choisir un rôle')
        .setMinValues(1)
        .setMaxValues(1),
    );
    await interaction.reply({
      content: `Gère les accès de ${owned.channel} : sélectionner deux fois le même membre ou rôle retire son accès.`,
      components: [memberRow, roleRow],
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  if (interaction.customId === VOICE_PANEL_IDS.delete) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const deletedChannel = { id: owned.channel.id, name: owned.channel.name };
    await owned.channel.delete(`Vocal personnel supprimé par ${actor.user.tag}`);
    delete guildData.privateVoices[owned.channel.id];
    await saveStore();
    await interaction.editReply(panel('success', 'Vocal supprimé', 'Ton salon vocal personnel a été supprimé.', true));
    await sendPersonalVoiceLog(interaction.guild, 'Salon supprimé', interaction.user, deletedChannel);
    return true;
  }
  return false;
}

async function handleVoiceAccessSelect(interaction) {
  if (![VOICE_PANEL_IDS.accessMemberSelect, VOICE_PANEL_IDS.accessRoleSelect].includes(interaction.customId)) return false;
  if (!await requireVoicePanelAccess(interaction)) return true;
  const owned = await ownedPanelVoice(interaction.guild, interaction.user.id);
  if (!owned) {
    await interaction.reply(panel('warning', 'Aucun vocal', 'Ton salon vocal personnel est introuvable.', true));
    return true;
  }
  const selectedId = interaction.values[0];
  const isRoleSelection = interaction.customId === VOICE_PANEL_IDS.accessRoleSelect;
  const selectedRole = isRoleSelection ? interaction.guild.roles.cache.get(selectedId) : null;
  if (isRoleSelection) {
    if (!selectedRole) {
      await interaction.reply(panel('warning', 'Rôle introuvable', 'Ce rôle n’existe plus sur le serveur.', true));
      return true;
    }
    if (selectedRole.id === interaction.guild.id || selectedRole.managed) {
      await interaction.reply(panel('warning', 'Rôle invalide', 'Choisis un rôle attribuable du serveur.', true));
      return true;
    }
    const roleAccess = new Set(owned.privateVoice.roleAccess ?? []);
    if (roleAccess.has(selectedRole.id)) {
      roleAccess.delete(selectedRole.id);
      const original = owned.privateVoice.roleAccessOriginal?.[selectedRole.id];
      await owned.channel.permissionOverwrites.edit(selectedRole.id, {
        Connect: original?.connect ?? null,
        ViewChannel: original?.viewChannel ?? null,
      }, { reason: `Accès du rôle retiré par ${interaction.user.tag}` });
      delete owned.privateVoice.roleAccessOriginal?.[selectedRole.id];
      owned.privateVoice.roleAccess = [...roleAccess];
      await saveStore();
      await interaction.reply(panel('success', 'Accès retiré', `${selectedRole} n’a plus d’accès personnel à ${owned.channel}.`, true));
      await sendPersonalVoiceLog(interaction.guild, 'Accès retiré', interaction.user, owned.channel, [
        `**Rôle** — <@&${selectedRole.id}> · ID ${selectedRole.id}`,
      ]);
      return true;
    }
    owned.privateVoice.roleAccessOriginal ??= {};
    owned.privateVoice.roleAccessOriginal[selectedRole.id] = {
      connect: overwritePermissionValue(owned.channel, selectedRole.id, PermissionFlagsBits.Connect),
      viewChannel: overwritePermissionValue(owned.channel, selectedRole.id, PermissionFlagsBits.ViewChannel),
    };
    roleAccess.add(selectedRole.id);
    owned.privateVoice.roleAccess = [...roleAccess];
    await owned.channel.permissionOverwrites.edit(selectedRole.id, {
      Connect: true,
      ViewChannel: true,
    }, { reason: `Accès du rôle ajouté par ${interaction.user.tag}` });
    await saveStore();
    await interaction.reply(panel('success', 'Accès ajouté', `${selectedRole} peut maintenant rejoindre ${owned.channel}.`, true));
    await sendPersonalVoiceLog(interaction.guild, 'Accès ajouté', interaction.user, owned.channel, [
      `**Rôle** — <@&${selectedRole.id}> · ID ${selectedRole.id}`,
    ]);
    return true;
  }

  const target = await interaction.guild.members.fetch(selectedId).catch(() => null);
  if (!target || target.user.bot || target.id === interaction.user.id) {
    await interaction.reply(panel('warning', 'Membre invalide', 'Choisis un autre membre ou un rôle du serveur.', true));
    return true;
  }
  const access = new Set(owned.privateVoice.access ?? []);
  if (access.has(target.id)) {
    access.delete(target.id);
    const original = owned.privateVoice.accessOriginal?.[target.id];
    await owned.channel.permissionOverwrites.edit(target.id, {
      Connect: original?.connect ?? null,
      ViewChannel: original?.viewChannel ?? null,
    }, { reason: `Accès retiré par ${interaction.user.tag}` });
    delete owned.privateVoice.accessOriginal?.[target.id];
    owned.privateVoice.access = [...access];
    await saveStore();
    await interaction.reply(panel('success', 'Accès retiré', `${target} n’a plus d’accès personnel à ${owned.channel}.`, true));
    await sendPersonalVoiceLog(interaction.guild, 'Accès retiré', interaction.user, owned.channel, [
      `**Membre** — <@${target.id}> · ID ${target.id}`,
    ]);
    return true;
  }
  owned.privateVoice.accessOriginal ??= {};
  owned.privateVoice.accessOriginal[target.id] = {
    connect: overwritePermissionValue(owned.channel, target.id, PermissionFlagsBits.Connect),
    viewChannel: overwritePermissionValue(owned.channel, target.id, PermissionFlagsBits.ViewChannel),
  };
  access.add(target.id);
  owned.privateVoice.access = [...access];
  await owned.channel.permissionOverwrites.edit(target.id, {
    Connect: true,
    ViewChannel: true,
  }, { reason: `Accès ajouté par ${interaction.user.tag}` });
  await saveStore();
  await interaction.reply(panel('success', 'Accès ajouté', `${target} peut maintenant rejoindre ${owned.channel}.`, true));
  await sendPersonalVoiceLog(interaction.guild, 'Accès ajouté', interaction.user, owned.channel, [
    `**Membre** — <@${target.id}> · ID ${target.id}`,
  ]);
  return true;
}

async function handleVoiceRenameModal(interaction) {
  if (interaction.customId !== VOICE_PANEL_IDS.renameModal) return false;
  if (!await requireVoicePanelAccess(interaction)) return true;
  const owned = await ownedPanelVoice(interaction.guild, interaction.user.id);
  if (!owned) {
    await interaction.reply(panel('warning', 'Aucun vocal', 'Ton salon vocal personnel est introuvable.', true));
    return true;
  }
  const name = interaction.fields.getTextInputValue(VOICE_PANEL_IDS.renameInput).trim();
  if (!name) {
    await interaction.reply(panel('warning', 'Nom invalide', 'Indique un nom valide.', true));
    return true;
  }
  const previousName = owned.channel.name;
  await owned.channel.setName(name.slice(0, 100), `Vocal renommé par ${interaction.user.tag}`);
  await interaction.reply(panel('success', 'Vocal renommé', `Ton vocal s’appelle maintenant **${owned.channel.name}**.`, true));
  await sendPersonalVoiceLog(interaction.guild, 'Salon renommé', interaction.user, owned.channel, [
    `**Ancien nom** — ${previousName}`,
    `**Nouveau nom** — ${owned.channel.name}`,
  ]);
  return true;
}

async function handleVoiceCreateModal(interaction) {
  if (interaction.customId !== VOICE_PANEL_IDS.createModal) return false;
  if (!await requireVoicePanelAccess(interaction)) return true;
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const existing = await ownedPanelVoice(interaction.guild, actor.id);
  if (existing) {
    await interaction.reply(panel('info', 'Vocal déjà créé', `Tu possèdes déjà ${existing.channel}.`, true));
    return true;
  }
  const name = interaction.fields.getTextInputValue(VOICE_PANEL_IDS.createInput).trim();
  if (!name) {
    await interaction.reply(panel('warning', 'Nom invalide', 'Indique un nom valide.', true));
    return true;
  }
  const category = await interaction.guild.channels.fetch(PRIVATE_VOICE_CATEGORY_ID).catch(() => null);
  if (category?.type !== ChannelType.GuildCategory) {
    await interaction.reply(panel('error', 'Catégorie introuvable', 'La catégorie des vocaux personnels est inaccessible.', true));
    return true;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const channel = await interaction.guild.channels.create({
    name: name.slice(0, 100),
    type: ChannelType.GuildVoice,
    parent: category.id,
    reason: `Vocal personnel créé par ${actor.user.tag}`,
  });
  await channel.lockPermissions().catch((error) => {
    console.error(`Impossible de synchroniser les permissions de ${channel.name}.`, error);
  });
  await configureMusicBotChannel(channel);
  const guildData = getGuildData(interaction.guild.id);
  guildData.privateVoices[channel.id] = {
    ownerId: actor.id,
    access: [],
    accessOriginal: {},
    roleAccess: [],
    roleAccessOriginal: {},
    isPrivate: false,
    managedPanel: true,
    lastActiveAt: Date.now(),
  };
  await saveStore();
  await interaction.editReply(panel('success', 'Vocal créé', `${channel} a été créé avec les permissions de la catégorie.`, true));
  await sendPersonalVoiceLog(interaction.guild, 'Salon créé', interaction.user, channel, [
    '**Permissions** — synchronisées avec la catégorie',
  ]);
  return true;
}

async function getSecurityForum(guild) {
  const channel = await guild.channels.fetch(SECURITY_FORUM_ID).catch(() => null);
  return channel?.type === ChannelType.GuildForum ? channel : null;
}

function securityTemplatePanel(section) {
  const container = new ContainerBuilder()
    .setAccentColor(section.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `## ${section.icon} Journal · ${section.title}`,
        `-# ${section.description}`,
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '**Ce que contiendra chaque entrée**',
        '・**Auteur** — membre responsable et identifiant',
        '・**Cible** — membre, rôle ou salon concerné',
        '・**Action** — événement détecté par le bot',
        '・**Réponse** — correction et sanction appliquées',
        '・**Date** — horodatage précis de l’incident',
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('-# Pvcool Security · surveillance automatique'),
    );
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function securityLogPanel(section, title, details) {
  const container = new ContainerBuilder()
    .setAccentColor(section?.color ?? 0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${section?.icon ?? '🛡️'} INCIDENT DE SÉCURITÉ`),
      new TextDisplayBuilder().setContent(`## ${title}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(details.join('\n').slice(0, 3500)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# Détecté <t:${Math.floor(Date.now() / 1000)}:R> · Pvcool Security`),
    );
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

async function ensureSecurityForum(guild) {
  let forum = await getSecurityForum(guild);
  if (!forum) {
    console.error(`Le salon ${SECURITY_FORUM_ID} n’est pas un forum accessible.`);
    return;
  }

  const guildData = getGuildData(guild.id);
  const obsoleteSections = new Map([
    ['permissions', 'Modèle — Permissions'],
    ['roles', 'Modèle — Rôles'],
    ['restore', 'Modèle — Restauration'],
  ]);
  const [activeThreads, archivedThreads] = await Promise.all([
    forum.threads.fetchActive().catch(() => null),
    forum.threads.fetchArchived({ type: 'public', fetchAll: true }).catch(() => null),
  ]);
  const obsoleteThreadNames = new Set(obsoleteSections.values());
  const obsoleteThreads = new Map(
    [...(activeThreads?.threads?.values() ?? []), ...(archivedThreads?.threads?.values() ?? [])]
      .filter((thread) => obsoleteThreadNames.has(thread.name))
      .map((thread) => [thread.id, thread]),
  );
  let removedStoredTemplate = false;
  for (const [key] of obsoleteSections) {
    const storedId = guildData.securityForumTemplates[key];
    if (storedId && !obsoleteThreads.has(storedId)) {
      const storedThread = await forum.threads.fetch(storedId).catch(() => null);
      if (storedThread) obsoleteThreads.set(storedThread.id, storedThread);
    }
    if (storedId) removedStoredTemplate = true;
    delete guildData.securityForumTemplates[key];
  }
  for (const thread of obsoleteThreads.values()) {
    await thread.delete('Suppression d’un ancien modèle de sécurité').catch(console.error);
  }
  if (obsoleteThreads.size || removedStoredTemplate) {
    await saveStore();
  }

  const obsoleteTags = new Set(['Permissions', 'Rôles', 'Restauration']);
  const retainedTags = forum.availableTags.filter((tag) => !obsoleteTags.has(tag.name));
  const existingNames = new Set(retainedTags.map((tag) => tag.name));
  const missingTags = SECURITY_FORUM_SECTIONS.filter(({ tag }) => !existingNames.has(tag));
  if (missingTags.length || retainedTags.length !== forum.availableTags.length) {
    forum = await forum.setAvailableTags([
      ...retainedTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        moderated: tag.moderated,
        emoji: tag.emoji,
      })),
      ...missingTags.map(({ tag }) => ({ name: tag, moderated: false })),
    ], 'Initialisation des catégories de logs de sécurité');
  }

  for (const section of SECURITY_FORUM_SECTIONS) {
    const tag = forum.availableTags.find((candidate) => candidate.name === section.tag);
    let thread = guildData.securityForumTemplates[section.key]
      ? await forum.threads.fetch(guildData.securityForumTemplates[section.key]).catch(() => null)
      : null;
    if (!thread) {
      thread = await forum.threads.create({
        name: `Modèle — ${section.title}`,
        appliedTags: tag ? [tag.id] : [],
        reason: 'Création du modèle de logs de sécurité',
        message: {
          ...securityTemplatePanel(section),
          allowedMentions: { parse: [] },
        },
      });
      guildData.securityForumTemplates[section.key] = thread.id;
      await saveStore();
      continue;
    }

    const starterMessage = await thread.fetchStarterMessage().catch(() => null);
    if (starterMessage) {
      await starterMessage.edit({
        content: null,
        embeds: [],
        ...securityTemplatePanel(section),
        allowedMentions: { parse: [] },
      }).catch((error) => console.error(`Impossible de convertir le modèle ${section.title} en V2.`, error));
    }
  }
}

async function sendSecurityLog(guild, sectionKey, title, details) {
  let forum = await getSecurityForum(guild);
  if (!forum) return;
  const section = SECURITY_FORUM_SECTIONS.find(({ key }) => key === sectionKey);
  if (!section) return;
  const guildData = getGuildData(guild.id);
  let threadId = guildData.securityForumTemplates[sectionKey];
  let thread = threadId ? await forum.threads.fetch(threadId).catch(() => null) : null;
  if (!thread) {
    await ensureSecurityForum(guild);
    forum = await getSecurityForum(guild);
    threadId = getGuildData(guild.id).securityForumTemplates[sectionKey];
    thread = forum && threadId ? await forum.threads.fetch(threadId).catch(() => null) : null;
  }
  if (!thread) return;
  if (thread.archived) await thread.setArchived(false, 'Nouveau log de sécurité').catch(console.error);
  await thread.send({
    ...securityLogPanel(section, title, details),
    allowedMentions: { parse: [] },
  }).catch((error) => console.error('Impossible de publier un log de sécurité.', error));
}

function commandLogTag(commandName) {
  return {
    perso: 'Perso',
    rank: 'Rank',
    dog: 'Dog',
    clear: 'Clear',
    to: 'TO',
  }[commandName] ?? null;
}

function commandTemplatePanel(presentation) {
  const container = new ContainerBuilder()
    .setAccentColor(presentation.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `-# ${presentation.icon} MODÈLE DE JOURNAL`,
        `## ${presentation.command}`,
        presentation.description,
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '**Informations enregistrées**',
        '・Utilisateur et identifiant Discord',
        '・Salon dans lequel la commande a été lancée',
        `・Options attendues — ${presentation.options}`,
        '・Statut du traitement et éventuelle erreur technique',
        '・Date et heure exactes',
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('-# Les mentions affichées dans les logs ne provoquent aucune notification.'),
    );
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

async function ensureCommandLogForums(guild) {
  const guildData = getGuildData(guild.id);
  for (const config of COMMAND_LOG_FORUMS) {
    let forum = await guild.channels.fetch(config.id).catch(() => null);
    if (forum?.type !== ChannelType.GuildForum) {
      console.error(`Le salon ${config.id} n’est pas un forum accessible.`);
      continue;
    }
    if (config.tags.includes('Rôles perso')) {
      const legacyPersonalRoleTag = forum.availableTags.find((tag) => tag.name === 'My Role');
      if (legacyPersonalRoleTag) {
        forum = await forum.setAvailableTags(forum.availableTags.map((tag) => ({
          id: tag.id,
          name: tag.id === legacyPersonalRoleTag.id ? 'Rôles perso' : tag.name,
          moderated: tag.moderated,
          emoji: tag.emoji,
        })), 'Renommage du journal des rôles personnels');
      }
      const oldKey = `${config.id}:My Role`;
      const newKey = `${config.id}:Rôles perso`;
      if (guildData.commandForumTemplates[oldKey] && !guildData.commandForumTemplates[newKey]) {
        guildData.commandForumTemplates[newKey] = guildData.commandForumTemplates[oldKey];
      }
      delete guildData.commandForumTemplates[oldKey];
    }
    const legacyTagIds = new Set(
      forum.availableTags
        .filter((tag) => LEGACY_COMMAND_LOG_TAGS.has(tag.name))
        .map((tag) => tag.id),
    );
    const legacyThreadIds = new Set();
    for (const tagName of LEGACY_COMMAND_LOG_TAGS) {
      const templateKey = `${config.id}:${tagName}`;
      if (guildData.commandForumTemplates[templateKey]) {
        legacyThreadIds.add(guildData.commandForumTemplates[templateKey]);
        delete guildData.commandForumTemplates[templateKey];
      }
    }
    const threadCollections = await Promise.all([
      forum.threads.fetchActive().catch(() => null),
      forum.threads.fetchArchived({ type: 'public', fetchAll: true }).catch(() => null),
    ]);
    for (const collection of threadCollections) {
      for (const thread of collection?.threads?.values?.() ?? []) {
        const isLegacyName = LEGACY_COMMAND_LOG_NAMES.has(thread.name.toLocaleLowerCase('fr'));
        const hasLegacyTag = thread.appliedTags.some((tagId) => legacyTagIds.has(tagId));
        if (isLegacyName || hasLegacyTag) legacyThreadIds.add(thread.id);
      }
    }
    for (const threadId of legacyThreadIds) {
      const thread = await forum.threads.fetch(threadId).catch(() => null);
      if (thread) {
        await thread.delete('Suppression des anciens journaux /pv et /access').catch((error) => {
          console.error(`Impossible de supprimer l’ancien journal ${threadId}.`, error);
        });
      }
    }
    const keptTags = forum.availableTags.filter((tag) => (
      !COMMAND_LOG_TAGS.includes(tag.name) || config.tags.includes(tag.name)
    ));
    const keptNames = new Set(keptTags.map((tag) => tag.name));
    const missingTags = config.tags.filter((tag) => !keptNames.has(tag));
    const tagsChanged = keptTags.length !== forum.availableTags.length || missingTags.length > 0;
    if (tagsChanged) {
      forum = await forum.setAvailableTags([
        ...keptTags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          moderated: tag.moderated,
          emoji: tag.emoji,
        })),
        ...missingTags.map((name) => ({ name, moderated: false })),
      ], 'Répartition des catégories de logs de commandes');
    }

    for (const tagName of config.tags) {
      const presentation = COMMAND_LOG_PRESENTATION[tagName];
      const templateKey = `${config.id}:${tagName}`;
      const tag = forum.availableTags.find((candidate) => candidate.name === tagName);
      let thread = guildData.commandForumTemplates[templateKey]
        ? await forum.threads.fetch(guildData.commandForumTemplates[templateKey]).catch(() => null)
        : null;
      if (!thread && tagName === 'Rôles perso') {
        for (const collection of threadCollections) {
          thread = [...(collection?.threads?.values?.() ?? [])].find((candidate) => (
            ['modèle — /my-role', 'modifications des rôles perso'].includes(candidate.name.toLocaleLowerCase('fr'))
            || (tag && candidate.appliedTags.includes(tag.id))
          ));
          if (thread) break;
        }
        if (thread) guildData.commandForumTemplates[templateKey] = thread.id;
      }
      if (!thread) {
        thread = await forum.threads.create({
          name: presentation.threadName ?? `Modèle — ${presentation.command}`,
          appliedTags: tag ? [tag.id] : [],
          reason: 'Création du modèle de journal de commande',
          message: {
            ...commandTemplatePanel(presentation),
            allowedMentions: { parse: [] },
          },
        });
        guildData.commandForumTemplates[templateKey] = thread.id;
        await saveStore();
        continue;
      }

      const desiredName = presentation.threadName ?? `Modèle — ${presentation.command}`;
      if (thread.name !== desiredName) {
        await thread.setName(desiredName, 'Mise à jour du journal des rôles personnels').catch(console.error);
      }
      if (tag && !thread.appliedTags.includes(tag.id)) {
        await thread.setAppliedTags([tag.id], 'Mise à jour de la catégorie du journal').catch(console.error);
      }

      const starterMessage = await thread.fetchStarterMessage().catch(() => null);
      if (starterMessage) {
        await starterMessage.edit({
          content: null,
          embeds: [],
          ...commandTemplatePanel(presentation),
          allowedMentions: { parse: [] },
        }).catch((error) => console.error(`Impossible de mettre à jour le modèle ${presentation.command}.`, error));
      }
    }
  }
  await saveStore();
}

async function sendPersonalRoleModificationLog(guild, action, actor, role, extra = []) {
  const forumId = '1565405625788276796';
  const guildData = getGuildData(guild.id);
  const forum = await guild.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) return;
  const templateKey = `${forumId}:Rôles perso`;
  let thread = guildData.commandForumTemplates[templateKey]
    ? await forum.threads.fetch(guildData.commandForumTemplates[templateKey]).catch(() => null)
    : null;
  if (!thread) {
    await ensureCommandLogForums(guild);
    thread = guildData.commandForumTemplates[templateKey]
      ? await forum.threads.fetch(guildData.commandForumTemplates[templateKey]).catch(() => null)
      : null;
  }
  if (!thread) return;
  if (thread.archived) await thread.setArchived(false, 'Nouvelle modification de rôle personnel').catch(console.error);
  const roleId = role?.id ?? 'inconnu';
  const roleName = role?.name ?? 'rôle supprimé';
  const container = new ContainerBuilder().setAccentColor(0x9B72FF)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent([
      `-# 🎨 RÔLE PERSONNEL · <t:${Math.floor(Date.now() / 1000)}:R>`,
      `**${action}**`,
      `・**Auteur** — <@${actor.id}> · ID ${actor.id}`,
      `・**Rôle** — ${roleName} · ID ${roleId}`,
      ...extra.map((line) => `・${line}`),
    ].join('\n')));
  await thread.send({
    components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] },
  }).catch((error) => console.error('Impossible de publier le log du rôle personnel.', error));
}

async function sendPersonalVoiceLog(guild, action, actor, channel, extra = []) {
  const forumId = '1565405625788276796';
  const guildData = getGuildData(guild.id);
  const forum = await guild.channels.fetch(forumId).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) return;
  const templateKey = `${forumId}:Salons perso`;
  let thread = guildData.commandForumTemplates[templateKey]
    ? await forum.threads.fetch(guildData.commandForumTemplates[templateKey]).catch(() => null)
    : null;
  if (!thread) {
    await ensureCommandLogForums(guild);
    thread = guildData.commandForumTemplates[templateKey]
      ? await forum.threads.fetch(guildData.commandForumTemplates[templateKey]).catch(() => null)
      : null;
  }
  if (!thread) return;
  if (thread.archived) await thread.setArchived(false, 'Nouveau log de salon personnalisé').catch(console.error);
  const channelId = channel?.id ?? 'inconnu';
  const channelName = channel?.name ?? 'salon supprimé';
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `-# 🔊 SALON PERSONNALISÉ · <t:${Math.floor(Date.now() / 1000)}:R>`,
        `**${action}**`,
        `・**Auteur** — <@${actor.id}> · ID ${actor.id}`,
        `・**Salon** — ${channelName} · ID ${channelId}`,
        ...extra.map((line) => `・${line}`),
      ].join('\n')),
    );
  await thread.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  }).catch((error) => console.error('Impossible de publier le log du salon personnalisé.', error));
}

function formatCommandOptions(options, prefix = '') {
  const lines = [];
  for (const option of options) {
    const label = prefix ? `${prefix} ${option.name}` : option.name;
    if (option.options?.length) {
      lines.push(...formatCommandOptions(option.options, label));
      continue;
    }
    let value = String(option.value ?? '—').replace(/`/g, '′');
    if (option.type === ApplicationCommandOptionType.User) value = `<@${option.value}> · ID ${option.value}`;
    if (option.type === ApplicationCommandOptionType.Role) value = `<@&${option.value}> · ID ${option.value}`;
    if (option.type === ApplicationCommandOptionType.Channel) value = `<#${option.value}> · ID ${option.value}`;
    lines.push(`・**${label}** — ${value}`);
  }
  return lines;
}

async function sendCommandLog(interaction, status, technicalError = null) {
  const tagName = commandLogTag(interaction.commandName);
  const forumConfig = COMMAND_LOG_FORUMS.find(({ tags }) => tags.includes(tagName));
  if (!forumConfig) return;
  let forum = await interaction.guild.channels.fetch(forumConfig.id).catch(() => null);
  if (forum?.type !== ChannelType.GuildForum) return;
  const optionLines = formatCommandOptions(interaction.options.data);
  const success = status === 'Traitée';
  const details = [
    `**Utilisateur** — <@${interaction.user.id}> · ID ${interaction.user.id}`,
    `**Salon** — <#${interaction.channelId}> · ID ${interaction.channelId}`,
    `**Statut** — ${success ? '✓ Traitée' : '✕ Erreur technique'}`,
  ];
  if (technicalError) details.push(`**Erreur** — ${String(technicalError.message ?? technicalError).slice(0, 500).replace(/`/g, '′')}`);

  const header = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `-# ${success ? '✓' : '✕'} JOURNAL DE COMMANDE`,
        `## /${interaction.commandName}`,
        ...details,
      ].join('\n')),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ extension: 'png', size: 256 })),
    );
  const container = new ContainerBuilder()
    .setAccentColor(success ? 0x5865F2 : 0xED4245)
    .addSectionComponents(header)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '**Options utilisées**',
        ...(optionLines.length ? optionLines : ['-# Aucune option']),
      ].join('\n').slice(0, 3500)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F> · Pvcool Commands`),
    );

  const templateKey = `${forumConfig.id}:${tagName}`;
  const guildData = getGuildData(interaction.guild.id);
  let threadId = guildData.commandForumTemplates[templateKey];
  let thread = threadId ? await forum.threads.fetch(threadId).catch(() => null) : null;
  if (!thread) {
    await ensureCommandLogForums(interaction.guild);
    forum = await interaction.guild.channels.fetch(forumConfig.id).catch(() => null);
    threadId = getGuildData(interaction.guild.id).commandForumTemplates[templateKey];
    thread = forum?.type === ChannelType.GuildForum && threadId
      ? await forum.threads.fetch(threadId).catch(() => null)
      : null;
  }
  if (!thread) return;
  if (thread.archived) await thread.setArchived(false, 'Nouveau log de commande').catch(console.error);
  await thread.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  }).catch((error) => console.error('Impossible de publier un log de commande.', error));
}

function profileMediaPanel(title, user, imageUrl, accentColor) {
  const gallery = new MediaGalleryBuilder().addItems(
    new MediaGalleryItemBuilder()
      .setURL(imageUrl)
      .setDescription(`${title} de ${user.username}`),
  );
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${title}\n-# ${user} · ${user.username}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addMediaGalleryComponents(gallery);
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function whitelistListPanel(guildData) {
  const formatList = (title, command, userIds) => {
    const visibleIds = userIds.slice(0, 30);
    const members = visibleIds.length ? visibleIds.map((userId) => `<@${userId}>`).join(' · ') : '-# Aucun membre';
    const remaining = userIds.length - visibleIds.length;
    return [
      `### ${title} — ${userIds.length}`,
      `-# Gestion : \`${command}\``,
      members,
      ...(remaining > 0 ? [`-# … et ${remaining} autre${remaining > 1 ? 's' : ''}`] : []),
    ].join('\n');
  };
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 📋 Listes des whitelists'),
      new TextDisplayBuilder().setContent(formatList('Whitelist Perso', '=wlperso · =unwlperso', guildData.whitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist Dog', '=wldog · =unwldog', guildData.dogWhitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist PV', '=wlpv · =unwlpv', guildData.pvWhitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist Antispam', '=wlspam · =unwlspam', guildData.spamWhitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist Ban', '=wlban · =unwlban', guildData.banWhitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist Wakeup', '=wlwakeup · =unwlwakeup', guildData.wakeupWhitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist Lockname', '=wllockname · =unwllockname', guildData.locknameWhitelist)),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(formatList('Whitelist Quiz', '=wlquiz · =unwlquiz', guildData.quizWhitelist)),
    );
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

async function removeWelcomePanel(guild) {
  const channel = await guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return;
  const guildData = getGuildData(guild.id);
  if (!guildData.welcomeMessageId) return;
  const existing = await channel.messages.fetch(guildData.welcomeMessageId).catch(() => null);
  await existing?.delete().catch(console.error);
  guildData.welcomeMessageId = null;
  await saveStore();
}

async function handleOwnerChannelCommand(message) {
  if (!message.inGuild() || message.author.bot) return;
  const command = message.content.trim().toLowerCase();
  if (!['+new', '+lock', '+unlock'].includes(command)) return;
  if (command === '+new' && !canUseNewCommand(message.member)) return;
  if (['+lock', '+unlock'].includes(command) && !canUseLockCommand(message.member)) return;

  if (message.channel.isThread() || !('permissionOverwrites' in message.channel)) {
    await message.reply(panel('error', 'Salon incompatible', 'Cette commande doit être utilisée directement dans un salon du serveur.'));
    return;
  }

  if (command === '+lock' || command === '+unlock') {
    const guildData = getGuildData(message.guild.id);
    const everyoneOverwrite = message.channel.permissionOverwrites.cache.get(message.guild.id);
    const alreadyLocked = everyoneOverwrite?.deny.has(PermissionFlagsBits.SendMessages)
      && everyoneOverwrite.deny.has(PermissionFlagsBits.SendMessagesInThreads)
      && everyoneOverwrite.deny.has(PermissionFlagsBits.CreatePublicThreads)
      && everyoneOverwrite.deny.has(PermissionFlagsBits.CreatePrivateThreads);
    if (command === '+unlock') {
      if (!alreadyLocked) {
        await message.reply(panel('info', 'Salon déjà ouvert', 'Ce salon n’est pas verrouillé. Utilise `+lock` pour le fermer.'));
        return;
      }
      const original = guildData.channelLocks[message.channel.id] ?? {};
      await message.channel.permissionOverwrites.edit(
        message.guild.roles.everyone,
        {
          SendMessages: original.sendMessages ?? null,
          SendMessagesInThreads: original.sendMessagesInThreads ?? null,
          CreatePublicThreads: original.createPublicThreads ?? null,
          CreatePrivateThreads: original.createPrivateThreads ?? null,
        },
        { reason: `Salon déverrouillé avec +unlock par ${message.author.tag}` },
      );
      delete guildData.channelLocks[message.channel.id];
      await saveStore();
      await message.reply(panel('success', 'Salon déverrouillé', 'Salon ouvert à tout le monde.'));
      return;
    }
    if (alreadyLocked) {
      await message.reply(panel('info', 'Salon déjà verrouillé', 'Ce salon est déjà fermé. Utilise `+unlock` pour le rouvrir.'));
      return;
    }
    const originalPermissions = {
      sendMessages: overwritePermissionValue(message.channel, message.guild.id, PermissionFlagsBits.SendMessages),
      sendMessagesInThreads: overwritePermissionValue(message.channel, message.guild.id, PermissionFlagsBits.SendMessagesInThreads),
      createPublicThreads: overwritePermissionValue(message.channel, message.guild.id, PermissionFlagsBits.CreatePublicThreads),
      createPrivateThreads: overwritePermissionValue(message.channel, message.guild.id, PermissionFlagsBits.CreatePrivateThreads),
    };
    await message.channel.permissionOverwrites.edit(
      message.guild.roles.everyone,
      {
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
      },
      { reason: `Salon verrouillé avec +lock par ${message.author.tag}` },
    );
    guildData.channelLocks[message.channel.id] = originalPermissions;
    await saveStore();
    await message.reply({
      ...panel('success', 'Salon verrouillé', 'Salon fermé à tout le monde.'),
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (!message.channel.deletable || typeof message.channel.clone !== 'function') {
    await message.reply(panel('error', 'Action impossible', 'Le bot ne peut pas recréer ce salon. Vérifie sa hiérarchie et ses permissions.'));
    return;
  }

  const originalPosition = message.channel.rawPosition;
  const originalName = message.channel.name;
  const originalChannelId = message.channel.id;
  const guildData = getGuildData(message.guild.id);
  const protectedBackup = guildData.protectedChannels?.[originalChannelId] ?? null;
  const lockBackup = guildData.channelLocks?.[originalChannelId] ?? null;
  const clonedChannel = await message.channel.clone({
    reason: `Salon recréé avec +new par ${message.author.tag}`,
  });
  await clonedChannel.setPosition(originalPosition, { reason: 'Restauration de la position après +new' })
    .catch(console.error);
  authorizedChannelDeletions.add(originalChannelId);
  try {
    await message.channel.delete(`Salon remplacé avec +new par ${message.author.tag}`);
  } catch (error) {
    authorizedChannelDeletions.delete(originalChannelId);
    await clonedChannel.delete('Annulation de +new après échec de suppression du salon original').catch(console.error);
    throw error;
  }
  if (protectedBackup) {
    delete guildData.protectedChannels[originalChannelId];
    guildData.protectedChannels[clonedChannel.id] = channelBackup(clonedChannel);
  }
  if (lockBackup) {
    delete guildData.channelLocks[originalChannelId];
    guildData.channelLocks[clonedChannel.id] = lockBackup;
  }
  if (protectedBackup || lockBackup) await saveStore();
  if (clonedChannel.isTextBased() && 'send' in clonedChannel) {
    await clonedChannel.send({
      ...panel('success', 'Salon recréé', `Le salon **${originalName}** a été recréé à la même position.`),
      allowedMentions: { parse: [] },
    }).catch(console.error);
  }
}

async function handleProfileMediaCommand(message) {
  if (!message.inGuild() || message.author.bot || !message.content.startsWith('+')) return;
  const [command] = message.content.trim().toLowerCase().split(/\s+/);
  if (command === '+listewl') {
    if (!WHITELIST_MANAGERS.has(message.author.id)) {
      await message.reply(panel('error', 'Accès refusé', 'Seuls les quatre gestionnaires peuvent consulter les whitelists.'));
      return;
    }
    await message.reply(whitelistListPanel(getGuildData(message.guild.id)));
    return;
  }
  if (!['+pic', '+banner'].includes(command)) return;

  const selectedUser = message.mentions.users.first() ?? message.author;
  const user = await message.client.users.fetch(selectedUser.id, { force: true });
  if (command === '+pic') {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 2048, forceStatic: false });
    await message.reply(profileMediaPanel('Photo de profil', user, avatarUrl, 0x5865F2));
    return;
  }

  const bannerUrl = user.bannerURL({ extension: 'png', size: 2048, forceStatic: false });
  if (!bannerUrl) {
    await message.reply(panel('info', 'Aucune bannière', `${user} n’a pas de bannière de profil.`));
    return;
  }
  await message.reply(profileMediaPanel('Bannière', user, bannerUrl, 0x9B59B6));
}

async function handleUnbanCommand(message) {
  if (!message.inGuild() || message.author.bot) return false;

  const [command, rawTarget] = message.content.trim().split(/\s+/);
  if (command?.toLowerCase() !== '+unban') return false;

  if (!canUseUnbanCommand(message.member)) {
    await message.reply(panel('error', 'Accès refusé', 'Seuls les rôles **PVCool Elite** et **Créateur** peuvent utiliser `+unban`.'));
    return true;
  }

  const userId = parseUserId(rawTarget);
  if (!userId) {
    await message.reply(panel('warning', 'Utilisateur requis', 'Utilise `+unban <identifiant ou mention>`.'));
    return true;
  }

  const remainsBlacklisted = getGuildData(message.guild.id).securityBlacklist.includes(userId);

  const activeBan = await message.guild.bans.fetch(userId).catch(() => null);
  let unbanned = false;
  let unbanError = null;
  if (activeBan) {
    try {
      await message.guild.bans.remove(userId, `+unban utilisé par ${message.author.tag}`);
      unbanned = true;
    } catch (error) {
      unbanError = error;
    }
  }

  await sendSecurityLog(message.guild, 'blacklist', 'Utilisateur débanni', [
    `**Utilisateur** — <@${userId}> (\`${userId}\`)`,
    `**Par** — <@${message.author.id}>`,
    `**Bannissement Discord** — ${unbanned ? 'levé' : activeBan ? 'échec' : 'déjà absent'}`,
    `**Blacklist persistante** — ${remainsBlacklisted ? 'conservée' : 'absente'}`,
  ]).catch(console.error);

  if (unbanError) {
    await message.reply({
      ...panel(
        'warning',
        'Débannissement impossible',
        `Discord n’a pas permis de débannir <@${userId}>. Vérifie la permission **Bannir des membres** du bot.`,
      ),
      allowedMentions: { parse: [] },
    });
    return true;
  }

  await message.reply({
    ...panel(
      'success',
      'Utilisateur débanni',
      remainsBlacklisted
        ? `<@${userId}> est débanni, mais reste **blacklisté** : s’il revient, le bot le bannira immédiatement. Utilise \`+unblacklist ${userId}\` pour retirer cette protection.`
        : `<@${userId}> peut revenir sur le serveur.`,
    ),
    allowedMentions: { parse: [] },
  });
  return true;
}

async function handleBlacklistCommand(message) {
  if (!message.inGuild() || message.author.bot) return false;

  const [rawCommand, rawTarget, ...reasonParts] = message.content.trim().split(/\s+/);
  const command = rawCommand?.toLowerCase();
  if (!['+blacklist', '+unblacklist'].includes(command)) return false;

  if (!canManageBlacklist(message.member)) {
    await message.reply(panel('error', 'Accès refusé', 'Seul le rôle **Créateur** peut gérer la blacklist.'));
    return true;
  }

  const userId = parseUserId(rawTarget);
  if (!userId) {
    await message.reply(panel('warning', 'Utilisateur requis', `Utilise \`${command} <identifiant ou mention>${command === '+blacklist' ? ' [motif]' : ''}\`.`));
    return true;
  }

  const guildData = getGuildData(message.guild.id);
  if (command === '+unblacklist') {
    const wasBlacklisted = guildData.securityBlacklist.includes(userId);
    guildData.securityBlacklist = guildData.securityBlacklist.filter((id) => id !== userId);
    if (wasBlacklisted) await saveStore();

    await sendSecurityLog(message.guild, 'blacklist', 'Utilisateur retiré de la blacklist', [
      `**Utilisateur** — <@${userId}> (\`${userId}\`)`,
      `**Par** — <@${message.author.id}>`,
      '**Bannissement Discord** — inchangé',
    ]).catch(console.error);
    await message.reply({
      ...panel(
        wasBlacklisted ? 'success' : 'info',
        wasBlacklisted ? 'Blacklist retirée' : 'Blacklist déjà absente',
        wasBlacklisted
          ? `<@${userId}> ne sera plus rebanni automatiquement. Son bannissement Discord actuel reste inchangé ; utilise \`+unban ${userId}\` si nécessaire.`
          : `<@${userId}> n’était pas dans la blacklist.`,
      ),
      allowedMentions: { parse: [] },
    });
    return true;
  }

  if (userId === message.author.id || userId === message.client.user.id || userId === message.guild.ownerId) {
    await message.reply(panel('error', 'Cible protégée', 'Tu ne peux pas blacklister ce compte.'));
    return true;
  }

  const targetMember = await message.guild.members.fetch(userId).catch(() => null);
  if (targetMember?.user.bot) {
    await message.reply(panel('error', 'Cible protégée', 'Un bot ne peut pas être ajouté à cette blacklist.'));
    return true;
  }
  if (targetMember
    && message.author.id !== message.guild.ownerId
    && targetMember.roles.highest.position >= message.member.roles.highest.position) {
    await message.reply(panel('error', 'Hiérarchie insuffisante', 'Tu ne peux pas blacklister un membre placé au même niveau ou au-dessus de toi.'));
    return true;
  }

  const alreadyBlacklisted = guildData.securityBlacklist.includes(userId);
  const reason = reasonParts.join(' ').trim() || `Blacklist manuelle appliquée par ${message.author.tag}`;
  await blacklistAndBanById(message.guild, userId, reason);
  await message.reply({
    ...panel(
      'success',
      alreadyBlacklisted ? 'Blacklist confirmée' : 'Utilisateur blacklisté',
      `<@${userId}> est enregistré dans la blacklist persistante. Même après un déban, son retour provoquera un bannissement immédiat.`,
    ),
    allowedMentions: { parse: [] },
  });
  return true;
}

function rememberDeletedMessage(message) {
  if (badwordDeletedMessageIds.delete(message.id)) return;
  if (!message.inGuild() || message.author?.bot || !message.author) return;
  const content = message.content?.trim() || '';
  const attachments = [...message.attachments.values()].slice(0, 3).map((attachment) => ({
    name: attachment.name ?? 'Pièce jointe',
    url: attachment.url,
  }));
  if (!content && !attachments.length) return;
  deletedMessageCache.set(message.channelId, {
    authorName: message.author.username,
    avatarUrl: message.author.displayAvatarURL({ extension: 'png', size: 256 }),
    content,
    attachments,
    deletedAt: Date.now(),
  });
}

function snipePanel(snipe) {
  const visibleContent = snipe.content
    ? snipe.content.slice(0, 1400)
    : '-# Message sans texte';
  const attachmentLines = snipe.attachments.map((attachment, index) => (
    `・[Pièce jointe ${index + 1} — ${attachment.name}](${attachment.url})`
  ));
  const description = [
    visibleContent,
    ...(attachmentLines.length ? ['', ...attachmentLines] : []),
  ].join('\n');
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: snipe.authorName, iconURL: snipe.avatarUrl })
    .setDescription(description.slice(0, 4000));
  return { embeds: [embed] };
}

async function handleSnipeCommand(message) {
  if (!message.inGuild() || message.author.bot || message.content.trim().toLowerCase() !== '+snipe') return;
  const isAllowed = WHITELIST_MANAGERS.has(message.author.id)
    || message.member?.roles.cache.has(SNIPE_ROLE_ID)
    || hasPremiumAccess(message.member);
  if (!isAllowed) {
    const response = await message.reply(panel('error', 'Accès refusé', 'Cette commande est réservée aux membres autorisés.'));
    setTimeout(() => response.delete().catch(() => null), 8_000);
    return;
  }
  const snipe = deletedMessageCache.get(message.channel.id);
  if (!snipe || Date.now() - snipe.deletedAt > SNIPE_CACHE_MS) {
    deletedMessageCache.delete(message.channel.id);
    const response = await message.reply(panel('info', 'Aucun message', 'Aucun message supprimé récemment dans ce salon.'));
    setTimeout(() => response.delete().catch(() => null), SNIPE_DISPLAY_MS);
    return;
  }
  const response = await message.reply({
    ...snipePanel(snipe),
    allowedMentions: { parse: [] },
  });
  setTimeout(() => response.delete().catch(() => null), SNIPE_DISPLAY_MS);
}

function parseGiveawayDuration(input) {
  const normalized = input.toLowerCase().replace(/\s+/g, '');
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    j: 24 * 60 * 60 * 1000,
  };
  let total = 0;
  let consumed = '';
  for (const match of normalized.matchAll(/(\d+)([smhdj])/g)) {
    total += Number.parseInt(match[1], 10) * multipliers[match[2]];
    consumed += match[0];
  }
  if (!total || consumed !== normalized || total < 10_000 || total > MAX_GIVEAWAY_DURATION_MS) return null;
  return total;
}

function giveawayPayload(giveaway) {
  const participants = giveaway.participants ?? [];
  const embed = new EmbedBuilder().setColor(0xA855F7);
  if (giveaway.status === 'cancelled') {
    embed
      .setColor(0xED4245)
      .setTitle(giveaway.prize)
      .setDescription('Ce giveaway a été annulé.');
    return { embeds: [embed], components: [] };
  }
  if (giveaway.status === 'ended') {
    const winners = giveaway.winners?.length
      ? giveaway.winners.map((userId) => `<@${userId}>`).join(', ')
      : 'Aucun gagnant';
    embed
      .setColor(0x57F287)
      .setTitle(giveaway.prize)
      .setDescription([
        '**Giveaway terminé**',
        '',
        `**Gagnant${giveaway.winnerCount > 1 ? 's' : ''}** — ${winners}`,
        `**Participants** — ${participants.length}`,
      ].join('\n'));
    return { embeds: [embed], components: [] };
  }

  embed
    .setTitle(giveaway.prize)
    .setDescription([
      'Réagis avec 💎 pour participer !',
      '',
      `**Gagnants** — ${giveaway.winnerCount}`,
      `**Fin** — <t:${Math.floor(giveaway.endAt / 1000)}:R>`,
    ].join('\n'));
  return {
    embeds: [embed],
    components: [],
  };
}

function drawGiveawayWinners(participants, count) {
  const shuffled = [...new Set(participants)];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

async function eligibleGiveawayParticipants(guild, participants) {
  const eligible = [];
  for (const userId of [...new Set(participants)]) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member && !member.user.bot) eligible.push(userId);
  }
  return eligible;
}

function clearGiveawayTimer(messageId) {
  const timer = giveawayTimers.get(messageId);
  if (timer) clearTimeout(timer);
  giveawayTimers.delete(messageId);
}

function scheduleGiveaway(guild, messageId) {
  clearGiveawayTimer(messageId);
  const giveaway = getGuildData(guild.id).giveaways[messageId];
  if (!giveaway || giveaway.status !== 'active') return;
  const delay = Math.max(1, Math.min(giveaway.endAt - Date.now(), 24 * 60 * 60 * 1000));
  const timer = setTimeout(async () => {
    const current = getGuildData(guild.id).giveaways[messageId];
    if (!current || current.status !== 'active') return;
    if (current.endAt > Date.now()) scheduleGiveaway(guild, messageId);
    else await finishGiveaway(guild, messageId).catch(console.error);
  }, delay);
  giveawayTimers.set(messageId, timer);
}

async function finishGiveaway(guild, messageId) {
  const guildData = getGuildData(guild.id);
  const giveaway = guildData.giveaways[messageId];
  if (!giveaway || giveaway.status !== 'active') return false;
  giveaway.status = 'ended';
  giveaway.endedAt = Date.now();
  const eligible = await eligibleGiveawayParticipants(guild, giveaway.participants ?? []);
  giveaway.winners = drawGiveawayWinners(eligible, giveaway.winnerCount);
  clearGiveawayTimer(messageId);
  await saveStore();

  const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return true;
  const giveawayMessage = await channel.messages.fetch(messageId).catch(() => null);
  await giveawayMessage?.edit({
    ...giveawayPayload(giveaway),
    allowedMentions: { parse: [] },
  }).catch(console.error);
  await giveawayMessage?.reactions.removeAll().catch(() => null);
  const result = giveaway.winners.length
    ? `🎉 Félicitations ${giveaway.winners.map((userId) => `<@${userId}>`).join(', ')} ! Vous remportez **${giveaway.prize}**.`
    : `Aucun participant valide pour **${giveaway.prize}**.`;
  await channel.send({ content: result, allowedMentions: { users: giveaway.winners } }).catch(console.error);
  return true;
}

async function handleGiveawayReaction(reaction, user, adding) {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
  if (reaction.emoji.name !== '💎' || !reaction.message.guild) return;
  const guildData = getGuildData(reaction.message.guild.id);
  const giveaway = guildData.giveaways[reaction.message.id];
  if (!giveaway || giveaway.status !== 'active') return;
  if (giveaway.endAt <= Date.now()) {
    await finishGiveaway(reaction.message.guild, reaction.message.id);
    return;
  }
  const participants = new Set(giveaway.participants ?? []);
  if (adding) participants.add(user.id);
  else participants.delete(user.id);
  giveaway.participants = [...participants];
  await saveStore();
}

async function handleGiveawayCommand(message) {
  if (!message.inGuild() || message.author.bot || !message.content.startsWith('+')) return;
  const [command] = message.content.trim().toLowerCase().split(/\s+/);
  if (!['+giveaway', '+gend', '+greroll', '+gcancel', '+glist', '+ghelp'].includes(command)) return;
  if (!WHITELIST_MANAGERS.has(message.author.id)
    && !message.member?.roles.cache.has(ELITE_ROLE_ID)) {
    const response = await message.reply(panel('error', 'Accès refusé', 'Ton rôle ne permet pas de gérer les giveaways.'));
    setTimeout(() => response.delete().catch(() => null), 8_000);
    return;
  }
  const guildData = getGuildData(message.guild.id);

  if (command === '+ghelp') {
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xA855F7)
        .setTitle('Commandes Giveaway')
        .setDescription([
          '**`+giveaway <durée> <gagnants> <lot>`**',
          'Lance un giveaway à réaction. Exemple : `+giveaway 1h30m 2 Nitro`',
          '',
          '**`+gend <id message>`**',
          'Termine immédiatement un giveaway en cours.',
          '',
          '**`+greroll <id message>`**',
          'Refait le tirage d’un giveaway terminé.',
          '',
          '**`+gcancel <id message>`**',
          'Annule un giveaway encore actif.',
          '',
          '**`+glist`**',
          'Affiche uniquement les giveaways actuellement en cours.',
        ].join('\n'))
        .setFooter({ text: 'Durées acceptées : 30s · 15m · 2h · 1j · 1h30m' })],
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (command === '+giveaway') {
    const match = message.content.trim().match(/^\+giveaway\s+(\S+)\s+(\d+)\s+(.+)$/i);
    const duration = match ? parseGiveawayDuration(match[1]) : null;
    const winnerCount = match ? Number.parseInt(match[2], 10) : 0;
    const prize = match?.[3]?.trim();
    if (!duration || winnerCount < 1 || winnerCount > 20 || !prize) {
      await message.reply(panel('warning', 'Syntaxe invalide', 'Utilise `+giveaway <durée> <gagnants> <lot>`, par exemple `+giveaway 1h30m 2 Nitro`.'));
      return;
    }
    const giveaway = {
      channelId: message.channel.id,
      hostId: message.author.id,
      prize: prize.slice(0, 256),
      winnerCount,
      endAt: Date.now() + duration,
      status: 'active',
      participationMode: 'reaction',
      participants: [],
      winners: [],
    };
    const giveawayMessage = await message.channel.send({
      ...giveawayPayload(giveaway),
      allowedMentions: { parse: [] },
    });
    guildData.giveaways[giveawayMessage.id] = giveaway;
    await saveStore();
    await giveawayMessage.react('💎');
    scheduleGiveaway(message.guild, giveawayMessage.id);
    return;
  }

  if (command === '+glist') {
    const active = Object.entries(guildData.giveaways)
      .filter(([, giveaway]) => giveaway.status === 'active');
    const description = active.length
      ? active.slice(0, 20).map(([messageId, giveaway]) => (
        `・[${giveaway.prize}](https://discord.com/channels/${message.guild.id}/${giveaway.channelId}/${messageId}) — <t:${Math.floor(giveaway.endAt / 1000)}:R>`
      )).join('\n')
      : 'Aucun giveaway en cours.';
    await message.reply({
      embeds: [new EmbedBuilder()
        .setColor(0xA855F7)
        .setTitle('Giveaways en cours')
        .setDescription(description)],
      allowedMentions: { parse: [] },
    });
    return;
  }

  const messageId = message.content.trim().split(/\s+/)[1];
  const giveaway = messageId ? guildData.giveaways[messageId] : null;
  if (!giveaway) {
    await message.reply(panel('error', 'Giveaway introuvable', 'Indique un identifiant de message de giveaway valide.'));
    return;
  }
  const channel = await message.guild.channels.fetch(giveaway.channelId).catch(() => null);
  const giveawayMessage = channel?.isTextBased() && 'messages' in channel
    ? await channel.messages.fetch(messageId).catch(() => null)
    : null;

  if (command === '+gend') {
    if (giveaway.status !== 'active') {
      await message.reply(panel('warning', 'Déjà terminé', 'Ce giveaway n’est plus en cours.'));
      return;
    }
    await finishGiveaway(message.guild, messageId);
    return;
  }
  if (command === '+gcancel') {
    if (giveaway.status !== 'active') {
      await message.reply(panel('warning', 'Action impossible', 'Ce giveaway n’est plus en cours.'));
      return;
    }
    giveaway.status = 'cancelled';
    giveaway.cancelledAt = Date.now();
    clearGiveawayTimer(messageId);
    await saveStore();
    await giveawayMessage?.edit({
      ...giveawayPayload(giveaway),
      allowedMentions: { parse: [] },
    }).catch(console.error);
    await giveawayMessage?.reactions.removeAll().catch(() => null);
    return;
  }
  if (giveaway.status !== 'ended') {
    await message.reply(panel('warning', 'Tirage impossible', 'Termine d’abord le giveaway avant de refaire un tirage.'));
    return;
  }
  const eligible = await eligibleGiveawayParticipants(message.guild, giveaway.participants ?? []);
  const previousWinners = new Set(giveaway.winners ?? []);
  const withoutPrevious = eligible.filter((userId) => !previousWinners.has(userId));
  giveaway.winners = drawGiveawayWinners(
    withoutPrevious.length >= giveaway.winnerCount ? withoutPrevious : eligible,
    giveaway.winnerCount,
  );
  giveaway.rerolledAt = Date.now();
  await saveStore();
  await giveawayMessage?.edit({
    ...giveawayPayload(giveaway),
    allowedMentions: { parse: [] },
  }).catch(console.error);
  const result = giveaway.winners.length
    ? `🔄 Nouveau tirage : ${giveaway.winners.map((userId) => `<@${userId}>`).join(', ')} remporte **${giveaway.prize}**.`
    : `Aucun participant disponible pour le nouveau tirage de **${giveaway.prize}**.`;
  await channel?.send({ content: result, allowedMentions: { users: giveaway.winners } }).catch(console.error);
}

function isSmashOrPassMedia(attachment) {
  if (attachment.contentType?.startsWith('image/') || attachment.contentType?.startsWith('video/')) {
    return true;
  }
  return /\.(?:apng|avif|gif|jpe?g|png|webp|mp4|mov|m4v|webm|mkv)$/i.test(attachment.name ?? '');
}

function isImageAttachment(attachment) {
  if (attachment.contentType?.startsWith('image/')) return true;
  return /\.(?:apng|avif|gif|jpe?g|png|webp)$/i.test(attachment.name ?? '');
}

function normalizeBadword(value) {
  return value.normalize('NFKC').toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();
}

function messageContainsBadword(content, badwords) {
  const normalized = normalizeBadword(content);
  return badwords.some((entry) => {
    const badword = normalizeBadword(entry);
    if (!badword) return false;
    const escaped = badword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const leftBoundary = /^[\p{L}\p{N}]/u.test(badword) ? '(?<![\\p{L}\\p{N}])' : '';
    const rightBoundary = /[\p{L}\p{N}]$/u.test(badword) ? '(?![\\p{L}\\p{N}])' : '';
    return new RegExp(`${leftBoundary}${escaped}${rightBoundary}`, 'u').test(normalized);
  });
}

function canManageBadwords(member) {
  return WHITELIST_MANAGERS.has(member?.id)
    || member?.roles.cache.has(CREATOR_ROLE_ID)
    || member?.roles.cache.has(ELITE_ROLE_ID);
}

async function handleBadwordCommand(message) {
  if (!message.inGuild() || message.author.bot || !message.content.toLowerCase().startsWith('+badword')) {
    return false;
  }
  if (!canManageBadwords(message.member)) {
    await message.reply(panel('error', 'Accès refusé', 'Cette commande est réservée aux owners, à Créateur et à PVCool Elite.'));
    return true;
  }

  const match = message.content.trim().match(/^\+badword\s+(add|remove)\s+([\s\S]+)$/i);
  if (!match) {
    await message.reply(panel('warning', 'Utilisation', 'Utilise `+badword add <mot ou expression>` ou `+badword remove <mot ou expression>`.'));
    return true;
  }
  const action = match[1].toLowerCase();
  const badword = normalizeBadword(match[2]);
  if (!badword || badword.length > 100) {
    await message.reply(panel('warning', 'Valeur invalide', 'Le mot ou l’expression doit contenir entre 1 et 100 caractères.'));
    return true;
  }

  const guildData = getGuildData(message.guild.id);
  const existingIndex = guildData.badwords.findIndex((entry) => normalizeBadword(entry) === badword);
  if (action === 'add') {
    if (existingIndex !== -1) {
      await message.reply(panel('info', 'Déjà bloqué', `\`${badword}\` est déjà dans la liste.`));
      return true;
    }
    guildData.badwords.push(badword);
    await saveStore();
    await message.reply(panel('success', 'Mot ajouté', `\`${badword}\` sera désormais supprimé automatiquement.`));
    return true;
  }

  if (existingIndex === -1) {
    await message.reply(panel('info', 'Mot introuvable', `\`${badword}\` n’est pas dans la liste.`));
    return true;
  }
  guildData.badwords.splice(existingIndex, 1);
  await saveStore();
  await message.reply(panel('success', 'Mot retiré', `\`${badword}\` n’est plus bloqué.`));
  return true;
}

async function handleBadwordFilter(message) {
  if (!message.inGuild() || message.author.bot || message.webhookId || !message.content.trim()) return false;
  if (canManageBadwords(message.member)) return false;
  const guildData = getGuildData(message.guild.id);
  if (!messageContainsBadword(message.content, guildData.badwords)) return false;
  badwordDeletedMessageIds.add(message.id);
  return message.delete().then(() => true).catch((error) => {
    badwordDeletedMessageIds.delete(message.id);
    console.error(`Impossible de supprimer un message contenant un badword de ${message.author.tag}.`, error);
    return false;
  });
}

async function handleImageThreadMessage(message) {
  if (!message.inGuild() || message.author.bot || message.channelId !== IMAGE_THREAD_CHANNEL_ID) {
    return false;
  }
  if (![...message.attachments.values()].some(isImageAttachment) || message.hasThread) {
    return false;
  }

  const authorName = message.member?.displayName ?? message.author.username;
  await message.startThread({
    name: `Discussion · ${authorName}`.slice(0, 100),
    autoArchiveDuration: 1_440,
    reason: `Discussion automatique pour l’image de ${message.author.tag}`,
  });
  return true;
}

function randomCandyThreshold() {
  return Math.floor(Math.random() * 11) + 10;
}

async function handleHalloweenCandyReaction(message) {
  if (!message.inGuild() || message.author.bot || message.channelId !== HALLOWEEN_CANDY_CHANNEL_ID) return;
  const state = halloweenCandyActivity.get(message.guild.id) ?? {
    count: 0,
    target: randomCandyThreshold(),
  };
  state.count += 1;
  if (state.count < state.target) {
    halloweenCandyActivity.set(message.guild.id, state);
    return;
  }
  const reacted = await message.react('❄️').then(() => true).catch((error) => {
    console.error('Impossible d’ajouter la réaction flocon Halloween.', error);
    return false;
  });
  if (!reacted) {
    halloweenCandyActivity.set(message.guild.id, state);
    return;
  }
  await registerCandyDrop(message);
  halloweenCandyActivity.set(message.guild.id, {
    count: 0,
    target: randomCandyThreshold(),
  });
}

function randomTriviaThreshold() {
  return Math.floor(Math.random() * (TRIVIA_MAX_MESSAGE_COUNT - TRIVIA_MIN_MESSAGE_COUNT + 1))
    + TRIVIA_MIN_MESSAGE_COUNT;
}

function normalizeTriviaAnswer(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:la reponse est|reponse|je dirais|je pense que|c est)\s+/, '');
}

async function wikipediaIllustration(question) {
  const query = question.wikiQuery ?? question.answers?.[0] ?? question.question;
  if (wikipediaIllustrationCache.has(query)) return wikipediaIllustrationCache.get(query);
  try {
    const url = new URL('https://fr.wikipedia.org/w/api.php');
    url.search = new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: query, gsrlimit: '5',
      prop: 'pageimages|info', piprop: 'thumbnail', pithumbsize: '900',
      inprop: 'url', format: 'json', origin: '*',
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`Wikipedia ${response.status}`);
    const payload = await response.json();
    const page = Object.values(payload.query?.pages ?? {}).find((candidate) => candidate.thumbnail?.source);
    const result = page?.thumbnail?.source
      ? { image: page.thumbnail.source, page: page.fullurl }
      : WIKIPEDIA_FALLBACK_ILLUSTRATION;
    wikipediaIllustrationCache.set(query, result);
    return result;
  } catch {
    wikipediaIllustrationCache.set(query, WIKIPEDIA_FALLBACK_ILLUSTRATION);
    return WIKIPEDIA_FALLBACK_ILLUSTRATION;
  }
}

async function completeReactionCandyGame(guild, gameMessage, active) {
  const winningChoice = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
  const voterIds = Object.keys(active.votes ?? {});
  let winners = Object.entries(active.votes ?? {})
    .filter(([, answer]) => active.type === 'yes-no'
      ? answer === active.question.correct
      : (active.type === 'rps'
        ? answer === winningChoice[active.question.botChoice]
        : answer === active.question.winningColor))
    .map(([userId]) => userId);
  let consolation = false;
  if (!winners.length && voterIds.length) {
    winners = [voterIds[Math.floor(Math.random() * voterIds.length)]];
    consolation = true;
  }
  const difficulty = TRIVIA_DIFFICULTIES[active.question.level];
  const rewards = winners.map((userId) => ({
    userId,
    amount: active.type === 'roulette'
      ? active.question.reward
      : Math.floor(Math.random() * (difficulty.max - difficulty.min + 1)) + difficulty.min,
  }));
  if (rewards.length) await awardCandiesBatch(guild, rewards);
  const rpsLabels = { rock: 'Pierre 🪨', paper: 'Feuille 📄', scissors: 'Ciseaux ✂️' };
  const rouletteLabels = { red: 'Rouge 🔴', blue: 'Bleu 🔵', green: 'Vert 🟢' };
  const resultLabel = active.type === 'yes-no'
    ? (active.question.correct ? 'Vrai ✅' : 'Faux ❌')
    : (active.type === 'rps'
      ? `le bot a joué ${rpsLabels[active.question.botChoice]}`
      : `la couleur tirée est ${rouletteLabels[active.question.winningColor]}`);
  if (!voterIds.length) return;
  await gameMessage.reply({
    content: `Résultat : **${resultLabel}**. ${consolation ? 'Tirage de consolation : ' : ''}${winners
      .map((userId) => `<@${userId}>`).join(' ')} remport${winners.length > 1 ? 'ent' : 'e'} des flocons !`,
    allowedMentions: { users: winners },
  });
}

function scheduleTriviaExpiration(guild, channel, active) {
  const previousTimer = triviaExpirationTimers.get(guild.id);
  if (previousTimer) clearTimeout(previousTimer);
  const timer = setTimeout(async () => {
    triviaExpirationTimers.delete(guild.id);
    const guildData = getGuildData(guild.id);
    const state = halloweenTriviaActivity.get(guild.id) ?? {
      count: 0,
      target: randomTriviaThreshold(),
      active: guildData.candyLeaderboard?.activeTrivia ?? null,
    };
    if (!state.active || state.active.startedAt !== active.startedAt) return;
    state.active = null;
    state.count = 0;
    state.target = randomTriviaThreshold();
    halloweenTriviaActivity.set(guild.id, state);
    guildData.candyLeaderboard.activeTrivia = null;
    await saveStore();
    if (active.messageId && 'messages' in channel) {
      const gameMessage = await channel.messages.fetch(active.messageId).catch(() => null);
      if (gameMessage && ['yes-no', 'rps', 'roulette'].includes(active.type)) {
        await completeReactionCandyGame(guild, gameMessage, active).catch(console.error);
      }
      await gameMessage?.reactions.removeAll().catch(() => null);
    }
  }, Math.max(0, active.expiresAt - Date.now()));
  timer.unref();
  triviaExpirationTimers.set(guild.id, timer);
}

async function launchHalloweenQuestion(guild, channel, state) {
  const now = Date.now();
  if (state.active && now <= state.active.expiresAt) return false;
  const guildData = getGuildData(guild.id);
  guildData.candyLeaderboard ??= {};
  const formatRoll = Math.random();
  const type = formatRoll < 0.5
    ? 'text'
    : (formatRoll < 0.8 ? 'yes-no' : (formatRoll < 0.9 ? 'rps' : 'roulette'));
  let question;
  if (type === 'rps') {
    const choices = ['rock', 'paper', 'scissors'];
    question = {
      level: 'medium',
      question: 'Choisis Pierre, Feuille ou Ciseaux !',
      botChoice: choices[Math.floor(Math.random() * choices.length)],
    };
  } else if (type === 'roulette') {
    const colors = ['red', 'blue', 'green'];
    question = {
      level: 'medium',
      question: 'Choisis une couleur : rouge, bleu ou vert.',
      winningColor: colors[Math.floor(Math.random() * colors.length)],
      reward: Math.floor(Math.random() * 5) + 2,
    };
  } else {
    const pool = type === 'yes-no' ? ALL_YES_NO_TRIVIA : HALLOWEEN_TRIVIA;
    const historyKey = type === 'yes-no' ? 'usedYesNoTriviaQuestions' : 'usedTriviaQuestions';
    const lastKey = type === 'yes-no' ? 'lastYesNoTriviaQuestion' : 'lastTriviaQuestion';
    let usedQuestions = new Set(guildData.candyLeaderboard[historyKey] ?? []);
    let availableQuestions = pool.filter((candidate) => !usedQuestions.has(candidate.question));
    if (!availableQuestions.length) {
      return false;
    }
    question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.add(question.question);
    guildData.candyLeaderboard[historyKey] = [...usedQuestions];
    guildData.candyLeaderboard[lastKey] = question.question;
  }
  const difficulty = TRIVIA_DIFFICULTIES[question.level];
  guildData.candyLeaderboard.lastTriviaAt = now;
  state.count = 0;
  state.active = {
    type,
    question,
    votes: {},
    startedAt: now,
    expiresAt: now + TRIVIA_EXPIRATION_MS,
  };
  halloweenTriviaActivity.set(guild.id, state);
  guildData.candyLeaderboard.activeTrivia = state.active;
  await saveStore();
  try {
    const illustration = ['text', 'yes-no'].includes(type) ? await wikipediaIllustration(question) : null;
    const gameAttachment = type === 'rps'
      ? { attachment: CANDY_RPS_GIF, name: 'pierre-feuille-ciseaux.gif' }
      : (type === 'roulette' ? { attachment: CANDY_ROULETTE_GIF, name: 'roulette-flocons.gif' } : null);
    const embed = new EmbedBuilder()
      .setColor(difficulty.color)
      .setTitle(type === 'yes-no'
        ? `Vrai ou faux · ${difficulty.label}`
        : (type === 'rps'
          ? 'Pierre · Feuille · Ciseaux'
          : (type === 'roulette' ? 'Roulette des flocons' : `Quiz · ${difficulty.label}`)))
      .setDescription(question.question)
      .addFields({
        name: 'Récompense',
        value: type === 'yes-no'
          ? `${difficulty.min} à ${difficulty.max} flocons pour chaque bonne réponse`
          : (type === 'rps'
            ? `${difficulty.min} à ${difficulty.max} flocons si tu bats le bot`
            : (type === 'roulette'
              ? `**${question.reward} flocons** si ta couleur est tirée`
              : `${difficulty.min} à ${difficulty.max} flocons · jusqu’à +2 pour la rapidité`)),
      })
      .setFooter({ text: type === 'yes-no'
        ? '✅ Vrai · ❌ Faux · cinq premières réponses · expiration dans 1 minute · illustration Wikipédia'
        : (type === 'rps'
          ? '🪨 Pierre · 📄 Feuille · ✂️ Ciseaux · cinq réponses · expiration dans 1 minute'
          : (type === 'roulette'
            ? '🔴 Rouge · 🔵 Bleu · 🟢 Vert · cinq réponses · expiration dans 1 minute'
            : 'Première bonne réponse uniquement · expiration dans 1 minute · illustration Wikipédia')) });
    if (illustration) embed.setImage(illustration.image).setURL(illustration.page);
    if (gameAttachment) embed.setImage(`attachment://${gameAttachment.name}`);
    const sentMessage = await channel.send({
      embeds: [embed],
      files: gameAttachment ? [gameAttachment] : [],
    });
    state.active.messageId = sentMessage.id;
    guildData.candyLeaderboard.activeTrivia = state.active;
    if (type !== 'text') {
      const reactions = type === 'yes-no'
        ? ['✅', '❌']
        : (type === 'rps' ? ['🪨', '📄', '✂️'] : ['🔴', '🔵', '🟢']);
      for (const emoji of reactions) await sentMessage.react(emoji);
    }
    await saveStore();
    scheduleTriviaExpiration(guild, channel, state.active);
  } catch (error) {
    state.active = null;
    guildData.candyLeaderboard.activeTrivia = null;
    await saveStore();
    throw error;
  }
  return true;
}

async function handleHiddenQuizCommand(message) {
  if (!message.inGuild()
    || message.author.bot
    || message.content.trim().toLowerCase() !== '+quiz') return false;

  badwordDeletedMessageIds.add(message.id);
  await message.delete().catch(() => badwordDeletedMessageIds.delete(message.id));
  const guildData = getGuildData(message.guild.id);
  if (!guildData.quizWhitelist.includes(message.author.id)) {
    await message.author.send('Tu dois être ajouté avec `=wlquiz @membre` pour utiliser `+quiz`.').catch(() => null);
    return true;
  }
  if (!CANDY_GAMES_ENABLED) {
    await message.author.send('Les quiz et jeux de flocons sont temporairement désactivés.').catch(() => null);
    return true;
  }
  const channel = await message.guild.channels.fetch(HALLOWEEN_CANDY_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('send' in channel)) {
    await message.author.send('Le salon des quiz Halloween est introuvable.').catch(() => null);
    return true;
  }
  const state = halloweenTriviaActivity.get(message.guild.id) ?? {
    count: 0,
    target: randomTriviaThreshold(),
    active: guildData.candyLeaderboard?.activeTrivia ?? null,
  };
  const launched = await launchHalloweenQuestion(message.guild, channel, state);
  if (!launched) {
    await message.author.send('Un quiz Halloween est déjà en cours.').catch(() => null);
  }
  return true;
}

function loveCompatibility(firstId, secondId) {
  if (firstId === secondId) return 100;
  const pair = [firstId, secondId].sort().join(':');
  let hash = 2166136261;
  for (const character of pair) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 101;
}

async function handleCandyLoveCommand(message) {
  if (!message.inGuild() || message.author.bot || !/^\^{1,2}lc(?:\s|$)/i.test(message.content.trim())) return false;
  if (message.channelId !== CANDY_SOCIAL_CHANNEL_ID) return true;
  await message.guild.members.fetch().catch(() => null);
  const members = message.guild.members.cache.filter((member) => !member.user.bot);
  const mentioned = [...message.mentions.members.values()].filter((member) => !member.user.bot);
  let first;
  let second;
  if (/^\^{1,2}lc\s+random\b/i.test(message.content.trim())) {
    const candidates = [...members.values()];
    if (candidates.length < 2) {
      await message.reply({ content: 'Il faut au moins deux membres pour calculer une compatibilité.', allowedMentions: { repliedUser: false } });
      return true;
    }
    first = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
    second = candidates[Math.floor(Math.random() * candidates.length)];
  } else if (mentioned.length >= 2) {
    [first, second] = mentioned;
  } else if (mentioned.length === 1) {
    first = message.member;
    [second] = mentioned;
  } else {
    const candidates = [...members.values()].filter((member) => member.id !== message.author.id);
    first = message.member;
    second = candidates[Math.floor(Math.random() * candidates.length)];
  }
  if (!first || !second) {
    await message.reply({ content: 'Je n’ai pas trouvé assez de membres.', allowedMentions: { repliedUser: false } });
    return true;
  }
  const percentage = loveCompatibility(first.id, second.id);
  const image = await renderLoveCompatibilityImage(first.user, second.user, percentage);
  await message.reply({
    content: `${first} + ${second} = **${percentage}% de compatibilité** 💖`,
    files: [{ attachment: image, name: 'compatibilite-love.png' }],
    allowedMentions: { users: [first.id, second.id], repliedUser: false },
  });
  return true;
}

async function handleCandyKissCommand(message) {
  if (!message.inGuild() || message.author.bot || !/^\^{1,2}kiss(?:\s|$)/i.test(message.content.trim())) return false;
  if (message.channelId !== CANDY_SOCIAL_CHANNEL_ID) return true;
  await message.guild.members.fetch().catch(() => null);
  const candidates = [...message.guild.members.cache.values()]
    .filter((member) => !member.user.bot && member.id !== message.author.id);
  const mentioned = [...message.mentions.members.values()]
    .find((member) => !member.user.bot && member.id !== message.author.id);
  const target = mentioned ?? candidates[Math.floor(Math.random() * candidates.length)];
  if (!target) {
    await message.reply({ content: 'Je n’ai trouvé personne à embrasser.', allowedMentions: { repliedUser: false } });
    return true;
  }
  const sender = message.member;
  const image = await renderCandyKissImage(sender.user, target.user);
  await message.reply({
    content: `💋 ${sender} fait un bisou à ${target} !`,
    files: [{ attachment: image, name: 'bisou.png' }],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`candy:kissback:${sender.id}:${target.id}`)
        .setLabel('Rendre le bisou')
        .setEmoji('💋')
        .setStyle(ButtonStyle.Secondary),
    )],
    allowedMentions: { users: [sender.id, target.id], repliedUser: false },
  });
  return true;
}

async function handleCandyKissButton(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('candy:kissback:')) return false;
  const [, , senderId, targetId] = interaction.customId.split(':');
  if (interaction.user.id !== targetId) {
    await interaction.reply({ content: 'Seule la personne embrassée peut rendre ce bisou.', flags: MessageFlags.Ephemeral });
    return true;
  }
  const [sender, target] = await Promise.all([
    interaction.guild.members.fetch(senderId).catch(() => null),
    interaction.guild.members.fetch(targetId).catch(() => null),
  ]);
  if (!sender || !target) {
    await interaction.reply({ content: 'Un des deux membres est introuvable.', flags: MessageFlags.Ephemeral });
    return true;
  }
  await interaction.update({
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(interaction.customId)
        .setLabel('Bisou rendu')
        .setEmoji('💞')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    )],
  });
  const image = await renderCandyKissImage(target.user, sender.user);
  await interaction.followUp({
    content: `💞 ${target} rend son bisou à ${sender} !`,
    files: [{ attachment: image, name: 'bisou-retour.png' }],
    allowedMentions: { users: [sender.id, target.id] },
  });
  return true;
}

function candyFamilyData(guildId) {
  const guildData = getGuildData(guildId);
  guildData.candyFamilies ??= {};
  guildData.candyFamilies.parents ??= {};
  guildData.candyFamilies.siblings ??= {};
  return guildData.candyFamilies;
}

function familyChildren(family, parentId) {
  return Object.entries(family.parents)
    .filter(([, storedParentId]) => storedParentId === parentId)
    .map(([childId]) => childId);
}

function isFamilyAncestor(family, ancestorId, userId) {
  const visited = new Set();
  let current = family.parents[userId];
  while (current && !visited.has(current)) {
    if (current === ancestorId) return true;
    visited.add(current);
    current = family.parents[current];
  }
  return false;
}

function familyEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xEB459E)
    .setTitle(`👪 ${title}`)
    .setDescription(description)
    .setFooter({ text: 'PVCool · Famille' })
    .setTimestamp();
}

async function handleCandyFamilyCommand(message) {
  if (!message.inGuild() || message.author.bot || !/^\^\^family(?:\s|$)/i.test(message.content.trim())) return false;
  if (message.channelId !== CANDY_SOCIAL_CHANNEL_ID) return true;
  const [, rawSubcommand = 'manage'] = message.content.trim().split(/\s+/);
  const subcommand = rawSubcommand.toLowerCase();
  const family = candyFamilyData(message.guild.id);
  const mentioned = [...message.mentions.members.values()].filter((member) => !member.user.bot);
  const target = mentioned[0] ?? message.member;
  const show = (embed, components = []) => message.reply({
    embeds: [embed],
    components,
    allowedMentions: { users: mentioned.map((member) => member.id), repliedUser: false },
  });

  if (['manage', 'help', 'aide'].includes(subcommand)) {
    return show(familyEmbed('Commandes famille', [
      '`^^family adopt @membre` — proposer une adoption',
      '`^^family disown @enfant` — renier un enfant',
      '`^^family runaway` — quitter son parent',
      '`^^family children [@membre]` — voir les enfants',
      '`^^family parent [@membre]` — voir le parent',
      '`^^family tree [@membre]` — afficher l’arbre familial',
      '`^^family sibling @membre` — proposer un lien fraternel',
      '`^^family unsibling @membre` — rompre un lien fraternel',
      '`^^family siblings [@membre]` — voir la fratrie',
      '`^^family relationship @membre1 @membre2` — consulter leur lien',
    ].join('\n'))).then(() => true);
  }

  if (subcommand === 'adopt') {
    if (!mentioned[0] || mentioned[0].id === message.author.id) {
      await show(familyEmbed('Adoption impossible', 'Mentionne une autre personne à adopter.'));
      return true;
    }
    if (family.parents[mentioned[0].id]) {
      await show(familyEmbed('Adoption impossible', `${mentioned[0]} possède déjà un parent.`));
      return true;
    }
    if (isFamilyAncestor(family, mentioned[0].id, message.author.id)) {
      await show(familyEmbed('Adoption impossible', 'Cette adoption créerait une boucle dans l’arbre familial.'));
      return true;
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`candy:family:adopt:yes:${message.author.id}:${mentioned[0].id}`).setLabel('Accepter').setEmoji('👶').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`candy:family:adopt:no:${message.author.id}:${mentioned[0].id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
    );
    await show(familyEmbed('Demande d’adoption', `${message.member} souhaite adopter ${mentioned[0]}.\nSeule la personne concernée peut répondre.`), [row]);
    return true;
  }

  if (subcommand === 'sibling') {
    if (!mentioned[0] || mentioned[0].id === message.author.id) {
      await show(familyEmbed('Demande impossible', 'Mentionne la personne avec qui créer un lien fraternel.'));
      return true;
    }
    if (family.siblings[message.author.id]?.includes(mentioned[0].id)) {
      await show(familyEmbed('Lien existant', `Tu es déjà dans la même fratrie que ${mentioned[0]}.`));
      return true;
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`candy:family:sibling:yes:${message.author.id}:${mentioned[0].id}`).setLabel('Accepter').setEmoji('🤝').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`candy:family:sibling:no:${message.author.id}:${mentioned[0].id}`).setLabel('Refuser').setStyle(ButtonStyle.Danger),
    );
    await show(familyEmbed('Demande de fraternité', `${message.member} propose à ${mentioned[0]} de rejoindre sa fratrie.`), [row]);
    return true;
  }

  if (subcommand === 'disown') {
    const child = mentioned[0];
    if (!child || family.parents[child.id] !== message.author.id) {
      await show(familyEmbed('Action impossible', 'Cette personne n’est pas ton enfant.'));
      return true;
    }
    delete family.parents[child.id];
    await saveStore();
    await show(familyEmbed('Enfant renié', `${message.member} a renié ${child}.`));
    return true;
  }

  if (subcommand === 'runaway') {
    const parentId = family.parents[message.author.id];
    if (!parentId) {
      await show(familyEmbed('Aucun parent', 'Tu n’as actuellement aucun parent à quitter.'));
      return true;
    }
    delete family.parents[message.author.id];
    await saveStore();
    await show(familyEmbed('Fugue', `${message.member} a quitté <@${parentId}>.`));
    return true;
  }

  if (subcommand === 'unsibling') {
    const sibling = mentioned[0];
    if (!sibling || !family.siblings[message.author.id]?.includes(sibling.id)) {
      await show(familyEmbed('Action impossible', 'Aucun lien fraternel n’existe avec cette personne.'));
      return true;
    }
    family.siblings[message.author.id] = family.siblings[message.author.id].filter((id) => id !== sibling.id);
    family.siblings[sibling.id] = (family.siblings[sibling.id] ?? []).filter((id) => id !== message.author.id);
    await saveStore();
    await show(familyEmbed('Lien rompu', `${message.member} et ${sibling} ne font plus partie de la même fratrie.`));
    return true;
  }

  if (subcommand === 'children') {
    const children = familyChildren(family, target.id);
    await show(familyEmbed(`Enfants de ${target.displayName}`, children.length ? children.map((id) => `<@${id}>`).join('\n') : 'Aucun enfant enregistré.'));
    return true;
  }
  if (subcommand === 'parent') {
    const parentId = family.parents[target.id];
    await show(familyEmbed(`Parent de ${target.displayName}`, parentId ? `<@${parentId}>` : 'Aucun parent enregistré.'));
    return true;
  }
  if (subcommand === 'siblings') {
    const siblings = family.siblings[target.id] ?? [];
    await show(familyEmbed(`Fratrie de ${target.displayName}`, siblings.length ? siblings.map((id) => `<@${id}>`).join('\n') : 'Aucun frère ou sœur enregistré.'));
    return true;
  }
  if (subcommand === 'relationship') {
    const [first, second] = mentioned;
    if (!first || !second) {
      await show(familyEmbed('Relation', 'Mentionne deux membres à comparer.'));
      return true;
    }
    let relationship = 'Aucun lien familial direct.';
    if (family.parents[second.id] === first.id) relationship = `${first} est le parent de ${second}.`;
    else if (family.parents[first.id] === second.id) relationship = `${second} est le parent de ${first}.`;
    else if (family.siblings[first.id]?.includes(second.id)) relationship = `${first} et ${second} font partie de la même fratrie.`;
    else if (isFamilyAncestor(family, first.id, second.id)) relationship = `${first} est un ancêtre de ${second}.`;
    else if (isFamilyAncestor(family, second.id, first.id)) relationship = `${second} est un ancêtre de ${first}.`;
    await show(familyEmbed('Relation familiale', relationship));
    return true;
  }
  if (subcommand === 'tree') {
    const image = await renderFamilyTreeImage(message.guild, target.id, family);
    await message.reply({
      files: [{ attachment: image, name: 'arbre-familial.png' }],
      allowedMentions: { repliedUser: false },
    });
    return true;
  }

  await show(familyEmbed('Commande inconnue', 'Utilise `^^family manage` pour afficher toutes les commandes.'));
  return true;
}

async function handleCandyFamilyButton(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('candy:family:')) return false;
  const [, , kind, decision, requesterId, targetId] = interaction.customId.split(':');
  if (interaction.user.id !== targetId) {
    await interaction.reply({ content: 'Seule la personne concernée peut répondre.', flags: MessageFlags.Ephemeral });
    return true;
  }
  const family = candyFamilyData(interaction.guildId);
  if (decision === 'no') {
    await interaction.update({ embeds: [familyEmbed('Demande refusée', `<@${targetId}> a refusé la demande de <@${requesterId}>.`)], components: [] });
    return true;
  }
  if (kind === 'adopt') {
    if (family.parents[targetId] || isFamilyAncestor(family, targetId, requesterId)) {
      await interaction.update({ embeds: [familyEmbed('Adoption impossible', 'La situation familiale a changé depuis la demande.')], components: [] });
      return true;
    }
    family.parents[targetId] = requesterId;
    await saveStore();
    await interaction.update({ embeds: [familyEmbed('Adoption acceptée', `<@${requesterId}> est maintenant le parent de <@${targetId}>.`)], components: [] });
    return true;
  }
  if (kind === 'sibling') {
    family.siblings[requesterId] = [...new Set([...(family.siblings[requesterId] ?? []), targetId])];
    family.siblings[targetId] = [...new Set([...(family.siblings[targetId] ?? []), requesterId])];
    await saveStore();
    await interaction.update({ embeds: [familyEmbed('Fraternité acceptée', `<@${requesterId}> et <@${targetId}> font maintenant partie de la même fratrie.`)], components: [] });
    return true;
  }
  return false;
}

async function handleCandyProfileButton(interaction) {
  const isProfileSelect = interaction.isStringSelectMenu()
    && ['candy:background', 'candy:character'].includes(interaction.customId);
  if (!interaction.isButton() && !isProfileSelect) return false;
  const isPurchase = interaction.customId.startsWith('candy:buy:');
  const isShopNavigation = interaction.customId.startsWith('candy:shop:prev:')
    || interaction.customId.startsWith('candy:shop:next:');
  const isBuildingPurchase = interaction.customId.startsWith('candy:building:buy:');
  const isBuildingPurchaseConfirm = interaction.customId.startsWith('candy:building:confirm:');
  const isBuildingPurchaseCancel = interaction.customId === 'candy:building:cancel';
  const isRentClaim = interaction.customId === 'candy:building:claim';
  if (![CANDY_PROFILE_BUTTON_ID, CANDY_SHOP_BUTTON_ID, CANDY_BUILDINGS_BUTTON_ID].includes(interaction.customId)
    && !isPurchase
    && !isShopNavigation
    && !isBuildingPurchase
    && !isBuildingPurchaseConfirm
    && !isBuildingPurchaseCancel
    && !isRentClaim
    && !isProfileSelect) return false;
  const guildData = getGuildData(interaction.guildId);
  guildData.candyLeaderboard ??= {};
  const candy = guildData.candyLeaderboard;
  candy.counts ??= {};
  candy.nextGainMultipliers ??= {};
  candy.profileBadges ??= {};
  candy.profileBackgrounds ??= {};
  candy.profileCharacters ??= {};
  candy.buildings ??= {};

  const profileComponents = () => [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('candy:background')
        .setPlaceholder('Choisir mon fond')
        .addOptions(
          { label: 'Coucher sucré', value: 'sunset', emoji: '🌅', default: (candy.profileBackgrounds[interaction.user.id] ?? 'sunset') === 'sunset' },
          { label: 'Nuit étoilée', value: 'night', emoji: '🌙', default: candy.profileBackgrounds[interaction.user.id] === 'night' },
          { label: 'Hiver givré', value: 'winter', emoji: '❄️', default: candy.profileBackgrounds[interaction.user.id] === 'winter' },
        ),
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('candy:character')
        .setPlaceholder('Choisir mon personnage')
        .addOptions(
          { label: 'Fille', value: 'clara', emoji: '🧡', default: ['clara', 'ghost'].includes(candy.profileCharacters[interaction.user.id]) },
          { label: 'Scaphandrier', value: 'boris', emoji: '🤿', default: candy.profileCharacters[interaction.user.id] === 'boris' },
          { label: 'Agent', value: 'alfred', emoji: '🕶️', default: ['alfred', 'snowman'].includes(candy.profileCharacters[interaction.user.id]) },
          { label: 'Pirate', value: 'ruby', emoji: '🏴‍☠️', default: candy.profileCharacters[interaction.user.id] === 'ruby' },
          { label: 'Héros', value: 'leo', emoji: '🦸', default: ['leo', 'candy', undefined].includes(candy.profileCharacters[interaction.user.id]) },
          { label: 'Gobelin', value: 'goblin', emoji: '⚔️', default: candy.profileCharacters[interaction.user.id] === 'goblin' },
          { label: 'Chevalier', value: 'knight', emoji: '🛡️', default: candy.profileCharacters[interaction.user.id] === 'knight' },
          { label: 'Combattant', value: 'fighter', emoji: '🥋', default: candy.profileCharacters[interaction.user.id] === 'fighter' },
          { label: 'Capitaine', value: 'captain', emoji: '🏴‍☠️', default: candy.profileCharacters[interaction.user.id] === 'captain' },
          { label: 'Mage', value: 'mage', emoji: '🧙', default: candy.profileCharacters[interaction.user.id] === 'mage' },
          { label: 'Aventurière', value: 'adventurer', emoji: '🪓', default: candy.profileCharacters[interaction.user.id] === 'adventurer' },
          { label: 'Inventeur', value: 'inventor', emoji: '🥽', default: candy.profileCharacters[interaction.user.id] === 'inventor' },
        ),
    ),
  ];

  const profilePayload = async () => ({
    files: [{ attachment: await renderCandyProfileImage(interaction.guild, interaction.user, candy), name: 'profil-flocons.png' }],
    components: profileComponents(),
  });

  const shopPayload = async (itemId) => {
    const selectedId = CANDY_SHOP_ITEMS[itemId] ? itemId : CANDY_SHOP_ITEM_IDS[0];
    const index = CANDY_SHOP_ITEM_IDS.indexOf(selectedId);
    const previousId = CANDY_SHOP_ITEM_IDS[(index - 1 + CANDY_SHOP_ITEM_IDS.length) % CANDY_SHOP_ITEM_IDS.length];
    const nextId = CANDY_SHOP_ITEM_IDS[(index + 1) % CANDY_SHOP_ITEM_IDS.length];
    const item = CANDY_SHOP_ITEMS[selectedId];
    const balance = candy.counts[interaction.user.id] ?? 0;
    const background = candy.profileBackgrounds[interaction.user.id] ?? 'sunset';
    return {
      files: [{
        attachment: await renderCandyShopItemImage(interaction.guild, item, background, balance, index + 1, CANDY_SHOP_ITEM_IDS.length),
        name: 'boutique-flocons.png',
      }],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`candy:shop:prev:${previousId}`).setEmoji('◀️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`candy:buy:${selectedId}`).setLabel(`Acheter · ${item.price}`).setEmoji('❄️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`candy:shop:next:${nextId}`).setEmoji('▶️').setStyle(ButtonStyle.Secondary),
      )],
    };
  };

  const buildingsPayload = async (notice = null) => {
    const portfolio = candy.buildings[interaction.user.id] ?? { owned: [], lastRentAt: null };
    const owned = new Set(portfolio.owned ?? []);
    const dailyRent = [...owned].reduce((total, buildingId) => (
      total + (CANDY_BUILDINGS[buildingId]?.rent ?? 0)
    ), 0);
    const balance = candy.counts[interaction.user.id] ?? 0;
    const nextRentAt = portfolio.lastRentAt
      ? portfolio.lastRentAt + CANDY_RENT_INTERVAL_MS
      : null;
    const rentStatus = !owned.size
      ? 'Achète un premier bâtiment pour commencer.'
      : (Date.now() >= nextRentAt
        ? `${dailyRent} flocons sont disponibles maintenant.`
        : `Prochain loyer dans ${Math.floor((nextRentAt - Date.now()) / 3_600_000)} h ${Math.ceil(((nextRentAt - Date.now()) % 3_600_000) / 60_000)} min.`);
    const buyButtons = Object.entries(CANDY_BUILDINGS).map(([id, building]) => (
      new ButtonBuilder()
        .setCustomId(`candy:building:buy:${id}`)
        .setLabel(building.label)
        .setEmoji(building.emoji)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(owned.has(id))
    ));
    return {
      files: [{
        attachment: await renderCandyBuildingsImage(interaction.guild, {
          balance,
          buildings: CANDY_BUILDINGS,
          ownedIds: [...owned],
          dailyRent,
          rentStatus,
          notice,
          background: candy.profileBackgrounds[interaction.user.id] ?? 'sunset',
        }),
        name: 'patrimoine-immobilier.png',
      }],
      components: [
        new ActionRowBuilder().addComponents(...buyButtons),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('candy:building:claim')
            .setLabel('Récupérer le loyer')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!owned.size),
        ),
      ],
    };
  };

  if (isProfileSelect) {
    if (interaction.customId === 'candy:background') candy.profileBackgrounds[interaction.user.id] = interaction.values[0];
    if (interaction.customId === 'candy:character') candy.profileCharacters[interaction.user.id] = interaction.values[0];
    await saveStore();
    await interaction.update({ ...(await profilePayload()), attachments: [] });
    return true;
  }

  if (interaction.customId === CANDY_SHOP_BUTTON_ID) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      ...(await shopPayload(CANDY_SHOP_ITEM_IDS[0])),
    });
    return true;
  }

  if (interaction.customId === CANDY_BUILDINGS_BUTTON_ID) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      ...(await buildingsPayload()),
    });
    return true;
  }

  if (isBuildingPurchase) {
    const buildingId = interaction.customId.slice('candy:building:buy:'.length);
    const building = CANDY_BUILDINGS[buildingId];
    if (!building) return false;
    const portfolio = candy.buildings[interaction.user.id] ?? { owned: [], lastRentAt: null };
    portfolio.owned ??= [];
    if (portfolio.owned.includes(buildingId)) {
      await interaction.update({ ...(await buildingsPayload(`${building.emoji} Tu possèdes déjà ce bâtiment.`)), attachments: [] });
      return true;
    }
    const balance = candy.counts[interaction.user.id] ?? 0;
    if (balance < building.price) {
      await interaction.reply({
        content: `❌ Tu n’as pas assez de flocons pour acheter **${building.label}**.\nPrix : **${building.price}** · Ton solde : **${balance}** · Il te manque : **${building.price - balance}** ❄️`,
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }
    const confirmation = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle(`${building.emoji} Confirmer l’achat`)
      .setDescription(`Veux-tu vraiment acheter **${building.label}** ?`)
      .addFields(
        { name: 'Prix', value: `❄️ **${building.price} flocons**`, inline: true },
        { name: 'Loyer quotidien', value: `💰 **${building.rent} flocons**`, inline: true },
        { name: 'Après l’achat', value: `Il te restera **${balance - building.price} flocons**.`, inline: false },
        { name: 'Malus possibles au retrait', value: 'Entretien −15 % · taxe −25 % · vacance −40 %', inline: false },
      )
      .setFooter({ text: 'Aucun flocon ne sera retiré avant ta confirmation.' });
    await interaction.update({
      embeds: [confirmation],
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`candy:building:confirm:${buildingId}`)
          .setLabel(`Confirmer · ${building.price}`)
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('candy:building:cancel')
          .setLabel('Annuler')
          .setEmoji('✖️')
          .setStyle(ButtonStyle.Secondary),
      )],
      attachments: [],
    });
    return true;
  }

  if (isBuildingPurchaseCancel) {
    await interaction.update({ ...(await buildingsPayload('Achat annulé, aucun flocon retiré.')), embeds: [], attachments: [] });
    return true;
  }

  if (isBuildingPurchaseConfirm) {
    const buildingId = interaction.customId.slice('candy:building:confirm:'.length);
    const building = CANDY_BUILDINGS[buildingId];
    if (!building) return false;
    const portfolio = candy.buildings[interaction.user.id] ?? { owned: [], lastRentAt: null };
    portfolio.owned ??= [];
    if (portfolio.owned.includes(buildingId)) {
      await interaction.update({ ...(await buildingsPayload(`${building.emoji} Tu possèdes déjà ce bâtiment.`)), embeds: [], attachments: [] });
      return true;
    }
    const balance = candy.counts[interaction.user.id] ?? 0;
    if (balance < building.price) {
      await interaction.update({ ...(await buildingsPayload(`Ton solde a changé : il te manque ${building.price - balance} flocons.`)), embeds: [], attachments: [] });
      return true;
    }
    candy.counts[interaction.user.id] = balance - building.price;
    portfolio.owned.push(buildingId);
    portfolio.lastRentAt ??= Date.now();
    candy.buildings[interaction.user.id] = portfolio;
    await saveStore();
    await interaction.update({ ...(await buildingsPayload(`${building.emoji} ${building.label} acheté pour ${building.price} flocons.`)), embeds: [], attachments: [] });
    return true;
  }

  if (isRentClaim) {
    const portfolio = candy.buildings[interaction.user.id] ?? { owned: [], lastRentAt: null };
    const owned = new Set(portfolio.owned ?? []);
    if (!owned.size) {
      await interaction.update({ ...(await buildingsPayload('Tu ne possèdes encore aucun bâtiment.')), attachments: [] });
      return true;
    }
    const nextRentAt = (portfolio.lastRentAt ?? Date.now()) + CANDY_RENT_INTERVAL_MS;
    if (Date.now() < nextRentAt) {
      const remainingMs = nextRentAt - Date.now();
      const remainingTotalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
      const remainingHours = Math.floor(remainingTotalMinutes / 60);
      const remainingMinutes = remainingTotalMinutes % 60;
      await interaction.update({
        ...(await buildingsPayload(`Loyer déjà récupéré · prochain retrait dans ${remainingHours} h ${remainingMinutes} min.`)),
        attachments: [],
      });
      return true;
    }
    const rent = [...owned].reduce((total, buildingId) => (
      total + (CANDY_BUILDINGS[buildingId]?.rent ?? 0)
    ), 0);
    const roll = Math.random();
    const malus = CANDY_RENT_MALUSES.find((entry) => roll < entry.threshold) ?? null;
    const penalty = malus ? Math.max(1, Math.floor(rent * malus.rate)) : 0;
    const netRent = Math.max(0, rent - penalty);
    candy.counts[interaction.user.id] = (candy.counts[interaction.user.id] ?? 0) + netRent;
    portfolio.lastRentAt = Date.now();
    portfolio.lastRentResult = { gross: rent, penalty, net: netRent, label: malus?.label ?? null, claimedAt: Date.now() };
    candy.buildings[interaction.user.id] = portfolio;
    await saveStore();
    const resultNotice = malus
      ? `Loyer : +${netRent} flocons après ${malus.label.toLowerCase()} (-${penalty}).`
      : `Loyer récupéré : +${netRent} flocons, aucun malus aujourd’hui.`;
    await interaction.update({ ...(await buildingsPayload(resultNotice)), attachments: [] });
    return true;
  }

  if (isShopNavigation) {
    const itemId = interaction.customId.split(':').at(-1);
    await interaction.update({ ...(await shopPayload(itemId)), attachments: [] });
    return true;
  }

  if (isPurchase) {
    const itemId = interaction.customId.slice('candy:buy:'.length);
    const item = CANDY_SHOP_ITEMS[itemId];
    if (!item) return false;
    const balance = candy.counts[interaction.user.id] ?? 0;
    if (item.badge && candy.profileBadges[interaction.user.id] === item.badge) {
      await interaction.reply({ content: 'Tu possèdes déjà ce badge.', flags: MessageFlags.Ephemeral });
      return true;
    }
    const currentMultiplier = candy.nextGainMultipliers[interaction.user.id] ?? 1;
    if (item.multiplier && currentMultiplier >= item.multiplier) {
      await interaction.reply({
        content: `Ton prochain gain possède déjà un bonus ×${currentMultiplier}, égal ou supérieur.`,
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }
    if (balance < item.price) {
      await interaction.reply({
        content: `Il te manque **${item.price - balance} flocon${item.price - balance > 1 ? 's' : ''}** pour cet achat.`,
        flags: MessageFlags.Ephemeral,
      });
      return true;
    }
    candy.counts[interaction.user.id] = balance - item.price;
    if (item.multiplier) candy.nextGainMultipliers[interaction.user.id] = item.multiplier;
    if (item.badge) candy.profileBadges[interaction.user.id] = item.badge;
    await saveStore();
    await interaction.reply({
      content: `${item.emoji} **${item.label}** acheté ! Nouveau solde : **${candy.counts[interaction.user.id]} ❄️**.`,
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    ...(await profilePayload()),
  });
  return true;
}

async function handleTriviaPollReaction(reaction, user) {
  if (!CANDY_GAMES_ENABLED) return false;
  if (user.bot) return false;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
  const message = reaction.message;
  if (!message.guild
    || message.channelId !== HALLOWEEN_CANDY_CHANNEL_ID
    || !['✅', '❌', '🪨', '📄', '✂️', '🔴', '🔵', '🟢'].includes(reaction.emoji.name)) return false;

  const guildData = getGuildData(message.guild.id);
  const state = halloweenTriviaActivity.get(message.guild.id) ?? {
    count: 0,
    target: randomTriviaThreshold(),
    active: guildData.candyLeaderboard?.activeTrivia ?? null,
  };
  const active = state.active;
  if (!['yes-no', 'rps', 'roulette'].includes(active?.type) || active.messageId !== message.id) return false;
  const allowedReactions = active.type === 'yes-no'
    ? ['✅', '❌']
    : (active.type === 'rps' ? ['🪨', '📄', '✂️'] : ['🔴', '🔵', '🟢']);
  if (!allowedReactions.includes(reaction.emoji.name)) return false;
  active.votes ??= {};
  if (active.votes[user.id] !== undefined || Object.keys(active.votes).length >= 5) {
    await reaction.users.remove(user.id).catch(() => null);
    return true;
  }

  const rpsChoices = { '🪨': 'rock', '📄': 'paper', '✂️': 'scissors' };
  const rouletteChoices = { '🔴': 'red', '🔵': 'blue', '🟢': 'green' };
  active.votes[user.id] = active.type === 'yes-no'
    ? reaction.emoji.name === '✅'
    : (active.type === 'rps' ? rpsChoices[reaction.emoji.name] : rouletteChoices[reaction.emoji.name]);
  halloweenTriviaActivity.set(message.guild.id, state);
  guildData.candyLeaderboard.activeTrivia = active;
  if (Object.keys(active.votes).length < 5) {
    await saveStore();
    return true;
  }

  state.active = null;
  state.count = 0;
  state.target = randomTriviaThreshold();
  guildData.candyLeaderboard.activeTrivia = null;
  halloweenTriviaActivity.set(message.guild.id, state);
  await saveStore();

  await completeReactionCandyGame(message.guild, message, active);
  return true;
}

async function handleHalloweenTrivia(message) {
  if (!CANDY_GAMES_ENABLED) return;
  if (!message.inGuild()
    || message.author.bot
    || message.channelId !== HALLOWEEN_CANDY_CHANNEL_ID
    || /^[+=]/.test(message.content.trim())) return;

  const now = Date.now();
  const state = halloweenTriviaActivity.get(message.guild.id) ?? {
    count: 0,
    target: randomTriviaThreshold(),
    active: getGuildData(message.guild.id).candyLeaderboard?.activeTrivia ?? null,
  };

  if (state.active && now > state.active.expiresAt) {
    state.active = null;
    state.count = 0;
    state.target = randomTriviaThreshold();
    const guildData = getGuildData(message.guild.id);
    guildData.candyLeaderboard.activeTrivia = null;
    await saveStore();
  }

  if (state.active) {
    if (['yes-no', 'rps', 'roulette'].includes(state.active.type)) {
      halloweenTriviaActivity.set(message.guild.id, state);
      return;
    }
    const answer = normalizeTriviaAnswer(message.content);
    const isCorrect = state.active.question.answers
      .some((candidate) => normalizeTriviaAnswer(candidate) === answer);
    if (!isCorrect) {
      halloweenTriviaActivity.set(message.guild.id, state);
      return;
    }

    const activeQuestion = state.active;
    state.active = null;
    state.count = 0;
    state.target = randomTriviaThreshold();
    halloweenTriviaActivity.set(message.guild.id, state);
    const guildData = getGuildData(message.guild.id);
    guildData.candyLeaderboard.activeTrivia = null;
    await saveStore();

    const difficulty = TRIVIA_DIFFICULTIES[activeQuestion.question.level];
    const baseReward = Math.floor(Math.random() * (difficulty.max - difficulty.min + 1)) + difficulty.min;
    const elapsed = now - activeQuestion.startedAt;
    const speedBonus = elapsed <= 10_000 ? 2 : (elapsed <= 30_000 ? 1 : 0);
    const reward = baseReward + speedBonus;
    await message.react('✅').catch(() => null);
    const total = await awardCandies(message.guild, message.author.id, reward);
    await message.reply({
      content: `Bien joué ${message.author} ! **+${reward} flocon${reward > 1 ? 's' : ''}** (${difficulty.label.toLowerCase()}${speedBonus ? ` + bonus rapidité de ${speedBonus}` : ''}). Tu en possèdes maintenant **${total}**.`,
      allowedMentions: { users: [message.author.id] },
    });
    return;
  }

  state.count += 1;
  if (state.count < state.target) {
    halloweenTriviaActivity.set(message.guild.id, state);
    return;
  }

  const lastTriviaAt = getGuildData(message.guild.id).candyLeaderboard?.lastTriviaAt ?? 0;
  if (now - lastTriviaAt < TRIVIA_AUTO_COOLDOWN_MS) {
    halloweenTriviaActivity.set(message.guild.id, state);
    return;
  }

  await launchHalloweenQuestion(message.guild, message.channel, state);
}

function voiceCandyTimerKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function randomVoiceCandyDelay() {
  return Math.floor(Math.random() * (VOICE_CANDY_MAX_DELAY_MS - VOICE_CANDY_MIN_DELAY_MS + 1))
    + VOICE_CANDY_MIN_DELAY_MS;
}

function scheduleVoiceCandyReward(guild, userId) {
  const key = voiceCandyTimerKey(guild.id, userId);
  if (voiceCandyTimers.has(key)) return;
  const timer = setTimeout(async () => {
    voiceCandyTimers.delete(key);
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member || member.user.bot || !member.voice.channelId) return;
    const reward = Math.floor(Math.random() * (VOICE_CANDY_MAX_REWARD - VOICE_CANDY_MIN_REWARD + 1))
      + VOICE_CANDY_MIN_REWARD;
    await awardCandies(guild, userId, reward).catch((error) => {
      console.error(`Impossible d’attribuer les flocons vocaux à ${member.user.tag}.`, error);
    });
    if (member.voice.channelId) scheduleVoiceCandyReward(guild, userId);
  }, randomVoiceCandyDelay());
  timer.unref();
  voiceCandyTimers.set(key, timer);
}

function handleVoiceCandyState(oldState, newState) {
  if (newState.member?.user.bot || oldState.member?.user.bot) return;
  const key = voiceCandyTimerKey(newState.guild.id, newState.id);
  if (!newState.channelId) {
    const timer = voiceCandyTimers.get(key);
    if (timer) clearTimeout(timer);
    voiceCandyTimers.delete(key);
    return;
  }
  scheduleVoiceCandyReward(newState.guild, newState.id);
}

async function refreshInviteSnapshot(guild) {
  const invites = await guild.invites.fetch().catch((error) => {
    console.error(`Impossible de récupérer les invitations de ${guild.name}.`, error);
    return null;
  });
  if (!invites) return null;
  const snapshot = new Map(invites.map((invite) => [invite.code, {
    uses: invite.uses ?? 0,
    maxUses: invite.maxUses ?? 0,
    inviterId: invite.inviterId ?? invite.inviter?.id ?? null,
  }]));
  inviteSnapshots.set(guild.id, snapshot);
  return snapshot;
}

async function rewardInviteJoin(member) {
  if (member.user.bot) return;
  const previous = inviteSnapshots.get(member.guild.id) ?? new Map();
  const current = await refreshInviteSnapshot(member.guild);
  if (!current) return;

  let usedInvite = [...current.entries()].find(([code, invite]) => (
    invite.uses > (previous.get(code)?.uses ?? invite.uses)
  ));
  if (!usedInvite) {
    const vanished = [...previous.entries()].filter(([code, invite]) => (
      !current.has(code) && invite.maxUses > 0 && invite.uses + 1 >= invite.maxUses
    ));
    if (vanished.length === 1) usedInvite = vanished[0];
  }
  const inviterId = usedInvite?.[1]?.inviterId;
  if (!inviterId || inviterId === member.id || inviterId === candyRuntimeClient.user?.id) return;

  const guildData = getGuildData(member.guild.id);
  guildData.candyLeaderboard ??= {};
  guildData.candyLeaderboard.rewardedInviteMembers ??= {};
  if (guildData.candyLeaderboard.rewardedInviteMembers[member.id]) return;
  const inviter = await member.guild.members.fetch(inviterId).catch(() => null);
  if (!inviter || inviter.user.bot) return;

  guildData.candyLeaderboard.rewardedInviteMembers[member.id] = { inviterId, joinedAt: Date.now() };
  const reward = Math.floor(Math.random() * 181) + 45;
  const total = await awardCandies(member.guild, inviterId, reward);
  const channel = await member.guild.channels.fetch(HALLOWEEN_CANDY_CHANNEL_ID).catch(() => null);
  if (channel?.isTextBased() && 'send' in channel) {
    await channel.send({
      content: `❄️ <@${inviterId}> a invité <@${member.id}> sur le serveur et gagne **${reward} flocon${reward > 1 ? 's' : ''}** ! Il en possède maintenant **${total}**.`,
      allowedMentions: { users: [inviterId, member.id] },
    });
  }
}

function queueInviteJoinReward(member) {
  const previous = inviteJoinQueues.get(member.guild.id) ?? Promise.resolve();
  const current = previous.catch(() => null).then(() => rewardInviteJoin(member));
  inviteJoinQueues.set(member.guild.id, current);
  current.finally(() => {
    if (inviteJoinQueues.get(member.guild.id) === current) inviteJoinQueues.delete(member.guild.id);
  }).catch(console.error);
  return current;
}

async function rewardCurrentBoosters(guild) {
  const guildData = getGuildData(guild.id);
  guildData.candyLeaderboard ??= {};
  guildData.candyLeaderboard.counts ??= {};
  guildData.candyLeaderboard.rewardCampaigns ??= {};
  const campaigns = guildData.candyLeaderboard.rewardCampaigns;
  const campaign = campaigns[BOOSTER_CANDY_CAMPAIGN_KEY] ?? {};

  if (!campaign.awarded) {
    const members = await guild.members.fetch();
    const boosterIds = members
      .filter((member) => !member.user.bot && member.roles.cache.has(SNIPE_ROLE_ID))
      .map((member) => member.id);

    for (const userId of boosterIds) {
      guildData.candyLeaderboard.counts[userId] = (guildData.candyLeaderboard.counts[userId] ?? 0)
        + BOOSTER_CANDY_REWARD;
    }
    campaigns[BOOSTER_CANDY_CAMPAIGN_KEY] = {
      ...campaign,
      awarded: true,
      awardedAt: Date.now(),
      boosterIds,
      amount: BOOSTER_CANDY_REWARD,
    };
    await saveStore();
  }

  const savedCampaign = campaigns[BOOSTER_CANDY_CAMPAIGN_KEY];
  if (savedCampaign.announced) return;
  const channel = await guild.channels.fetch(HALLOWEEN_CANDY_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('send' in channel)) return;

  const boosterCount = savedCampaign.boosterIds?.length ?? 0;
  const announcement = await channel.send({
    content: [
      '🚀 **CADEAU POUR LES BOOSTERS**',
      `Tous les boosters actuels du serveur viennent de recevoir **${BOOSTER_CANDY_REWARD} ❄️** chacun.`,
      `Merci aux **${boosterCount} booster${boosterCount > 1 ? 's' : ''}** pour votre soutien !`,
    ].join('\n'),
    allowedMentions: { parse: [] },
  });
  savedCampaign.announced = true;
  savedCampaign.announcementMessageId = announcement.id;
  await saveStore();
}

async function syncCandyHolderRole(guild) {
  const guildData = getGuildData(guild.id);
  guildData.candyLeaderboard ??= {};
  guildData.candyLeaderboard.counts ??= {};
  const candy = guildData.candyLeaderboard;

  let role = candy.bimoRoleId
    ? await guild.roles.fetch(candy.bimoRoleId).catch(() => null)
    : null;
  if (!role) {
    role = guild.roles.cache.find((candidate) => candidate.name === CANDY_HOLDER_ROLE_NAME) ?? null;
  }
  if (!role) {
    role = await guild.roles.create({
      name: CANDY_HOLDER_ROLE_NAME,
      reason: 'Rôle quotidien réservé aux membres possédant des flocons.',
    });
  }
  if (candy.bimoRoleId !== role.id) {
    candy.bimoRoleId = role.id;
    await saveStore();
  }

  const holderIds = Object.entries(candy.counts)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([userId]) => userId);
  for (const userId of holderIds) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member || member.user.bot || member.roles.cache.has(role.id)) continue;
    if (!role.editable || !member.manageable) continue;
    await member.roles.add(role, 'Ce membre possède au moins un flocon.').catch((error) => {
      console.error(`Impossible d’attribuer le rôle ${CANDY_HOLDER_ROLE_NAME} à ${member.user.tag}.`, error);
    });
  }
}

function scheduleCandyHolderRoleSync(clientInstance) {
  const timer = setInterval(() => {
    for (const guild of clientInstance.guilds.cache.values()) {
      syncCandyHolderRole(guild).catch((error) => {
        console.error(`Impossible de synchroniser le rôle ${CANDY_HOLDER_ROLE_NAME} sur ${guild.name}.`, error);
      });
    }
  }, CANDY_HOLDER_ROLE_SYNC_INTERVAL_MS);
  timer.unref?.();
}

async function handleCandyDropCommand(message) {
  if (!message.inGuild() || message.author.bot) return false;
  const match = message.content.trim().match(/^\+drop\s+(\d+)$/i);
  if (!match) return false;
  if (message.author.id !== OWNER_COMMAND_USER_ID) return true;

  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000) {
    await message.reply({
      content: 'Utilisation : `+drop <nombre>` avec un montant compris entre 1 et 1 000 000.',
      allowedMentions: { repliedUser: false },
    });
    return true;
  }

  const countdownButton = (label) => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('candy:manual-drop:countdown')
      .setLabel(label)
      .setEmoji('⏳')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );
  const dropMessage = await message.channel.send({
    content: `❄️ **DROP · ${amount.toLocaleString('fr-FR')} FLOCONS**\nPrépare-toi…`,
    components: [countdownButton('1')],
    allowedMentions: { parse: [] },
  });

  const guildData = getGuildData(message.guild.id);
  guildData.candyLeaderboard ??= {};
  guildData.candyLeaderboard.manualDrops ??= {};
  guildData.candyLeaderboard.manualDrops[dropMessage.id] = {
    amount,
    createdBy: message.author.id,
    createdAt: Date.now(),
    opensAt: Date.now() + 3_000,
    claimedBy: null,
  };
  await saveStore();

  for (const label of ['2', '3']) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    await dropMessage.edit({ components: [countdownButton(label)] }).catch(() => null);
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  await dropMessage.edit({
    content: `❄️ **DROP · ${amount.toLocaleString('fr-FR')} FLOCONS**\nLe premier clic remporte tout !`,
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('candy:manual-drop:claim')
        .setLabel('Récupérer les flocons')
        .setEmoji('❄️')
        .setStyle(ButtonStyle.Success),
    )],
  });
  return true;
}

async function handleCandyDropButton(interaction) {
  if (!interaction.isButton() || interaction.customId !== 'candy:manual-drop:claim') return false;
  const guildData = getGuildData(interaction.guildId);
  guildData.candyLeaderboard ??= {};
  guildData.candyLeaderboard.manualDrops ??= {};
  const drop = guildData.candyLeaderboard.manualDrops[interaction.message.id];
  if (!drop) {
    await interaction.reply({ content: 'Ce drop n’est plus disponible.', flags: MessageFlags.Ephemeral });
    return true;
  }
  if (drop.claimedBy) {
    await interaction.reply({ content: `Ce coffre a déjà été récupéré par <@${drop.claimedBy}>.`, flags: MessageFlags.Ephemeral });
    return true;
  }
  if (drop.opensAt && Date.now() < drop.opensAt) {
    await interaction.reply({ content: 'Le drop n’est pas encore ouvert.', flags: MessageFlags.Ephemeral });
    return true;
  }

  drop.claimedBy = interaction.user.id;
  drop.claimedAt = Date.now();
  await saveStore();
  const total = await awardCandies(interaction.guild, interaction.user.id, drop.amount);
  const disabledButton = new ButtonBuilder()
    .setCustomId('candy:manual-drop:claimed')
    .setLabel(`Remporté par ${interaction.user.username}`)
    .setEmoji('❄️')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);
  await interaction.update({
    content: `🎉 ${interaction.user} remporte **${drop.amount.toLocaleString('fr-FR')} flocons** ! Total : **${total.toLocaleString('fr-FR')}**.`,
    components: [new ActionRowBuilder().addComponents(disabledButton)],
    allowedMentions: { users: [interaction.user.id] },
  });
  return true;
}

function initializeVoiceCandyRewards(clientInstance) {
  for (const guild of clientInstance.guilds.cache.values()) {
    for (const state of guild.voiceStates.cache.values()) {
      if (state.channelId && !state.member?.user.bot) {
        scheduleVoiceCandyReward(guild, state.id);
      }
    }
  }
}

function domainMatches(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function dangerousLinkReason(rawContent) {
  const normalizedContent = rawContent
    .replace(/hxxps?:\/\//gi, (value) => value.toLowerCase().startsWith('hxxps') ? 'https://' : 'http://')
    .replace(/\[(?:\.|dot)\]|\((?:\.|dot)\)/gi, '.');
  const candidates = normalizedContent.match(/(?:https?:\/\/|www\.)[^\s<>()]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>()]*)?/gi) ?? [];
  for (const candidate of candidates) {
    let parsed;
    try {
      parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    } catch {
      continue;
    }
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    if (!hostname) continue;
    if (domainMatches(hostname, 'discord.gg')
      || (domainMatches(hostname, 'discord.com') && parsed.pathname.toLowerCase().startsWith('/invite/'))
      || (domainMatches(hostname, 'discordapp.com') && parsed.pathname.toLowerCase().startsWith('/invite/'))) {
      return { hostname, reason: 'Invitation vers un serveur Discord non autorisée' };
    }
    if ([...DANGEROUS_LINK_DOMAINS].some((domain) => domainMatches(hostname, domain))) {
      return { hostname, reason: 'Domaine connu pour la récupération d’adresse IP ou le phishing' };
    }
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')) {
      return { hostname, reason: 'Lien direct vers une adresse IP' };
    }
    if (/\.(?:exe|scr|bat|cmd|com|ps1|msi|apk|jar)(?:$|[?#])/i.test(parsed.pathname)) {
      return { hostname, reason: 'Téléchargement exécutable potentiellement dangereux' };
    }
    const comparableHost = hostname.replace(/0/g, 'o').replace(/[1l]/g, 'i').replace(/-/g, '');
    for (const [brand, trustedDomains] of Object.entries(TRUSTED_BRAND_DOMAINS)) {
      if (!comparableHost.includes(brand)) continue;
      if (!trustedDomains.some((domain) => domainMatches(hostname, domain))) {
        return { hostname, reason: `Faux domaine imitant ${brand}` };
      }
    }
  }
  return null;
}

async function handleDangerousLink(message) {
  if (!message.inGuild() || message.author.bot || message.webhookId || !message.content) return false;
  const detection = dangerousLinkReason(message.content);
  if (!detection) return false;
  badwordDeletedMessageIds.add(message.id);
  const deleted = await message.delete().then(() => true).catch((error) => {
    badwordDeletedMessageIds.delete(message.id);
    console.error(`Impossible de supprimer le lien dangereux de ${message.author.tag}.`, error);
    return false;
  });
  if (!deleted) return false;
  await sendSecurityLog(message.guild, 'spam', 'Lien dangereux supprimé', [
    `- **Auteur** — <@${message.author.id}> (${message.author.id})`,
    `- **Salon** — <#${message.channel.id}> (${message.channel.id})`,
    `- **Domaine** — \`${detection.hostname.replace(/`/g, '')}\``,
    `- **Détection** — ${detection.reason}`,
    '- **Réponse** — message supprimé immédiatement, aucune sanction appliquée',
  ]).catch(console.error);
  return true;
}

async function handleMessageAntispam(message) {
  if (!message.inGuild() || message.author.bot || message.webhookId) return false;
  if (getGuildData(message.guild.id).spamWhitelist.includes(message.author.id)) return false;
  const rawContent = message.content.trim();
  if (!rawContent) return false;
  if (/^[+=]/.test(rawContent)) return false;

  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  const normalized = rawContent.toLowerCase().replace(/\s+/g, ' ');
  const hasLink = /(?:https?:\/\/|www\.)\S+/i.test(rawContent);
  const recent = (antispamActivity.get(key) ?? [])
    .filter((entry) => now - entry.at <= 15_000);
  recent.push({ at: now, normalized, hasLink });
  antispamActivity.set(key, recent);

  const rapidCount = recent.filter((entry) => now - entry.at <= 5_000).length;
  const identicalCount = normalized
    ? recent.filter((entry) => entry.normalized === normalized).length
    : 0;
  const linkCount = recent.filter((entry) => now - entry.at <= 10_000 && entry.hasLink).length;

  let reason = null;
  let reasonKey = null;
  if (identicalCount >= 3) {
    reason = 'Troisième message identique envoyé en moins de 15 secondes';
    reasonKey = 'duplicate';
  } else if (hasLink && linkCount > 3) {
    reason = 'Lien excédentaire après trois messages avec lien en moins de 10 secondes';
    reasonKey = 'links';
  } else if (rapidCount > 6) {
    reason = 'Message excédentaire après six messages envoyés en moins de 5 secondes';
    reasonKey = 'rapid';
  }
  if (!reason) return false;

  const deleted = await message.delete().then(() => true).catch((error) => {
    console.error(`Impossible de supprimer un message antispam de ${message.author.tag}.`, error);
    return false;
  });
  if (!deleted) return false;

  const cooldownKey = `${key}:${reasonKey}`;
  const lastLogAt = antispamLogCooldowns.get(cooldownKey) ?? 0;
  if (now - lastLogAt >= 30_000) {
    antispamLogCooldowns.set(cooldownKey, now);
    await sendSecurityLog(message.guild, 'spam', 'Message supprimé par l’antispam', [
      `- **Auteur** — <@${message.author.id}> (${message.author.id})`,
      `- **Cible** — <#${message.channel.id}> (${message.channel.id})`,
      `- **Action** — ${reason}`,
      '- **Réponse** — message supprimé uniquement, aucune sanction appliquée',
    ]);
  }
  return true;
}

async function handleSmashOrPassMessage(message) {
  if (!message.inGuild() || message.author.bot || message.channelId !== SMASH_OR_PASS_CHANNEL_ID) {
    return false;
  }
  const attachments = [...message.attachments.values()];
  const containsOnlyMedia = attachments.length > 0
    && attachments.every(isSmashOrPassMedia)
    && message.content.trim().length === 0
    && message.stickers.size === 0;
  if (!containsOnlyMedia) {
    await message.delete().catch(console.error);
    return true;
  }

  const reactionResults = await Promise.allSettled([
    message.react('✅'),
    message.react('❌'),
  ]);
  for (const result of reactionResults) {
    if (result.status === 'rejected') console.error('Impossible d’ajouter une réaction Smash or Pass.', result.reason);
  }
  if (!message.hasThread) {
    const authorName = message.member?.displayName ?? message.author.username;
    await message.startThread({
      name: `Smash or Pass · ${authorName}`.slice(0, 100),
      autoArchiveDuration: 1_440,
      reason: `Discussion Smash or Pass de ${message.author.tag}`,
    });
  }
  return true;
}

function rolePanel(style, title, member, role, actor, holderCount) {
  const selected = PANEL_STYLES[style] ?? PANEL_STYLES.info;
  const holderLabel = holderCount > 1 ? 'personnes possèdent' : 'personne possède';
  const details = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `**Membre** — ${member}`,
        `**Rôle** — ${role}`,
        `**Par** — ${actor}`,
      ].join('\n')),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(member.displayAvatarURL({ size: 128 }))
        .setDescription(`Avatar de ${member.displayName}`),
    );

  const container = new ContainerBuilder()
    .setAccentColor(selected.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${selected.icon} ${title.toUpperCase()}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addSectionComponents(details)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${holderCount} ${holderLabel} ce rôle`),
    );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function rankActionPanel(title, member, role, linkedRole, actor) {
  const details = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `**Membre** — ${member}`,
        `**Rank** — ${role}`,
        ...(linkedRole ? [`**Rôle associé** — ${linkedRole}`] : []),
        `**Par** — ${actor}`,
      ].join('\n')),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(member.displayAvatarURL({ size: 128 }))
        .setDescription(`Avatar de ${member.displayName}`),
    );
  const container = new ContainerBuilder()
    .setAccentColor(PANEL_STYLES.success.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ✓ ${title.toUpperCase()}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addSectionComponents(details);

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function whitelistPanel(title, member, actor, instruction) {
  const isRemoved = title.toLowerCase().includes('retir');
  const isDog = title.toLowerCase().includes('dog');
  const isPv = title.toLowerCase().includes('pv');
  const isSpam = title.toLowerCase().includes('antispam');
  const isBan = title.toLowerCase().includes('ban');
  const isWakeup = title.toLowerCase().includes('wakeup');
  const isLockname = title.toLowerCase().includes('lockname');
  const isQuiz = title.toLowerCase().includes('quiz');
  const activeAccess = isDog
    ? '`/dog`'
    : (isPv
      ? `Panneau <#${VOICE_PANEL_CHANNEL_ID}>`
      : (isSpam
        ? 'Exemption de l’antispam'
        : (isBan
          ? '`/ban`'
          : (isWakeup
            ? '`/wakeup`'
            : (isLockname
              ? '`/lockname`'
              : (isQuiz ? '`+quiz`' : '`/perso`'))))));
  const details = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `**Membre** — ${member}`,
        `**Statut** — ${isRemoved ? 'Whitelist retirée' : 'Whitelist active'}`,
        `**Accès** — ${isRemoved ? 'Aucun' : activeAccess}`,
        `**Par** — ${actor}`,
      ].join('\n')),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(member.displayAvatarURL({ size: 128 }))
        .setDescription(`Avatar de ${member.displayName}`),
    );
  const container = new ContainerBuilder()
    .setAccentColor(PANEL_STYLES.success.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ✓ ${title.toUpperCase()}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addSectionComponents(details)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${instruction}`),
    );

  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function dogPanel(title, member, actor, imposedNickname = null, released = false) {
  const details = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `**Chien** — ${member}`,
        `**${released ? 'Libéré par' : 'Maître'}** — ${actor}`,
        ...(released
          ? ['**Pseudo imposé** — Retiré', `**Pseudo restauré** — \`${member.displayName}\``]
          : [`**Pseudo imposé** — ${imposedNickname}`]),
      ].join('\n')),
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(member.displayAvatarURL({ size: 128 }))
        .setDescription(`Avatar de ${member.displayName}`),
    );
  const container = new ContainerBuilder()
    .setAccentColor(released ? PANEL_STYLES.warning.color : PANEL_STYLES.success.color)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${released ? '🐾 CHIEN LIBÉRÉ' : '🐕 MIS EN LAISSE'}`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addSectionComponents(details)
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${member.guild.name} · ${released ? '0/1' : '1/1'} chien`),
    );
  return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

function shortenNickname(value, maximum) {
  const characters = [...String(value)];
  if (characters.length <= maximum) return characters.join('');
  if (maximum <= 1) return characters.slice(0, maximum).join('');
  return `${characters.slice(0, maximum - 1).join('')}…`;
}

function buildDogNickname(target, actor, originalNickname = target.nickname) {
  const originalName = originalNickname ?? target.user.globalName ?? target.user.username;
  const ownerName = shortenNickname(actor.displayName, 10);
  const suffix = ` (🐕 de ${ownerName})`;
  const availableForOriginal = Math.max(1, 32 - [...suffix].length);
  return `${shortenNickname(originalName, availableForOriginal)}${suffix}`;
}

async function handleDog(interaction) {
  const targetUser = interaction.options.getUser('membre', true);
  const [actor, target] = await Promise.all([
    interaction.guild.members.fetch(interaction.user.id),
    interaction.guild.members.fetch(targetUser.id),
  ]);
  const guildData = getGuildData(interaction.guild.id);
  if (!guildData.dogWhitelist.includes(actor.id)) {
    await interaction.reply(panel(
      'error',
      'Accès refusé',
      'Tu dois être ajouté à la whitelist Dog avec `=wldog @membre`.',
      true,
    ));
    return;
  }
  const existing = guildData.dogs[target.id];

  if (existing) {
    if (existing.ownerId !== actor.id && interaction.guild.ownerId !== actor.id) {
      await interaction.reply(panel('error', 'Action refusée', 'Ce membre est déjà sous la responsabilité d’un autre maître.', true));
      return;
    }
    if (!target.manageable) {
      await interaction.reply(panel('error', 'Hiérarchie insuffisante', 'Le rôle du bot doit être placé au-dessus de celui de ce membre.', true));
      return;
    }
    await interaction.deferReply();
    delete guildData.dogs[target.id];
    try {
      await target.setNickname(existing.originalNickname ?? null, `Libéré par ${actor.user.tag}`);
      await saveStore();
    } catch (error) {
      guildData.dogs[target.id] = existing;
      throw error;
    }
    await interaction.editReply(dogPanel('Chien libéré', target, actor, null, true));
    return;
  }

  if (target.id === interaction.guild.ownerId
    || (actor.id !== interaction.guild.ownerId
      && actor.roles.highest.comparePositionTo(target.roles.highest) <= 0)) {
    await interaction.reply(panel(
      'error',
      'Hiérarchie insuffisante',
      'Tu dois avoir un rôle strictement supérieur à celui du membre ciblé.',
      true,
    ));
    return;
  }
  if (!target.manageable) {
    await interaction.reply(panel('error', 'Hiérarchie du bot', 'Le rôle du bot doit être placé au-dessus de celui du membre ciblé.', true));
    return;
  }
  if (Object.values(guildData.dogs).some(({ ownerId }) => ownerId === actor.id)) {
    await interaction.reply(panel('warning', 'Limite atteinte', 'Tu ne peux avoir qu’un seul chien à la fois.', true));
    return;
  }

  const imposedNickname = buildDogNickname(target, actor);
  await interaction.deferReply();
  guildData.dogs[target.id] = {
    ownerId: actor.id,
    originalNickname: target.nickname,
  };
  try {
    await target.setNickname(imposedNickname, `Mis en laisse par ${actor.user.tag}`);
    await saveStore();
  } catch (error) {
    delete guildData.dogs[target.id];
    throw error;
  }
  await interaction.editReply(dogPanel('Mis en laisse', target, actor, `\`${imposedNickname}\``));
}

async function handleClear(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const actorRankTier = memberRankTier(actor);
  const canClear = actor.roles.cache.has(CREATOR_ROLE_ID)
    || (actorRankTier !== null && actorRankTier < 3);
  if (!canClear) {
    await interaction.reply(panel('error', 'Permission refusée', 'Ton rang ne permet pas d’utiliser `/clear`.', true));
    return;
  }
  if (typeof interaction.channel?.bulkDelete !== 'function') {
    await interaction.reply(panel('error', 'Salon incompatible', 'Cette commande ne peut pas être utilisée dans ce type de salon.', true));
    return;
  }

  const requestedAmount = interaction.options.getInteger('nombre') ?? 20;
  const selectedUser = interaction.options.getUser('membre');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const selectedMessages = new Collection();
  let before;
  const minimumTimestamp = Date.now() - (14 * 24 * 60 * 60 * 1_000);
  for (let page = 0; page < 10 && selectedMessages.size < requestedAmount; page += 1) {
    const fetched = await interaction.channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
    if (!fetched.size) break;
    for (const message of fetched.values()) {
      if (message.createdTimestamp <= minimumTimestamp) continue;
      if (selectedUser && message.author.id !== selectedUser.id) continue;
      selectedMessages.set(message.id, message);
      if (selectedMessages.size >= requestedAmount) break;
    }
    before = fetched.last()?.id;
    if (!before || fetched.size < 100) break;
  }

  if (!selectedMessages.size) {
    await interaction.editReply(panel(
      'info',
      'Aucun message',
      selectedUser
        ? `Aucun message récent de ${selectedUser} ne peut être supprimé dans ce salon.`
        : 'Aucun message récent ne peut être supprimé dans ce salon.',
      true,
    ));
    return;
  }

  const deleted = await interaction.channel.bulkDelete(selectedMessages, true);
  await interaction.editReply(panel(
    'success',
    'Messages supprimés',
    selectedUser
      ? `**${deleted.size}** message${deleted.size > 1 ? 's' : ''} de ${selectedUser} supprimé${deleted.size > 1 ? 's' : ''}.`
      : `**${deleted.size}** message${deleted.size > 1 ? 's' : ''} supprimé${deleted.size > 1 ? 's' : ''} dans ce salon.`,
    true,
  ));
}

function parseTimeoutDuration(input) {
  const match = input.trim().toLowerCase().match(/^(\d+)\s*([a-zé]+)$/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  const unit = TIMEOUT_UNITS[TIMEOUT_UNIT_ALIASES[match[2]]];
  if (!Number.isSafeInteger(value) || value < 1 || !unit) return null;
  return {
    milliseconds: value * unit.multiplier,
    label: `${value} ${value === 1 ? unit.singular : unit.plural}`,
  };
}

async function handleTimeout(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const selectedUser = interaction.options.getUser('membre', true);
  const target = await interaction.guild.members.fetch(selectedUser.id);
  const duration = parseTimeoutDuration(interaction.options.getString('duree', true));
  const reason = interaction.options.getString('raison')?.trim() || 'Aucune raison indiquée';
  const isGlobalManager = WHITELIST_MANAGERS.has(actor.id);
  const hasAllowedRole = hasPremiumAccess(actor)
    || actor.roles.cache.some((role) => TIMEOUT_ROLE_IDS.has(role.id));

  if (!isGlobalManager && !hasAllowedRole) {
    await interaction.reply(panel('error', 'Accès refusé', 'Tu ne possèdes pas un rôle autorisé pour utiliser `/to`.', true));
    return;
  }
  if (!duration || duration.milliseconds > MAX_TIMEOUT_MS) {
    await interaction.reply(panel('error', 'Durée invalide', 'Utilise par exemple `30m`, `2h` ou `3j`, sans dépasser 28 jours.', true));
    return;
  }
  if (target.id === actor.id) {
    await interaction.reply(panel('warning', 'Action impossible', 'Tu ne peux pas t’exclure temporairement toi-même.', true));
    return;
  }
  if (target.id === interaction.guild.ownerId || target.id === client.user.id) {
    await interaction.reply(panel('error', 'Membre protégé', 'Ce membre ne peut pas être exclu temporairement.', true));
    return;
  }
  if (!isGlobalManager && WHITELIST_MANAGERS.has(target.id)) {
    await interaction.reply(panel('error', 'Membre protégé', 'Tu ne peux pas sanctionner un gestionnaire global.', true));
    return;
  }
  if (!isGlobalManager && actor.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
    await interaction.reply(panel('error', 'Hiérarchie protégée', 'Tu ne peux pas sanctionner un membre ayant un rôle égal ou supérieur au tien.', true));
    return;
  }
  if (!target.moderatable) {
    await interaction.reply(panel('error', 'Action impossible', 'Le rôle du bot doit être placé au-dessus de ce membre pour appliquer le timeout.', true));
    return;
  }

  await interaction.deferReply();
  await target.timeout(
    duration.milliseconds,
    `/to par ${actor.user.tag} : ${reason}`,
  );
  await interaction.editReply({
    ...panel(
      'success',
      'Membre exclu temporairement',
      [
        `**Membre** — ${target}`,
        `**Durée** — ${duration.label}`,
        `**Raison** — ${reason}`,
        `**Par** — ${actor}`,
      ].join('\n'),
    ),
    allowedMentions: { parse: [] },
  });
  await sendSecurityLog(interaction.guild, 'sanctions', 'Timeout manuel', [
    `- **Auteur** — <@${actor.id}> (${actor.id})`,
    `- **Cible** — <@${target.id}> (${target.id})`,
    `- **Action** — timeout de ${duration.label}`,
    `- **Raison** — ${reason}`,
    '- **Réponse** — sanction appliquée avec succès',
  ]);
}

function overwritePermissionValue(channel, targetId, permission) {
  const overwrite = channel.permissionOverwrites.cache.get(targetId);
  if (overwrite?.allow.has(permission)) return true;
  if (overwrite?.deny.has(permission)) return false;
  return null;
}

async function unlockPrivateVoice(guild, channelId, reason) {
  const guildData = getGuildData(guild.id);
  const privateVoice = guildData.privateVoices[channelId];
  if (!privateVoice) return false;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (channel?.isVoiceBased()) {
    await channel.permissionOverwrites.edit(
      guild.roles.everyone,
      { Connect: privateVoice.originalEveryoneConnect ?? null },
      { reason },
    );
    const userIds = new Set([privateVoice.ownerId, ...(privateVoice.access ?? [])]);
    for (const userId of userIds) {
      const original = userId === privateVoice.ownerId
        ? privateVoice.ownerOriginal
        : privateVoice.accessOriginal?.[userId];
      await channel.permissionOverwrites.edit(
        userId,
        {
          Connect: original?.connect ?? null,
          ViewChannel: original?.viewChannel ?? null,
        },
        { reason },
      ).catch(console.error);
    }
  }
  delete guildData.privateVoices[channelId];
  await saveStore();
  return true;
}

async function handlePrivateVoice(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const guildData = getGuildData(interaction.guild.id);
  if (!guildData.pvWhitelist.includes(actor.id)) {
    await interaction.reply(panel(
      'error',
      'Whitelist PV requise',
      'Tu dois posséder la whitelist PV pour utiliser cette fonctionnalité. Ouvre un ticket **owner** dans <#1563907534119633019> pour faire une demande.',
      true,
    ));
    return;
  }
  const channel = actor.voice.channel;
  if (!channel?.isVoiceBased()) {
    await interaction.reply(panel('warning', 'Vocal requis', 'Rejoins d’abord le salon vocal que tu souhaites verrouiller.', true));
    return;
  }
  if (channel.parentId !== PRIVATE_VOICE_CATEGORY_ID) {
    await interaction.reply(panel(
      'error',
      'Catégorie interdite',
      'Tu peux utiliser `/pv` uniquement dans les salons vocaux de la catégorie autorisée.',
      true,
    ));
    return;
  }
  const otherOwnedChannels = Object.entries(guildData.privateVoices)
    .filter(([channelId, privateVoice]) => channelId !== channel.id && privateVoice.ownerId === actor.id)
    .map(([channelId]) => channelId);
  for (const channelId of otherOwnedChannels) {
    await unlockPrivateVoice(
      interaction.guild,
      channelId,
      `Ancien vocal déverrouillé avant un nouveau /pv par ${actor.user.tag}`,
    );
  }
  const existing = guildData.privateVoices[channel.id];
  if (existing) {
    if (existing.ownerId !== actor.id && !WHITELIST_MANAGERS.has(actor.id)) {
      await interaction.reply(panel('error', 'Salon déjà privé', 'Ce vocal est déjà géré par un autre membre.', true));
      return;
    }
    await interaction.deferReply();
    await unlockPrivateVoice(interaction.guild, channel.id, `Vocal déverrouillé par ${actor.user.tag}`);
    await interaction.editReply(panel(
      'success',
      'Vocal public',
      `${channel} est de nouveau accessible à tout le monde.\n-# Refais \`/pv\` pour le verrouiller à nouveau.`,
    ));
    return;
  }

  const originalEveryoneConnect = overwritePermissionValue(
    channel,
    interaction.guild.roles.everyone.id,
    PermissionFlagsBits.Connect,
  );
  const ownerOriginal = {
    connect: overwritePermissionValue(channel, actor.id, PermissionFlagsBits.Connect),
    viewChannel: overwritePermissionValue(channel, actor.id, PermissionFlagsBits.ViewChannel),
  };
  await interaction.deferReply();
  await channel.permissionOverwrites.edit(
    interaction.guild.roles.everyone,
    { Connect: false },
    { reason: `Vocal verrouillé par ${actor.user.tag}` },
  );
  await channel.permissionOverwrites.edit(
    actor.id,
    { Connect: true, ViewChannel: true },
    { reason: 'Propriétaire du vocal privé' },
  );
  guildData.privateVoices[channel.id] = {
    ownerId: actor.id,
    access: [],
    originalEveryoneConnect,
    ownerOriginal,
    accessOriginal: {},
  };
  await saveStore();
  await interaction.editReply(panel(
    'success',
    'Vocal privé',
    `${channel} est maintenant verrouillé. Utilise \`/access membre\` pour gérer les accès.\n-# Refais \`/pv\` pour déverrouiller le vocal.`,
  ));
}

async function handlePrivateVoiceAccess(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const target = await interaction.guild.members.fetch(interaction.options.getUser('membre', true).id);
  const channel = actor.voice.channel;
  if (!channel?.isVoiceBased()) {
    await interaction.reply(panel('warning', 'Vocal requis', 'Rejoins d’abord ton salon vocal privé.', true));
    return;
  }
  if (channel.parentId !== PRIVATE_VOICE_CATEGORY_ID) {
    await interaction.reply(panel(
      'error',
      'Catégorie interdite',
      'Tu peux utiliser `/access` uniquement dans les salons vocaux de la catégorie autorisée.',
      true,
    ));
    return;
  }
  const guildData = getGuildData(interaction.guild.id);
  const privateVoice = guildData.privateVoices[channel.id];
  if (!privateVoice || privateVoice.ownerId !== actor.id) {
    await interaction.reply(panel('error', 'Salon non géré', 'Tu dois être le propriétaire de ce vocal privé.', true));
    return;
  }
  if (target.id === actor.id) {
    await interaction.reply(panel('info', 'Déjà autorisé', 'Tu es déjà le propriétaire de ce vocal.', true));
    return;
  }

  const access = new Set(privateVoice.access ?? []);
  await interaction.deferReply();
  if (access.has(target.id)) {
    access.delete(target.id);
    const original = privateVoice.accessOriginal?.[target.id];
    await channel.permissionOverwrites.edit(
      target.id,
      {
        Connect: original?.connect ?? null,
        ViewChannel: original?.viewChannel ?? null,
      },
      { reason: `Accès retiré par ${actor.user.tag}` },
    );
    if (privateVoice.accessOriginal) delete privateVoice.accessOriginal[target.id];
    privateVoice.access = [...access];
    await saveStore();
    await interaction.editReply(panel(
      'success',
      'Accès retiré',
      `${target} ne peut plus rejoindre ${channel}.\n-# Refais \`/access\` avec ce membre pour lui rendre l’accès.`,
    ));
    return;
  }

  access.add(target.id);
  privateVoice.accessOriginal ??= {};
  privateVoice.accessOriginal[target.id] = {
    connect: overwritePermissionValue(channel, target.id, PermissionFlagsBits.Connect),
    viewChannel: overwritePermissionValue(channel, target.id, PermissionFlagsBits.ViewChannel),
  };
  await channel.permissionOverwrites.edit(
    target.id,
    { Connect: true, ViewChannel: true },
    { reason: `Accès accordé par ${actor.user.tag}` },
  );
  privateVoice.access = [...access];
  await saveStore();
  await interaction.editReply(panel(
    'success',
    'Accès ajouté',
    `${target} peut maintenant rejoindre ${channel}.\n-# Refais \`/access\` avec ce membre pour retirer son accès.`,
  ));
}

async function handlePrivateVoiceState(oldState, newState) {
  const guildData = getGuildData(oldState.guild.id);
  const affectedChannelIds = new Set([oldState.channelId, newState.channelId].filter(Boolean));
  let activityUpdated = false;
  for (const channelId of affectedChannelIds) {
    const trackedVoice = guildData.privateVoices[channelId];
    if (!trackedVoice?.managedPanel) continue;
    trackedVoice.lastActiveAt = Date.now();
    activityUpdated = true;
  }
  if (activityUpdated) await saveStore();

  if (!oldState.channelId || oldState.channelId === newState.channelId) return;
  const privateVoice = guildData.privateVoices[oldState.channelId];
  if (privateVoice?.managedPanel) return;
  if (privateVoice?.ownerId !== oldState.id) return;
  await unlockPrivateVoice(
    oldState.guild,
    oldState.channelId,
    `Déverrouillage automatique après le départ de ${oldState.member?.user.tag ?? oldState.id}`,
  );
}

async function handleRank(interaction, selectedId, selectedUser) {
  const selectedRank = RANKS.find(({ roleId }) => roleId === selectedId);
  if (!selectedRank) {
    await interaction.reply(panel('error', 'Rank invalide', 'Ce choix n’est plus disponible.', true));
    return;
  }

  const selectedRole = interaction.guild.roles.cache.get(selectedRank.roleId);
  const linkedRole = selectedRank.linkedRoleId
    ? interaction.guild.roles.cache.get(selectedRank.linkedRoleId)
    : null;
  if (!selectedRole || (selectedRank.linkedRoleId && !linkedRole)) {
    await interaction.reply(panel('error', 'Rôle introuvable', 'Un rôle configuré est introuvable sur le serveur.', true));
    return;
  }

  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const member = await interaction.guild.members.fetch(selectedUser.id);
  const isCreator = actor.roles.cache.has(CREATOR_ROLE_ID);
  const actorRankTier = memberRankTier(actor);
  const selectedRankTier = rankTierForRole(selectedRole);
  const canManageSelectedRank = actorRankTier !== null
    && selectedRankTier !== null
    && selectedRankTier > actorRankTier;

  if (!canManageSelectedRank) {
    await interaction.reply(panel(
      'error',
      'Accès refusé',
      'Créateur peut gérer les quatre ranks, Elite les trois rangs inférieurs, Premium peut gérer Plus et Basic, et Plus peut gérer Basic.',
      true,
    ));
    return;
  }

  const targetIsCreator = member.roles.cache.has(CREATOR_ROLE_ID);
  const targetRankTier = memberRankTier(member);
  if (!isCreator && (
    targetIsCreator
    || (targetRankTier !== null && actorRankTier !== null && targetRankTier <= actorRankTier)
  )) {
    await interaction.reply(panel(
      'error',
      'Hiérarchie protégée',
      'Tu ne peux pas modifier le rank d’un membre ayant un niveau égal ou supérieur au tien.',
      true,
    ));
    return;
  }

  await interaction.deferReply();
  const hadSelectedRank = member.roles.cache.has(selectedRole.id);
  const allRankRoleIds = RANKS.flatMap(({ roleId, linkedRoleId }) => [roleId, linkedRoleId]).filter(Boolean);
  const rolesToRemove = allRankRoleIds.filter((roleId) => member.roles.cache.has(roleId));
  if (rolesToRemove.length) {
    await member.roles.remove(rolesToRemove, `Changement de rank par ${interaction.user.tag}`);
  }

  if (hadSelectedRank) {
    await interaction.editReply(rankActionPanel('Rank retiré', member, selectedRole, linkedRole, interaction.user));
    return;
  }

  const rolesToAdd = [selectedRole.id];
  if (linkedRole) rolesToAdd.push(linkedRole.id);
  await member.roles.add(rolesToAdd, `Rank sélectionné par ${interaction.user.tag}`);

  await interaction.editReply(rankActionPanel('Rank ajouté', member, selectedRole, linkedRole, interaction.user));
  await ghostPingRankedMember(interaction.guild, member.id).catch(console.error);
}

async function handleRankAutocomplete(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const actorRankTier = memberRankTier(actor);
  const query = interaction.options.getFocused().toLowerCase();
  if (actorRankTier === null || actorRankTier >= 3) {
    await interaction.respond([]);
    return;
  }

  const choices = RANKS
    .map(({ roleId }) => interaction.guild.roles.cache.get(roleId))
    .filter((role) => {
      const tier = rankTierForRole(role);
      return role
        && tier !== null
        && tier > actorRankTier
        && (!query || role.name.toLowerCase().includes(query));
    })
    .sort((left, right) => rankTierForRole(left) - rankTierForRole(right))
    .slice(0, 25)
    .map((role) => ({ name: role.name.slice(0, 100), value: role.id }));
  await interaction.respond(choices);
}

function canJudgeBan(guildData, userId) {
  return guildData.banWhitelist.includes(userId);
}

async function removeBanJudgmentTemplate(guild) {
  const guildData = getGuildData(guild.id);
  const channel = await guild.channels.fetch(BAN_JUDGMENT_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return;
  const storedMessage = guildData.banJudgmentTemplateMessageId
    ? await channel.messages.fetch(guildData.banJudgmentTemplateMessageId).catch(() => null)
    : null;
  if (storedMessage) await storedMessage.delete().catch(console.error);
  const recentMessages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  for (const message of recentMessages?.values() ?? []) {
    const hasTemplateImage = message.author.id === guild.members.me?.id
      && message.attachments.some((attachment) => attachment.name === 'jugement.png');
    if (hasTemplateImage) await message.delete().catch(console.error);
  }
  guildData.banJudgmentTemplateMessageId = null;
  await saveStore();
}

function banVoteMessage(vote, disabled = false, finalText = null, includeFlags = true, pingEveryone = false) {
  const approveCount = vote.approve.length;
  const rejectCount = vote.reject.length;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ban-vote:approve:${vote.messageId ?? 'pending'}`)
      .setLabel(`Pour · ${approveCount}`)
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`ban-vote:reject:${vote.messageId ?? 'pending'}`)
      .setLabel(`Contre · ${rejectCount}`)
      .setEmoji('❌')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
  );
  const container = new ContainerBuilder()
    .setAccentColor(finalText ? 0x747F8D : 0xED4245)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        '@everyone',
        '-# ⚖️ DOSSIER DE JUGEMENT',
        '## Demande de bannissement',
        `**Membre** — <@${vote.targetId}>`,
        `**Motif** — ${vote.reason}`,
        `**Ouvert par** — <@${vote.authorId}>`,
      ].join('\n')),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `✅ **Pour** — ${approveCount}/${BAN_VOTE_REQUIRED}`,
        `❌ **Contre** — ${rejectCount}/${BAN_VOTE_REQUIRED}`,
        finalText
          ? `\n**Décision** — ${finalText}`
          : `\n-# Fin automatique <t:${Math.floor(vote.expiresAt / 1000)}:R>`,
      ].join('\n')),
    );
  if (vote.proofUrl) container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(vote.proofUrl).setDescription('Preuve jointe au dossier'),
      ),
    );
  container.addActionRowComponents(row);
  const messageOptions = {
    content: null,
    embeds: [],
    components: [container],
    allowedMentions: { parse: pingEveryone ? ['everyone'] : [] },
  };
  if (includeFlags) messageOptions.flags = MessageFlags.IsComponentsV2;
  return messageOptions;
}

async function closeBanVote(guild, messageId, outcome) {
  const guildData = getGuildData(guild.id);
  const vote = guildData.banVotes[messageId];
  if (!vote || vote.closed) return;
  vote.closed = true;
  if (banVoteTimers.has(messageId)) clearTimeout(banVoteTimers.get(messageId));
  banVoteTimers.delete(messageId);
  const channel = await guild.channels.fetch(vote.channelId).catch(() => null);
  const message = channel?.isTextBased() ? await channel.messages.fetch(messageId).catch(() => null) : null;
  let finalText = 'Dossier expiré sans majorité.';
  if (outcome === 'approved') {
    const target = await guild.members.fetch(vote.targetId).catch(() => null);
    if (target && !target.bannable) finalText = 'Vote accepté, mais la hiérarchie empêche le bannissement.';
    else {
      const banned = await guild.members.ban(vote.targetId, {
        reason: `${vote.reason} · Vote accepté par ${vote.approve.length} juge(s)`,
      }).then(() => true).catch((error) => {
        console.error(`Impossible de bannir ${vote.targetId} après le jugement.`, error);
        return false;
      });
      finalText = banned
        ? `Bannissement accepté avec ${vote.approve.length} votes.`
        : 'Vote accepté, mais Discord a refusé le bannissement.';
    }
  } else if (outcome === 'rejected') {
    finalText = `Bannissement refusé avec ${vote.reject.length} votes.`;
  }
  if (message) await message.edit(banVoteMessage(vote, true, finalText)).catch(console.error);
  await saveStore();
}

function scheduleBanVote(guild, messageId) {
  const vote = getGuildData(guild.id).banVotes[messageId];
  if (!vote || vote.closed) return;
  const delay = Math.max(0, vote.expiresAt - Date.now());
  if (banVoteTimers.has(messageId)) clearTimeout(banVoteTimers.get(messageId));
  banVoteTimers.set(messageId, setTimeout(() => {
    closeBanVote(guild, messageId, 'expired').catch(console.error);
  }, delay));
}

async function handleBanCommand(interaction) {
  const guildData = getGuildData(interaction.guild.id);
  if (!canJudgeBan(guildData, interaction.user.id)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Tu dois être ajouté avec `=wlban @membre`.', true));
    return;
  }
  const selectedUser = interaction.options.getUser('membre', false);
  const rawTargetId = interaction.options.getString('identifiant', false);
  const targetId = selectedUser?.id ?? parseUserId(rawTargetId);
  if (!targetId) {
    await interaction.reply(panel('warning', 'Utilisateur requis', 'Sélectionne un `membre` ou indique son `identifiant` Discord.', true));
    return;
  }
  const target = await interaction.guild.members.fetch(targetId).catch(() => null);
  const targetUser = selectedUser ?? target?.user ?? await interaction.client.users.fetch(targetId).catch(() => null);
  const reason = interaction.options.getString('raison', true).trim();
  const proof = interaction.options.getAttachment('preuve', false);
  const isImage = !proof
    || proof.contentType?.startsWith('image/')
    || /\.(png|jpe?g|webp|gif)$/i.test(proof.name ?? '');
  if (!isImage) {
    await interaction.reply(panel('error', 'Preuve invalide', 'Si tu ajoutes une preuve, elle doit être une image.', true));
    return;
  }
  if (targetUser?.bot || targetId === interaction.user.id || WHITELIST_MANAGERS.has(targetId)) {
    await interaction.reply(panel('error', 'Membre invalide', 'Ce membre ne peut pas faire l’objet de cette procédure.', true));
    return;
  }
  if (target && !target.bannable) {
    await interaction.reply(panel('error', 'Hiérarchie du bot', 'Le bot ne pourra pas bannir ce membre.', true));
    return;
  }
  const existingVote = Object.values(guildData.banVotes).find((vote) => (
    !vote.closed
    && vote.targetId === targetId
    && vote.expiresAt > Date.now()
  ));
  if (existingVote) {
    await interaction.reply(panel(
      'warning',
      'Jugement déjà en cours',
      `Ce membre possède déjà un dossier actif : https://discord.com/channels/${interaction.guild.id}/${existingVote.channelId}/${existingVote.messageId}`,
      true,
    ));
    return;
  }
  const judgmentChannel = await interaction.guild.channels.fetch(BAN_JUDGMENT_CHANNEL_ID).catch(() => null);
  if (!judgmentChannel?.isTextBased() || !('messages' in judgmentChannel)) {
    await interaction.reply(panel('error', 'Salon introuvable', 'Le salon réservé aux jugements est inaccessible.', true));
    return;
  }
  const vote = {
    messageId: null,
    channelId: judgmentChannel.id,
    authorId: interaction.user.id,
    targetId,
    reason,
    proofUrl: proof?.url ?? null,
    approve: [],
    reject: [],
    expiresAt: Date.now() + BAN_VOTE_DURATION_MS,
    closed: false,
  };
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const message = await judgmentChannel.send(banVoteMessage(vote, false, null, true, true));
  vote.messageId = message.id;
  guildData.banVotes[message.id] = vote;
  await message.edit(banVoteMessage(vote));
  await saveStore();
  scheduleBanVote(interaction.guild, message.id);
  await interaction.editReply(panel(
    'success',
    'Dossier envoyé',
    `Le jugement est disponible dans ${judgmentChannel} : ${message.url}`,
    true,
  ));
}

async function handleBanInfoCommand(interaction) {
  if (!hasPremiumAccess(interaction.member)) {
    await interaction.reply(panel(
      'error',
      'Accès refusé',
      'Cette commande est réservée aux rôles **PVCool Premium**, **PVCool Elite** et **Créateur**.',
      true,
    ));
    return;
  }
  const rawTarget = interaction.options.getString('utilisateur', true).trim();
  const userId = parseUserId(rawTarget);
  if (!userId) {
    await interaction.reply(panel('warning', 'Identifiant invalide', 'Indique l’identifiant ou la mention du compte banni.', true));
    return;
  }

  await interaction.deferReply();
  const timed = (promise, fallback, delay = 6_000) => Promise.race([
    promise.catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), delay)),
  ]);
  const ban = await timed(
    interaction.guild.bans.fetch({ user: userId, force: true }),
    null,
  );
  if (!ban) {
    await interaction.editReply(panel('warning', 'Aucun bannissement', 'Ce compte n’est pas actuellement banni du serveur.', false));
    return;
  }

  const auditLogs = await timed(interaction.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberBanAdd,
    limit: 100,
  }), null);
  const auditEntry = auditLogs?.entries.find((entry) => entry.targetId === userId) ?? null;
  const storedVote = Object.values(getGuildData(interaction.guild.id).banVotes ?? {})
    .filter((vote) => vote.targetId === userId)
    .sort((left, right) => (right.expiresAt ?? 0) - (left.expiresAt ?? 0))[0] ?? null;
  const moderatorId = auditEntry?.executorId === interaction.client.user.id && storedVote?.authorId
    ? storedVote.authorId
    : (auditEntry?.executorId ?? storedVote?.authorId ?? null);
  const bannedAt = auditEntry?.createdTimestamp ?? (storedVote?.expiresAt
    ? storedVote.expiresAt - BAN_VOTE_DURATION_MS
    : null);
  const reason = ban.reason || storedVote?.reason || 'Non spécifiée';
  const createdAt = Math.floor(ban.user.createdTimestamp / 1000);

  const embed = new EmbedBuilder()
    .setColor(0xD88B27)
    .setTitle('🔨 Bannissement')
    .setThumbnail(ban.user.displayAvatarURL({ extension: 'png', size: 256 }))
    .setDescription([
      `**<@${ban.user.id}> · ${ban.user.username}**`,
      `\`${ban.user.id}\` · compte créé <t:${createdAt}:R>`,
    ].join('\n'))
    .addFields(
      { name: 'RAISON', value: `> ${reason.slice(0, 1000)}` },
      {
        name: 'DEPUIS',
        value: bannedAt
          ? `<t:${Math.floor(bannedAt / 1000)}:F>\n<t:${Math.floor(bannedAt / 1000)}:R>`
          : 'Date inconnue',
      },
      {
        name: 'MODÉRATEUR',
        value: moderatorId ? `<@${moderatorId}>\n\`${moderatorId}\`` : 'Modérateur inconnu',
      },
    )
    .setFooter({ text: interaction.guild.name });
  const profileButton = new ButtonBuilder()
    .setLabel('Profil')
    .setEmoji('👤')
    .setStyle(ButtonStyle.Link)
    .setURL(`https://discord.com/users/${ban.user.id}`);
  await interaction.editReply({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(profileButton)],
    allowedMentions: { parse: [] },
  });
}

async function handleWakeupCommand(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const target = await interaction.guild.members.fetch(interaction.options.getUser('membre', true).id).catch(() => null);
  const guildData = getGuildData(interaction.guild.id);
  if (!guildData.wakeupWhitelist.includes(actor.id)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Tu dois être ajouté à la whitelist avec `=wlwakeup @membre` pour utiliser `/wakeup`.', true));
    return;
  }
  if (!target || target.user.bot || target.id === actor.id) {
    await interaction.reply(panel('warning', 'Membre invalide', 'Choisis un autre membre humain à réveiller.', true));
    return;
  }
  if (!target.voice.channelId) {
    await interaction.reply(panel('warning', 'Absent du vocal', 'Ce membre doit être connecté dans un salon vocal.', true));
    return;
  }
  if (!WHITELIST_MANAGERS.has(actor.id) && actor.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
    await interaction.reply(panel('error', 'Hiérarchie protégée', 'Tu ne peux pas réveiller un membre ayant un rôle égal ou supérieur au tien.', true));
    return;
  }
  if (activeWakeups.has(target.id)) {
    await interaction.reply(panel('info', 'Réveil déjà actif', 'Ce membre est déjà en train d’être réveillé.', true));
    return;
  }

  const botMember = interaction.guild.members.me;
  const voiceChannels = interaction.guild.channels.cache
    .filter((channel) => (
      channel.type === ChannelType.GuildVoice
      && channel.id !== target.voice.channelId
      && channel.permissionsFor(botMember)?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.MoveMembers,
      ])
    ))
    .sort((left, right) => left.rawPosition - right.rawPosition)
    .map((channel) => channel);
  if (!voiceChannels.length) {
    await interaction.reply(panel('error', 'Aucun salon disponible', 'Le bot ne trouve aucun autre salon vocal accessible.', true));
    return;
  }

  if (actor.id !== OWNER_COMMAND_USER_ID) {
    const now = Date.now();
    const recentUses = (guildData.wakeupUsage[actor.id] ?? [])
      .filter((timestamp) => now - timestamp < WAKEUP_ABUSE_WINDOW_MS);
    if (recentUses.length >= WAKEUP_ABUSE_LIMIT - 1) {
      guildData.wakeupWhitelist = guildData.wakeupWhitelist.filter((userId) => userId !== actor.id);
      delete guildData.wakeupUsage[actor.id];
      await saveStore();
      await interaction.reply(panel(
        'error',
        'Whitelist Wakeup retirée',
        'Tu as utilisé `/wakeup` trop souvent. Ton accès à cette commande a été retiré automatiquement.',
        true,
      ));
      await sendSecurityLog(interaction.guild, 'voice', 'Abus de la commande Wakeup', [
        `**Membre** — ${actor} (${actor.id})`,
        `**Sanction** — Whitelist Wakeup retirée`,
        `**Seuil** — ${WAKEUP_ABUSE_LIMIT} utilisations en 10 minutes`,
      ]);
      return;
    }
    guildData.wakeupUsage[actor.id] = [...recentUses, now];
    await saveStore();
  }

  const originalChannelId = target.voice.channelId;
  const session = { cancelled: false };
  activeWakeups.set(target.id, session);
  const endsAt = Date.now() + 30_000;
  const wakeupEmbed = (progress = 0, completed = false, interrupted = false) => {
    const filled = completed ? 12 : Math.min(12, Math.floor(progress * 12));
    const bar = `${'▰'.repeat(filled)}${'▱'.repeat(12 - filled)}`;
    const percent = completed ? 100 : Math.min(99, Math.floor(progress * 100));
    return new EmbedBuilder()
      .setColor(completed ? 0x57F287 : 0xFEE75C)
      .setTitle(completed ? '🔔 Réveil terminé' : '🔔 Réveil en cours')
      .setThumbnail(target.displayAvatarURL({ extension: 'png', size: 256 }))
      .setDescription(completed
        ? [
          `**Cible** — ${target}`,
          '**Mode** — MP uniquement',
          interrupted ? '⚠️ Interrompu : membre déconnecté' : '✅ Terminé',
        ].join('\n')
        : [
          `**Cible** — ${target}`,
          '**Mode** — MP uniquement',
          `\`${bar}\` **${percent} %** · fin <t:${Math.floor(endsAt / 1000)}:R>`,
        ].join('\n'))
      .setFooter({
        text: `demandé par ${actor.displayName}`,
        iconURL: interaction.guild.iconURL({ extension: 'png', size: 128 }) ?? undefined,
      });
  };
  await interaction.reply({
    embeds: [wakeupEmbed()],
    allowedMentions: { users: [target.id] },
  });

  (async () => {
    let index = 0;
    let interrupted = false;
    try {
      while (!session.cancelled && Date.now() < endsAt) {
        const refreshed = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!refreshed?.voice.channelId) {
          interrupted = true;
          break;
        }
        const destination = voiceChannels[index % voiceChannels.length];
        index += 1;
        await refreshed.voice.setChannel(destination, `/wakeup par ${actor.user.tag}`).catch(() => null);
        await wait(2_500);
        const progress = Math.min(1, (30_000 - Math.max(0, endsAt - Date.now())) / 30_000);
        await interaction.editReply({
          embeds: [wakeupEmbed(progress)],
          allowedMentions: { users: [target.id] },
        }).catch(() => null);
      }
      const refreshed = await interaction.guild.members.fetch(target.id).catch(() => null);
      const originalChannel = interaction.guild.channels.cache.get(originalChannelId);
      if (refreshed?.voice.channelId && originalChannel?.isVoiceBased()) {
        await refreshed.voice.setChannel(originalChannel, 'Fin du réveil de 30 secondes').catch(() => null);
      }
      await interaction.editReply({
        embeds: [wakeupEmbed(1, true, interrupted)],
        allowedMentions: { users: [target.id] },
      }).catch(() => null);
    } finally {
      activeWakeups.delete(target.id);
    }
  })().catch(console.error);
}

async function handleLocknameCommand(interaction) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const guildData = getGuildData(interaction.guild.id);
  if (!guildData.locknameWhitelist.includes(actor.id)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Tu dois être ajouté avec `=wllockname @membre` pour utiliser `/lockname`.', true));
    return;
  }
  const target = await interaction.guild.members.fetch(interaction.options.getUser('membre', true).id).catch(() => null);
  const imposedName = interaction.options.getString('nom', true).trim();
  if (!target || target.user.bot || target.id === actor.id) {
    await interaction.reply(panel('warning', 'Membre invalide', 'Choisis un autre membre humain.', true));
    return;
  }
  if (!target.manageable) {
    await interaction.reply(panel('error', 'Hiérarchie du bot', 'Le rôle du bot doit être placé au-dessus de celui du membre ciblé.', true));
    return;
  }
  if (!WHITELIST_MANAGERS.has(actor.id)
    && actor.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
    await interaction.reply(panel('error', 'Hiérarchie protégée', 'Tu ne peux pas verrouiller le pseudo d’un membre ayant un rôle égal ou supérieur au tien.', true));
    return;
  }
  const existing = guildData.lockedNicknames[target.id];
  if (existing) {
    delete guildData.lockedNicknames[target.id];
    await target.setNickname(existing.originalNickname ?? null, `/lockname retiré par ${actor.user.tag}`);
    await saveStore();
    await interaction.reply(panel('success', 'Pseudo déverrouillé', `${target} peut de nouveau modifier son pseudo.`, false));
    return;
  }
  if (guildData.dogs[target.id]) {
    await interaction.reply(panel('warning', 'Pseudo déjà protégé', 'Ce membre est actuellement concerné par `/dog`. Libère-le avant de verrouiller son pseudo.', true));
    return;
  }
  guildData.lockedNicknames[target.id] = {
    nickname: imposedName,
    originalNickname: existing?.originalNickname ?? target.nickname,
    actorId: actor.id,
    lockedAt: Date.now(),
  };
  try {
    await target.setNickname(imposedName, `/lockname par ${actor.user.tag}`);
    await saveStore();
  } catch (error) {
    if (existing) guildData.lockedNicknames[target.id] = existing;
    else delete guildData.lockedNicknames[target.id];
    throw error;
  }
  await interaction.reply(panel(
    'success',
    'Pseudo verrouillé',
    `${target} gardera désormais le pseudo **${imposedName.replaceAll('*', '\\*')}**. Refais la même commande pour le libérer.`,
    false,
  ));
}

async function handleBanVoteButton(interaction) {
  if (!interaction.customId.startsWith('ban-vote:')) return false;
  const [, choice, messageId] = interaction.customId.split(':');
  const guildData = getGuildData(interaction.guild.id);
  const vote = guildData.banVotes[messageId];
  if (!vote || vote.closed || Date.now() >= vote.expiresAt) {
    if (vote && !vote.closed) await closeBanVote(interaction.guild, messageId, 'expired');
    await interaction.reply(panel('info', 'Vote terminé', 'Ce jugement est déjà clos.', true));
    return true;
  }
  if (vote.approve.includes(interaction.user.id) || vote.reject.includes(interaction.user.id)) {
    await interaction.reply(panel('info', 'Vote déjà enregistré', 'Tu ne peux voter qu’une seule fois.', true));
    return true;
  }
  vote[choice === 'approve' ? 'approve' : 'reject'].push(interaction.user.id);
  await saveStore();
  await interaction.update(banVoteMessage(vote, false, null, false));
  if (vote.approve.length >= BAN_VOTE_REQUIRED) await closeBanVote(interaction.guild, messageId, 'approved');
  else if (vote.reject.length >= BAN_VOTE_REQUIRED) await closeBanVote(interaction.guild, messageId, 'rejected');
  return true;
}

async function clearEntireWhitelist(message, command, guildData) {
  const configurations = {
    '=unwlquiz': { key: 'quizWhitelist', label: 'Quiz' },
    '=unwllockname': { key: 'locknameWhitelist', label: 'Lockname' },
    '=unwlwakeup': { key: 'wakeupWhitelist', label: 'Wakeup' },
    '=unwlban': { key: 'banWhitelist', label: 'Ban' },
    '=unwlspam': { key: 'spamWhitelist', label: 'Antispam' },
    '=unwlpv': { key: 'pvWhitelist', label: 'PV' },
    '=unwldog': { key: 'dogWhitelist', label: 'Dog' },
    '=unwlperso': { key: 'whitelist', label: 'Perso' },
  };
  const configuration = configurations[command];
  if (!configuration) return false;

  const removedUserIds = new Set(guildData[configuration.key]);
  guildData[configuration.key] = [];

  if (command === '=unwlspam') {
    for (const key of antispamActivity.keys()) {
      if (key.startsWith(`${message.guild.id}:`)) antispamActivity.delete(key);
    }
  }

  if (command === '=unwlpv') {
    for (const [channelId, privateVoice] of Object.entries(guildData.privateVoices)) {
      if (!removedUserIds.has(privateVoice.ownerId)) continue;
      if (privateVoice.managedPanel) {
        const channel = await message.guild.channels.fetch(channelId).catch(() => null);
        if (channel) await channel.delete(`Whitelist PV entièrement vidée par ${message.author.tag}`).catch(console.error);
        delete guildData.privateVoices[channelId];
      } else {
        await unlockPrivateVoice(message.guild, channelId, `Whitelist PV entièrement vidée par ${message.author.tag}`);
      }
    }
  }

  if (command === '=unwldog') {
    for (const [dogId, dog] of Object.entries(guildData.dogs)) {
      if (!removedUserIds.has(dog.ownerId)) continue;
      delete guildData.dogs[dogId];
      const dogMember = await message.guild.members.fetch(dogId).catch(() => null);
      if (dogMember?.manageable) {
        await dogMember.setNickname(
          dog.originalNickname ?? null,
          `Whitelist Dog entièrement vidée par ${message.author.tag}`,
        ).catch(() => null);
      }
    }
  }

  if (command === '=unwlperso') {
    for (const userId of removedUserIds) {
      const roleId = guildData.personalRoles[userId];
      delete guildData.personalRoles[userId];
      if (roleId) delete guildData.roleHolders[roleId];
    }
  }

  await saveStore();
  await message.reply(panel(
    'success',
    `Whitelist ${configuration.label} vidée`,
    removedUserIds.size
      ? `Les **${removedUserIds.size} membres** ont été retirés de cette whitelist.`
      : 'Cette whitelist était déjà vide.',
  ));
  return true;
}

async function handleManagerCommand(message) {
  if (!message.inGuild() || message.author.bot || !message.content.startsWith('=')) return;
  if (!WHITELIST_MANAGERS.has(message.author.id)) return;

  const commandParts = message.content.trim().toLowerCase().split(/\s+/);
  let command = commandParts[0];
  if (commandParts[0] === '=forcing' && commandParts[1] === 'dog') command = '=forcingdog';
  if (!['=wlperso', '=unwlperso', '=wlpv', '=unwlpv', '=wlspam', '=unwlspam', '=wlban', '=unwlban', '=wlwakeup', '=unwlwakeup', '=wllockname', '=unwllockname', '=wlquiz', '=unwlquiz', '=delperso', '=wldog', '=unwldog', '=forcingdog'].includes(command)) return;

  const guildData = getGuildData(message.guild.id);
  if (commandParts[1] === 'all' && await clearEntireWhitelist(message, command, guildData)) return;

  const target = message.mentions.users.first();
  if (!target) {
    await message.reply(panel('warning', 'Membre manquant', `Utilise la commande avec une mention, par exemple \`${command} @membre\`.`));
    return;
  }

  if (command === '=wlquiz' || command === '=unwlquiz') {
    const targetMember = await message.guild.members.fetch(target.id);
    const isAdding = command === '=wlquiz';
    const alreadyWhitelisted = guildData.quizWhitelist.includes(target.id);
    if (isAdding !== alreadyWhitelisted) {
      guildData.quizWhitelist = isAdding
        ? [...guildData.quizWhitelist, target.id]
        : guildData.quizWhitelist.filter((userId) => userId !== target.id);
      await saveStore();
    }
    await message.reply(whitelistPanel(
      isAdding ? 'Whitelist Quiz ajoutée' : 'Whitelist Quiz retirée',
      targetMember,
      message.author,
      isAdding
        ? 'Ce membre peut maintenant utiliser `+quiz`.'
        : 'Ce membre ne peut plus utiliser `+quiz`.',
    ));
    return;
  }
  if (command === '=wllockname' || command === '=unwllockname') {
    const targetMember = await message.guild.members.fetch(target.id);
    const isAdding = command === '=wllockname';
    const alreadyWhitelisted = guildData.locknameWhitelist.includes(target.id);
    if (isAdding !== alreadyWhitelisted) {
      guildData.locknameWhitelist = isAdding
        ? [...guildData.locknameWhitelist, target.id]
        : guildData.locknameWhitelist.filter((userId) => userId !== target.id);
      await saveStore();
    }
    await message.reply(whitelistPanel(
      isAdding ? 'Whitelist Lockname ajoutée' : 'Whitelist Lockname retirée',
      targetMember,
      message.author,
      isAdding
        ? 'Ce membre peut maintenant utiliser `/lockname`.'
        : 'Ce membre ne peut plus utiliser `/lockname`.',
    ));
    return;
  }
  if (command === '=wlwakeup' || command === '=unwlwakeup') {
    const targetMember = await message.guild.members.fetch(target.id);
    const isAdding = command === '=wlwakeup';
    const alreadyWhitelisted = guildData.wakeupWhitelist.includes(target.id);
    if (isAdding !== alreadyWhitelisted) {
      guildData.wakeupWhitelist = isAdding
        ? [...guildData.wakeupWhitelist, target.id]
        : guildData.wakeupWhitelist.filter((userId) => userId !== target.id);
      await saveStore();
    }
    await message.reply(whitelistPanel(
      isAdding ? 'Whitelist Wakeup ajoutée' : 'Whitelist Wakeup retirée',
      targetMember,
      message.author,
      isAdding
        ? 'Ce membre peut maintenant utiliser `/wakeup`.'
        : 'Ce membre ne peut plus utiliser `/wakeup`.',
    ));
    return;
  }
  if (command === '=wlban' || command === '=unwlban') {
    const targetMember = await message.guild.members.fetch(target.id);
    const isAdding = command === '=wlban';
    const alreadyWhitelisted = guildData.banWhitelist.includes(target.id);
    if (isAdding !== alreadyWhitelisted) {
      guildData.banWhitelist = isAdding
        ? [...guildData.banWhitelist, target.id]
        : guildData.banWhitelist.filter((userId) => userId !== target.id);
      await saveStore();
    }
    await message.reply(whitelistPanel(
      isAdding ? 'Whitelist Ban ajoutée' : 'Whitelist Ban retirée',
      targetMember,
      message.author,
      isAdding
        ? 'Ce membre peut maintenant ouvrir un jugement avec `/ban`.'
        : 'Ce membre ne peut plus ouvrir de jugement.',
    ));
    return;
  }
  if (command === '=wlspam' || command === '=unwlspam') {
    const targetMember = await message.guild.members.fetch(target.id);
    const isAdding = command === '=wlspam';
    const alreadyWhitelisted = guildData.spamWhitelist.includes(target.id);
    if (isAdding === alreadyWhitelisted) {
      await message.reply(whitelistPanel(
        isAdding ? 'Whitelist Antispam déjà active' : 'Whitelist Antispam déjà retirée',
        targetMember,
        message.author,
        isAdding
          ? 'Ce membre est déjà ignoré par l’antispam.'
          : 'Ce membre est déjà surveillé par l’antispam.',
      ));
      return;
    }
    guildData.spamWhitelist = isAdding
      ? [...guildData.spamWhitelist, target.id]
      : guildData.spamWhitelist.filter((userId) => userId !== target.id);
    antispamActivity.delete(`${message.guild.id}:${target.id}`);
    await saveStore();
    await message.reply(whitelistPanel(
      isAdding ? 'Whitelist Antispam ajoutée' : 'Whitelist Antispam retirée',
      targetMember,
      message.author,
      isAdding
        ? 'L’antispam ignorera désormais les messages de ce membre.'
        : 'L’antispam surveillera de nouveau les messages de ce membre.',
    ));
    return;
  }
  if (command === '=wlpv') {
    const targetMember = await message.guild.members.fetch(target.id);
    if (guildData.pvWhitelist.includes(target.id)) {
      await message.reply(whitelistPanel(
        'Whitelist PV déjà active',
        targetMember,
        message.author,
        `Ce membre possède déjà l’accès au panneau <#${VOICE_PANEL_CHANNEL_ID}>.`,
      ));
      return;
    }
    guildData.pvWhitelist.push(target.id);
    await saveStore();
    await message.reply(whitelistPanel(
      'Whitelist PV ajoutée',
      targetMember,
      message.author,
      `Utilise le panneau <#${VOICE_PANEL_CHANNEL_ID}> pour créer et gérer ton vocal personnel.`,
    ));
    return;
  }
  if (command === '=unwlpv') {
    const targetMember = await message.guild.members.fetch(target.id);
    if (!guildData.pvWhitelist.includes(target.id)) {
      await message.reply(whitelistPanel(
        'Whitelist PV déjà retirée',
        targetMember,
        message.author,
        'Ce membre ne possède pas l’accès au panneau vocal.',
      ));
      return;
    }
    guildData.pvWhitelist = guildData.pvWhitelist.filter((userId) => userId !== target.id);
    const ownedChannels = Object.entries(guildData.privateVoices)
      .filter(([, privateVoice]) => privateVoice.ownerId === target.id)
      .map(([channelId, privateVoice]) => ({ channelId, privateVoice }));
    for (const { channelId, privateVoice } of ownedChannels) {
      if (privateVoice.managedPanel) {
        const channel = await message.guild.channels.fetch(channelId).catch(() => null);
        if (channel) await channel.delete(`Whitelist PV retirée par ${message.author.tag}`).catch(console.error);
        delete guildData.privateVoices[channelId];
      } else {
        await unlockPrivateVoice(message.guild, channelId, `Whitelist PV retirée par ${message.author.tag}`);
      }
    }
    await saveStore();
    await message.reply(whitelistPanel(
      'Whitelist PV retirée',
      targetMember,
      message.author,
      'L’accès au panneau vocal a été retiré et son vocal personnel a été supprimé.',
    ));
    return;
  }
  if (command === '=forcingdog') {
    const targetMember = await message.guild.members.fetch(target.id);
    const dog = guildData.dogs[target.id];
    if (!dog) {
      await message.reply(panel('info', 'Aucun statut Dog', `${target} n’est actuellement le chien de personne.`));
      return;
    }
    if (!targetMember.manageable) {
      await message.reply(panel('error', 'Hiérarchie du bot', 'Le rôle du bot doit être placé au-dessus de celui du membre ciblé.'));
      return;
    }
    delete guildData.dogs[target.id];
    try {
      await targetMember.setNickname(dog.originalNickname ?? null, `Libération forcée par ${message.author.tag}`);
      await saveStore();
    } catch (error) {
      guildData.dogs[target.id] = dog;
      throw error;
    }
    await message.reply(dogPanel('Chien libéré', targetMember, message.author, null, true));
    return;
  }
  if (command === '=wldog') {
    const targetMember = await message.guild.members.fetch(target.id);
    if (guildData.dogWhitelist.includes(target.id)) {
      await message.reply(whitelistPanel(
        'Whitelist Dog déjà active',
        targetMember,
        message.author,
        'Ce membre possède déjà l’accès à `/dog`.',
      ));
      return;
    }
    guildData.dogWhitelist.push(target.id);
    await saveStore();
    await message.reply(whitelistPanel(
      'Whitelist Dog ajoutée',
      targetMember,
      message.author,
      'Utilise `/dog @membre` pour mettre en laisse ou libérer un membre.',
    ));
    return;
  }
  if (command === '=unwldog') {
    const targetMember = await message.guild.members.fetch(target.id);
    if (!guildData.dogWhitelist.includes(target.id)) {
      await message.reply(whitelistPanel(
        'Whitelist Dog déjà retirée',
        targetMember,
        message.author,
        'Ce membre ne possède pas l’accès à `/dog`.',
      ));
      return;
    }
    guildData.dogWhitelist = guildData.dogWhitelist.filter((userId) => userId !== target.id);
    for (const [dogId, dog] of Object.entries(guildData.dogs)) {
      if (dog.ownerId !== target.id) continue;
      delete guildData.dogs[dogId];
      const dogMember = await message.guild.members.fetch(dogId).catch(() => null);
      if (dogMember?.manageable) {
        await dogMember.setNickname(dog.originalNickname ?? null, `Whitelist Dog retirée par ${message.author.tag}`).catch(() => null);
      }
    }
    await saveStore();
    await message.reply(whitelistPanel(
      'Whitelist Dog retirée',
      targetMember,
      message.author,
      'L’accès à `/dog` a été retiré et les chiens associés ont été libérés.',
    ));
    return;
  }
  if (command === '=wlperso') {
    const targetMember = await message.guild.members.fetch(target.id);
    if (isWhitelisted(guildData, target.id)) {
      await message.reply(whitelistPanel(
        'Whitelist déjà active',
        targetMember,
        message.author,
        'Utilise le panneau de gestion pour créer ton rôle, puis `/perso @membre` pour le partager.',
      ));
      return;
    }
    guildData.whitelist.push(target.id);
    await saveStore();
    await message.reply(whitelistPanel(
      'Whitelist ajoutée',
      targetMember,
      message.author,
      'Utilise le panneau de gestion pour créer ton rôle, puis `/perso @membre` pour le partager.',
    ));
    return;
  }

  if (command === '=unwlperso') {
    const targetMember = await message.guild.members.fetch(target.id);
    const roleId = guildData.personalRoles[target.id];
    guildData.whitelist = guildData.whitelist.filter((userId) => userId !== target.id);
    delete guildData.personalRoles[target.id];
    if (roleId) delete guildData.roleHolders[roleId];
    await saveStore();
    await message.reply(whitelistPanel(
      'Whitelist retirée',
      targetMember,
      message.author,
      'L’accès au panneau de rôle personnel et à `/perso` a été supprimé.',
    ));
    return;
  }

  if (!guildData.personalRoles[target.id]) {
    await message.reply(panel('info', 'Aucun rôle', `${target} n’a aucun rôle personnel enregistré.`));
    return;
  }
  const roleId = guildData.personalRoles[target.id];
  delete guildData.personalRoles[target.id];
  delete guildData.roleHolders[roleId];
  await saveStore();
  await message.reply(panel('success', 'Rôle désenregistré', `Le rôle personnel de ${target} a été retiré du bot sans supprimer le rôle Discord.`));
}

async function handleMyRole(interaction) {
  const guildData = getGuildData(interaction.guild.id);
  if (!isWhitelisted(guildData, interaction.user.id)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Tu dois être dans la whitelist.', true));
    return;
  }
  if (guildData.personalRoles[interaction.user.id]) {
    await interaction.reply(panel('warning', 'Rôle déjà enregistré', 'Tu ne peux enregistrer qu’un seul rôle personnel.', true));
    return;
  }

  const role = interaction.options.getRole('role', true);
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const botMember = interaction.guild.members.me;
  const personalRoleCeiling = interaction.guild.roles.cache.get(ROLE_MANAGER_ID);
  const existingOwner = Object.entries(guildData.personalRoles)
    .find(([, registeredRoleId]) => registeredRoleId === role.id)?.[0];

  if (existingOwner && existingOwner !== interaction.user.id) {
    await interaction.reply(panel(
      'error',
      'Rôle déjà pris',
      `Ce rôle est déjà enregistré comme rôle personnel par <@${existingOwner}>.`,
      true,
    ));
    return;
  }

  if (role.id === interaction.guild.id || role.managed) {
    await interaction.reply(panel('error', 'Rôle refusé', 'Ce rôle ne peut pas être utilisé comme rôle personnel.', true));
    return;
  }
  if (!member.roles.cache.has(role.id)) {
    await interaction.reply(panel('error', 'Rôle non possédé', 'Tu dois déjà posséder le rôle sélectionné.', true));
    return;
  }
  if (role.permissions.bitfield !== 0n) {
    await interaction.reply(panel('error', 'Permissions détectées', 'Ce rôle possède des permissions Discord et reste bloqué.', true));
    return;
  }
  if (!personalRoleCeiling) {
    await interaction.reply(panel(
      'error',
      'Plafond introuvable',
      `Le rôle plafond <@&${ROLE_MANAGER_ID}> est introuvable. Contacte un responsable.`,
      true,
    ));
    return;
  }
  if (role.position >= personalRoleCeiling.position && interaction.user.id !== OWNER_COMMAND_USER_ID) {
    await interaction.reply(panel(
      'error',
      'Rôle placé trop haut',
      `Un rôle personnel doit obligatoirement rester sous ${personalRoleCeiling}.`,
      true,
    ));
    return;
  }
  if (!botMember || role.position >= botMember.roles.highest.position) {
    await interaction.reply(panel('error', 'Hiérarchie incorrecte', 'Place le rôle du bot au-dessus du rôle personnel.', true));
    return;
  }

  if (role.hoist || role.mentionable) {
    await role.edit({
      hoist: false,
      mentionable: false,
      reason: `Normalisation du rôle personnel enregistré par ${interaction.user.tag}`,
    });
  }

  guildData.personalRoles[interaction.user.id] = role.id;
  guildData.roleHolders[role.id] = [interaction.user.id];
  if (interaction.user.id === OWNER_COMMAND_USER_ID
    && role.position >= personalRoleCeiling.position
    && !guildData.personalRolePositionExemptions.includes(role.id)) {
    guildData.personalRolePositionExemptions.push(role.id);
  } else if (interaction.user.id !== OWNER_COMMAND_USER_ID) {
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions
      .filter((roleId) => roleId !== role.id);
  }
  await saveStore();
  await interaction.reply(panel('success', 'Rôle personnel enregistré', `${role} est maintenant ton unique rôle personnel.`));
}

async function enforcePersonalRolePositions(guild) {
  const ceilingRole = guild.roles.cache.get(ROLE_MANAGER_ID);
  if (!ceilingRole) {
    console.warn(`Rôle plafond personnel ${ROLE_MANAGER_ID} introuvable sur ${guild.name}.`);
    return;
  }

  const guildData = getGuildData(guild.id);
  const personalRoleIds = new Set(Object.values(guildData.personalRoles));
  const ownerExemptions = new Set(guildData.personalRolePositionExemptions);
  const rolesAboveCeiling = [...personalRoleIds]
    .map((roleId) => guild.roles.cache.get(roleId))
    .filter((role) => (
      role
      && role.position >= ceilingRole.position
      && !ownerExemptions.has(role.id)
    ))
    .sort((left, right) => left.position - right.position);

  for (const role of rolesAboveCeiling) {
    if (!role.editable) {
      console.error(`Impossible de replacer le rôle personnel ${role.name} sous le plafond : rôle non modifiable.`);
      continue;
    }
    const currentCeiling = guild.roles.cache.get(ROLE_MANAGER_ID);
    if (!currentCeiling || role.position < currentCeiling.position) continue;
    await role.setPosition(
      Math.max(1, currentCeiling.position - 1),
      'Protection automatique du plafond des rôles personnels',
    ).catch((error) => {
      console.error(`Impossible de replacer le rôle personnel ${role.name} sous le plafond.`, error);
    });
  }
}

async function cleanupUnregisteredPersonalRoles(guild) {
  const guildData = getGuildData(guild.id);
  if (guildData.personalRoleDatabaseCleanupDone) return;

  const anchorRole = guild.roles.cache.get(SNIPE_ROLE_ID);
  const ceilingRole = guild.roles.cache.get(ROLE_MANAGER_ID);
  const botMember = guild.members.me;
  if (!anchorRole || !ceilingRole || !botMember) {
    console.warn(`Nettoyage des rôles personnels reporté sur ${guild.name} : rôles de placement introuvables.`);
    return;
  }

  const registeredRoleIds = new Set(Object.values(guildData.personalRoles));
  const retained = [];
  for (const [ownerId, roleId] of Object.entries(guildData.personalRoles)) {
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      delete guildData.personalRoles[ownerId];
      delete guildData.roleHolders[roleId];
      delete guildData.personalRoleBlockedUsers[roleId];
      continue;
    }
    if (!guildData.whitelist.includes(ownerId)) guildData.whitelist.push(ownerId);
    guildData.personalRoleBlockedUsers[roleId] ??= [];
    const knownHolders = new Set(guildData.roleHolders[roleId] ?? []);
    for (const member of role.members.values()) knownHolders.add(member.id);
    knownHolders.add(ownerId);
    guildData.roleHolders[roleId] = [...knownHolders];
    const owner = await guild.members.fetch(ownerId).catch(() => null);
    if (owner && !owner.roles.cache.has(roleId) && role.editable) {
      authorizePersonalRoleAssignment(guild.id, owner.id, role.id);
      await owner.roles.add(role, 'Migration du rôle personnel déjà enregistré').catch(console.error);
    }
    retained.push(role.name);
  }

  const candidates = guild.roles.cache
    .filter((role) => {
      if (role.id === guild.id || role.managed || registeredRoleIds.has(role.id)) return false;
      const isInPersonalRoleZone = role.position > anchorRole.position && role.position < ceilingRole.position;
      const hasPersonalRoleName = role.name.toLocaleLowerCase('fr').startsWith('perso ·');
      return role.permissions.bitfield === 0n && (isInPersonalRoleZone || hasPersonalRoleName);
    })
    .sort((left, right) => right.position - left.position);

  const deleted = [];
  for (const role of candidates.values()) {
    if (!role.editable || role.position >= botMember.roles.highest.position) {
      console.warn(`Rôle personnel non enregistré ignoré car non modifiable : ${role.name} (${role.id}).`);
      continue;
    }
    delete guildData.roleBackups[role.id];
    delete guildData.roleHolders[role.id];
    delete guildData.personalRoleBlockedUsers[role.id];
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions.filter((id) => id !== role.id);
    guildData.roleCeilingProtectedIds = guildData.roleCeilingProtectedIds.filter((id) => id !== role.id);
    await role.delete('Nettoyage unique : rôle personnel absent de la base de données').then(() => {
      deleted.push(role.name);
    }).catch((error) => console.error(`Impossible de supprimer le rôle personnel non enregistré ${role.name}.`, error));
  }

  guildData.personalRoleDatabaseCleanupDone = true;
  await saveStore();
  console.log(`Migration des rôles personnels terminée sur ${guild.name} : ${retained.length} conservé(s), ${deleted.length} supprimé(s).`);
  await sendSecurityLog(guild, 'roles', 'Migration des rôles personnels terminée', [
    `- **Conservés** — ${retained.length}`,
    `- **Supprimés** — ${deleted.length}`,
    '- **Règle** — seuls les rôles personnels enregistrés dans la base ont été conservés',
  ]).catch(console.error);
}

async function enforcePersonalRoleVisibility(guild) {
  const guildData = getGuildData(guild.id);
  const personalRoleIds = new Set([
    ...Object.values(guildData.personalRoles),
    ...guildData.roleCeilingProtectedIds,
  ]);
  for (const roleId of personalRoleIds) {
    const role = guild.roles.cache.get(roleId);
    if (!role || (!role.hoist && !role.mentionable)) continue;
    if (!role.editable) {
      console.error(`Impossible de désactiver l’affichage ou la mention du rôle personnel ${role.name}.`);
      continue;
    }
    await role.edit({
      hoist: false,
      mentionable: false,
      reason: 'Protection automatique des réglages du rôle personnel',
    }).catch((error) => {
      console.error(`Impossible de normaliser le rôle personnel ${role.name}.`, error);
    });
  }
}

async function ensureRoleCeilingProtection(guild) {
  const ceilingRole = guild.roles.cache.get(ROLE_MANAGER_ID);
  if (!ceilingRole) return;
  const guildData = getGuildData(guild.id);
  const protectedIds = new Set(guildData.roleCeilingProtectedIds);

  if (!guildData.roleCeilingProtectionInitialized) {
    for (const role of guild.roles.cache.values()) {
      if (role.id === guild.id || role.id === ROLE_MANAGER_ID || role.managed) continue;
      if (role.position < ceilingRole.position) protectedIds.add(role.id);
    }
    guildData.roleCeilingProtectionInitialized = true;
  }

  guildData.roleCeilingProtectedIds = [...protectedIds]
    .filter((roleId) => guild.roles.cache.has(roleId));
  await saveStore();
}

async function enforceProtectedRoleCeiling(guild, audit) {
  if (audit?.actorId === OWNER_COMMAND_USER_ID || audit?.actorId === client.user.id) return;
  const ceilingRole = guild.roles.cache.get(ROLE_MANAGER_ID);
  if (!ceilingRole) return;
  const guildData = getGuildData(guild.id);
  const ownerExemptions = new Set(guildData.roleCeilingOwnerExemptions);
  const violations = guildData.roleCeilingProtectedIds
    .map((roleId) => guild.roles.cache.get(roleId))
    .filter((role) => (
      role
      && role.position >= ceilingRole.position
      && !ownerExemptions.has(role.id)
    ))
    .sort((left, right) => left.position - right.position);
  if (!violations.length) return;

  const restoredNames = [];
  for (const role of violations) {
    if (!role.editable) {
      console.error(`Impossible de replacer le rôle protégé ${role.name} sous le plafond.`);
      continue;
    }
    const currentCeiling = guild.roles.cache.get(ROLE_MANAGER_ID);
    if (!currentCeiling || role.position < currentCeiling.position) continue;
    await role.setPosition(
      Math.max(1, currentCeiling.position - 1),
      'Protection automatique du plafond global des rôles',
    ).then(() => restoredNames.push(role.name)).catch((error) => {
      console.error(`Impossible de replacer le rôle protégé ${role.name}.`, error);
    });
  }

  let response = restoredNames.length
    ? `Rôle${restoredNames.length > 1 ? 's' : ''} replacé${restoredNames.length > 1 ? 's' : ''} sous le plafond`
    : 'Repositionnement impossible';
  const actor = audit?.actorId
    ? await guild.members.fetch(audit.actorId).catch(() => null)
    : null;
  if (actor && actor.id !== guild.ownerId && actor.moderatable) {
    await actor.timeout(
      FORBIDDEN_ROLE_TIMEOUT_MS,
      `Déplacement interdit de rôle au-dessus de ${ceilingRole.name}`,
    ).then(() => {
      response += ' et timeout de 5 minutes appliqué';
    }).catch((error) => console.error(`Impossible de timeout ${actor.user.tag}.`, error));
  } else if (actor) {
    response += ', mais le timeout est impossible avec la hiérarchie actuelle';
  }

  await sendSecurityLog(guild, 'roles', 'Dépassement du plafond des rôles', [
    `- **Auteur** — ${actor ? `<@${actor.id}> (${actor.id})` : 'Inconnu'}`,
    `- **Plafond** — <@&${ROLE_MANAGER_ID}>`,
    `- **Rôles concernés** — ${violations.map((role) => `${role.name} (${role.id})`).join(', ')}`,
    `- **Réponse** — ${response}`,
  ]);
}

async function findRecentRolePositionAudit(guild) {
  const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 8 });
  const entry = logs.entries.find((candidate) => (
    Date.now() - candidate.createdTimestamp < 15_000
  ));
  if (!entry?.executorId) return null;
  return { actorId: entry.executorId, targetId: entry.targetId };
}

async function applyPersonalRolePositionPolicy(guild) {
  const guildData = getGuildData(guild.id);
  const audit = await findRecentRolePositionAudit(guild).catch(() => null);
  const ceilingRole = guild.roles.cache.get(ROLE_MANAGER_ID);

  if (audit?.actorId === OWNER_COMMAND_USER_ID && ceilingRole) {
    const exemptions = new Set(guildData.personalRolePositionExemptions);
    for (const roleId of Object.values(guildData.personalRoles)) {
      const role = guild.roles.cache.get(roleId);
      if (role && role.position >= ceilingRole.position) exemptions.add(role.id);
      else exemptions.delete(roleId);
    }
    guildData.personalRolePositionExemptions = [...exemptions];
    const globalExemptions = new Set(guildData.roleCeilingOwnerExemptions);
    for (const roleId of guildData.roleCeilingProtectedIds) {
      const role = guild.roles.cache.get(roleId);
      if (role && role.position >= ceilingRole.position) globalExemptions.add(role.id);
      else globalExemptions.delete(roleId);
    }
    guildData.roleCeilingOwnerExemptions = [...globalExemptions];
    await saveStore();
    return;
  }

  if (audit?.targetId === ROLE_MANAGER_ID) {
    guildData.roleCeilingOwnerExemptions = [];
  } else if (audit?.targetId) {
    guildData.roleCeilingOwnerExemptions = guildData.roleCeilingOwnerExemptions
      .filter((roleId) => roleId !== audit.targetId);
  }
  await saveStore();
  await enforceProtectedRoleCeiling(guild, audit);

  if (audit?.targetId === ROLE_MANAGER_ID) {
    guildData.personalRolePositionExemptions = [];
    await saveStore();
  } else if (audit?.targetId && guildData.personalRolePositionExemptions.includes(audit.targetId)) {
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions
      .filter((roleId) => roleId !== audit.targetId);
    await saveStore();
  }
  await enforcePersonalRolePositions(guild);
}

function schedulePersonalRolePositionEnforcement(guild) {
  const existingTimer = personalRolePositionTimers.get(guild.id);
  if (existingTimer) clearTimeout(existingTimer);
  const timer = setTimeout(() => {
    personalRolePositionTimers.delete(guild.id);
    applyPersonalRolePositionPolicy(guild).catch(console.error);
  }, 1_000);
  personalRolePositionTimers.set(guild.id, timer);
}

async function handlePersonalRole(interaction) {
  const guildData = getGuildData(interaction.guild.id);
  if (!isWhitelisted(guildData, interaction.user.id)) {
    await interaction.reply(panel('error', 'Accès refusé', 'Tu n’es pas dans la whitelist.', true));
    return;
  }

  const roleId = guildData.personalRoles[interaction.user.id];
  if (!roleId) {
    await interaction.reply(panel('warning', 'Rôle non configuré', 'Crée d’abord ton rôle depuis le panneau de gestion.', true));
    return;
  }

  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    delete guildData.personalRoles[interaction.user.id];
    await saveStore();
    await interaction.reply(panel('warning', 'Rôle introuvable', 'Ton ancien rôle a été automatiquement désenregistré.', true));
    return;
  }

  const user = interaction.options.getUser('membre', true);
  const member = await interaction.guild.members.fetch(user.id);
  const holders = new Set([
    ...(guildData.roleHolders[role.id] ?? [interaction.user.id]),
    ...role.members.keys(),
  ]);
  if (!member.roles.cache.has(role.id)) {
    if ((guildData.personalRoleBlockedUsers[role.id] ?? []).includes(user.id)) {
      await interaction.reply(panel('error', 'Membre interdit', 'Tu as interdit à ce membre de recevoir ton rôle personnel.', true));
      return;
    }
    authorizePersonalRoleAssignment(interaction.guild.id, member.id, role.id);
    await member.roles.add(role, `Rôle personnel ajouté par ${interaction.user.tag}`);
    holders.add(user.id);
    for (const knownMemberId of role.members.keys()) holders.add(knownMemberId);
    guildData.roleHolders[role.id] = [...holders];
    await saveStore();
    await interaction.reply(rolePanel('success', 'Rôle ajouté', member, role, interaction.user, holders.size));
  } else {
    await member.roles.remove(role, `Rôle personnel retiré par ${interaction.user.tag}`);
    holders.delete(user.id);
    for (const knownMemberId of role.members.keys()) holders.add(knownMemberId);
    holders.delete(user.id);
    guildData.roleHolders[role.id] = [...holders];
    await saveStore();
    await interaction.reply(rolePanel('success', 'Rôle retiré', member, role, interaction.user, holders.size));
  }
}

async function handleMemberLeave(member) {
  const guildData = getGuildData(member.guild.id);
  const roleId = guildData.personalRoles[member.id];

  for (const [personalRoleId, blockedUsers] of Object.entries(guildData.personalRoleBlockedUsers)) {
    guildData.personalRoleBlockedUsers[personalRoleId] = blockedUsers.filter((userId) => userId !== member.id);
  }

  guildData.pvWhitelist = guildData.pvWhitelist.filter((userId) => userId !== member.id);
  const ownedPrivateVoices = Object.entries(guildData.privateVoices)
    .filter(([, privateVoice]) => privateVoice.ownerId === member.id)
    .map(([channelId, privateVoice]) => ({ channelId, privateVoice }));
  for (const { channelId, privateVoice } of ownedPrivateVoices) {
    if (privateVoice.managedPanel) {
      const channel = await member.guild.channels.fetch(channelId).catch(() => null);
      if (channel) await channel.delete('Propriétaire du vocal ayant quitté le serveur').catch(console.error);
      delete guildData.privateVoices[channelId];
    } else {
      await unlockPrivateVoice(member.guild, channelId, 'Propriétaire ayant quitté le serveur');
    }
  }
  for (const [channelId, privateVoice] of Object.entries(guildData.privateVoices)) {
    if ((privateVoice.access ?? []).includes(member.id)) {
      const channel = await member.guild.channels.fetch(channelId).catch(() => null);
      const original = privateVoice.accessOriginal?.[member.id];
      if (channel?.isVoiceBased()) {
        await channel.permissionOverwrites.edit(
          member.id,
          {
            Connect: original?.connect ?? null,
            ViewChannel: original?.viewChannel ?? null,
          },
          { reason: 'Membre autorisé ayant quitté le serveur' },
        ).catch(console.error);
      }
      if (privateVoice.accessOriginal) delete privateVoice.accessOriginal[member.id];
    }
    privateVoice.access = (privateVoice.access ?? []).filter((userId) => userId !== member.id);
  }
  delete guildData.dogs[member.id];
  for (const [targetId, dog] of Object.entries(guildData.dogs)) {
    if (dog.ownerId !== member.id) continue;
    delete guildData.dogs[targetId];
    const target = await member.guild.members.fetch(targetId).catch(() => null);
    if (target?.manageable) {
      await target.setNickname(dog.originalNickname ?? null, 'Maître ayant quitté le serveur').catch(() => null);
    }
  }

  guildData.whitelist = guildData.whitelist.filter((userId) => userId !== member.id);
  guildData.dogWhitelist = guildData.dogWhitelist.filter((userId) => userId !== member.id);
  guildData.spamWhitelist = guildData.spamWhitelist.filter((userId) => userId !== member.id);
  guildData.wakeupWhitelist = guildData.wakeupWhitelist.filter((userId) => userId !== member.id);
  delete guildData.wakeupUsage[member.id];
  guildData.locknameWhitelist = guildData.locknameWhitelist.filter((userId) => userId !== member.id);
  guildData.quizWhitelist = guildData.quizWhitelist.filter((userId) => userId !== member.id);
  delete guildData.lockedNicknames[member.id];
  delete guildData.personalRoles[member.id];
  if (roleId) {
    delete guildData.roleHolders[roleId];
    delete guildData.personalRoleBlockedUsers[roleId];
    delete guildData.roleBackups[roleId];
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions
      .filter((personalRoleId) => personalRoleId !== roleId);
    guildData.roleCeilingProtectedIds = guildData.roleCeilingProtectedIds
      .filter((personalRoleId) => personalRoleId !== roleId);
  }
  await saveStore();

  if (!roleId) return;
  const role = member.guild.roles.cache.get(roleId);
  if (!role) return;

  try {
    const deletedRole = { id: role.id, name: role.name };
    await role.delete(`Rôle personnel supprimé après le départ de ${member.user.tag}`);
    void sendPersonalRoleModificationLog(
      member.guild,
      'Rôle supprimé après le départ du propriétaire',
      member.user,
      deletedRole,
    ).catch(console.error);
    console.log(`Rôle personnel ${role.name} supprimé après le départ de ${member.user.tag}.`);
  } catch (error) {
    console.error(`Impossible de supprimer le rôle personnel ${role.name} après le départ de ${member.user.tag}.`, error);
  }
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function findRoleAuditActor(guild, roleId, auditType) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await wait(750);
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 6 });
    const entry = logs.entries.find((candidate) => (
      candidate.targetId === roleId
      && Date.now() - candidate.createdTimestamp < 15_000
    ));
    if (entry?.executorId) return entry.executorId;
  }
  return null;
}

async function findMemberRoleAuditActor(guild, memberId, addedRoleIds) {
  const expectedRoleIds = new Set(addedRoleIds);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await wait(750);
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 8 });
    const entry = logs.entries.find((candidate) => (
      candidate.targetId === memberId
      && Date.now() - candidate.createdTimestamp < 15_000
      && candidate.changes?.some((change) => (
        change.key === '$add'
        && Array.isArray(change.new)
        && change.new.some((role) => expectedRoleIds.has(role.id))
      ))
    ));
    if (entry?.executorId) return entry.executorId;
  }
  return null;
}

async function findBanAuditActor(guild, bannedUserId) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await wait(600);
    const now = Date.now();
    for (const [entryId, processedAt] of processedBanAuditEntries) {
      if (now - processedAt > 60_000) processedBanAuditEntries.delete(entryId);
    }
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 8 });
    const entry = logs.entries.find((candidate) => (
      candidate.targetId === bannedUserId
      && now - candidate.createdTimestamp < 10_000
      && !processedBanAuditEntries.has(candidate.id)
    ));
    if (entry?.executorId) {
      processedBanAuditEntries.set(entry.id, now);
      return entry.executorId;
    }
  }
  return null;
}

async function handleBanAbuse(ban) {
  const actorId = await findBanAuditActor(ban.guild, ban.user.id).catch((error) => {
    console.error('Impossible d’identifier l’auteur du bannissement.', error);
    return null;
  });
  if (!actorId || actorId === client.user.id || actorId === OWNER_COMMAND_USER_ID) return;

  const guildData = getGuildData(ban.guild.id);
  const now = Date.now();
  const previous = guildData.banAbuse[actorId] ?? { recent: [], strikes: 0, lastStrikeAt: 0 };
  const strikes = now - (previous.lastStrikeAt ?? 0) <= BAN_ABUSE_STRIKE_TTL_MS
    ? (previous.strikes ?? 0)
    : 0;
  const recent = (previous.recent ?? []).filter((timestamp) => now - timestamp <= BAN_ABUSE_WINDOW_MS);
  recent.push(now);
  guildData.banAbuse[actorId] = {
    recent,
    strikes,
    lastStrikeAt: previous.lastStrikeAt ?? 0,
  };

  if (recent.length < BAN_ABUSE_LIMIT) {
    await saveStore();
    return;
  }

  const nextStrikes = strikes + 1;
  guildData.banAbuse[actorId] = {
    recent: [],
    strikes: nextStrikes,
    lastStrikeAt: now,
  };
  await saveStore();
  const reason = `${BAN_ABUSE_LIMIT} bannissements en moins de 60 secondes`;

  if (nextStrikes >= 2) {
    await sendSecurityLog(ban.guild, 'sanctions', 'Récidive de bannissements abusifs', [
      `- **Auteur** — <@${actorId}> (${actorId})`,
      `- **Dernière cible** — <@${ban.user.id}> (${ban.user.id})`,
      `- **Action** — seconde série de ${reason}`,
      '- **Réponse** — blacklist persistante et bannissement',
    ]);
    await blacklistAndBanById(ban.guild, actorId, `Récidive : ${reason}`);
    return;
  }

  const actor = await ban.guild.members.fetch(actorId).catch(() => null);
  let response = 'Timeout de 10 minutes appliqué';
  if (!actor?.moderatable) {
    response = 'Timeout impossible avec la hiérarchie actuelle';
  } else {
    await actor.timeout(BAN_ABUSE_TIMEOUT_MS, reason).catch((error) => {
      response = 'Timeout impossible avec la hiérarchie actuelle';
      console.error(`Impossible de timeout ${actor.user.tag} après un massban.`, error);
    });
  }
  await sendSecurityLog(ban.guild, 'sanctions', 'Bannissements abusifs détectés', [
    `- **Auteur** — <@${actorId}> (${actorId})`,
    `- **Dernière cible** — <@${ban.user.id}> (${ban.user.id})`,
    `- **Action** — ${reason}`,
    `- **Réponse** — ${response} · prochaine série sous 24 h = blacklist`,
  ]);
}

async function findVoiceAuditActor(guild, auditType, memberId, changeKeys = []) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt > 0) await wait(600);
    const now = Date.now();
    for (const [entryId, processedAt] of processedVoiceAuditEntries) {
      if (now - processedAt > 60_000) processedVoiceAuditEntries.delete(entryId);
    }
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 8 });
    const entry = logs.entries.find((candidate) => (
      candidate.targetId === memberId
      && now - candidate.createdTimestamp < 8_000
      && !processedVoiceAuditEntries.has(candidate.id)
      && (!changeKeys.length || candidate.changes?.some((change) => changeKeys.includes(change.key)))
    ));
    if (entry?.executorId) {
      processedVoiceAuditEntries.set(entry.id, now);
      return entry.executorId;
    }
  }
  return null;
}

async function registerVoiceModerationAbuse(guild, actorId, targetId, actions) {
  if (!actorId || actorId === client.user.id) return;
  const now = Date.now();
  const key = `${guild.id}:${actorId}`;
  const previous = voiceModerationActions.get(key) ?? [];
  const recent = previous.filter((timestamp) => now - timestamp <= VOICE_ABUSE_WINDOW_MS);
  for (let index = 0; index < actions.length; index += 1) recent.push(now);
  voiceModerationActions.set(key, recent);
  if (recent.length < VOICE_ABUSE_LIMIT) return;
  voiceModerationActions.delete(key);

  const actor = await guild.members.fetch(actorId).catch(() => null);
  if (!actor) return;
  const guildData = getGuildData(guild.id);
  const previousStrike = guildData.voiceAbuseStrikes[actorId];
  const repeated = previousStrike && now - previousStrike.lastAt <= VOICE_ABUSE_REPEAT_PERIOD_MS;
  const duration = repeated ? VOICE_ABUSE_REPEAT_TIMEOUT_MS : VOICE_ABUSE_FIRST_TIMEOUT_MS;
  guildData.voiceAbuseStrikes[actorId] = {
    count: repeated ? (previousStrike.count ?? 1) + 1 : 1,
    lastAt: now,
  };
  await saveStore();

  const durationLabel = duration === VOICE_ABUSE_REPEAT_TIMEOUT_MS ? '30 minutes' : '10 minutes';
  const reason = `${VOICE_ABUSE_LIMIT} actions de modération vocale en moins de 60 secondes`;
  let sanction = `Timeout de ${durationLabel}`;
  try {
    await actor.timeout(duration, reason);
  } catch (error) {
    sanction = `Échec du timeout de ${durationLabel} (hiérarchie ou permission du bot)`;
    console.error(`Impossible de sanctionner l’abus vocal de ${actor.user.tag}.`, error);
  }

  await sendSecurityLog(guild, 'voice', 'Abus de modération vocale', [
    `- **Auteur** — <@${actor.id}> (${actor.id})`,
    `- **Dernière cible** — <@${targetId}> (${targetId})`,
    `- **Action** — ${reason}`,
    `- **Détails** — ${actions.join(', ')}`,
    `- **Réponse** — ${sanction}`,
  ]);
}

async function handleVoiceModerationSecurity(oldState, newState) {
  const memberActions = [];
  const changeKeys = [];
  if (oldState.serverMute !== newState.serverMute) {
    memberActions.push(newState.serverMute ? 'mute serveur' : 'retrait du mute serveur');
    changeKeys.push('mute');
  }
  if (oldState.serverDeaf !== newState.serverDeaf) {
    memberActions.push(newState.serverDeaf ? 'casque serveur' : 'retrait du casque serveur');
    changeKeys.push('deaf');
  }
  if (memberActions.length) {
    const actorId = await findVoiceAuditActor(
      newState.guild,
      AuditLogEvent.MemberUpdate,
      newState.id,
      changeKeys,
    );
    await registerVoiceModerationAbuse(newState.guild, actorId, newState.id, memberActions);
  }

  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    const actorId = await findVoiceAuditActor(
      newState.guild,
      AuditLogEvent.MemberMove,
      newState.id,
    );
    await registerVoiceModerationAbuse(newState.guild, actorId, newState.id, ['déplacement forcé']);
  }
  if (oldState.channelId && !newState.channelId) {
    const actorId = await findVoiceAuditActor(
      newState.guild,
      AuditLogEvent.MemberDisconnect,
      newState.id,
    );
    await registerVoiceModerationAbuse(newState.guild, actorId, newState.id, ['déconnexion forcée']);
  }
}

async function protectForbiddenRoleAssignment(oldMember, newMember) {
  const addedForbiddenRoles = newMember.roles.cache.filter((role) => (
    !oldMember.roles.cache.has(role.id)
    && (role.permissions.bitfield & FORBIDDEN_ROLE_PERMISSIONS.bitfield) !== 0n
  ));
  if (!addedForbiddenRoles.size) return;

  const roleIds = [...addedForbiddenRoles.keys()];
  const actorId = await findMemberRoleAuditActor(newMember.guild, newMember.id, roleIds);
  if (!actorId || actorId === client.user.id) return;

  const actor = await newMember.guild.members.fetch(actorId).catch(() => null);
  if (!actor || ![...PROTECTED_ROLE_ASSIGNERS].some((roleId) => actor.roles.cache.has(roleId))) return;

  const roleNames = addedForbiddenRoles.map((role) => role.name).join(', ');
  const reason = `Attribution interdite de rôle(s) à permissions sensibles : ${roleNames}`;

  try {
    await newMember.roles.remove(roleIds, `Protection automatique : ${reason}`);
    console.log(`Rôle(s) interdit(s) retiré(s) à ${newMember.user.tag} : ${roleNames}.`);
  } catch (error) {
    console.error(`Impossible de retirer le(s) rôle(s) interdit(s) à ${newMember.user.tag}.`, error);
  }

  await blacklistAndBan(actor, reason);
  await sendSecurityLog(newMember.guild, 'permissions', 'Attribution de rôle interdite', [
    `- **Auteur** — <@${actor.id}> (${actor.id})`,
    `- **Cible** — <@${newMember.id}> (${newMember.id})`,
    `- **Action** — attribution de ${roleNames}`,
    '- **Réponse** — rôle retiré, compte blacklisté et bannissement demandé',
  ]);
}

async function removeRedundantRoleManager(newMember) {
  if (!newMember.roles.cache.has(ROLE_MANAGER_ID)) return;
  const promotedRole = newMember.roles.cache.find((role) => (
    role.id !== ROLE_MANAGER_ID
    && role.id !== newMember.guild.id
    && role.permissions.has(PermissionFlagsBits.ManageRoles)
  ));
  if (!promotedRole) return;

  await newMember.roles.remove(
    ROLE_MANAGER_ID,
    `Retrait automatique après obtention du rôle ${promotedRole.name} avec Gérer les rôles`,
  ).then(() => {
    console.log(`Rôle ${ROLE_MANAGER_ID} retiré à ${newMember.user.tag} après sa promotion vers ${promotedRole.name}.`);
  }).catch((error) => {
    console.error(`Impossible de retirer le rôle ${ROLE_MANAGER_ID} à ${newMember.user.tag}.`, error);
  });
}

function forbiddenPermissionNames(permissionBits) {
  return Object.entries(PermissionFlagsBits)
    .filter(([, bit]) => (permissionBits & bit) === bit)
    .map(([name]) => name)
    .join(', ');
}

function isProtectedRoleManager(member, removedRoleId = null, previousMemberIds = []) {
  if (!member) return false;
  if (member.roles.cache.has(ROLE_MANAGER_ID)
    || [...PROTECTED_ROLE_ASSIGNERS].some((roleId) => member.roles.cache.has(roleId))) return true;
  return previousMemberIds.includes(member.id)
    && (removedRoleId === ROLE_MANAGER_ID || PROTECTED_ROLE_ASSIGNERS.has(removedRoleId));
}

async function blacklistAndBan(member, reason) {
  const guildData = getGuildData(member.guild.id);
  if (!guildData.securityBlacklist.includes(member.id)) {
    guildData.securityBlacklist.push(member.id);
    await saveStore();
  }
  let response = 'Compte banni et ajouté à la blacklist persistante';
  try {
    await member.ban({ reason });
    console.log(`${member.user.tag} banni et placé sur la blacklist : ${reason}.`);
  } catch (error) {
    response = 'Blacklist enregistrée, mais le bannissement a échoué';
    console.error(`Impossible de bannir ${member.user.tag}, mais sa blacklist est enregistrée.`, error);
  }
  await sendSecurityLog(member.guild, 'blacklist', 'Compte blacklisté', [
    `- **Auteur** — <@${member.id}> (${member.id})`,
    `- **Action** — ${reason}`,
    `- **Réponse** — ${response}`,
  ]);
}

async function blacklistAndBanById(guild, userId, reason) {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (member) {
    await blacklistAndBan(member, reason);
    return;
  }
  const guildData = getGuildData(guild.id);
  if (!guildData.securityBlacklist.includes(userId)) {
    guildData.securityBlacklist.push(userId);
    await saveStore();
  }
  let response = 'Compte banni et ajouté à la blacklist persistante';
  await guild.members.ban(userId, { reason }).catch((error) => {
    response = 'Blacklist enregistrée, mais le bannissement a échoué';
    console.error(`Impossible de bannir ${userId}, mais sa blacklist est enregistrée.`, error);
  });
  await sendSecurityLog(guild, 'blacklist', 'Compte blacklisté', [
    `- **Auteur** — <@${userId}> (${userId})`,
    `- **Action** — ${reason}`,
    `- **Réponse** — ${response}`,
  ]);
}

function serializeRoleBackup(role) {
  const channelOverwrites = [];
  for (const channel of role.guild.channels.cache.values()) {
    if (!('permissionOverwrites' in channel)) continue;
    const overwrite = channel.permissionOverwrites.cache.get(role.id);
    if (!overwrite) continue;
    channelOverwrites.push({
      channelId: channel.id,
      allow: overwrite.allow.bitfield.toString(),
      deny: overwrite.deny.bitfield.toString(),
    });
  }
  return {
    name: role.name,
    color: role.color,
    colors: {
      primaryColor: role.colors.primaryColor,
      secondaryColor: role.colors.secondaryColor,
      tertiaryColor: role.colors.tertiaryColor,
    },
    hoist: role.hoist,
    permissions: role.permissions.bitfield.toString(),
    mentionable: role.mentionable,
    iconUrl: role.iconURL({ extension: 'png', size: 256 }),
    unicodeEmoji: role.unicodeEmoji,
    position: role.position,
    memberIds: [...role.members.keys()],
    channelOverwrites,
  };
}

function permissionOverwriteOptions(allowValue, denyValue) {
  const allow = BigInt(allowValue ?? 0);
  const deny = BigInt(denyValue ?? 0);
  const options = {};
  for (const [permissionName, permissionBit] of Object.entries(PermissionFlagsBits)) {
    if ((allow & permissionBit) === permissionBit) options[permissionName] = true;
    else if ((deny & permissionBit) === permissionBit) options[permissionName] = false;
  }
  return options;
}

async function downloadRoleIcon(iconUrl) {
  if (!iconUrl) return null;
  try {
    const response = await fetch(iconUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`Impossible de télécharger l’icône de rôle ${iconUrl}.`, error);
    return null;
  }
}

async function backupRole(role) {
  if (role.id === role.guild.id || role.managed) return;
  const guildData = getGuildData(role.guild.id);
  guildData.roleBackups[role.id] = serializeRoleBackup(role);
  await saveStore();
}

async function backupGuildRoles(guild) {
  await guild.members.fetch();
  const guildData = getGuildData(guild.id);
  for (const role of guild.roles.cache.values()) {
    if (role.id === guild.id || role.managed) continue;
    guildData.roleBackups[role.id] = serializeRoleBackup(role);
  }
  await saveStore();
}

async function updateChannelRoleOverwriteBackups(oldChannel, newChannel) {
  if (!oldChannel.guild || !newChannel.guild) return;
  const roleIds = new Set();
  for (const channel of [oldChannel, newChannel]) {
    if (!('permissionOverwrites' in channel)) continue;
    for (const overwrite of channel.permissionOverwrites.cache.values()) {
      if (overwrite.type === 0) roleIds.add(overwrite.id);
    }
  }
  for (const roleId of roleIds) {
    const role = newChannel.guild.roles.cache.get(roleId);
    if (role && !role.managed) await backupRole(role);
  }
}

async function updateRoleMemberBackups(oldMember, newMember) {
  const changedRoleIds = new Set([
    ...oldMember.roles.cache
      .filter((role) => !newMember.roles.cache.has(role.id))
      .keys(),
    ...newMember.roles.cache
      .filter((role) => !oldMember.roles.cache.has(role.id))
      .keys(),
  ]);
  if (!changedRoleIds.size) return;

  const guildData = getGuildData(newMember.guild.id);
  let changed = false;
  for (const roleId of changedRoleIds) {
    const role = newMember.guild.roles.cache.get(roleId);
    // Si le rôle vient d’être supprimé, conserver son dernier instantané intact.
    if (!role || role.id === newMember.guild.id || role.managed) continue;
    guildData.roleBackups[role.id] = serializeRoleBackup(role);
    changed = true;
  }
  if (changed) await saveStore();
}

async function punishForbiddenRolePermissions(role, safePermissionBits, addedBits, auditType) {
  const actorId = await findRoleAuditActor(role.guild, role.id, auditType);
  if (!actorId || actorId === client.user.id) return;

  const actor = await role.guild.members.fetch(actorId).catch(() => null);
  if (!isProtectedRoleManager(actor)) return;

  const names = forbiddenPermissionNames(addedBits);
  const reason = `Ajout de permissions interdites sur ${role.name} : ${names}`;

  try {
    await role.setPermissions(safePermissionBits, `Protection automatique : ${reason}`);
  } catch (error) {
    console.error(`Impossible de restaurer les permissions du rôle ${role.name}.`, error);
  }

  await sendSecurityLog(role.guild, 'permissions', 'Permissions interdites ajoutées', [
    `- **Auteur** — <@${actor.id}> (${actor.id})`,
    `- **Cible** — rôle ${role.name} (${role.id})`,
    `- **Action** — ajout de ${names}`,
    '- **Réponse** — permissions annulées et bannissement demandé',
  ]);
  await blacklistAndBan(actor, reason);
}

async function handleRoleCreate(role) {
  const addedBits = role.permissions.bitfield & FORBIDDEN_ROLE_PERMISSIONS.bitfield;
  if (addedBits !== 0n) {
    const safeBits = role.permissions.bitfield & ~FORBIDDEN_ROLE_PERMISSIONS.bitfield;
    await punishForbiddenRolePermissions(role, safeBits, addedBits, AuditLogEvent.RoleCreate);
  }
  const ceilingRole = role.guild.roles.cache.get(ROLE_MANAGER_ID);
  const guildData = getGuildData(role.guild.id);
  if (guildData.roleCeilingProtectionInitialized
    && ceilingRole
    && role.id !== ROLE_MANAGER_ID
    && !role.managed
    && role.position < ceilingRole.position
    && !guildData.roleCeilingProtectedIds.includes(role.id)) {
    guildData.roleCeilingProtectedIds.push(role.id);
    await saveStore();
  }
  const creationAnchor = role.guild.roles.cache.get(SNIPE_ROLE_ID);
  if (!role.managed && role.id !== role.guild.id && role.id !== SNIPE_ROLE_ID && role.editable && creationAnchor) {
    await role.setPosition(
      creationAnchor.position + 1,
      `Placement automatique au-dessus de ${creationAnchor.name}`,
    ).catch((error) => {
      console.error(`Impossible de placer le nouveau rôle ${role.name} au-dessus de ${creationAnchor.name}.`, error);
    });
  }
  await backupRole(role);
}

async function protectRankRolePermissions(oldRole, newRole) {
  const protectedRankIds = new Set(RANKS.map(({ roleId }) => roleId));
  if (!protectedRankIds.has(newRole.id)
    || oldRole.permissions.bitfield === newRole.permissions.bitfield) return false;

  const actorId = await findRoleAuditActor(newRole.guild, newRole.id, AuditLogEvent.RoleUpdate);
  if (actorId === client.user.id) {
    await backupRole(newRole);
    return true;
  }
  if (actorId === OWNER_COMMAND_USER_ID || actorId === newRole.guild.ownerId) {
    await backupRole(newRole);
    return true;
  }

  const before = oldRole.permissions.bitfield;
  const after = newRole.permissions.bitfield;
  const changedBits = before ^ after;
  const changedNames = forbiddenPermissionNames(changedBits) || `bits ${changedBits.toString()}`;
  const reason = `Modification interdite des permissions du rôle ${newRole.name}`;
  let restoration = 'Permissions précédentes restaurées';
  try {
    await newRole.setPermissions(before, `Protection automatique : ${reason}`);
    await backupRole(oldRole);
  } catch (error) {
    restoration = 'Échec de la restauration des permissions';
    console.error(`Impossible de restaurer toutes les permissions de ${newRole.name}.`, error);
  }

  const actor = actorId
    ? await newRole.guild.members.fetch(actorId).catch(() => null)
    : null;
  let sanction = 'Auteur introuvable, aucune blacklist appliquée';
  if (actor) {
    await blacklistAndBan(actor, reason);
    sanction = 'Blacklist persistante et bannissement demandés';
  }

  await sendSecurityLog(newRole.guild, 'permissions', 'Permissions d’un rank protégées', [
    `- **Auteur** — ${actor ? `<@${actor.id}> (${actor.id})` : 'Inconnu'}`,
    `- **Rôle** — <@&${newRole.id}> (${newRole.id})`,
    `- **Permissions touchées** — ${changedNames}`,
    `- **Réponse** — ${restoration} · ${sanction}`,
  ]);
  return true;
}

async function handleRoleUpdate(oldRole, newRole) {
  if (await protectRankRolePermissions(oldRole, newRole)) return;
  const newlyAddedBits = newRole.permissions.bitfield
    & ~oldRole.permissions.bitfield
    & FORBIDDEN_ROLE_PERMISSIONS.bitfield;
  const removedBits = oldRole.permissions.bitfield & ~newRole.permissions.bitfield;
  if (newlyAddedBits !== 0n) {
    await punishForbiddenRolePermissions(
      newRole,
      oldRole.permissions.bitfield,
      newlyAddedBits,
      AuditLogEvent.RoleUpdate,
    );
  }
  if (removedBits !== 0n) {
    const actorId = await findRoleAuditActor(newRole.guild, newRole.id, AuditLogEvent.RoleUpdate);
    if (actorId && actorId !== client.user.id) {
      const actor = await newRole.guild.members.fetch(actorId).catch(() => null);
      if (isProtectedRoleManager(actor)) {
        const names = forbiddenPermissionNames(removedBits) || `bits ${removedBits.toString()}`;
        const reason = `Suppression interdite de permissions sur ${newRole.name} : ${names}`;
        await newRole.setPermissions(oldRole.permissions.bitfield, `Protection automatique : ${reason}`)
          .catch((error) => console.error(`Impossible de restaurer les permissions de ${newRole.name}.`, error));
        await sendSecurityLog(newRole.guild, 'permissions', 'Permissions supprimées', [
          `- **Auteur** — <@${actor.id}> (${actor.id})`,
          `- **Cible** — rôle ${newRole.name} (${newRole.id})`,
          `- **Action** — retrait de ${names}`,
          '- **Réponse** — permissions restaurées et bannissement demandé',
        ]);
        await blacklistAndBan(actor, reason);
      }
    }
  }
  await backupRole(newRole);
}

async function refreshGuildCommands(guild) {
  const roleNames = Object.fromEntries(
    guild.roles.cache.map((role) => [role.id, role.name]),
  );
  await guild.commands.set(buildCommands(roleNames));
  console.log(`Commandes slash actualisées sur ${guild.name}.`);
}

function isCriticalProtectedRole(role) {
  const criticalIds = new Set([
    ROLE_MANAGER_ID,
    ...RANKS.map(({ roleId }) => roleId),
  ]);
  if (criticalIds.has(role.id)) return true;
  const normalizedName = role.name.normalize('NFKC').toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();
  return [
    'pvcool elite',
    'pvcool premium',
    'pvcool plus',
    'pvcool basic',
    'perm x rôle / touche = bl',
  ].includes(normalizedName);
}

async function handleRoleDelete(role) {
  if (role.id === role.guild.id || role.managed) return;
  const guildData = getGuildData(role.guild.id);
  guildData.roleCeilingProtectedIds = guildData.roleCeilingProtectedIds
    .filter((roleId) => roleId !== role.id);
  guildData.roleCeilingOwnerExemptions = guildData.roleCeilingOwnerExemptions
    .filter((roleId) => roleId !== role.id);
  await saveStore();
  const backup = guildData.roleBackups[role.id] ?? serializeRoleBackup(role);
  const actorId = await findRoleAuditActor(role.guild, role.id, AuditLogEvent.RoleDelete);
  if (!actorId) return;
  if (actorId === OWNER_COMMAND_USER_ID) {
    delete guildData.roleBackups[role.id];
    delete guildData.roleHolders[role.id];
    delete guildData.personalRoleBlockedUsers[role.id];
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions
      .filter((roleId) => roleId !== role.id);
    for (const [memberId, personalRoleId] of Object.entries(guildData.personalRoles)) {
      if (personalRoleId === role.id) delete guildData.personalRoles[memberId];
    }
    await saveStore();
    console.log(`Suppression volontaire du rôle ${role.name} par le propriétaire : aucune restauration.`);
    return;
  }
  if (actorId === client.user.id) {
    delete guildData.roleBackups[role.id];
    delete guildData.personalRoleBlockedUsers[role.id];
    await saveStore();
    return;
  }

  const actor = await role.guild.members.fetch(actorId).catch(() => null);
  const reason = `Suppression interdite du rôle ${role.name} (${role.id})`;
  const criticalRole = isCriticalProtectedRole(role);
  if (criticalRole) {
    await blacklistAndBanById(role.guild, actorId, reason);
  }

  let restoredRole = null;
  try {
    const icon = await downloadRoleIcon(backup.iconUrl);
    const colors = {
      primaryColor: backup.colors?.primaryColor ?? backup.color ?? 0,
      ...(backup.colors?.secondaryColor !== null && backup.colors?.secondaryColor !== undefined
        ? { secondaryColor: backup.colors.secondaryColor }
        : {}),
      ...(backup.colors?.tertiaryColor !== null && backup.colors?.tertiaryColor !== undefined
        ? { tertiaryColor: backup.colors.tertiaryColor }
        : {}),
    };
    restoredRole = await role.guild.roles.create({
      name: backup.name,
      colors,
      hoist: backup.hoist,
      permissions: backup.permissions,
      mentionable: backup.mentionable,
      icon: icon ?? undefined,
      unicodeEmoji: icon ? undefined : (backup.unicodeEmoji ?? undefined),
      reason: `Restauration automatique après suppression par ${actor?.user.tag ?? actorId}`,
    });

    const botMember = role.guild.members.me;
    const maximumPosition = Math.max(1, (botMember?.roles.highest.position ?? 1) - 1);
    await restoredRole.setPosition(Math.min(backup.position, maximumPosition), 'Restauration de la position du rôle')
      .catch(console.error);

    let restoredChannels = 0;
    for (const overwrite of backup.channelOverwrites ?? []) {
      const channel = await role.guild.channels.fetch(overwrite.channelId).catch(() => null);
      if (!channel || !('permissionOverwrites' in channel)) continue;
      await channel.permissionOverwrites.create(
        restoredRole,
        permissionOverwriteOptions(overwrite.allow, overwrite.deny),
        { reason: `Restauration des permissions de salon du rôle ${backup.name}` },
      ).then(() => {
        restoredChannels += 1;
      }).catch((error) => {
        console.error(`Impossible de restaurer les permissions de ${backup.name} dans ${channel.name}.`, error);
      });
    }

    let restoredMembers = 0;
    for (const memberId of backup.memberIds ?? []) {
      const member = await role.guild.members.fetch(memberId).catch(() => null);
      if (!member || !restoredRole.editable) continue;
      await member.roles.add(restoredRole, 'Restauration automatique du rôle supprimé').catch(console.error);
      if (member.roles.cache.has(restoredRole.id)) restoredMembers += 1;
    }

    delete guildData.roleBackups[role.id];
    guildData.roleBackups[restoredRole.id] = serializeRoleBackup(restoredRole);
    for (const [memberId, personalRoleId] of Object.entries(guildData.personalRoles)) {
      if (personalRoleId === role.id) guildData.personalRoles[memberId] = restoredRole.id;
    }
    if (guildData.roleHolders[role.id]) {
      guildData.roleHolders[restoredRole.id] = [...guildData.roleHolders[role.id]];
      delete guildData.roleHolders[role.id];
    }
    if (guildData.personalRoleBlockedUsers[role.id]) {
      guildData.personalRoleBlockedUsers[restoredRole.id] = [...guildData.personalRoleBlockedUsers[role.id]];
      delete guildData.personalRoleBlockedUsers[role.id];
    }
    guildData.personalRolePositionExemptions = guildData.personalRolePositionExemptions
      .map((roleId) => (roleId === role.id ? restoredRole.id : roleId));
    await saveStore();
    console.log(`Rôle ${backup.name} recréé, restauré dans ${restoredChannels}/${backup.channelOverwrites?.length ?? 0} salon(s) et rendu à ${restoredMembers}/${backup.memberIds?.length ?? 0} membre(s).`);
    await sendSecurityLog(role.guild, 'restore', 'Rôle supprimé restauré', [
      `- **Auteur** — <@${actorId}> (${actorId})`,
      `- **Cible** — ${backup.name} (${role.id})`,
      `- **Action** — suppression du rôle`,
      `- **Réponse** — rôle recréé (${restoredRole.id}), permissions restaurées dans ${restoredChannels}/${backup.channelOverwrites?.length ?? 0} salon(s) et rendu à ${restoredMembers}/${backup.memberIds?.length ?? 0} membre(s)`,
    ]);
  } catch (error) {
    console.error(`Impossible de restaurer le rôle supprimé ${backup.name}.`, error);
  }

  if (!actor) return;
  if (!criticalRole && isProtectedRoleManager(actor, role.id, backup.memberIds ?? [])) {
    await blacklistAndBan(actor, reason);
  }
}

async function enforceSecurityBlacklist(member) {
  const guildData = getGuildData(member.guild.id);
  if (!guildData.securityBlacklist.includes(member.id)) return;
  let response = 'Compte rebanni automatiquement';
  await member.ban({ reason: 'Compte présent sur la blacklist de sécurité' })
    .catch((error) => {
      response = 'Échec du bannissement automatique';
      console.error(`Impossible de rebannir le compte blacklisté ${member.user.tag}.`, error);
    });
  await sendSecurityLog(member.guild, 'blacklist', 'Retour d’un compte blacklisté', [
    `- **Auteur** — <@${member.id}> (${member.id})`,
    '- **Action** — tentative de retour sur le serveur',
    `- **Réponse** — ${response}`,
  ]);
}

async function reconcileDogNicknames(guild) {
  const guildData = getGuildData(guild.id);
  for (const [targetId, dog] of Object.entries(guildData.dogs)) {
    const [target, actor] = await Promise.all([
      guild.members.fetch(targetId).catch(() => null),
      guild.members.fetch(dog.ownerId).catch(() => null),
    ]);
    if (!target || !actor || !target.manageable) continue;
    const nickname = buildDogNickname(target, actor, dog.originalNickname);
    if (target.nickname !== nickname) {
      await target.setNickname(nickname, 'Mise à jour automatique du format /dog').catch(console.error);
    }
  }
}

async function reconcileLockedNicknames(guild) {
  const guildData = getGuildData(guild.id);
  for (const [memberId, lock] of Object.entries(guildData.lockedNicknames)) {
    const member = await guild.members.fetch(memberId).catch(() => null);
    if (!member) {
      delete guildData.lockedNicknames[memberId];
      continue;
    }
    if (guildData.dogs[memberId] || !member.manageable) continue;
    if (member.nickname !== lock.nickname) {
      await member.setNickname(lock.nickname, 'Restauration automatique du pseudo verrouillé').catch(console.error);
    }
  }
  await saveStore();
}

async function reconcilePrivateVoices(guild) {
  const guildData = getGuildData(guild.id);
  let changed = false;
  for (const [channelId, privateVoice] of Object.entries(guildData.privateVoices)) {
    const owner = await guild.members.fetch(privateVoice.ownerId).catch(() => null);
    if (privateVoice.managedPanel) {
      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel?.isVoiceBased() || !owner) {
        if (channel) await channel.delete('Nettoyage d’un vocal personnel sans propriétaire').catch(console.error);
        delete guildData.privateVoices[channelId];
        changed = true;
      } else if (!Number.isFinite(privateVoice.lastActiveAt)) {
        privateVoice.lastActiveAt = Date.now();
        changed = true;
      }
      continue;
    }
    if (!owner || owner.voice.channelId !== channelId) {
      await unlockPrivateVoice(guild, channelId, 'Nettoyage automatique après redémarrage');
    }
  }
  if (changed) await saveStore();
}

async function cleanupInactivePrivateVoices(guild) {
  const guildData = getGuildData(guild.id);
  const now = Date.now();
  let changed = false;

  for (const [channelId, privateVoice] of Object.entries(guildData.privateVoices)) {
    if (!privateVoice.managedPanel) continue;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isVoiceBased() || channel.parentId !== PRIVATE_VOICE_CATEGORY_ID) {
      delete guildData.privateVoices[channelId];
      changed = true;
      continue;
    }

    const hasHumanActivity = channel.members.some((member) => !member.user.bot);
    if (hasHumanActivity) {
      if (privateVoice.lastActiveAt !== now) {
        privateVoice.lastActiveAt = now;
        changed = true;
      }
      continue;
    }

    if (!Number.isFinite(privateVoice.lastActiveAt)) {
      privateVoice.lastActiveAt = now;
      changed = true;
      continue;
    }
    if (now - privateVoice.lastActiveAt < PRIVATE_VOICE_INACTIVITY_MS) continue;

    const deletedChannel = { id: channel.id, name: channel.name };
    const deleted = await channel.delete('Suppression automatique après 7 jours sans activité')
      .then(() => true)
      .catch((error) => {
        console.error(`Impossible de supprimer le vocal inactif ${channel.name}.`, error);
        return false;
      });
    if (!deleted) continue;

    delete guildData.privateVoices[channelId];
    changed = true;
    await sendPersonalVoiceLog(
      guild,
      'Salon inactif supprimé',
      { id: privateVoice.ownerId },
      deletedChannel,
      [
        '**Motif** — aucune activité depuis 7 jours',
        '**Recréation** — le prochain salon repartira avec les permissions actuelles de la catégorie',
      ],
    ).catch(console.error);
  }

  if (changed) await saveStore();
}

async function reconcileGiveaways(guild) {
  const guildData = getGuildData(guild.id);
  for (const [messageId, giveaway] of Object.entries(guildData.giveaways)) {
    if (giveaway.status !== 'active') continue;
    if (giveaway.participationMode !== 'reaction') {
      giveaway.participationMode = 'reaction';
      giveaway.participants = [];
      await saveStore();
    }
    if (giveaway.endAt <= Date.now()) {
      await finishGiveaway(guild, messageId).catch(console.error);
      continue;
    }
    const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
    const giveawayMessage = channel?.isTextBased() && 'messages' in channel
      ? await channel.messages.fetch(messageId).catch(() => null)
      : null;
    if (giveawayMessage) {
      await giveawayMessage.edit({
        ...giveawayPayload(giveaway),
        allowedMentions: { parse: [] },
      }).catch(console.error);
      if (!giveawayMessage.reactions.cache.some((reaction) => reaction.emoji.name === '💎')) {
        await giveawayMessage.react('💎').catch(console.error);
      }
    }
    scheduleGiveaway(guild, messageId);
  }
}

function musicBotRoles(guild) {
  return guild.roles.cache.filter((role) => MUSIC_BOT_ROLE_NAME.test(role.name));
}

async function configureMusicBotChannel(channel, roles = musicBotRoles(channel.guild)) {
  if (!channel?.permissionOverwrites || channel.isThread?.()) return;
  const judgmentCategoryId = channel.guild.channels.cache.get(BAN_JUDGMENT_CHANNEL_ID)?.parentId;
  const isBlockedArea = MUSIC_BOT_BLOCKED_CATEGORY_IDS.has(channel.id)
    || MUSIC_BOT_BLOCKED_CATEGORY_IDS.has(channel.parentId)
    || channel.id === BAN_JUDGMENT_CHANNEL_ID
    || (judgmentCategoryId && channel.parentId === judgmentCategoryId);
  const isReadOnlyArea = channel.id === MUSIC_BOT_READ_ONLY_CATEGORY_ID
    || channel.parentId === MUSIC_BOT_READ_ONLY_CATEGORY_ID;
  const canWrite = !isBlockedArea && (!isReadOnlyArea || channel.id === MUSIC_BOT_WRITABLE_CHANNEL_ID);
  for (const role of roles.values()) {
    if (isBlockedArea) {
      if (channel.permissionOverwrites.cache.has(role.id)) {
        await channel.permissionOverwrites.delete(
          role.id,
          'Retrait des bots musique de cette zone',
        ).catch((error) => {
          console.error(`Impossible de retirer ${role.name} de ${channel.name}.`, error);
        });
      }
      continue;
    }
    await channel.permissionOverwrites.edit(role, {
      ViewChannel: true,
      SendMessages: canWrite,
      SendMessagesInThreads: canWrite,
      EmbedLinks: true,
      AttachFiles: true,
      ReadMessageHistory: true,
      AddReactions: true,
      UseExternalEmojis: true,
      UseExternalStickers: true,
      UseApplicationCommands: true,
      Connect: true,
      Speak: true,
      Stream: true,
      UseVAD: true,
      UseSoundboard: true,
      UseExternalSounds: true,
      RequestToSpeak: true,
    }, { reason: 'Permissions minimales des bots musique' }).catch((error) => {
      console.error(`Impossible d’autoriser ${role.name} dans ${channel.name}.`, error);
    });
  }
}

async function configureMusicBotRoles(guild) {
  await guild.roles.fetch().catch(() => null);
  const roles = musicBotRoles(guild);
  for (const role of roles.values()) {
    if (!role.editable) {
      console.warn(`Le rôle ${role.name} est trop haut pour être configuré par le bot.`);
      continue;
    }
    const permissions = new PermissionsBitField(role.permissions)
      .remove(PermissionFlagsBits.Administrator)
      .add(MUSIC_BOT_PERMISSIONS);
    await role.setPermissions(permissions, 'Retrait Administrateur et permissions minimales de bot musique')
      .catch((error) => console.error(`Impossible de configurer le rôle ${role.name}.`, error));
  }
  const channels = await guild.channels.fetch().catch(() => guild.channels.cache);
  for (const channel of channels.values()) {
    if (channel) await configureMusicBotChannel(channel, roles);
  }
  const guildData = getGuildData(guild.id);
  const musicRoleIds = new Set(roles.keys());
  for (const backup of Object.values(guildData.protectedChannels ?? {})) {
    const judgmentCategoryId = guild.channels.cache.get(BAN_JUDGMENT_CHANNEL_ID)?.parentId;
    const isBlockedBackup = MUSIC_BOT_BLOCKED_CATEGORY_IDS.has(backup.id)
      || MUSIC_BOT_BLOCKED_CATEGORY_IDS.has(backup.parentId)
      || backup.id === BAN_JUDGMENT_CHANNEL_ID
      || (judgmentCategoryId && backup.parentId === judgmentCategoryId);
    if (isBlockedBackup) {
      backup.permissionOverwrites = backup.permissionOverwrites
        .filter((overwrite) => !musicRoleIds.has(overwrite.id));
    }
  }
  await saveStore();
  console.log(`${roles.size} rôle(s) de bots musique configuré(s) sur ${guild.name}.`);
}

function normalizedChannelName(name) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isProtectedChannelCategory(channel) {
  if (channel.type !== ChannelType.GuildCategory) return false;
  const name = normalizedChannelName(channel.name);
  const compact = name.replace(/\s+/g, '');
  return PROTECTED_CHANNEL_CATEGORY_NAMES.some((expected) => {
    if (expected === 'pvcool') return compact.includes('pvcool');
    if (expected === 'quete et evenements') return name.includes('quete') && name.includes('evenement');
    return name === expected || name.startsWith(expected) || name.endsWith(expected);
  });
}

function channelBackup(channel) {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    parentId: channel.parentId,
    position: channel.rawPosition ?? channel.position,
    topic: channel.topic ?? null,
    nsfw: channel.nsfw ?? false,
    rateLimitPerUser: channel.rateLimitPerUser ?? 0,
    bitrate: channel.bitrate ?? null,
    userLimit: channel.userLimit ?? null,
    rtcRegion: channel.rtcRegion ?? null,
    videoQualityMode: channel.videoQualityMode ?? null,
    defaultAutoArchiveDuration: channel.defaultAutoArchiveDuration ?? null,
    defaultThreadRateLimitPerUser: channel.defaultThreadRateLimitPerUser ?? null,
    permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => ({
      id: overwrite.id,
      type: overwrite.type,
      allow: overwrite.allow.bitfield.toString(),
      deny: overwrite.deny.bitfield.toString(),
    })),
  };
}

function isChannelPositionOnlyUpdate(oldChannel, newChannel) {
  if (oldChannel.rawPosition === newChannel.rawPosition) return false;
  const normalize = (channel) => {
    const backup = channelBackup(channel);
    delete backup.position;
    backup.permissionOverwrites.sort((left, right) => left.id.localeCompare(right.id));
    return backup;
  };
  return JSON.stringify(normalize(oldChannel)) === JSON.stringify(normalize(newChannel));
}

async function backupProtectedChannels(guild) {
  const channels = await guild.channels.fetch().catch(() => guild.channels.cache);
  const protectedCategories = channels.filter((channel) => channel && (
    isProtectedChannelCategory(channel) || OWNER_LOCKED_CATEGORY_IDS.has(channel.id)
  ));
  const guildData = getGuildData(guild.id);
  guildData.protectedChannels ??= {};
  for (const category of protectedCategories.values()) {
    const ownerLocked = OWNER_LOCKED_CATEGORY_IDS.has(category.id);
    if (!ownerLocked || !guildData.protectedChannels[category.id]) {
      guildData.protectedChannels[category.id] = channelBackup(category);
    }
    for (const channel of channels.values()) {
      if (channel?.parentId === category.id
        && (!ownerLocked || !guildData.protectedChannels[channel.id])) {
        guildData.protectedChannels[channel.id] = channelBackup(channel);
      }
    }
  }
  await saveStore();
  for (const channel of channels.values()) {
    const protectedCategoryId = channel?.type === ChannelType.GuildCategory
      ? channel.id
      : channel?.parentId;
    if (!channel || !OWNER_LOCKED_CATEGORY_IDS.has(protectedCategoryId)) continue;
    const backup = guildData.protectedChannels[channel.id];
    if (!backup || channel.name === backup.name) continue;
    restoringOwnerLockedCategories.add(channel.id);
    await channel.setName(backup.name, 'Protection propriétaire : restauration au démarrage').catch(console.error);
    setTimeout(() => restoringOwnerLockedCategories.delete(channel.id), 2_000);
  }
  const missingBackups = Object.values(guildData.protectedChannels)
    .filter((backup) => !guild.channels.cache.has(backup.id))
    .sort((left, right) => (left.type === ChannelType.GuildCategory ? -1 : 0)
      - (right.type === ChannelType.GuildCategory ? -1 : 0));
  for (const backup of missingBackups) {
    await restoreProtectedChannel({ id: backup.id, name: backup.name, guild }).catch(console.error);
  }
  console.log(`${Object.keys(guildData.protectedChannels).length} salon(s) protégé(s) sauvegardé(s) sur ${guild.name}.`);
}

async function banChannelDeleter(guild, deletedChannel) {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 8 }).catch(() => null);
  const entry = logs?.entries.find((candidate) => candidate.targetId === deletedChannel.id
    && Date.now() - candidate.createdTimestamp < 15_000);
  const executorId = entry?.executorId ?? entry?.executor?.id;
  if (!executorId || executorId === guild.client.user.id) return null;
  if (CHANNEL_MANAGEMENT_USER_IDS.has(executorId)) return executorId;
  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member || member.user.bot || executorId === guild.ownerId) return executorId;
  await member.ban({ reason: `Suppression du salon protégé #${deletedChannel.name}` }).catch(console.error);
  return executorId;
}

async function restoreProtectedChannel(deletedChannel) {
  const guild = deletedChannel.guild;
  const guildData = getGuildData(guild.id);
  const backup = guildData.protectedChannels?.[deletedChannel.id];
  if (!backup) return false;
  const actorId = await banChannelDeleter(guild, deletedChannel);
  if (CHANNEL_MANAGEMENT_USER_IDS.has(actorId)) {
    delete guildData.protectedChannels[deletedChannel.id];
    for (const childBackup of Object.values(guildData.protectedChannels)) {
      if (childBackup.parentId !== deletedChannel.id) continue;
      const child = guild.channels.cache.get(childBackup.id);
      if (child) guildData.protectedChannels[child.id] = channelBackup(child);
      else childBackup.parentId = null;
    }
    await saveStore();
    return true;
  }
  const permissionOverwrites = backup.permissionOverwrites.map((overwrite) => ({
    id: overwrite.id,
    type: overwrite.type,
    allow: BigInt(overwrite.allow),
    deny: BigInt(overwrite.deny),
  }));
  const options = {
    name: backup.name,
    type: backup.type,
    parent: backup.type === ChannelType.GuildCategory ? undefined : backup.parentId,
    position: backup.position,
    permissionOverwrites,
    reason: 'Restauration automatique d’un salon protégé',
  };
  if (backup.topic !== null) options.topic = backup.topic;
  if (backup.nsfw) options.nsfw = true;
  if (backup.rateLimitPerUser) options.rateLimitPerUser = backup.rateLimitPerUser;
  if (backup.bitrate) options.bitrate = backup.bitrate;
  if (backup.userLimit !== null) options.userLimit = backup.userLimit;
  if (backup.rtcRegion) options.rtcRegion = backup.rtcRegion;
  if (backup.videoQualityMode) options.videoQualityMode = backup.videoQualityMode;
  if (backup.defaultAutoArchiveDuration) options.defaultAutoArchiveDuration = backup.defaultAutoArchiveDuration;
  if (backup.defaultThreadRateLimitPerUser) options.defaultThreadRateLimitPerUser = backup.defaultThreadRateLimitPerUser;
  const restored = await guild.channels.create(options);
  await restored.setPosition(backup.position).catch(() => null);
  delete guildData.protectedChannels[deletedChannel.id];
  backup.id = restored.id;
  guildData.protectedChannels[restored.id] = backup;
  if (backup.type === ChannelType.GuildCategory) {
    for (const childBackup of Object.values(guildData.protectedChannels)) {
      if (childBackup.parentId !== deletedChannel.id) continue;
      childBackup.parentId = restored.id;
      const child = guild.channels.cache.get(childBackup.id);
      if (child) await child.setParent(restored.id, { lockPermissions: false }).catch(console.error);
    }
  }
  await saveStore();
  await sendSecurityLog(guild, 'restore', 'Salon protégé restauré', [
    `- **Salon** — ${restored} (${backup.name})`,
    `- **Auteur** — ${actorId ? `<@${actorId}> (${actorId})` : 'introuvable'}`,
    '- **Réponse** — restauration complète et bannissement immédiat',
  ]).catch(console.error);
  return true;
}

async function protectedChannelUpdateActor(channel) {
  await new Promise((resolve) => setTimeout(resolve, 1_200));
  const auditLogs = await channel.guild.fetchAuditLogs({ limit: 20 }).catch(() => null);
  const relevantActions = new Set([
    AuditLogEvent.ChannelUpdate,
    AuditLogEvent.ChannelOverwriteCreate,
    AuditLogEvent.ChannelOverwriteUpdate,
    AuditLogEvent.ChannelOverwriteDelete,
  ]);
  // Priorité absolue aux deux propriétaires : un déplacement ou une édition
  // peut générer plusieurs ChannelUpdate sans cible d'audit correspondante.
  // Si l'une de leurs actions vient d'avoir lieu, aucune restauration ne doit
  // démarrer sur les mises à jour produites par cette même action.
  const authorizedOwnerEntry = auditLogs?.entries.find((candidate) => {
    const executorId = candidate.executorId ?? candidate.executor?.id;
    return relevantActions.has(candidate.action)
      && CHANNEL_MANAGEMENT_USER_IDS.has(executorId)
      && Date.now() - candidate.createdTimestamp < 15_000;
  });
  if (authorizedOwnerEntry) {
    return authorizedOwnerEntry.executorId ?? authorizedOwnerEntry.executor?.id ?? null;
  }
  const matchingEntries = auditLogs?.entries.filter((candidate) => {
    const affectedChannelId = candidate.targetId === channel.id
      ? channel.id
      : (candidate.extra?.channel?.id ?? candidate.extra?.channelId);
    return affectedChannelId === channel.id
      && relevantActions.has(candidate.action)
      && Date.now() - candidate.createdTimestamp < 15_000;
  }) ?? [];
  // Une restauration automatique peut arriver juste après l'action humaine et
  // devenir l'entrée la plus récente. On privilégie donc toujours l'auteur
  // humain afin que les utilisateurs autorisés à renommer soient reconnus.
  const entry = matchingEntries.find((candidate) => (
    (candidate.executorId ?? candidate.executor?.id) !== channel.guild.client.user.id
  )) ?? matchingEntries.first?.() ?? matchingEntries[0];
  const directActorId = entry?.executorId ?? entry?.executor?.id ?? null;
  if (directActorId) return directActorId;

  return null;
}

async function protectOwnerLockedChannel(oldChannel, newChannel) {
  const protectedCategoryId = newChannel.type === ChannelType.GuildCategory
    ? newChannel.id
    : newChannel.parentId;
  if (!OWNER_LOCKED_CATEGORY_IDS.has(protectedCategoryId)
    || restoringOwnerLockedCategories.has(newChannel.id)) return;
  const guildData = getGuildData(newChannel.guild.id);
  const backup = guildData.protectedChannels?.[newChannel.id] ?? channelBackup(oldChannel);
  // Discord recalcule plusieurs positions lors d'un glisser-déposer. L'ordre
  // choisi doit toujours être conservé et ne doit jamais déclencher une
  // restauration automatique, même si l'audit ne donne aucun auteur.
  if (isChannelPositionOnlyUpdate(oldChannel, newChannel)) {
    guildData.protectedChannels[newChannel.id] = channelBackup(newChannel);
    await saveStore();
    return;
  }
  const actorId = await protectedChannelUpdateActor(newChannel);
  if (actorId === newChannel.guild.client.user.id) {
    guildData.protectedChannels[newChannel.id] = channelBackup(newChannel);
    await saveStore();
    return;
  }
  if (CHANNEL_MANAGEMENT_USER_IDS.has(actorId)) {
    guildData.protectedChannels[newChannel.id] = channelBackup(newChannel);
    await saveStore();
    return;
  }
  if (actorId === OWNER_COMMAND_USER_ID) {
    guildData.protectedChannels[newChannel.id] = channelBackup(newChannel);
    await saveStore();
    return;
  }

  restoringOwnerLockedCategories.add(newChannel.id);
  try {
    const permissionOverwrites = backup.permissionOverwrites.map((overwrite) => ({
      id: overwrite.id,
      type: overwrite.type,
      allow: BigInt(overwrite.allow),
      deny: BigInt(overwrite.deny),
    }));
    if (newChannel.name !== backup.name) {
      await newChannel.setName(backup.name, 'Protection propriétaire : restauration du nom');
    }
    await newChannel.permissionOverwrites.set(
      permissionOverwrites,
      'Protection propriétaire : restauration des permissions',
    );
    if (newChannel.type !== ChannelType.GuildCategory && newChannel.parentId !== backup.parentId) {
      await newChannel.setParent(backup.parentId, { lockPermissions: false });
    }
    await sendSecurityLog(newChannel.guild, 'permissions', 'Salon protégé restauré', [
      `- **Salon** — <#${newChannel.id}> (${backup.name})`,
      `- **Auteur** — ${actorId ? `<@${actorId}> (${actorId})` : 'introuvable'}`,
      '- **Réponse** — nom et permissions remis à leur état autorisé',
    ]).catch(console.error);
  } finally {
    setTimeout(() => restoringOwnerLockedCategories.delete(newChannel.id), 2_000);
  }
}

async function enforceDogNickname(oldMember, newMember) {
  if (oldMember.nickname === newMember.nickname
    && oldMember.displayName === newMember.displayName) return;
  const guildData = getGuildData(newMember.guild.id);
  const ownDogRecord = guildData.dogs[newMember.id];

  if (ownDogRecord && newMember.manageable) {
    const owner = await newMember.guild.members.fetch(ownDogRecord.ownerId).catch(() => null);
    if (owner) {
      const expected = buildDogNickname(newMember, owner, ownDogRecord.originalNickname);
      if (newMember.nickname !== expected) {
        await newMember.setNickname(expected, 'Protection automatique du pseudo /dog');
      }
    }
  }

  for (const [targetId, dog] of Object.entries(guildData.dogs)) {
    if (dog.ownerId !== newMember.id || targetId === newMember.id) continue;
    const target = await newMember.guild.members.fetch(targetId).catch(() => null);
    if (!target?.manageable) continue;
    const expected = buildDogNickname(target, newMember, dog.originalNickname);
    if (target.nickname !== expected) {
      await target.setNickname(expected, 'Mise à jour du nom du maître /dog');
    }
  }
}

async function enforceLockedNickname(oldMember, newMember) {
  if (oldMember.nickname === newMember.nickname) return;
  const guildData = getGuildData(newMember.guild.id);
  const lock = guildData.lockedNicknames[newMember.id];
  if (!lock || guildData.dogs[newMember.id] || !newMember.manageable) return;
  if (newMember.nickname !== lock.nickname) {
    await newMember.setNickname(lock.nickname, 'Protection automatique du pseudo /lockname');
  }
}

async function enforcePersonalRoleBlockedUsers(oldMember, newMember) {
  const addedRoleIds = newMember.roles.cache
    .filter((role) => !oldMember.roles.cache.has(role.id))
    .map((role) => role.id);
  if (!addedRoleIds.length) return;
  const guildData = getGuildData(newMember.guild.id);
  for (const roleId of addedRoleIds) {
    if (!(guildData.personalRoleBlockedUsers[roleId] ?? []).includes(newMember.id)) continue;
    const ownerId = Object.entries(guildData.personalRoles).find(([, id]) => id === roleId)?.[0];
    if (ownerId === newMember.id) continue;
    const role = newMember.guild.roles.cache.get(roleId);
    if (role && newMember.manageable) {
      await newMember.roles.remove(role, 'Membre interdit par le propriétaire du rôle personnel');
      guildData.roleHolders[roleId] = (guildData.roleHolders[roleId] ?? []).filter((id) => id !== newMember.id);
      await saveStore();
    }
  }
}

async function enforcePersonalRoleAssignments(oldMember, newMember) {
  const guildData = getGuildData(newMember.guild.id);
  const personalRoleIds = new Set(Object.values(guildData.personalRoles));
  const manuallyAddedRoles = newMember.roles.cache.filter((role) => (
    personalRoleIds.has(role.id)
    && !oldMember.roles.cache.has(role.id)
    && !consumePersonalRoleAssignmentAuthorization(newMember.guild.id, newMember.id, role.id)
  ));
  if (!manuallyAddedRoles.size || !newMember.manageable) return;

  for (const role of manuallyAddedRoles.values()) {
    await newMember.roles.remove(role, 'Rôle personnel attribuable uniquement avec /perso').catch((error) => {
      console.error(`Impossible de retirer le rôle personnel ${role.name} ajouté manuellement.`, error);
    });
    guildData.roleHolders[role.id] = (guildData.roleHolders[role.id] ?? [])
      .filter((memberId) => memberId !== newMember.id);
    await sendSecurityLog(newMember.guild, 'roles', 'Attribution manuelle d’un rôle personnel annulée', [
      `- **Membre** — <@${newMember.id}> (${newMember.id})`,
      `- **Rôle** — ${role.name} (${role.id})`,
      '- **Action** — rôle retiré automatiquement',
      '- **Règle** — les rôles personnels sont attribuables uniquement avec `/perso`',
    ]).catch(console.error);
  }
  await saveStore();
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Connecté en tant que ${readyClient.user.tag}.`);
  for (const guild of readyClient.guilds.cache.values()) {
    await cleanupLegacyPrivateVoices(guild).catch(console.error);
    await ensureSecurityForum(guild).catch(console.error);
    await ensureCommandLogForums(guild).catch(console.error);
    await ensureProfilePanel(guild).catch(console.error);
    await ensureVoicePanel(guild).catch(console.error);
    await ensurePersonalRolePanel(guild).catch(console.error);
    if (botMode === 'all' && !supportClient) await ensureTicketPanel(guild).catch(console.error);
    await removeBanJudgmentTemplate(guild).catch(console.error);
    await cleanupUnregisteredPersonalRoles(guild).catch(console.error);
    await backupGuildRoles(guild).catch(console.error);
    await ensureRoleCeilingProtection(guild).catch(console.error);
    await enforcePersonalRolePositions(guild).catch(console.error);
    await enforcePersonalRoleVisibility(guild).catch(console.error);
    await reconcileLockedNicknames(guild).catch(console.error);
    await refreshGuildCommands(guild).catch(console.error);
    await reconcileDogNicknames(guild);
    await reconcilePrivateVoices(guild).catch(console.error);
    await cleanupInactivePrivateVoices(guild).catch(console.error);
    await reconcileGiveaways(guild).catch(console.error);
    await backupProtectedChannels(guild).catch(console.error);
    await configureMusicBotRoles(guild).catch(console.error);
    await removeWelcomePanel(guild).catch(console.error);
    for (const [messageId, vote] of Object.entries(getGuildData(guild.id).banVotes)) {
      if (vote.closed) continue;
      if (vote.expiresAt <= Date.now()) await closeBanVote(guild, messageId, 'expired').catch(console.error);
      else {
        const voteChannel = await guild.channels.fetch(vote.channelId).catch(() => null);
        const voteMessage = voteChannel?.isTextBased()
          ? await voteChannel.messages.fetch(messageId).catch(() => null)
          : null;
        if (voteMessage) await voteMessage.edit(banVoteMessage(vote)).catch(console.error);
        scheduleBanVote(guild, messageId);
      }
    }
  }
  const cleanupTimer = setInterval(() => {
    for (const guild of readyClient.guilds.cache.values()) {
      cleanupInactivePrivateVoices(guild).catch(console.error);
    }
  }, PRIVATE_VOICE_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref?.();
});
statsRuntimeClient.once(Events.ClientReady, async (readyClient) => {
  if (!statsModeActive) return;
  console.log(`Système de statistiques connecté en tant que ${readyClient.user.tag}.`);
  await initializeLeaderboards(readyClient);
});
candyRuntimeClient.once(Events.ClientReady, async (readyClient) => {
  if (!candyModeActive) return;
  console.log(`Système de flocons connecté en tant que ${readyClient.user.tag}.`);
  for (const guild of readyClient.guilds.cache.values()) {
    if (!CANDY_GAMES_ENABLED) {
      const guildData = getGuildData(guild.id);
      guildData.candyLeaderboard ??= {};
      guildData.candyLeaderboard.activeTrivia = null;
      halloweenTriviaActivity.delete(guild.id);
    }
    await refreshInviteSnapshot(guild).catch(console.error);
    await rewardCurrentBoosters(guild).catch((error) => {
      console.error(`Impossible de distribuer le cadeau boosters sur ${guild.name}.`, error);
    });
    await syncCandyHolderRole(guild).catch((error) => {
      console.error(`Impossible de synchroniser le rôle ${CANDY_HOLDER_ROLE_NAME} sur ${guild.name}.`, error);
    });
  }
  if (!CANDY_GAMES_ENABLED) await saveStore();
  await initializeCandyLeaderboard(readyClient);
  initializeVoiceCandyRewards(readyClient);
  scheduleCandyHolderRoleSync(readyClient);
});

if (supportClient) {
  supportRuntimeClient.once(Events.ClientReady, async (readyClient) => {
    console.log(`Système de support connecté en tant que ${readyClient.user.tag}.`);
    for (const guild of readyClient.guilds.cache.values()) {
      await guild.commands.set(SUPPORT_COMMANDS).catch(console.error);
      await ensureTicketPanel(guild).catch(console.error);
    }
  });

  supportRuntimeClient.on(Events.InteractionCreate, async (interaction) => {
    if (await handleTicketRating(interaction).catch((error) => {
      console.error('Impossible d’enregistrer la note du ticket.', error);
      return false;
    })) return;
    if (!interaction.inGuild()) return;
    if (interaction.isStringSelectMenu()) {
      await handleTicketSelect(interaction).catch(console.error);
      return;
    }
    if (interaction.isButton()) {
      await handleTicketButton(interaction).catch(console.error);
      return;
    }
    if (interaction.isChatInputCommand()) await handleSupportCommand(interaction).catch(console.error);
  });
}
client.on(Events.MessageCreate, async (message) => {
  try {
    if (await handleBlacklistCommand(message)) return;
    if (await handleUnbanCommand(message)) return;
    const channelCommand = message.content.trim().toLowerCase();
    const canRunChannelCommand = (channelCommand === '+new' && canUseNewCommand(message.member))
      || (['+lock', '+unlock'].includes(channelCommand) && canUseLockCommand(message.member));
    if (canRunChannelCommand) {
      await handleOwnerChannelCommand(message);
      return;
    }
    if (await handleDangerousLink(message)) return;
    if (await handleBadwordCommand(message)) return;
    if (await handleBadwordFilter(message)) return;
    await handleImageThreadMessage(message);
    if (await handleSmashOrPassMessage(message)) return;
    if (await handleMessageAntispam(message)) return;
    await Promise.all([
      handleProfileMediaCommand(message),
      handleSnipeCommand(message),
      handleGiveawayCommand(message),
      handleManagerCommand(message),
    ]);
  } catch (error) {
    console.error('Erreur pendant le traitement d’un message.', error);
  }
});
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  handlePrivateVoiceState(oldState, newState).catch(console.error);
  handleVoiceModerationSecurity(oldState, newState).catch(console.error);
});
statsRuntimeClient.on(Events.MessageCreate, (message) => {
  if (!statsModeActive) return;
  recordLeaderboardMessage(message);
});
statsRuntimeClient.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (!statsModeActive) return;
  recordVoiceState(oldState, newState);
});
statsRuntimeClient.on(Events.InteractionCreate, async (interaction) => {
  if (!statsModeActive || !interaction.inGuild() || !interaction.isButton()) return;
  await handleLeaderboardButton(interaction).catch(console.error);
});
client.on(Events.GuildMemberRemove, (member) => handleMemberLeave(member).catch(console.error));
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await enforceSecurityBlacklist(member);
  } catch (error) {
    console.error('Impossible de traiter la sécurité à l’arrivée.', error);
  }
});
client.on(Events.GuildBanAdd, (ban) => handleBanAbuse(ban).catch(console.error));
client.on(Events.MessageDelete, (message) => rememberDeletedMessage(message));
client.on(Events.MessageBulkDelete, (messages) => {
  const latest = [...messages.values()]
    .filter((message) => message.author && !message.author.bot)
    .sort((left, right) => right.createdTimestamp - left.createdTimestamp)[0];
  if (latest) rememberDeletedMessage(latest);
});
client.on(Events.MessageReactionAdd, (reaction, user) => {
  handleGiveawayReaction(reaction, user, true).catch(console.error);
});
client.on(Events.MessageReactionRemove, (reaction, user) => {
  handleGiveawayReaction(reaction, user, false).catch(console.error);
});
candyRuntimeClient.on(Events.MessageCreate, async (message) => {
  if (!candyModeActive) return;
  try {
    if (await handleCandyDropCommand(message)) return;
    if (CANDY_FAMILY_ENABLED && await handleCandyFamilyCommand(message)) return;
    if (await handleCandyKissCommand(message)) return;
    if (await handleCandyLoveCommand(message)) return;
    if (await handleHiddenQuizCommand(message)) return;
    await handleHalloweenTrivia(message);
    await handleHalloweenCandyReaction(message);
  } catch (error) {
    console.error('Erreur du bot Flocons pendant le traitement d’un message.', error);
  }
});
candyRuntimeClient.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (!candyModeActive) return;
  handleVoiceCandyState(oldState, newState);
});
candyRuntimeClient.on(Events.GuildMemberAdd, (member) => {
  if (!candyModeActive) return;
  if (getGuildData(member.guild.id).securityBlacklist.includes(member.id)) return;
  queueInviteJoinReward(member).catch(console.error);
});
candyRuntimeClient.on(Events.InviteCreate, (invite) => {
  if (!candyModeActive) return;
  const snapshot = inviteSnapshots.get(invite.guild?.id) ?? new Map();
  snapshot.set(invite.code, {
    uses: invite.uses ?? 0,
    maxUses: invite.maxUses ?? 0,
    inviterId: invite.inviterId ?? invite.inviter?.id ?? null,
  });
  if (invite.guild?.id) inviteSnapshots.set(invite.guild.id, snapshot);
});
candyRuntimeClient.on(Events.MessageReactionAdd, (reaction, user) => {
  if (!candyModeActive) return;
  Promise.all([
    handleCandyReaction(reaction, user),
    handleTriviaPollReaction(reaction, user),
  ]).catch(console.error);
});
candyRuntimeClient.on(Events.InteractionCreate, async (interaction) => {
  if (!candyModeActive) return;
  if (!interaction.inGuild()) return;
  if (await handleCandyDropButton(interaction).catch((error) => {
    console.error(error);
    return false;
  })) return;
  if (CANDY_FAMILY_ENABLED && await handleCandyFamilyButton(interaction).catch((error) => {
    console.error(error);
    return false;
  })) return;
  if (await handleCandyKissButton(interaction).catch((error) => {
    console.error(error);
    return false;
  })) return;
  await handleCandyProfileButton(interaction).catch(console.error);
});
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  enforceDogNickname(oldMember, newMember).catch(console.error);
  enforceLockedNickname(oldMember, newMember).catch(console.error);
  enforcePersonalRoleAssignments(oldMember, newMember).catch(console.error);
  protectForbiddenRoleAssignment(oldMember, newMember).catch(console.error);
  removeRedundantRoleManager(newMember).catch(console.error);
  updateRoleMemberBackups(oldMember, newMember).catch(console.error);
  enforcePersonalRoleBlockedUsers(oldMember, newMember).catch(console.error);
});
client.on(Events.GuildRoleCreate, (role) => handleRoleCreate(role).catch(console.error));
client.on(Events.ChannelCreate, (channel) => configureMusicBotChannel(channel).catch(console.error));
client.on(Events.ChannelDelete, (channel) => {
  const authorizedDeletion = authorizedChannelDeletions.delete(channel.id);
  if (!authorizedDeletion) restoreProtectedChannel(channel).catch(console.error);
  if (!channel.guild) return;
  const guildData = getGuildData(channel.guild.id);
  if (!guildData.tickets?.[channel.id]) return;
  delete guildData.tickets[channel.id];
  saveStore().catch(console.error);
});
client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
  handleRoleUpdate(oldRole, newRole).catch(console.error);
  const guildData = getGuildData(newRole.guild.id);
  const personalRoleIds = new Set(Object.values(guildData.personalRoles));
  if (personalRoleIds.has(newRole.id)
    || guildData.roleCeilingProtectedIds.includes(newRole.id)) {
    if ((newRole.hoist || newRole.mentionable)
      && (oldRole.hoist !== newRole.hoist || oldRole.mentionable !== newRole.mentionable)) {
      enforcePersonalRoleVisibility(newRole.guild).catch(console.error);
    }
  }
  const protectedRoleIds = new Set(guildData.roleCeilingProtectedIds);
  if (oldRole.position !== newRole.position
    && (newRole.id === ROLE_MANAGER_ID
      || personalRoleIds.has(newRole.id)
      || protectedRoleIds.has(newRole.id))) {
    schedulePersonalRolePositionEnforcement(newRole.guild);
  }
  if (oldRole.name !== newRole.name && RANKS.some(({ roleId }) => roleId === newRole.id)) {
    refreshGuildCommands(newRole.guild).catch(console.error);
  }
});
client.on(Events.GuildRoleDelete, (role) => handleRoleDelete(role).catch(console.error));
client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
  updateChannelRoleOverwriteBackups(oldChannel, newChannel).catch(console.error);
  protectOwnerLockedChannel(oldChannel, newChannel).catch(console.error);
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.inGuild()) return;
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === 'rank') await handleRankAutocomplete(interaction).catch(console.error);
    else await interaction.respond([]).catch(console.error);
    return;
  }
  if (interaction.isButton()) {
    if (await handlePersonalRolePanelButton(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    if (botMode === 'all' && !supportClient && await handleTicketButton(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    if (await handleBanVoteButton(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    if (await handleVoicePanelButton(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    if (await handleProfileButton(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    return;
  }
  if (interaction.isStringSelectMenu()) {
    if (await handlePersonalRoleColorSelect(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    if (botMode === 'all' && !supportClient) await handleTicketSelect(interaction).catch(console.error);
    return;
  }
  if (interaction.isUserSelectMenu() || interaction.isRoleSelectMenu()) {
    if (interaction.isUserSelectMenu() && await handlePersonalRoleBlockedSelect(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    await handleVoiceAccessSelect(interaction).catch(console.error);
    return;
  }
  if (interaction.isModalSubmit()) {
    if (await handlePersonalRolePanelModal(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    if (await handleVoiceCreateModal(interaction).catch((error) => {
      console.error(error);
      return false;
    })) return;
    await handleVoiceRenameModal(interaction).catch(console.error);
    return;
  }
  if (!interaction.isChatInputCommand()) return;

  let commandError = null;
  try {
    if (interaction.commandName === 'perso') await handlePersonalRole(interaction);
    if (interaction.commandName === 'dog') await handleDog(interaction);
    if (interaction.commandName === 'clear') await handleClear(interaction);
    if (interaction.commandName === 'to') await handleTimeout(interaction);
    if (interaction.commandName === 'ban') await handleBanCommand(interaction);
    if (interaction.commandName === 'baninfo') await handleBanInfoCommand(interaction);
    if (interaction.commandName === 'wakeup') await handleWakeupCommand(interaction);
    if (interaction.commandName === 'lockname') await handleLocknameCommand(interaction);
    if (interaction.commandName === 'rank') {
      await handleRank(
        interaction,
        interaction.options.getString('role', true),
        interaction.options.getUser('membre', true),
      );
    }
  } catch (error) {
    commandError = error;
    console.error(error);
    const response = panel('error', 'Action impossible', 'Vérifie les permissions et la hiérarchie du bot.', true);
    if (interaction.deferred) await interaction.editReply(response).catch(() => interaction.followUp(response));
    else if (interaction.replied) await interaction.followUp(response);
    else await interaction.reply(response);
  } finally {
    await sendCommandLog(interaction, commandError ? 'Erreur' : 'Traitée', commandError);
  }
});

await loadStore();
await Promise.all([
  mainModeActive ? client.login(token) : null,
  candyClient?.login(candyToken),
  supportClient?.login(supportToken),
  statsClient?.login(statsToken),
]);
