import 'dotenv/config';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, ContainerBuilder,
  EmbedBuilder, Events, GatewayIntentBits, MediaGalleryBuilder, MediaGalleryItemBuilder,
  MessageFlags, Partials, PermissionFlagsBits, SectionBuilder, SeparatorBuilder,
  SeparatorSpacingSize, SlashCommandBuilder, StringSelectMenuBuilder, TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import { getGuildData, loadStore, saveStore } from './store.js';
import { renderTicketCard } from './ticket-card.js';

const token = process.env.SUPPORT_DISCORD_TOKEN?.trim().replace(/^Bot\s+/i, '');
if (!token) throw new Error('SUPPORT_DISCORD_TOKEN est manquant.');

const OWNER_COMMAND_USER_ID = '317270244815011840';
const CREATOR_ROLE_ID = '1565034303560355870';
const ELITE_ROLE_ID = '1565392656970817568';
const PREMIUM_ROLE_ID = '1564636248499429446';
const PLUS_ROLE_ID = '1564638261769404428';
const BASIC_ROLE_ID = '1564636235333505126';
const TICKET_PANEL_CHANNEL_ID = process.env.TICKET_PANEL_CHANNEL_ID?.trim() || '1563907534119633019';
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID?.trim() || '1566175178445291691';
const TICKET_SELECT_ID = 'ticket-panel:select';
const TICKET_CLAIM_ID = 'ticket:claim';
const TICKET_CLOSE_ID = 'ticket:close';
const TICKET_RELEASE_ID = 'ticket:release';
const TICKET_TRANSCRIPT_ID = 'ticket:transcript';
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

function prestigeRoleForGuild(guild) {
  return guild?.roles.cache.find((role) => {
    const name = role.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    return name === 'prestige' || name === 'pvcool prestige' || name.endsWith(' prestige');
  }) ?? null;
}

function panel(kind, title, description, ephemeral = false) {
  const colors = { success: 0x57F287, warning: 0xFEE75C, error: 0xED4245, info: 0x5865F2 };
  const container = new ContainerBuilder().setAccentColor(colors[kind] ?? colors.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}\n${description}`));
  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0),
    allowedMentions: { parse: [] },
  };
}

function parseTimeoutDuration(value) {
  const match = String(value).trim().toLowerCase().match(/^(\d+)\s*(s|m|h|j|d)$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const units = { s: 1000, m: 60_000, h: 3_600_000, j: 86_400_000, d: 86_400_000 };
  const milliseconds = amount * units[match[2]];
  if (!amount || milliseconds > MAX_TIMEOUT_MS) return null;
  return { milliseconds, label: `${amount}${match[2] === 'd' ? 'j' : match[2]}` };
}

const SUPPORT_COMMANDS = [
  new SlashCommandBuilder().setName('ticket').setDescription('Gérer le ticket actuel')
    .addSubcommand((command) => command.setName('add').setDescription('Ajouter un membre au ticket')
      .addUserOption((option) => option.setName('membre').setDescription('Membre à ajouter').setRequired(true)))
    .addSubcommand((command) => command.setName('close').setDescription('Fermer le ticket dans quelques secondes')),
  new SlashCommandBuilder().setName('punish').setDescription('Interdire temporairement les tickets à un membre')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à sanctionner').setRequired(true))
    .addStringOption((option) => option.setName('duree').setDescription('Exemples : 30m, 2h ou 3j').setRequired(true)),
  new SlashCommandBuilder().setName('unpunish').setDescription('Rétablir immédiatement l’accès aux tickets')
    .addUserOption((option) => option.setName('membre').setDescription('Membre à réautoriser').setRequired(true)),
].map((command) => command.toJSON());

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
  const configuredChannel = await guild.channels.fetch(TICKET_PANEL_CHANNEL_ID).catch(() => null);
  const channel = configuredChannel ?? guild.channels.cache.find((candidate) => {
    if (!candidate?.isTextBased() || !('messages' in candidate)) return false;
    const normalizedName = candidate.name.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return normalizedName.includes('creer-un-ticket')
      || normalizedName.includes('ouvrir-un-ticket')
      || normalizedName === 'tickets';
  });
  if (!channel?.isTextBased() || !('messages' in channel)) {
    console.error([
      `Le salon du panneau tickets ${TICKET_PANEL_CHANNEL_ID} est introuvable ou incompatible.`,
      'Configure TICKET_PANEL_CHANNEL_ID avec l’identifiant d’un salon textuel accessible au bot.',
    ].join(' '));
    return;
  }
  if (channel.id !== TICKET_PANEL_CHANNEL_ID) {
    console.warn(`Salon du panneau introuvable : utilisation automatique de #${channel.name} (${channel.id}).`);
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



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Tikonita connecté en tant que ${readyClient.user.tag}.`);
  for (const guild of readyClient.guilds.cache.values()) {
    await guild.commands.set(SUPPORT_COMMANDS).catch(console.error);
    await ensureTicketPanel(guild).catch(console.error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (await handleTicketRating(interaction)) return;
    if (!interaction.inGuild()) return;
    if (interaction.isStringSelectMenu() && await handleTicketSelect(interaction)) return;
    if (interaction.isButton() && await handleTicketButton(interaction)) return;
    if (interaction.isChatInputCommand()) await handleSupportCommand(interaction);
  } catch (error) {
    console.error('Erreur Tikonita:', error);
    const response = panel('error', 'Action impossible', 'Une erreur est survenue.', true);
    if (interaction.deferred || interaction.replied) await interaction.followUp(response).catch(() => null);
    else await interaction.reply(response).catch(() => null);
  }
});

await loadStore();
await client.login(token);
