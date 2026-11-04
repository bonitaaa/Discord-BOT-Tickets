import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { getGuildData, saveStore } from './store.js';

const LEADERBOARD_CHANNEL_ID = '1564992066696646807';
const CANDY_LEADERBOARD_CHANNEL_ID = '1565775071489040394';
const CANDY_SOURCE_CHANNEL_ID = '1564379007414181928';
const SMASH_OR_PASS_CHANNEL_ID = '1565028083965108294';
const UPDATE_INTERVAL_MS = 5 * 60 * 1000;
const PERSONAL_ROLE_ANCHOR_ID = '1556315994614534296';
const PERSONAL_ROLE_CEILING_ID = '1564627919354069012';
const MAX_CONTINUOUS_VOICE_MS = 6 * 60 * 60 * 1000;
const PARIS_TIME_ZONE = 'Europe/Paris';
const INTER_FONT_DATA = readFileSync(
  new URL('../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', import.meta.url),
).toString('base64');
const TICKET_CARD_BACKGROUND_DATA = readFileSync(
  new URL('../assets/ticket-card-grunge.png', import.meta.url),
).toString('base64');
const CANDY_ICON_DATA = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="snow" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#8fddff"/><stop offset="1" stop-color="#239bea"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#snow)" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
      <path d="M256 54v404M81 155l350 202M81 357l350-202"/>
      <path d="M205 95l51 51 51-51M205 417l51-51 51 51"/>
      <path d="M92 218l70-19-19-70M420 294l-70 19 19 70"/>
      <path d="M143 383l19-70-70-19M369 129l-19 70 70 19"/>
    </g>
  </svg>
`).toString('base64');
const CANDY_ICON_DATA_URI = `data:image/svg+xml;base64,${CANDY_ICON_DATA}`;
const CANDY_BUILDING_SOURCE = readFileSync(new URL('../assets/buildings-source.jpg', import.meta.url));
let candyBuildingArtworkPromise = null;
async function getCandyBuildingArtwork() {
  candyBuildingArtworkPromise ??= Promise.all([
    { left: 0, top: 0 },
    { left: 1500, top: 0 },
    { left: 3000, top: 0 },
    { left: 0, top: 1500 },
  ].map(async ({ left, top }) => {
    const cropped = await sharp(CANDY_BUILDING_SOURCE)
      .extract({ left, top, width: 1400, height: 1400 })
      .png()
      .toBuffer();
    const { data, info } = await sharp(cropped)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let offset = 0; offset < data.length; offset += info.channels) {
      const whiteness = Math.min(data[offset], data[offset + 1], data[offset + 2]);
      if (whiteness >= 248) data[offset + 3] = 0;
      else if (whiteness > 232) data[offset + 3] = Math.round(255 * (248 - whiteness) / 16);
    }
    const transparent = await sharp(data, { raw: info })
      .png()
      .toBuffer();
    return sharp(transparent)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 6 })
      .resize({ width: 520, height: 380, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  }));
  return candyBuildingArtworkPromise;
}
const CANDY_CHARACTER_DATA = Object.fromEntries(
  [
    'clara', 'boris', 'alfred', 'ruby', 'leo', 'goblin',
    'knight', 'fighter', 'captain', 'mage', 'adventurer', 'inventor',
  ].map((name) => [
    name,
    readFileSync(new URL(`../assets/candy-character-${name}.png`, import.meta.url)).toString('base64'),
  ]),
);
const CANDY_BACKGROUND_DATA = Object.fromEntries(
  ['sunset', 'night', 'winter'].map((name) => [
    name,
    readFileSync(new URL(`../assets/candy-background-${name}.png`, import.meta.url)).toString('base64'),
  ]),
);
const CANDY_SHOP_ITEM_DATA = Object.fromEntries(
  ['potion', 'hat', 'skull', 'crystal'].map((name) => [
    name,
    readFileSync(new URL(`../assets/candy-shop-${name}.png`, import.meta.url)).toString('base64'),
  ]),
);
const CANDY_THEMES = {
  sunset: { top: '#ff7b65', middle: '#7d3b76', bottom: '#261d4d', accent: '#ffd166', hudStart: '#7a304f', hudEnd: '#d06c62', title: 'Coucher sucré' },
  night: { top: '#1b225d', middle: '#111536', bottom: '#080a1b', accent: '#b493ff', hudStart: '#211a43', hudEnd: '#443170', title: 'Nuit étoilée' },
  winter: { top: '#75c9ef', middle: '#a9e2f7', bottom: '#eaf9ff', accent: '#dff7ff', hudStart: '#245b78', hudEnd: '#4d94b4', title: 'Hiver givré' },
};
let pendingSave = null;

function ensureCandyStats(guildData) {
  guildData.candyLeaderboard ??= {};
  guildData.candyLeaderboard.counts ??= {};
  guildData.candyLeaderboard.dropMessageIds ??= [];
  guildData.candyLeaderboard.claims ??= {};
  guildData.candyLeaderboard.panelMessageId ??= null;
  guildData.candyLeaderboard.boostMessageId ??= null;
  guildData.candyLeaderboard.nextGainMultipliers ??= {};
  return guildData.candyLeaderboard;
}

function ensureStats(guildData) {
  guildData.leaderboard ??= {};
  guildData.leaderboard.weekKey ??= null;
  guildData.leaderboard.textCounts ??= {};
  guildData.leaderboard.voiceSeconds ??= {};
  guildData.leaderboard.voiceJoinedAt ??= {};
  guildData.leaderboard.voiceSessionStartedAt ??= {};
  guildData.leaderboard.duoSeconds ??= {};
  guildData.leaderboard.duoActiveSince ??= {};
  guildData.leaderboard.duoSessionStartedAt ??= {};
  guildData.leaderboard.messageAntiSpam ??= {};
  guildData.leaderboard.messageIds ??= { voice: null, text: null };
  return guildData.leaderboard;
}

function parisParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function currentWeekKey(date = new Date()) {
  const parts = parisParts(date);
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  let daysSinceSunday = weekdayIndex;
  if (weekdayIndex === 0 && Number(parts.hour) < 1) daysSinceSunday = 7;
  const localDay = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  localDay.setUTCDate(localDay.getUTCDate() - daysSinceSunday);
  return localDay.toISOString().slice(0, 10);
}

function scheduleSave() {
  if (pendingSave) return;
  pendingSave = setTimeout(() => {
    pendingSave = null;
    saveStore().catch(console.error);
  }, 15_000);
  pendingSave.unref();
}

function resetWeekIfNeeded(guild) {
  const stats = ensureStats(getGuildData(guild.id));
  const weekKey = currentWeekKey();
  if (stats.weekKey === weekKey) return stats;

  stats.weekKey = weekKey;
  stats.textCounts = {};
  stats.voiceSeconds = {};
  stats.voiceJoinedAt = {};
  stats.voiceSessionStartedAt = {};
  stats.duoSeconds = {};
  stats.duoActiveSince = {};
  stats.duoSessionStartedAt = {};
  stats.messageAntiSpam = {};
  checkpointVoice(stats, guild);
  checkpointDuos(stats, guild);
  scheduleSave();
  return stats;
}

function eligibleVoiceMembers(channel, guild) {
  if (!channel?.isVoiceBased?.()) return [];
  return [...channel.members.values()].filter((member) => !member.user.bot);
}

function activeVoiceMemberIds(guild) {
  const active = new Set();
  for (const channel of guild.channels.cache.values()) {
    const members = eligibleVoiceMembers(channel, guild);
    for (const member of members) active.add(member.id);
  }
  return active;
}

function checkpointVoice(stats, guild) {
  const now = Date.now();
  for (const [userId, joinedAt] of Object.entries(stats.voiceJoinedAt)) {
    const sessionStartedAt = stats.voiceSessionStartedAt[userId] ?? joinedAt;
    const countedUntil = Math.min(now, sessionStartedAt + MAX_CONTINUOUS_VOICE_MS);
    const elapsed = Math.max(0, Math.floor((countedUntil - joinedAt) / 1000));
    stats.voiceSeconds[userId] = (stats.voiceSeconds[userId] ?? 0) + elapsed;
  }
  const activeIds = activeVoiceMemberIds(guild);
  stats.voiceSessionStartedAt = Object.fromEntries(
    [...activeIds].map((userId) => [userId, stats.voiceSessionStartedAt[userId] ?? now]),
  );
  stats.voiceJoinedAt = Object.fromEntries(
    [...activeIds]
      .filter((userId) => now - stats.voiceSessionStartedAt[userId] < MAX_CONTINUOUS_VOICE_MS)
      .map((userId) => [userId, now]),
  );
}

const duoKey = (left, right) => [left, right].sort().join(':');

function activeVoicePairs(guild) {
  const pairs = new Set();
  for (const channel of guild.channels.cache.values()) {
    if (!channel.isVoiceBased?.() || channel.id === guild.afkChannelId) continue;
    const memberIds = eligibleVoiceMembers(channel, guild).map((member) => member.id);
    if (memberIds.length < 2) continue;
    for (let left = 0; left < memberIds.length; left += 1) {
      for (let right = left + 1; right < memberIds.length; right += 1) {
        pairs.add(duoKey(memberIds[left], memberIds[right]));
      }
    }
  }
  return pairs;
}

function checkpointDuos(stats, guild) {
  const now = Date.now();
  for (const [key, startedAt] of Object.entries(stats.duoActiveSince)) {
    const sessionStartedAt = stats.duoSessionStartedAt[key] ?? startedAt;
    const countedUntil = Math.min(now, sessionStartedAt + MAX_CONTINUOUS_VOICE_MS);
    stats.duoSeconds[key] = (stats.duoSeconds[key] ?? 0)
      + Math.max(0, Math.floor((countedUntil - startedAt) / 1000));
  }
  const activePairs = activeVoicePairs(guild);
  stats.duoSessionStartedAt = Object.fromEntries(
    [...activePairs].map((key) => [key, stats.duoSessionStartedAt[key] ?? now]),
  );
  stats.duoActiveSince = Object.fromEntries(
    [...activePairs]
      .filter((key) => now - stats.duoSessionStartedAt[key] < MAX_CONTINUOUS_VOICE_MS)
      .map((key) => [key, now]),
  );
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0 && minutes === 0) return '< 1 min';
  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${String(minutes).padStart(2, '0')}`;
}

function weekTimestamps(weekKey) {
  const start = new Date(`${weekKey}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
  };
}

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const shorten = (value, limit = 19) => (
  value.length > limit ? `${value.slice(0, limit - 1)}…` : value
);

function cleanDisplayName(value) {
  const cleaned = String(value)
    .normalize('NFKC')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/[\uE000-\uF8FF]/gu, '')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFFFD]/gu, '')
    .replace(/[^\p{L}\p{N}\s._'’()\-]/gu, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'Membre';
}

async function imageData(url) {
  try {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

const avatarData = (member) => imageData(member.displayAvatarURL({ extension: 'png', size: 128 }));

export async function renderTicketCard(guild, userId, ticket, stats = {}) {
  const member = await guild.members.fetch(userId).catch(() => null);
  const user = member?.user ?? await guild.client.users.fetch(userId).catch(() => null);
  const avatar = user ? await imageData(user.displayAvatarURL({ extension: 'png', size: 256 })) : null;
  const claimed = Boolean(ticket.claimedBy);
  const displayName = shorten(member?.displayName ?? user?.username ?? 'Membre', 22).toUpperCase();
  const name = escapeXml(displayName);
  const count = claimed ? Number(stats.claimed ?? 1) : Number(stats.created ?? 1);
  const responseSeconds = claimed ? Math.max(0, Math.round((ticket.claimedAt - ticket.createdAt) / 1000)) : 0;
  const response = responseSeconds < 60 ? `${responseSeconds}s` : `${Math.floor(responseSeconds / 60)}m ${responseSeconds % 60}s`;
  const joinedMonths = member?.joinedTimestamp
    ? Math.max(0, Math.floor((Date.now() - member.joinedTimestamp) / (30.44 * 24 * 60 * 60 * 1000)))
    : 0;
  const rank = claimed ? 'STAFF' : 'MEMBRE';
  const rating = Number(stats.rating ?? 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : '—';
  const ratingsCount = Number(stats.ratingsCount ?? 0);
  const milestones = [2, 5, 10, 25, 50, 100, 250, 500];
  const nextMilestone = milestones.find((milestone) => milestone > count) ?? Math.ceil((count + 1) / 500) * 500;
  const previousMilestone = [...milestones].reverse().find((milestone) => milestone <= count) ?? 0;
  const progressRatio = Math.min(1, Math.max(0, (count - previousMilestone) / (nextMilestone - previousMilestone)));
  const progressWidth = Math.max(8, Math.round(1020 * progressRatio));
  const middleValue = claimed ? ratingLabel : Number(stats.vouchesGiven ?? 0);
  const middleLabel = claimed ? 'NOTE MOYENNE' : 'VOUCHES DONNÉS';
  const lastValue = claimed ? response : `${joinedMonths} mois`;
  const lastLabel = claimed ? 'TEMPS DE RÉPONSE' : 'ANCIENNETÉ';
  const status = claimed ? 'PRIS EN CHARGE' : 'NOUVEAU TICKET';
  const ticketTypeLabels = { help: 'BESOIN D’AIDE', owner: 'CONTACT OWNER' };
  const ticketTag = escapeXml(shorten(
    ticket.typeLabel ?? ticketTypeLabels[ticket.type] ?? ticket.type ?? 'SUPPORT',
    20,
  ).toUpperCase());
  const ticketTagWidth = Math.min(240, Math.max(132, ticketTag.length * 10 + 38));
  const rankTagWidth = claimed ? 132 : 148;
  const rankTagX = Math.min(780, 245 + Math.max(215, displayName.length * 27));
  const footer = claimed
    ? 'TIKONITA · UNE ÉQUIPE À VOTRE ÉCOUTE'
    : `PROCHAIN PALIER · ${count}/${nextMilestone} TICKETS`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="380">
    <defs>
      <style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07080c"/><stop offset=".52" stop-color="#11090d"/><stop offset="1" stop-color="#31060c"/></linearGradient>
      <linearGradient id="red" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ff2538"/><stop offset="1" stop-color="#a70015"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#ff1832" stop-opacity=".32"/><stop offset="1" stop-color="#ff1832" stop-opacity="0"/></radialGradient>
      <pattern id="grain" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r="1" fill="#fff" opacity=".035"/><path d="M8 22L22 8" stroke="#fff" stroke-opacity=".025"/></pattern>
      <clipPath id="card"><rect width="1200" height="380" rx="30"/></clipPath>
      <clipPath id="avatar"><circle cx="132" cy="185" r="72"/></clipPath>
      <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity=".65"/></filter>
    </defs>
    <g clip-path="url(#card)">
      <image href="data:image/png;base64,${TICKET_CARD_BACKGROUND_DATA}" x="0" y="0" width="1200" height="380" preserveAspectRatio="xMidYMid slice"/>
      <rect width="1200" height="380" fill="#05060a" opacity=".20"/>
      <linearGradient id="readability" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#05060a" stop-opacity=".42"/><stop offset=".55" stop-color="#05060a" stop-opacity=".20"/><stop offset="1" stop-color="#05060a" stop-opacity=".05"/></linearGradient>
      <rect width="1200" height="380" fill="url(#readability)"/>
    </g>
    <rect x="26" y="25" width="1148" height="330" rx="24" fill="none" stroke="#ff3345" stroke-opacity=".46" stroke-width="2"/>
    <rect x="40" y="40" width="158" height="36" rx="18" fill="url(#red)" filter="url(#shadow)"/><circle cx="62" cy="58" r="4" fill="#73000d"/><text x="125" y="64" text-anchor="middle" fill="#fff" font-size="15" font-weight="950" letter-spacing="1.8">TIKONITA</text>
    <rect x="210" y="40" width="${ticketTagWidth}" height="36" rx="18" fill="#15151b" stroke="#fff" stroke-opacity=".18"/><text x="${210 + ticketTagWidth / 2}" y="64" text-anchor="middle" fill="#d7d5da" font-size="13" font-weight="850" letter-spacing="1.1">${ticketTag}</text>
    <rect x="932" y="40" width="208" height="36" rx="18" fill="${claimed ? '#123b24' : '#3d180b'}" stroke="${claimed ? '#35d36f' : '#ff9c36'}" stroke-opacity=".75"/><circle cx="960" cy="58" r="6" fill="${claimed ? '#51e482' : '#ffad42'}"/><text x="976" y="63" fill="${claimed ? '#69e993' : '#ffbd63'}" font-size="13" font-weight="950" letter-spacing=".5">${status}</text>
    <circle cx="132" cy="185" r="79" fill="#0b0c10" stroke="#ff2538" stroke-width="7" filter="url(#shadow)"/>
    ${avatar ? `<image href="${avatar}" x="60" y="113" width="144" height="144" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar)"/>` : ''}
    <circle cx="188" cy="240" r="14" fill="${claimed ? '#50dd7e' : '#ff3348'}" stroke="#0a0b0f" stroke-width="5"/>
    <text x="245" y="132" fill="#fff" font-size="43" font-weight="950" letter-spacing="-.5">${name}</text>
    <rect x="${rankTagX}" y="100" width="${rankTagWidth}" height="32" rx="16" fill="#3b2b09" stroke="#f6c936" stroke-opacity=".48"/><circle cx="${rankTagX + 18}" cy="116" r="4" fill="#ffd652"/><text x="${rankTagX + 34}" y="121" fill="#ffd652" font-size="13" font-weight="950" letter-spacing=".7">${rank}</text>
    <g transform="translate(245 214)">
      <text x="0" y="0" fill="#fff" font-size="37" font-weight="950">${count}</text><text x="0" y="28" fill="#9e99a4" font-size="13" font-weight="850" letter-spacing="1.3">${claimed ? 'TICKETS PRIS' : 'DEALS'}</text>
      <line x1="205" y1="-35" x2="205" y2="40" stroke="#fff" stroke-opacity=".17" stroke-width="2"/>
      <text x="250" y="0" fill="${claimed ? '#ffd84b' : '#fff'}" font-size="37" font-weight="950">${escapeXml(middleValue)}</text>${claimed && ratingsCount > 0 ? `<text x="318" y="-2" fill="#cbc7cf" font-size="12" font-weight="800">${ratingsCount} AVIS</text>` : ''}<text x="250" y="28" fill="#9e99a4" font-size="13" font-weight="850" letter-spacing="1.3">${middleLabel}</text>
      <line x1="505" y1="-35" x2="505" y2="40" stroke="#fff" stroke-opacity=".17" stroke-width="2"/>
      <text x="550" y="0" fill="${claimed ? '#54df83' : '#fff'}" font-size="37" font-weight="950">${escapeXml(lastValue)}</text><text x="550" y="28" fill="#9e99a4" font-size="13" font-weight="850" letter-spacing="1.3">${lastLabel}</text>
    </g>
    <text x="62" y="308" fill="#b2adb7" font-size="13" font-weight="850" letter-spacing="1.2">${footer}</text>
    <rect x="62" y="326" width="1020" height="10" rx="5" fill="#280b11" stroke="#fff" stroke-opacity=".07"/>
    <rect x="62" y="326" width="${claimed ? 1020 : progressWidth}" height="10" rx="5" fill="url(#red)"/>
    <circle cx="${claimed ? 1082 : 62 + progressWidth}" cy="331" r="6" fill="#fff"/>
  </svg>`;
  return sharp(Buffer.from(svg)).resize({ width: 2192 }).png({ compressionLevel: 9 }).toBuffer();
}

async function rankedMembers(guild, values) {
  const entries = Object.entries(values)
    .filter(([, value]) => value > 0)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 20);
  return Promise.all(entries.map(async ([userId, value], index) => {
    const member = await guild.members.fetch(userId).catch(() => null);
    return {
      rank: index + 1,
      value,
      name: shorten(cleanDisplayName(member?.displayName ?? `Membre ${userId.slice(-4)}`)),
      avatar: member ? await avatarData(member) : null,
    };
  }));
}

function avatarSvg(entry, x, y, size, id) {
  if (!entry?.avatar) {
    return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="#33233f"/>`;
  }
  return `<defs><clipPath id="avatar-${id}"><circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}"/></clipPath></defs><image href="${entry.avatar}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-${id})"/>${entry.color ? `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2 - 2}" fill="none" stroke="${entry.color}" stroke-width="4"/>` : ''}`;
}

function podiumCard(entry, x, y, width, height, accent, formatter, position) {
  if (!entry) return '';
  const avatarSize = position === 1 ? 132 : 82;
  const avatarX = x + 28;
  const avatarY = y + (height - avatarSize) / 2;
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="22" fill="#211329" stroke="${accent}" stroke-opacity="0.55" stroke-width="2"/>
    ${avatarSvg(entry, avatarX, avatarY, avatarSize, `podium-${position}`)}
    <text x="${avatarX + avatarSize + 28}" y="${y + 48}" fill="${accent}" font-size="18" font-weight="700" letter-spacing="2">N°${position}</text>
    <text x="${avatarX + avatarSize + 28}" y="${y + 88}" fill="#fff8ee" font-size="${position === 1 ? 34 : 22}" font-weight="800">${escapeXml(shorten(entry.name, position === 1 ? 18 : 12))}</text>
    <text x="${avatarX + avatarSize + 28}" y="${y + height - 34}" fill="#fff1df" font-size="${position === 1 ? 44 : 27}" font-weight="900">${escapeXml(formatter(entry.value))}</text>
    <text x="${x + width - 44}" y="${y + height - 26}" text-anchor="end" fill="${accent}" fill-opacity="0.12" font-size="${height * 0.78}" font-weight="900">${position}</text>
  </g>`;
}

function listRows(entries, accent, formatter) {
  const remaining = entries.slice(3);
  if (!remaining.length) {
    return '<text x="760" y="460" fill="#a99bb1" font-size="25">Aucune autre activité enregistrée.</text>';
  }
  const maxValue = entries[0]?.value || 1;
  return remaining.map((entry, index) => {
    const column = index < 9 ? 0 : 1;
    const row = column === 0 ? index : index - 9;
    const x = 720 + column * 410;
    const y = 235 + row * 59;
    const barWidth = Math.max(18, Math.round(270 * entry.value / maxValue));
    return `<g>
      <text x="${x}" y="${y + 30}" fill="#a99bb1" font-size="20" font-weight="800">${String(entry.rank).padStart(2, '0')}</text>
      ${avatarSvg(entry, x + 46, y, 44, `list-${entry.rank}`)}
      <text x="${x + 105}" y="${y + 24}" fill="#fff8ee" font-size="20" font-weight="700">${escapeXml(shorten(entry.name, 12))}</text>
      <text x="${x + 380}" y="${y + 24}" text-anchor="end" fill="#fff8ee" font-size="20" font-weight="800">${escapeXml(formatter(entry.value))}</text>
      <rect x="${x + 105}" y="${y + 38}" width="270" height="5" rx="3" fill="#49324f"/>
      <rect x="${x + 105}" y="${y + 38}" width="${barWidth}" height="5" rx="3" fill="${accent}"/>
    </g>`;
  }).join('');
}

async function renderLegacyLeaderboardImage({ guild, title, subtitle, accent, values, total, activeMembers, formatter, totalLabel, stats }) {
  const entries = await rankedMembers(guild, values);
  const startDate = new Date(`${stats.weekKey}T00:00:00Z`);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const weekLabel = `${dateFormat.format(startDate)} → ${dateFormat.format(endDate)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
    <defs>
      <style>@font-face { font-family: 'LeaderboardInter'; src: url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2'); font-weight: 100 900; } text { font-family: 'LeaderboardInter', 'Noto Sans', 'DejaVu Sans', sans-serif; }</style>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0c0612"/><stop offset="0.55" stop-color="#1c0d22"/><stop offset="1" stop-color="#351b32"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${accent}" stop-opacity="0.22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#background)"/>
    <circle cx="1340" cy="120" r="430" fill="url(#glow)"/><circle cx="230" cy="820" r="380" fill="url(#glow)"/>
    <rect x="38" y="35" width="1524" height="830" rx="34" fill="#130b19" fill-opacity="0.72" stroke="#ffffff" stroke-opacity="0.07"/>
    <rect x="68" y="65" width="64" height="64" rx="18" fill="${accent}"/><text x="100" y="108" text-anchor="middle" fill="#160b19" font-size="31" font-weight="900">${title === 'VOCAL' ? '♪' : '✉'}</text>
    <text x="155" y="93" fill="#cdbfd2" font-size="18" font-weight="800" letter-spacing="4">${escapeXml(subtitle.toUpperCase())}</text>
    <text x="68" y="185" fill="#fff1dc" font-size="64" font-weight="900">${escapeXml(title)}</text>
    <rect x="1110" y="65" width="410" height="140" rx="22" fill="#211128" stroke="${accent}" stroke-opacity="0.25"/>
    <text x="1140" y="98" fill="${accent}" font-size="15" font-weight="800" letter-spacing="3">SEMAINE EN COURS</text>
    <text x="1140" y="133" fill="#fff8ee" font-size="25" font-weight="800">${escapeXml(weekLabel)}</text>
    <text x="1140" y="165" fill="#aa9bad" font-size="13" font-weight="700">MEMBRES ACTIFS</text><text x="1140" y="192" fill="#fff8ee" font-size="25" font-weight="900">${activeMembers}</text>
    <text x="1355" y="165" fill="#aa9bad" font-size="13" font-weight="700">${escapeXml(totalLabel.toUpperCase())}</text><text x="1355" y="192" fill="#fff8ee" font-size="25" font-weight="900">${escapeXml(formatter(total))}</text>
    ${podiumCard(entries[0], 68, 235, 610, 280, accent, formatter, 1)}
    ${podiumCard(entries[1], 68, 535, 295, 220, accent, formatter, 2)}
    ${podiumCard(entries[2], 383, 535, 295, 220, accent, formatter, 3)}
    <rect x="700" y="215" width="820" height="565" rx="26" fill="#1b1022" fill-opacity="0.9" stroke="#ffffff" stroke-opacity="0.06"/>
    ${listRows(entries, accent, formatter)}
    <line x1="68" y1="810" x2="1520" y2="810" stroke="#ffffff" stroke-opacity="0.09"/>
    <text x="68" y="843" fill="#fff1dc" font-size="17" font-weight="700">${escapeXml(shorten(cleanDisplayName(guild.name), 36))}</text>
    <text x="1520" y="843" text-anchor="end" fill="#a99bb1" font-size="16">Remise à zéro · dimanche à 01:00 (Paris)</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function podiumRowCard(entry, x, y, width, accent, formatter, theme) {
  if (!entry) return '';
  const medalColors = ['#d6ad55', '#a8a3b0', '#b98262'];
  const medal = medalColors[entry.rank - 1] ?? accent;
  if (entry.empty) {
    return `<g opacity="0.5">
      <rect x="${x}" y="${y}" width="${width}" height="245" rx="24" fill="#1b1820" stroke="#3a3540" stroke-width="2"/>
      <rect x="${x + 28}" y="${y + 28}" width="58" height="40" rx="20" fill="#3a3540"/>
      <text x="${x + 57}" y="${y + 55}" text-anchor="middle" fill="#8a838f" font-size="21" font-weight="850">#${entry.rank}</text>
      <circle cx="${x + 66}" cy="${y + 128}" r="36" fill="#302c34"/>
      <text x="${x + 122}" y="${y + 137}" fill="#77717d" font-size="24" font-weight="700">Aucune activité</text>
      <text x="${x + 30}" y="${y + 210}" fill="#77717d" font-size="39" font-weight="850">—</text>
    </g>`;
  }
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="245" rx="24" fill="${theme.card}" stroke="${medal}" stroke-opacity="${entry.rank === 1 ? 0.62 : 0.24}" stroke-width="2"/>
    <rect x="${x + 28}" y="${y + 28}" width="58" height="40" rx="20" fill="${medal}" fill-opacity="0.16"/>
    <text x="${x + 57}" y="${y + 55}" text-anchor="middle" fill="${medal}" font-size="21" font-weight="850">#${entry.rank}</text>
    ${avatarSvg(entry, x + 30, y + 92, 72, `podium-row-${entry.rank}`)}
    <text x="${x + 122}" y="${y + 137}" fill="#f7f3f8" font-size="25" font-weight="750" clip-path="url(#podium-name-${entry.rank}-clip)">${escapeXml(shorten(entry.name, 16))}</text>
    <text x="${x + 30}" y="${y + 210}" fill="#f7f3f8" font-size="39" font-weight="850">${escapeXml(formatter(entry.value))}</text>
  </g>`;
}

function compactRankingRows(entries, accent, formatter, theme) {
  const maxValue = entries[0]?.value || 1;

  return Array.from({ length: 7 }, (_, index) => {
    const entry = entries[index + 3];
    const rank = index + 4;
    const x = 92;
    const y = 530 + index * 62;
    const barMaxWidth = 350;
    if (!entry) {
      return `<g opacity="0.52">
        <text x="${x}" y="${y + 34}" fill="#77717d" font-size="20" font-weight="750">${String(rank).padStart(2, '0')}</text>
        <circle cx="${x + 80}" cy="${y + 24}" r="22" fill="#302c34"/>
        <text x="${x + 125}" y="${y + 32}" fill="#77717d" font-size="20" font-weight="650">Aucune activité</text>
        <rect x="940" y="${y + 22}" width="${barMaxWidth}" height="8" rx="4" fill="#302c34"/>
        <text x="1460" y="${y + 34}" text-anchor="end" fill="#77717d" font-size="21" font-weight="750">—</text>
      </g>`;
    }
    const barWidth = Math.max(10, Math.round(barMaxWidth * entry.value / maxValue));
    return `<g>
      <text x="${x}" y="${y + 34}" fill="#91899a" font-size="20" font-weight="750">${String(entry.rank).padStart(2, '0')}</text>
      ${avatarSvg(entry, x + 58, y + 2, 44, `compact-${entry.rank}`)}
      <text x="${x + 125}" y="${y + 32}" fill="#eee9ef" font-size="21" font-weight="700" clip-path="url(#ranking-name-clip)">${escapeXml(shorten(entry.name, 23))}</text>
      <rect x="940" y="${y + 22}" width="${barMaxWidth}" height="8" rx="4" fill="${theme.track}"/>
      <rect x="940" y="${y + 22}" width="${barWidth}" height="8" rx="4" fill="${accent}" fill-opacity="0.8"/>
      <text x="1460" y="${y + 34}" text-anchor="end" fill="#b8b0bf" font-size="21" font-weight="750">${escapeXml(formatter(entry.value))}</text>
    </g>`;
  }).join('');
}

export async function renderLeaderboardImage({ guild, title, subtitle, accent, values, total, activeMembers, formatter, totalFormatter = formatter, totalLabel, stats, periodLabel = null, providedEntries = null }) {
  const entries = providedEntries ?? await rankedMembers(guild, values);
  const serverIcon = await imageData(guild.iconURL?.({ extension: 'png', size: 256 }));
  const width = 1600;
  const height = 900;
  const startDate = new Date(`${stats.weekKey}T00:00:00Z`);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const weekLabel = `${dateFormat.format(startDate)} — ${dateFormat.format(endDate)}`;
  const displayedPeriod = periodLabel ?? weekLabel;
  const theme = title === 'VOCAL'
    ? {
      outer: '#061310', start: '#102a24', middle: '#0b1d1a', end: '#071411',
      border: '#28594d', card: '#10231f', panel: '#0c1d19', panelBorder: '#24483f',
      track: '#203b34', glow: '#62c18f', soft: '#8fd6b4', highlight: '#ffd166',
      muted: '#9fc6b6', label: '#8fe0bb', barEnd: '#a7e879',
    }
    : title === 'RÔLES PERSO'
      ? {
        outer: '#120913', start: '#3d183a', middle: '#241126', end: '#140b19',
        border: '#74406f', card: '#35182f', panel: '#211121', panelBorder: '#5b3156',
        track: '#4a2947', glow: '#ff78c8', soft: '#ff9dd7', highlight: '#ffd166',
        muted: '#d2a9c8', label: '#ff9bd5', barEnd: '#ffcb70',
      }
      : {
      outer: '#090a18', start: '#211d43', middle: '#11152c', end: '#17112c',
      border: '#494675', card: '#1b1a35', panel: '#15152b', panelBorder: '#39385d',
      track: '#302e4d', glow: '#8d7cff', soft: '#69b7ff', highlight: '#ffd166',
      muted: '#aaa8cf', label: '#b8a8ff', barEnd: '#69c9ff',
    };
  const readableTitle = title === 'VOCAL' ? 'Vocal' : (title === 'MESSAGES' ? 'Messages' : (title === 'RÔLES PERSO' ? 'Rôles perso' : 'Flocons'));
  const metricDescription = title === 'VOCAL'
    ? 'temps en vocal'
    : (title === 'MESSAGES' ? 'messages envoyés' : (title === 'RÔLES PERSO' ? 'activité des détenteurs' : 'flocons récoltés · part du total'));
  const leader = entries[0];
  const leaderCard = leader
    ? `<g><rect x="60" y="200" width="620" height="350" rx="28" fill="${theme.card}" stroke="${leader.color ?? theme.highlight}" stroke-width="2"/><rect x="390" y="230" width="205" height="38" rx="19" fill="${theme.panel}" stroke="${leader.color ?? theme.highlight}"/><text x="492" y="255" text-anchor="middle" fill="${leader.color ?? theme.highlight}" font-size="16" font-weight="850">N°1 · EN TÊTE</text>${avatarSvg(leader, 100, 285, 130, 'single-leader')}<text x="275" y="340" fill="#fff" font-size="31" font-weight="850" clip-path="url(#leader-name-clip)">${escapeXml(shorten(leader.name, 24))}</text><text x="275" y="425" fill="#fff" font-size="62" font-weight="900">${escapeXml(formatter(leader.value))}</text><text x="275" y="475" fill="${theme.muted}" font-size="18">${total ? Math.round(leader.value / total * 100) : 0}% du total de la semaine</text></g>`
    : `<g opacity=".58"><rect x="60" y="200" width="620" height="350" rx="28" fill="${theme.card}" stroke="${theme.border}" stroke-width="2"/><text x="100" y="275" fill="${theme.muted}" font-size="24">Aucune activité</text></g>`;
  const secondaryCards = [1, 2].map((index) => {
    const entry = entries[index];
    const x = index === 1 ? 60 : 375;
    const medal = entry?.color ?? (index === 1 ? '#c7c9d8' : '#d89472');
    if (!entry) return `<g opacity=".48"><rect x="${x}" y="575" width="305" height="205" rx="24" fill="${theme.card}" stroke="${theme.border}"/><text x="${x + 28}" y="625" fill="${theme.muted}" font-size="20">N°${index + 1}</text><text x="${x + 28}" y="700" fill="${theme.muted}" font-size="20">Aucune activité</text></g>`;
    return `<g><rect x="${x}" y="575" width="305" height="205" rx="24" fill="${theme.card}" stroke="${medal}" stroke-opacity=".55" stroke-width="2"/><text x="${x + 28}" y="623" fill="${medal}" font-size="20" font-weight="850">N°${index + 1}</text>${avatarSvg(entry, x + 28, 645, 54, `single-secondary-${index}`)}<text x="${x + 98}" y="680" fill="#fff" font-size="18" font-weight="750" clip-path="url(#secondary-${index}-name-clip)">${escapeXml(shorten(entry.name, 15))}</text><text x="${x + 28}" y="750" fill="#fff" font-size="34" font-weight="850">${escapeXml(formatter(entry.value))}</text></g>`;
  }).join('');
  const rows = Array.from({ length: 7 }, (_, index) => {
    const entry = entries[index + 3];
    const rank = index + 4;
    const y = 265 + index * 73;
    if (!entry) return `<g opacity=".45"><text x="760" y="${y + 34}" fill="${theme.muted}" font-size="20" font-weight="750">${String(rank).padStart(2, '0')}</text><circle cx="840" cy="${y + 24}" r="22" fill="${theme.track}"/><text x="885" y="${y + 32}" fill="${theme.muted}" font-size="20">Aucune activité</text><rect x="910" y="${y + 45}" width="350" height="7" rx="4" fill="${theme.track}"/><text x="1480" y="${y + 34}" text-anchor="end" fill="${theme.muted}" font-size="21">—</text></g>`;
    const barWidth = Math.max(10, Math.round(350 * entry.value / (entries[0]?.value || 1)));
    return `<g><text x="760" y="${y + 34}" fill="${theme.muted}" font-size="20" font-weight="750">${String(entry.rank).padStart(2, '0')}</text>${avatarSvg(entry, 815, y + 2, 44, `single-row-${rank}`)}<text x="880" y="${y + 29}" fill="#fff" font-size="20" font-weight="700" clip-path="url(#row-name-clip)">${escapeXml(shorten(entry.name, 28))}</text><rect x="880" y="${y + 45}" width="380" height="7" rx="4" fill="${theme.track}"/><rect x="880" y="${y + 45}" width="${Math.round(barWidth * 1.08)}" height="7" rx="4" fill="${entry.color ?? 'url(#rank-bar)'}"/><text x="1480" y="${y + 34}" text-anchor="end" fill="#fff" font-size="21" font-weight="800">${escapeXml(formatter(entry.value))}</text></g>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <style>@font-face { font-family: 'LeaderboardInter'; src: url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2'); font-weight: 100 900; } text { font-family: 'LeaderboardInter', 'Noto Sans', 'DejaVu Sans', sans-serif; }</style>
      <linearGradient id="panel-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.start}"/><stop offset="0.52" stop-color="${theme.middle}"/><stop offset="1" stop-color="${theme.end}"/></linearGradient>
      <linearGradient id="rank-bar"><stop stop-color="${accent}"/><stop offset="1" stop-color="${theme.barEnd}"/></linearGradient>
      <radialGradient id="accent-glow"><stop stop-color="${theme.glow}" stop-opacity="0.24"/><stop offset="1" stop-color="${theme.glow}" stop-opacity="0"/></radialGradient>
      <pattern id="micro-grid" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#ffffff" fill-opacity="0.035"/></pattern>
      <clipPath id="server-icon"><circle cx="105" cy="105" r="42"/></clipPath>
      <clipPath id="leader-name-clip"><rect x="275" y="300" width="365" height="55"/></clipPath>
      <clipPath id="secondary-1-name-clip"><rect x="158" y="650" width="180" height="45"/></clipPath>
      <clipPath id="secondary-2-name-clip"><rect x="473" y="650" width="180" height="45"/></clipPath>
      <clipPath id="row-name-clip"><rect x="880" y="265" width="410" height="510"/></clipPath>
    </defs>
    <rect width="${width}" height="${height}" fill="${theme.outer}"/>
    <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="34" fill="url(#panel-bg)" stroke="${theme.border}" stroke-width="2"/>
    <circle cx="1430" cy="85" r="390" fill="url(#accent-glow)"/>
    <rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="34" fill="url(#micro-grid)"/>
    <circle cx="105" cy="105" r="45" fill="${theme.card}" stroke="${accent}" stroke-width="3"/>
    ${serverIcon
    ? `<image href="${serverIcon}" x="63" y="63" width="84" height="84" preserveAspectRatio="xMidYMid slice" clip-path="url(#server-icon)"/>`
    : `<text x="105" y="116" text-anchor="middle" fill="${accent}" font-size="28" font-weight="850">${title === 'VOCAL' ? '♪' : '✉'}</text>`}
    <text x="175" y="87" fill="#fff" font-size="22" font-weight="750" letter-spacing="5">CLASSEMENT ${escapeXml(readableTitle.toUpperCase())}</text>
    <text x="175" y="145" fill="#fff" font-size="48" font-weight="900">${escapeXml(readableTitle.toUpperCase())}</text>
    <rect x="1120" y="52" width="400" height="112" rx="24" fill="${theme.panel}" stroke="${theme.panelBorder}"/>
    <text x="1150" y="82" fill="${theme.label}" font-size="14" font-weight="800" letter-spacing="3">SEMAINE EN COURS</text>
    <text x="1150" y="116" fill="#fff" font-size="24" font-weight="850">${escapeXml(displayedPeriod)}</text>
    <text x="1150" y="148" fill="${theme.muted}" font-size="14">${activeMembers} ${title === 'RÔLES PERSO' ? 'rôles classés' : 'membres actifs'}</text>
    <text x="1490" y="148" text-anchor="end" fill="#fff" font-size="18" font-weight="800">${escapeXml(totalFormatter(total))}</text>
    ${leaderCard}${secondaryCards}
    <rect x="710" y="200" width="830" height="580" rx="28" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="2"/>
    <text x="760" y="242" fill="${theme.label}" font-size="15" font-weight="850" letter-spacing="3">TOP 10 · ${escapeXml(metricDescription.toUpperCase())}</text>
    ${rows}
    <line x1="60" y1="824" x2="1540" y2="824" stroke="${theme.border}" stroke-opacity=".55"/>
    <text x="60" y="854" fill="${theme.muted}" font-size="15">${escapeXml(cleanDisplayName(guild.name))} · classement hebdomadaire</text>
    <text x="1540" y="854" text-anchor="end" fill="${theme.muted}" font-size="15">Remise à zéro chaque dimanche à 01:00</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function rankedDuos(guild, values) {
  const pairs = Object.entries(values)
    .filter(([, value]) => value > 0)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 10);
  return Promise.all(pairs.map(async ([key, value], index) => {
    const [leftId, rightId] = key.split(':');
    const [left, right] = await Promise.all([
      guild.members.fetch(leftId).catch(() => null),
      guild.members.fetch(rightId).catch(() => null),
    ]);
    return {
      rank: index + 1,
      value,
      leftName: cleanDisplayName(left?.displayName ?? `Membre ${leftId.slice(-4)}`),
      rightName: cleanDisplayName(right?.displayName ?? `Membre ${rightId.slice(-4)}`),
      leftAvatar: left ? await avatarData(left) : null,
      rightAvatar: right ? await avatarData(right) : null,
    };
  }));
}

function duoAvatars(entry, x, y, size, id) {
  const avatar = (data, offset, suffix) => data
    ? `<defs><clipPath id="duo-${id}-${suffix}"><circle cx="${x + offset + size / 2}" cy="${y + size / 2}" r="${size / 2}"/></clipPath></defs><image href="${data}" x="${x + offset}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#duo-${id}-${suffix})"/>`
    : `<circle cx="${x + offset + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="#302c34"/>`;
  return `${avatar(entry.leftAvatar, 0, 'a')}${avatar(entry.rightAvatar, size * 0.68, 'b')}`;
}

export async function renderDuoLeaderboardImage(guild, stats) {
  const entries = await rankedDuos(guild, stats.duoSeconds);
  const serverIcon = await imageData(guild.iconURL?.({ extension: 'png', size: 256 }));
  const accent = '#d78cff';
  const width = 1600;
  const height = 900;
  const startDate = new Date(`${stats.weekKey}T00:00:00Z`);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const weekLabel = `${dateFormat.format(startDate)} — ${dateFormat.format(endDate)}`;
  const totalDuoTime = Object.values(stats.duoSeconds).reduce((sum, value) => sum + value, 0);
  const leader = entries[0];
  const leaderCard = leader
    ? `<g><rect x="60" y="200" width="620" height="350" rx="28" fill="url(#leader-card)" stroke="#f1b64b" stroke-width="2"/><rect x="390" y="230" width="205" height="38" rx="19" fill="#372142" stroke="#f1b64b"/><text x="492" y="255" text-anchor="middle" fill="#ffd878" font-size="16" font-weight="850">N°1 · EN TÊTE</text>${duoAvatars(leader, 100, 285, 130, 'leader')}<text x="365" y="340" fill="#fff9fd" font-size="27" font-weight="850" clip-path="url(#leader-name-clip)">${escapeXml(shorten(`${leader.leftName} & ${leader.rightName}`, 17))}</text><text x="365" y="420" fill="#fff9fd" font-size="64" font-weight="900">${escapeXml(formatDuration(leader.value))}</text><text x="365" y="470" fill="#d7bddf" font-size="18">${totalDuoTime ? Math.round(leader.value / totalDuoTime * 100) : 0}% du temps cumulé des duos</text></g>`
    : `<g opacity=".58"><rect x="60" y="200" width="620" height="350" rx="28" fill="#25172e" stroke="#76577d" stroke-width="2"/><text x="100" y="275" fill="#d2bfd9" font-size="24">Aucun duo classé</text></g>`;
  const secondaryCards = [1, 2].map((index) => {
    const entry = entries[index];
    const x = index === 1 ? 60 : 375;
    const medal = index === 1 ? '#c5bad1' : '#d89472';
    if (!entry) return `<g opacity=".48"><rect x="${x}" y="575" width="305" height="205" rx="24" fill="#21162b" stroke="#715276"/><text x="${x + 28}" y="625" fill="#9d879f" font-size="20">N°${index + 1}</text><text x="${x + 28}" y="700" fill="#866f8a" font-size="20">Aucune activité</text></g>`;
    return `<g><rect x="${x}" y="575" width="305" height="205" rx="24" fill="#24172e" stroke="${medal}" stroke-opacity=".55" stroke-width="2"/><text x="${x + 28}" y="623" fill="${medal}" font-size="20" font-weight="850">N°${index + 1}</text>${duoAvatars(entry, x + 28, 645, 54, `secondary-${index}`)}<text x="${x + 130}" y="680" fill="#fff8fc" font-size="17" font-weight="750" clip-path="url(#secondary-${index}-name-clip)">${escapeXml(shorten(`${entry.leftName} & ${entry.rightName}`, 13))}</text><text x="${x + 28}" y="750" fill="#fff8fc" font-size="34" font-weight="850">${escapeXml(formatDuration(entry.value))}</text></g>`;
  }).join('');
  const rows = Array.from({ length: 7 }, (_, index) => {
    const entry = entries[index + 3];
    const rank = index + 4;
    const y = 265 + index * 73;
    if (!entry) return `<g opacity="0.45"><text x="760" y="${y + 34}" fill="#87778f" font-size="20" font-weight="750">${String(rank).padStart(2, '0')}</text><circle cx="840" cy="${y + 24}" r="22" fill="#30243a"/><text x="885" y="${y + 32}" fill="#87778f" font-size="20">Aucun duo</text><rect x="1165" y="${y + 43}" width="250" height="6" rx="3" fill="#37283f"/><text x="1480" y="${y + 32}" text-anchor="end" fill="#87778f" font-size="21">—</text></g>`;
    const barWidth = Math.max(10, Math.round(350 * entry.value / (entries[0]?.value || 1)));
    return `<g><text x="760" y="${y + 34}" fill="#cbb7d2" font-size="20" font-weight="750">${String(rank).padStart(2, '0')}</text>${duoAvatars(entry, 815, y + 2, 44, `row-${rank}`)}<text x="910" y="${y + 29}" fill="#fff8fc" font-size="20" font-weight="700" clip-path="url(#row-name-clip)">${escapeXml(shorten(`${entry.leftName} & ${entry.rightName}`, 24))}</text><rect x="910" y="${y + 45}" width="350" height="7" rx="4" fill="#493454"/><rect x="910" y="${y + 45}" width="${Math.round(barWidth * 0.85)}" height="7" rx="4" fill="url(#row-bar)"/><text x="1480" y="${y + 34}" text-anchor="end" fill="#f0dfee" font-size="21" font-weight="800">${escapeXml(formatDuration(entry.value))}</text></g>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><style>@font-face { font-family: 'LeaderboardInter'; src: url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2'); font-weight: 100 900; } text { font-family: 'LeaderboardInter', 'Noto Sans', 'DejaVu Sans', sans-serif; }</style><linearGradient id="duo-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17101f"/><stop offset=".48" stop-color="#24122d"/><stop offset="1" stop-color="#351b3d"/></linearGradient><linearGradient id="leader-card" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3c2639"/><stop offset="1" stop-color="#27172f"/></linearGradient><linearGradient id="row-bar"><stop stop-color="#d68cff"/><stop offset="1" stop-color="#8de477"/></linearGradient><radialGradient id="duo-glow"><stop stop-color="#b66cff" stop-opacity=".2"/><stop offset="1" stop-color="#b66cff" stop-opacity="0"/></radialGradient><pattern id="duo-dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#fff" fill-opacity=".035"/></pattern><clipPath id="duo-server"><circle cx="105" cy="105" r="42"/></clipPath><clipPath id="leader-name-clip"><rect x="365" y="300" width="285" height="55"/></clipPath><clipPath id="secondary-1-name-clip"><rect x="190" y="650" width="150" height="45"/></clipPath><clipPath id="secondary-2-name-clip"><rect x="505" y="650" width="150" height="45"/></clipPath><clipPath id="row-name-clip"><rect x="910" y="265" width="390" height="510"/></clipPath></defs><rect width="1600" height="900" fill="#0d0912"/><rect x="22" y="22" width="1556" height="856" rx="34" fill="url(#duo-bg)" stroke="#6b4775" stroke-opacity=".55" stroke-width="2"/><circle cx="1420" cy="95" r="390" fill="url(#duo-glow)"/><rect x="22" y="22" width="1556" height="856" rx="34" fill="url(#duo-dots)"/><circle cx="105" cy="105" r="45" fill="#24162d" stroke="${accent}" stroke-width="3"/>${serverIcon ? `<image href="${serverIcon}" x="63" y="63" width="84" height="84" preserveAspectRatio="xMidYMid slice" clip-path="url(#duo-server)"/>` : ''}<text x="175" y="87" fill="#fff9fc" font-size="22" font-weight="750" letter-spacing="5">CLASSEMENT DUO</text><text x="175" y="145" fill="#fff9fc" font-size="48" font-weight="900">DUOS</text><rect x="1120" y="52" width="400" height="112" rx="24" fill="#24132d" stroke="#6f477a"/><text x="1150" y="82" fill="#cf9bea" font-size="14" font-weight="800" letter-spacing="3">SEMAINE EN COURS</text><text x="1150" y="116" fill="#fff8fc" font-size="24" font-weight="850">${escapeXml(weekLabel)}</text><text x="1150" y="148" fill="#bda8c5" font-size="14">${entries.length} duos classés</text><text x="1490" y="148" text-anchor="end" fill="#fff8fc" font-size="18" font-weight="800">${escapeXml(formatDuration(totalDuoTime))}</text>${leaderCard}${secondaryCards}<rect x="710" y="200" width="830" height="580" rx="28" fill="#1c1125" fill-opacity=".9" stroke="#5f3d68" stroke-width="2"/><text x="760" y="242" fill="#c99dde" font-size="15" font-weight="850" letter-spacing="3">TOP 10 · TEMPS PASSÉ ENSEMBLE</text>${rows}<line x1="60" y1="824" x2="1540" y2="824" stroke="#76527e" stroke-opacity=".35"/><text x="60" y="854" fill="#b8a5bf" font-size="15">${escapeXml(cleanDisplayName(guild.name))} · classement hebdomadaire des duos</text><text x="1540" y="854" text-anchor="end" fill="#b8a5bf" font-size="15">Remise à zéro chaque dimanche à 01:00</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const leaderboardButtons = () => [
  new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('leaderboard:voice')
      .setLabel('Classement vocal')
      .setEmoji('🎙️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('leaderboard:duos')
      .setLabel('Classement duos')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('leaderboard:roles')
      .setLabel('Rôles perso')
      .setEmoji('🎨')
      .setStyle(ButtonStyle.Secondary),
  ),
];

async function upsertImage(channel, messageId, image, filename, components = []) {
  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      if (existing.author.id !== channel.client.user.id) return existing.id;
      await existing.edit({ content: null, components, attachments: [], files: [{ attachment: image, name: filename }] })
        .catch((error) => console.error(`Impossible de modifier le panneau permanent ${existing.id}:`, error));
      return existing.id;
    }
  }
  const created = await channel.send({ components, files: [{ attachment: image, name: filename }] });
  return created.id;
}

export async function renderCandyLeaderboardImage(guild, values) {
  const entries = (await rankedMembers(guild, values)).slice(0, 5);
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const participantCount = Object.values(values).filter((value) => value > 0).length;
  const serverIcon = await imageData(guild.iconURL?.({ extension: 'png', size: 256 }));
  const topCards = Array.from({ length: 3 }, (_, index) => {
    const entry = entries[index];
    const x = 45 + index * 370;
    const accents = ['#ffd166', '#d8d4e4', '#e8a87c'];
    const accent = accents[index];
    if (!entry) {
      return `<g opacity=".42"><rect x="${x}" y="180" width="330" height="260" rx="28" fill="#fff" fill-opacity=".08" stroke="#fff" stroke-opacity=".15"/><text x="${x + 28}" y="225" fill="${accent}" font-size="19" font-weight="900">#${index + 1}</text><circle cx="${x + 68}" cy="300" r="38" fill="#fff" opacity=".08"/><text x="${x + 28}" y="395" fill="#fff" opacity=".55" font-size="18">Place disponible</text></g>`;
    }
    const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
    const barWidth = Math.max(12, Math.round(274 * entry.value / (entries[0]?.value || 1)));
    return `<g><rect x="${x}" y="180" width="330" height="260" rx="28" fill="#fff" fill-opacity="${index === 0 ? '.14' : '.09'}" stroke="${accent}" stroke-opacity="${index === 0 ? '.75' : '.34'}" stroke-width="2"/><rect x="${x + 24}" y="202" width="58" height="30" rx="15" fill="${accent}" fill-opacity=".2"/><text x="${x + 53}" y="223" text-anchor="middle" fill="${accent}" font-size="16" font-weight="900">#${entry.rank}</text>${avatarSvg(entry, x + 24, 254, 72, `candy-top-${entry.rank}`)}<text x="${x + 114}" y="286" fill="#fff" font-size="24" font-weight="850">${escapeXml(shorten(entry.name, 14))}</text><image href="${CANDY_ICON_DATA_URI}" x="${x + 24}" y="344" width="34" height="34"/><text x="${x + 68}" y="374" fill="#fff" font-size="35" font-weight="900">${entry.value}</text><text x="${x + 302}" y="372" text-anchor="end" fill="#fff" opacity=".68" font-size="18" font-weight="750">${percentage}%</text><rect x="${x + 28}" y="405" width="274" height="9" rx="5" fill="#fff" opacity=".11"/><rect x="${x + 28}" y="405" width="${barWidth}" height="9" rx="5" fill="${accent}"/></g>`;
  }).join('');
  const lowerRows = Array.from({ length: 2 }, (_, offset) => {
    const index = offset + 3;
    const entry = entries[index];
    const y = 470 + offset * 84;
    if (!entry) return `<g opacity=".38"><rect x="45" y="${y}" width="1070" height="68" rx="20" fill="#fff" fill-opacity=".07"/><text x="72" y="${y + 43}" fill="#fff" font-size="18" font-weight="800">#${index + 1}</text><text x="150" y="${y + 43}" fill="#fff" opacity=".55" font-size="18">Aucun flocon récolté</text></g>`;
    const percentage = total > 0 ? Math.round((entry.value / total) * 100) : 0;
    const barWidth = Math.max(8, Math.round(300 * entry.value / (entries[0]?.value || 1)));
    return `<g><rect x="45" y="${y}" width="1070" height="68" rx="20" fill="#fff" fill-opacity=".08" stroke="#fff" stroke-opacity=".12"/><text x="72" y="${y + 43}" fill="#ffd166" opacity=".8" font-size="18" font-weight="900">#${entry.rank}</text>${avatarSvg(entry, 120, y + 9, 50, `candy-row-${entry.rank}`)}<text x="190" y="${y + 43}" fill="#fff" font-size="21" font-weight="800">${escapeXml(shorten(entry.name, 24))}</text><rect x="610" y="${y + 29}" width="300" height="10" rx="5" fill="#fff" opacity=".11"/><rect x="610" y="${y + 29}" width="${barWidth}" height="10" rx="5" fill="#ffd166" opacity=".72"/><image href="${CANDY_ICON_DATA_URI}" x="948" y="20" width="1" height="1" opacity="0"/><text x="1080" y="${y + 44}" text-anchor="end" fill="#fff" font-size="22" font-weight="850">${entry.value} · ${percentage}%</text></g>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720"><defs><style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans','DejaVu Sans',sans-serif}</style><linearGradient id="candy-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#5ed5ff"/><stop offset=".48" stop-color="#367fc8"/><stop offset="1" stop-color="#152847"/></linearGradient><linearGradient id="veil" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#190d25" stop-opacity=".16"/><stop offset="1" stop-color="#10091c" stop-opacity=".54"/></linearGradient><radialGradient id="glow"><stop stop-color="#ffd166" stop-opacity=".24"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient><clipPath id="candy-server"><circle cx="84" cy="92" r="36"/></clipPath></defs><rect width="1200" height="720" rx="34" fill="url(#candy-bg)"/><rect width="1200" height="720" rx="34" fill="url(#veil)"/><circle cx="1050" cy="60" r="330" fill="url(#glow)"/><circle cx="84" cy="92" r="40" fill="#fff" opacity=".14" stroke="#ffd166" stroke-width="3"/>${serverIcon ? `<image href="${serverIcon}" x="48" y="56" width="72" height="72" preserveAspectRatio="xMidYMid slice" clip-path="url(#candy-server)"/>` : ''}<text x="145" y="78" fill="#fff" font-size="31" font-weight="900">${escapeXml(shorten(cleanDisplayName(guild.name), 24))}</text><text x="145" y="108" fill="#fff" opacity=".68" font-size="14" font-weight="800" letter-spacing="4">CLASSEMENT FLOCONS</text><rect x="835" y="44" width="300" height="96" rx="24" fill="#fff" fill-opacity=".09" stroke="#fff" stroke-opacity=".15"/><text x="865" y="76" fill="#fff" opacity=".68" font-size="14" font-weight="750">${participantCount} PARTICIPANT${participantCount > 1 ? 'S' : ''}</text><image href="${CANDY_ICON_DATA_URI}" x="865" y="91" width="34" height="34"/><text x="910" y="120" fill="#fff" font-size="29" font-weight="900">${total}</text><text x="1098" y="118" text-anchor="end" fill="#fff" opacity=".62" font-size="15">AU TOTAL</text>${topCards}${lowerRows}<text x="600" y="684" text-anchor="middle" fill="#fff" opacity=".6" font-size="15">Réagis avec le flocon sur les drops pour monter dans le top 5</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderAccessProfileImage(guild, profile) {
  const { member, commands, permissions, whitelists } = profile;
  const width = 1200;
  const height = 1120;
  const avatar = await imageData(member.displayAvatarURL({ extension: 'png', size: 256 }));
  const accent = /^#[0-9a-f]{6}$/i.test(profile.accent) ? profile.accent : '#76569B';

  const chipGroup = (items, { x, y, maxWidth, color, columns, gap = 12, rowHeight = 48 }) => {
    const chipWidth = (maxWidth - gap * (columns - 1)) / columns;
    const rows = Math.ceil(items.length / columns);
    const markup = [];
    items.forEach((item, index) => {
      const cursorX = x + (index % columns) * (chipWidth + gap);
      const cursorY = y + Math.floor(index / columns) * rowHeight;
      const opacity = item.allowed ? 1 : 0.3;
      markup.push(`<g opacity="${opacity}"><rect x="${cursorX}" y="${cursorY}" width="${chipWidth}" height="38" rx="12" fill="${item.allowed ? color : '#202433'}" fill-opacity="${item.allowed ? '.2' : '.62'}" stroke="${item.allowed ? color : '#555b70'}" stroke-width="1.6"/><rect x="${cursorX + 1}" y="${cursorY + 1}" width="${chipWidth - 2}" height="18" rx="11" fill="#fff" fill-opacity="${item.allowed ? '.035' : '.015'}"/><text x="${cursorX + 16}" y="${cursorY + 25}" fill="${item.allowed ? '#f7f8ff' : '#9ba0b3'}" font-size="15" font-weight="760">${escapeXml(shorten(item.label, columns >= 5 ? 18 : 26))}</text><circle cx="${cursorX + chipWidth - 17}" cy="${cursorY + 19}" r="4" fill="${item.allowed ? color : '#767c91'}"/>${item.allowed ? '' : `<line x1="${cursorX + 12}" y1="${cursorY + 19}" x2="${cursorX + chipWidth - 12}" y2="${cursorY + 19}" stroke="#8c91a4" stroke-width="2"/>`}</g>`);
    });
    return { markup: markup.join(''), height: rows * rowHeight };
  };

  const commandGroup = chipGroup(commands, { x: 64, y: 388, maxWidth: 1072, color: '#8b6cff', columns: 5 });
  const permissionY = 388 + commandGroup.height + 55;
  const permissionGroup = chipGroup(permissions, { x: 64, y: permissionY, maxWidth: 1072, color: '#35d7ef', columns: 4 });
  const whitelistY = permissionY + permissionGroup.height + 55;
  const whitelistGroup = chipGroup(whitelists, { x: 64, y: whitelistY, maxWidth: 1072, color: '#ffc72e', columns: 3 });
  const enabledCommands = commands.filter((item) => item.allowed).length;
  const enabledPermissions = permissions.filter((item) => item.allowed).length;
  const enabledWhitelists = whitelists.filter((item) => item.allowed).length;
  const avatarMarkup = avatar
    ? `<image href="${avatar}" x="68" y="135" width="118" height="118" preserveAspectRatio="xMidYMid slice" clip-path="url(#access-avatar)"/>`
    : '';

  const rankPillWidth = Math.min(280, Math.max(190, 88 + profile.rank.length * 12));
  const rankPillX = 1136 - rankPillWidth;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style><linearGradient id="access-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#191631"/><stop offset=".5" stop-color="#080a14"/><stop offset="1" stop-color="#07131d"/></linearGradient><linearGradient id="top-line"><stop stop-color="#815cff"/><stop offset="1" stop-color="#35d7ef"/></linearGradient><linearGradient id="rank-pill" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${accent}" stop-opacity=".32"/><stop offset="1" stop-color="${accent}" stop-opacity=".09"/></linearGradient><radialGradient id="access-glow"><stop stop-color="${accent}" stop-opacity=".25"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><pattern id="grid" width="65" height="65" patternUnits="userSpaceOnUse"><path d="M65 0H0V65" fill="none" stroke="#76809c" stroke-opacity=".12" stroke-width="1"/></pattern><clipPath id="access-card"><rect width="1200" height="1120" rx="34"/></clipPath><clipPath id="access-avatar"><circle cx="127" cy="194" r="59"/></clipPath></defs><g clip-path="url(#access-card)"><rect width="1200" height="1120" fill="url(#access-bg)"/><circle cx="110" cy="150" r="360" fill="url(#access-glow)"/><circle cx="1120" cy="1020" r="330" fill="url(#access-glow)" opacity=".38"/><rect width="1200" height="1120" fill="url(#grid)"/><rect width="1200" height="5" fill="url(#top-line)"/></g><rect x="1" y="1" width="1198" height="1118" rx="33" fill="none" stroke="#77809a" stroke-opacity=".45" stroke-width="2"/><text x="64" y="72" fill="#fff" font-size="20" font-weight="900" letter-spacing="5">PVCOOL</text><text x="190" y="72" fill="#8f95ad" font-size="17" font-weight="750" letter-spacing="4">COMMANDES ET PERMISSIONS</text><circle cx="127" cy="194" r="65" fill="#16192a" stroke="${accent}" stroke-width="5"/>${avatarMarkup}<text x="225" y="184" fill="#fff" font-size="38" font-weight="900">${escapeXml(shorten(member.displayName, 24))}</text><text x="225" y="218" fill="#8f95ad" font-size="19" font-weight="650">${member.id}</text><rect x="${rankPillX}" y="146" width="${rankPillWidth}" height="66" rx="20" fill="url(#rank-pill)" stroke="${accent}" stroke-opacity=".72" stroke-width="2"/><text x="${rankPillX + 22}" y="169" fill="${accent}" font-size="11" font-weight="900" letter-spacing="2">RANG</text><text x="${rankPillX + 22}" y="195" fill="#fff" font-size="20" font-weight="850">${escapeXml(shorten(profile.rank, 18))}</text><rect x="64" y="285" width="520" height="70" rx="18" fill="#fff" fill-opacity=".055" stroke="#fff" stroke-opacity=".09"/><text x="88" y="313" fill="#9ca2b7" font-size="13" font-weight="750">RANG ACTUEL</text><text x="88" y="340" fill="#fff" font-size="21" font-weight="850">${escapeXml(shorten(profile.rank, 30))}</text><rect x="604" y="285" width="532" height="70" rx="18" fill="#fff" fill-opacity=".055" stroke="#fff" stroke-opacity=".09"/><text x="628" y="313" fill="#9ca2b7" font-size="13" font-weight="750">RÔLE PERSONNEL</text><text x="628" y="340" fill="#fff" font-size="21" font-weight="850">${escapeXml(shorten(profile.personalRole, 30))}</text><rect x="44" y="358" width="1112" height="228" rx="24" fill="#8b6cff" fill-opacity=".035" stroke="#8b6cff" stroke-opacity=".14"/><text x="64" y="377" fill="#9f82ff" font-size="19" font-weight="900" letter-spacing="3">COMMANDES</text><text x="230" y="377" fill="#aeb3c5" font-size="17" font-weight="800">${enabledCommands} / ${commands.length}</text>${commandGroup.markup}<rect x="44" y="${permissionY - 33}" width="1112" height="235" rx="24" fill="#35d7ef" fill-opacity=".03" stroke="#35d7ef" stroke-opacity=".13"/><text x="64" y="${permissionY - 11}" fill="#35d7ef" font-size="19" font-weight="900" letter-spacing="3">PERMISSIONS</text><text x="245" y="${permissionY - 11}" fill="#aeb3c5" font-size="17" font-weight="800">${enabledPermissions} / ${permissions.length}</text>${permissionGroup.markup}<rect x="44" y="${whitelistY - 33}" width="1112" height="145" rx="24" fill="#ffc72e" fill-opacity=".035" stroke="#ffc72e" stroke-opacity=".14"/><text x="64" y="${whitelistY - 11}" fill="#ffc72e" font-size="19" font-weight="900" letter-spacing="3">WHITELISTS</text><text x="225" y="${whitelistY - 11}" fill="#aeb3c5" font-size="17" font-weight="800">${enabledWhitelists} / ${whitelists.length}</text>${whitelistGroup.markup}<text x="64" y="1075" fill="#8990a8" font-size="16">En clair : acquis · Barré : pas encore.</text><text x="1136" y="1075" text-anchor="end" fill="#8990a8" font-size="16">${escapeXml(shorten(guild.name, 28))}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCandyProfileImage(guild, user, candy) {
  const counts = candy.counts ?? {};
  const total = counts[user.id] ?? 0;
  const ranking = Object.entries(counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const rankIndex = ranking.findIndex(([userId]) => userId === user.id);
  const rank = rankIndex >= 0 ? `#${rankIndex + 1}` : '—';
  const multiplier = candy.nextGainMultipliers?.[user.id] ?? 1;
  const badge = candy.profileBadges?.[user.id] ?? 'Aucun badge';
  const background = candy.profileBackgrounds?.[user.id] ?? 'sunset';
  const character = candy.profileCharacters?.[user.id] ?? 'candy';
  const avatar = await imageData(user.displayAvatarURL({ extension: 'png', size: 256 }));
  const theme = CANDY_THEMES[background] ?? CANDY_THEMES.sunset;
  const backgroundData = CANDY_BACKGROUND_DATA[background] ?? CANDY_BACKGROUND_DATA.sunset;
  const characterAliases = { candy: 'leo', ghost: 'clara', snowman: 'alfred' };
  const selectedCharacter = characterAliases[character] ?? character;
  const characterLabels = {
    clara: 'Clara',
    boris: 'Scaphandrier',
    alfred: 'Agent',
    ruby: 'Pirate',
    leo: 'Héros',
    goblin: 'Gobelin',
    knight: 'Chevalier',
    fighter: 'Combattant',
    captain: 'Capitaine',
    mage: 'Mage',
    adventurer: 'Aventurière',
    inventor: 'Inventeur',
  };
  const characterLabel = characterLabels[selectedCharacter] ?? 'Léo';
  const characterData = CANDY_CHARACTER_DATA[selectedCharacter] ?? CANDY_CHARACTER_DATA.leo;
  const mascot = `<image href="data:image/png;base64,${characterData}" x="345" y="50" width="510" height="510" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>`;
  const safeBadge = cleanDisplayName(badge);
  const serverName = cleanDisplayName(guild.name ?? 'PVCool');
  const polishedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620">
    <defs>
      <style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style>
      <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#070615" stop-opacity=".02"/><stop offset="1" stop-color="#070615" stop-opacity=".16"/></linearGradient>
      <linearGradient id="hud" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.hudStart}" stop-opacity=".88"/><stop offset="1" stop-color="${theme.hudEnd}" stop-opacity=".76"/></linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#05040e" flood-opacity=".34"/></filter>
      <clipPath id="card2"><rect width="1200" height="620" rx="34"/></clipPath>
      <clipPath id="avatar2"><circle cx="91" cy="531" r="36"/></clipPath>
    </defs>
    <g clip-path="url(#card2)"><image href="data:image/png;base64,${backgroundData}" width="1200" height="620" preserveAspectRatio="xMidYMid slice"/><rect width="1200" height="620" fill="url(#veil)"/></g>
    <text x="42" y="62" fill="#fff" font-size="27" font-weight="900">${escapeXml(shorten(serverName, 24))}</text>
    <text x="42" y="88" fill="#fff" opacity=".66" font-size="14" font-weight="800" letter-spacing="4">MON PROFIL</text>
    <ellipse cx="600" cy="526" rx="145" ry="25" fill="#05040d" opacity=".22"/>${mascot}
    <g filter="url(#shadow)">
      <rect x="30" y="482" width="365" height="108" rx="28" fill="url(#hud)" stroke="#fff" stroke-opacity=".2" stroke-width="1.5"/>
      <circle cx="91" cy="531" r="43" fill="#fff" opacity=".96"/>
      ${avatar ? `<image href="${avatar}" x="55" y="495" width="72" height="72" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar2)"/>` : ''}
      <text x="151" y="510" fill="#fff" font-size="19" font-weight="840">${escapeXml(shorten(user.username, 14))}</text>
      <circle cx="169" cy="537" r="16" fill="#fff" opacity=".12"/>
      <image href="${CANDY_ICON_DATA_URI}" x="154" y="522" width="30" height="30" preserveAspectRatio="xMidYMid meet"/>
      <text x="198" y="548" fill="#fff" font-size="31" font-weight="900">${total}</text>
      <text x="151" y="575" fill="${theme.accent}" font-size="13" font-weight="800">BADGE · ${escapeXml(safeBadge).toUpperCase()}</text>
      <rect x="319" y="500" width="54" height="28" rx="14" fill="#fff" opacity=".1"/>
      <text x="346" y="519" text-anchor="middle" fill="#fff" font-size="13" font-weight="850">${rank}</text>
    </g>
    <text x="600" y="590" text-anchor="middle" fill="#fff" opacity=".9" font-size="18" font-weight="850">${characterLabel}</text>
  </svg>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620"><defs><style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style><linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#080713" stop-opacity=".28"/><stop offset=".5" stop-color="#080713" stop-opacity=".08"/><stop offset="1" stop-color="#080713" stop-opacity=".34"/></linearGradient><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#060711" flood-opacity=".3"/></filter><clipPath id="card"><rect width="1200" height="620" rx="34"/></clipPath><clipPath id="avatar"><circle cx="140" cy="185" r="66"/></clipPath></defs><g clip-path="url(#card)"><image href="data:image/png;base64,${backgroundData}" width="1200" height="620" preserveAspectRatio="xMidYMid slice"/><rect width="1200" height="620" fill="url(#shade)"/></g><rect x="34" y="32" width="1132" height="556" rx="32" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/><text x="65" y="82" fill="#fff" opacity=".88" font-size="17" font-weight="800" letter-spacing="4">PVCool · SNOW CLUB</text><rect x="55" y="112" width="500" height="425" rx="32" fill="#0b0a18" opacity=".82" stroke="#fff" stroke-opacity=".18"/><circle cx="140" cy="185" r="72" fill="#151226" stroke="${theme.accent}" stroke-width="5"/>${avatar ? `<image href="${avatar}" x="74" y="119" width="132" height="132" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar)"/>` : ''}<text x="235" y="166" fill="#fff" font-size="36" font-weight="850">${escapeXml(shorten(user.username, 15))}</text><text x="235" y="205" fill="${theme.accent}" font-size="19" font-weight="750">${escapeXml(safeBadge)}</text><text x="235" y="235" fill="#e5deea" font-size="16">${escapeXml(theme.title)}</text><rect x="88" y="290" width="200" height="100" rx="20" fill="#fff" opacity=".1"/><path d="M120 335 L145 318 L170 335 L145 352Z" fill="${theme.accent}"/><text x="190" y="326" fill="#d3cbd8" font-size="14" font-weight="700">FLOCONS</text><text x="190" y="364" fill="#fff" font-size="34" font-weight="850">${total}</text><rect x="320" y="290" width="200" height="100" rx="20" fill="#fff" opacity=".1"/><text x="350" y="326" fill="#d3cbd8" font-size="14" font-weight="700">CLASSEMENT</text><text x="350" y="364" fill="#fff" font-size="34" font-weight="850">${rank}</text><rect x="88" y="414" width="432" height="88" rx="20" fill="#fff" opacity=".1"/><text x="120" y="449" fill="#d3cbd8" font-size="14" font-weight="700">PROCHAIN GAIN</text><text x="120" y="482" fill="#fff" font-size="28" font-weight="850">${multiplier > 1 ? `Bonus ×${multiplier}` : 'Normal'}</text><rect x="625" y="500" width="480" height="54" rx="27" fill="#0b0a18" opacity=".72"/><text x="865" y="535" text-anchor="middle" fill="#fff" font-size="18" font-weight="750">Personnage · ${characterLabel}</text>${mascot}</svg>`;
  return sharp(Buffer.from(polishedSvg)).png().toBuffer();
}

export async function renderLoveCompatibilityImage(firstUser, secondUser, percentage) {
  const [firstAvatar, secondAvatar] = await Promise.all([
    imageData(firstUser.displayAvatarURL({ extension: 'png', size: 256 })),
    imageData(secondUser.displayAvatarURL({ extension: 'png', size: 256 })),
  ]);
  const heartColor = percentage >= 75 ? '#ff4f87' : percentage >= 45 ? '#ff78a0' : '#a996d8';
  const message = percentage >= 85
    ? 'Une connexion presque parfaite'
    : percentage >= 65
      ? 'Une très belle compatibilité'
      : percentage >= 40
        ? 'Une histoire à découvrir'
        : 'Les opposés peuvent se surprendre';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="330" viewBox="0 0 900 330">
    <defs>
      <style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style>
      <linearGradient id="love-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4b2170"/><stop offset=".52" stop-color="#a172b4"/><stop offset="1" stop-color="#5f596b"/></linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#160d26" flood-opacity=".38"/></filter>
      <clipPath id="avatar-left"><circle cx="155" cy="175" r="83"/></clipPath>
      <clipPath id="avatar-right"><circle cx="745" cy="175" r="83"/></clipPath>
    </defs>
    <rect width="900" height="330" rx="28" fill="url(#love-bg)"/>
    <circle cx="120" cy="40" r="150" fill="#d9b4ef" opacity=".16"/>
    <circle cx="790" cy="300" r="190" fill="#fff" opacity=".1"/>
    <rect x="30" y="28" width="840" height="274" rx="30" fill="url(#glass)" stroke="#fff" stroke-opacity=".48" stroke-width="2" filter="url(#shadow)"/>
    <circle cx="155" cy="175" r="94" fill="#fff" opacity=".95"/>
    ${firstAvatar ? `<image href="${firstAvatar}" x="72" y="92" width="166" height="166" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-left)"/>` : ''}
    <circle cx="745" cy="175" r="94" fill="#fff" opacity=".95"/>
    ${secondAvatar ? `<image href="${secondAvatar}" x="662" y="92" width="166" height="166" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-right)"/>` : ''}
    <path d="M450 247 C424 219 358 171 358 126 C358 80 414 68 450 109 C486 68 542 80 542 126 C542 171 476 219 450 247Z" fill="${heartColor}" stroke="#fff" stroke-width="6" filter="url(#shadow)"/>
    <text x="450" y="168" text-anchor="middle" fill="#fff" font-size="46" font-weight="900">${percentage}%</text>
    <text x="155" y="285" text-anchor="middle" fill="#fff" font-size="18" font-weight="850">${escapeXml(shorten(firstUser.username, 16))}</text>
    <text x="745" y="285" text-anchor="middle" fill="#fff" font-size="18" font-weight="850">${escapeXml(shorten(secondUser.username, 16))}</text>
    <text x="450" y="292" text-anchor="middle" fill="#fff" opacity=".86" font-size="15" font-weight="700">${message}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCandyKissImage(senderUser, targetUser) {
  const [senderAvatar, targetAvatar] = await Promise.all([
    imageData(senderUser.displayAvatarURL({ extension: 'png', size: 256 })),
    imageData(targetUser.displayAvatarURL({ extension: 'png', size: 256 })),
  ]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="330" viewBox="0 0 900 330">
    <defs>
      <style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style>
      <linearGradient id="kiss-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#30124d"/><stop offset=".5" stop-color="#a14476"/><stop offset="1" stop-color="#ff7b88"/></linearGradient>
      <radialGradient id="kiss-glow"><stop stop-color="#ffd6e4" stop-opacity=".62"/><stop offset="1" stop-color="#ffd6e4" stop-opacity="0"/></radialGradient>
      <filter id="kiss-shadow"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#16071e" flood-opacity=".42"/></filter>
      <clipPath id="kiss-left"><circle cx="180" cy="165" r="88"/></clipPath>
      <clipPath id="kiss-right"><circle cx="720" cy="165" r="88"/></clipPath>
    </defs>
    <rect width="900" height="330" rx="30" fill="url(#kiss-bg)"/>
    <circle cx="450" cy="165" r="245" fill="url(#kiss-glow)"/>
    <rect x="28" y="28" width="844" height="274" rx="32" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".34" stroke-width="2"/>
    <circle cx="180" cy="165" r="98" fill="#fff" opacity=".94" filter="url(#kiss-shadow)"/>
    ${senderAvatar ? `<image href="${senderAvatar}" x="92" y="77" width="176" height="176" preserveAspectRatio="xMidYMid slice" clip-path="url(#kiss-left)"/>` : ''}
    <circle cx="720" cy="165" r="98" fill="#fff" opacity=".94" filter="url(#kiss-shadow)"/>
    ${targetAvatar ? `<image href="${targetAvatar}" x="632" y="77" width="176" height="176" preserveAspectRatio="xMidYMid slice" clip-path="url(#kiss-right)"/>` : ''}
    <path d="M450 111 C423 82 376 94 378 133 C380 174 425 205 450 224 C475 205 520 174 522 133 C524 94 477 82 450 111Z" fill="#ff477e" stroke="#fff" stroke-width="5" filter="url(#kiss-shadow)"/>
    <text x="450" y="163" text-anchor="middle" fill="#fff" font-size="47" font-weight="900">BISOU</text>
    <text x="180" y="285" text-anchor="middle" fill="#fff" font-size="18" font-weight="850">${escapeXml(shorten(senderUser.username, 16))}</text>
    <text x="720" y="285" text-anchor="middle" fill="#fff" font-size="18" font-weight="850">${escapeXml(shorten(targetUser.username, 16))}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderFamilyTreeImage(guild, rootId, family) {
  const parents = family.parents ?? {};
  const siblings = family.siblings ?? {};
  const adjacency = new Map();
  const connect = (left, right) => {
    if (!left || !right) return;
    if (!adjacency.has(left)) adjacency.set(left, new Set());
    if (!adjacency.has(right)) adjacency.set(right, new Set());
    adjacency.get(left).add(right);
    adjacency.get(right).add(left);
  };
  for (const [childId, parentId] of Object.entries(parents)) connect(childId, parentId);
  for (const [userId, siblingIds] of Object.entries(siblings)) {
    for (const siblingId of siblingIds) connect(userId, siblingId);
  }
  const component = [];
  const queue = [rootId];
  const visited = new Set();
  while (queue.length && component.length < 30) {
    const userId = queue.shift();
    if (visited.has(userId)) continue;
    visited.add(userId);
    component.push(userId);
    for (const relatedId of adjacency.get(userId) ?? []) queue.push(relatedId);
  }
  const levels = new Map([[rootId, 0]]);
  for (let pass = 0; pass < component.length * 2; pass += 1) {
    let changed = false;
    for (const [childId, parentId] of Object.entries(parents)) {
      if (!visited.has(childId) || !visited.has(parentId)) continue;
      if (levels.has(parentId) && !levels.has(childId)) {
        levels.set(childId, levels.get(parentId) + 1);
        changed = true;
      } else if (levels.has(childId) && !levels.has(parentId)) {
        levels.set(parentId, levels.get(childId) - 1);
        changed = true;
      }
    }
    for (const [userId, siblingIds] of Object.entries(siblings)) {
      for (const siblingId of siblingIds) {
        if (!visited.has(userId) || !visited.has(siblingId)) continue;
        if (levels.has(userId) && !levels.has(siblingId)) {
          levels.set(siblingId, levels.get(userId));
          changed = true;
        } else if (!levels.has(userId) && levels.has(siblingId)) {
          levels.set(userId, levels.get(siblingId));
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const userId of component) if (!levels.has(userId)) levels.set(userId, 0);
  const minimumLevel = Math.min(...levels.values());
  const normalized = new Map([...levels].map(([userId, level]) => [userId, level - minimumLevel]));
  const rows = new Map();
  for (const userId of component) {
    const level = normalized.get(userId);
    if (!rows.has(level)) rows.set(level, []);
    rows.get(level).push(userId);
  }
  const widestRow = Math.max(1, ...[...rows.values()].map((row) => row.length));
  const width = Math.min(2400, Math.max(1200, widestRow * 190 + 160));
  const height = Math.max(700, rows.size * 230 + 250);
  const positions = new Map();
  for (const [level, row] of [...rows].sort(([left], [right]) => left - right)) {
    const spacing = width / (row.length + 1);
    row.forEach((userId, index) => positions.set(userId, {
      x: Math.round(spacing * (index + 1)),
      y: 175 + level * 230,
    }));
  }
  const memberData = new Map(await Promise.all(component.map(async (userId) => {
    const member = await guild.members.fetch(userId).catch(() => null);
    return [userId, {
      name: cleanDisplayName(member?.displayName ?? `Membre ${userId.slice(-4)}`),
      avatar: member ? await avatarData(member) : null,
    }];
  })));
  const parentLines = Object.entries(parents).filter(([childId, parentId]) => positions.has(childId) && positions.has(parentId))
    .map(([childId, parentId]) => {
      const child = positions.get(childId);
      const parent = positions.get(parentId);
      const middleY = Math.round((parent.y + child.y) / 2);
      return `<path d="M${parent.x} ${parent.y + 58} V${middleY} H${child.x} V${child.y - 58}" fill="none" stroke="#d9d8ef" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/>`;
    }).join('');
  const siblingPairs = new Set();
  const siblingLines = [];
  for (const [userId, siblingIds] of Object.entries(siblings)) {
    for (const siblingId of siblingIds) {
      if (!positions.has(userId) || !positions.has(siblingId)) continue;
      const key = [userId, siblingId].sort().join(':');
      if (siblingPairs.has(key)) continue;
      siblingPairs.add(key);
      const left = positions.get(userId);
      const right = positions.get(siblingId);
      siblingLines.push(`<path d="M${left.x} ${left.y} H${right.x}" fill="none" stroke="#27c6d8" stroke-width="5" stroke-linecap="round" opacity=".88"/>`);
    }
  }
  const clips = component.map((userId, index) => {
    const position = positions.get(userId);
    return `<clipPath id="family-avatar-${index}"><circle cx="${position.x}" cy="${position.y}" r="55"/></clipPath>`;
  }).join('');
  const nodes = component.map((userId, index) => {
    const position = positions.get(userId);
    const data = memberData.get(userId);
    const isRoot = userId === rootId;
    return `<g><circle cx="${position.x}" cy="${position.y}" r="62" fill="#262442" stroke="${isRoot ? '#ffd54f' : '#f4f3ff'}" stroke-width="${isRoot ? 7 : 4}" filter="url(#family-shadow)"/>${data.avatar ? `<image href="${data.avatar}" x="${position.x - 55}" y="${position.y - 55}" width="110" height="110" preserveAspectRatio="xMidYMid slice" clip-path="url(#family-avatar-${index})"/>` : ''}<text x="${position.x}" y="${position.y + 92}" text-anchor="middle" fill="#fff" font-size="23" font-weight="900" stroke="#232139" stroke-width="5" paint-order="stroke">${escapeXml(shorten(data.name, 18))}</text>${isRoot ? `<rect x="${position.x - 37}" y="${position.y + 106}" width="74" height="25" rx="13" fill="#ffd54f"/><text x="${position.x}" y="${position.y + 124}" text-anchor="middle" fill="#332b1c" font-size="12" font-weight="900">CENTRE</text>` : ''}</g>`;
  }).join('');
  const rootName = memberData.get(rootId)?.name ?? 'Membre';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style><linearGradient id="family-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#29284f"/><stop offset=".5" stop-color="#55547e"/><stop offset="1" stop-color="#3c3b68"/></linearGradient><radialGradient id="family-glow"><stop stop-color="#c5a5ff" stop-opacity=".2"/><stop offset="1" stop-color="#c5a5ff" stop-opacity="0"/></radialGradient><filter id="family-shadow"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#141329" flood-opacity=".5"/></filter>${clips}</defs><rect width="${width}" height="${height}" rx="32" fill="url(#family-bg)"/><circle cx="${Math.round(width * .8)}" cy="80" r="430" fill="url(#family-glow)"/><rect x="22" y="22" width="${width - 44}" height="${height - 44}" rx="28" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="3"/><text x="55" y="70" fill="#fff" font-size="31" font-weight="900">Arbre familial de ${escapeXml(shorten(rootName, 24))}</text><text x="55" y="101" fill="#fff" opacity=".65" font-size="15" font-weight="750">${component.length} membre${component.length > 1 ? 's' : ''} relié${component.length > 1 ? 's' : ''}</text>${parentLines}${siblingLines.join('')}${nodes}<g transform="translate(55 ${height - 75})"><rect width="${width - 110}" height="48" rx="18" fill="#24233f" opacity=".78"/><circle cx="30" cy="24" r="8" fill="#d9d8ef"/><text x="48" y="30" fill="#fff" opacity=".85" font-size="15" font-weight="750">parent / enfant</text><circle cx="210" cy="24" r="8" fill="#27c6d8"/><text x="228" y="30" fill="#fff" opacity=".85" font-size="15" font-weight="750">fratrie</text><circle cx="340" cy="24" r="8" fill="#ffd54f"/><text x="358" y="30" fill="#fff" opacity=".85" font-size="15" font-weight="750">profil consulté</text></g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCandyShopItemImage(guild, item, background = 'sunset', balance = 0, position = 1, totalItems = 4) {
  const theme = CANDY_THEMES[background] ?? CANDY_THEMES.sunset;
  const itemData = CANDY_SHOP_ITEM_DATA[item.image] ?? CANDY_SHOP_ITEM_DATA.potion;
  const serverName = cleanDisplayName(guild.name ?? 'PVCool');
  const advantageLines = [];
  for (const word of item.advantage.split(/\s+/)) {
    const current = advantageLines.at(-1) ?? '';
    if (!current || `${current} ${word}`.length <= 39) {
      if (advantageLines.length === 0) advantageLines.push(word);
      else advantageLines[advantageLines.length - 1] = `${current} ${word}`;
    } else {
      advantageLines.push(word);
    }
  }
  const advantageText = advantageLines.slice(0, 2)
    .map((line, index) => `<tspan x="600" dy="${index === 0 ? 0 : 28}">${escapeXml(line)}</tspan>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="620">
    <defs>
      <style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.top}"/><stop offset=".55" stop-color="${theme.middle}"/><stop offset="1" stop-color="${theme.bottom}"/></linearGradient>
      <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.hudStart}" stop-opacity=".94"/><stop offset="1" stop-color="${theme.hudEnd}" stop-opacity=".84"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="${theme.accent}" stop-opacity=".35"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#07050d" flood-opacity=".4"/></filter>
      <clipPath id="card"><rect width="1100" height="620" rx="34"/></clipPath>
    </defs>
    <g clip-path="url(#card)"><rect width="1100" height="620" fill="url(#background)"/><circle cx="250" cy="315" r="330" fill="url(#glow)"/><circle cx="1030" cy="30" r="250" fill="#fff" opacity=".04"/></g>
    <text x="48" y="58" fill="#fff" font-size="27" font-weight="900">${escapeXml(shorten(serverName, 24))}</text>
    <text x="48" y="88" fill="#fff" opacity=".66" font-size="14" font-weight="800" letter-spacing="4">BOUTIQUE FLOCONS</text>
    <text x="1048" y="62" text-anchor="end" fill="#fff" opacity=".78" font-size="16" font-weight="750">${position} / ${totalItems}</text>
    <g filter="url(#shadow)"><image href="data:image/png;base64,${itemData}" x="38" y="112" width="515" height="440" preserveAspectRatio="xMidYMid meet"/></g>
    <g filter="url(#shadow)"><rect x="555" y="112" width="495" height="440" rx="32" fill="url(#panel)" stroke="#fff" stroke-opacity=".2" stroke-width="2"/></g>
    <text x="600" y="177" fill="${theme.accent}" font-size="16" font-weight="850" letter-spacing="3">OBJET</text>
    <text x="600" y="222" fill="#fff" font-size="36" font-weight="900">${escapeXml(item.label)}</text>
    <line x1="600" y1="252" x2="1005" y2="252" stroke="#fff" stroke-opacity=".18"/>
    <text x="600" y="294" fill="#fff" opacity=".72" font-size="15" font-weight="800">PRIX</text>
    <image href="${CANDY_ICON_DATA_URI}" x="600" y="310" width="42" height="42" preserveAspectRatio="xMidYMid meet"/>
    <text x="654" y="345" fill="#fff" font-size="35" font-weight="900">${item.price}</text>
    <text x="600" y="396" fill="#fff" opacity=".72" font-size="15" font-weight="800">AVANTAGE</text>
    <text x="600" y="430" fill="#fff" font-size="19" font-weight="720">${advantageText}</text>
    <rect x="600" y="473" width="405" height="52" rx="18" fill="#fff" opacity=".11"/>
    <text x="622" y="505" fill="#fff" opacity=".76" font-size="15" font-weight="750">TON SOLDE</text>
    <image href="${CANDY_ICON_DATA_URI}" x="858" y="482" width="29" height="29" preserveAspectRatio="xMidYMid meet"/>
    <text x="899" y="508" fill="#fff" font-size="24" font-weight="900">${balance}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCandyBuildingsImage(guild, {
  balance = 0,
  buildings = {},
  ownedIds = [],
  dailyRent = 0,
  rentStatus = '',
  notice = null,
  background = 'sunset',
} = {}) {
  const theme = CANDY_THEMES[background] ?? CANDY_THEMES.sunset;
  const owned = new Set(ownedIds);
  const entries = Object.entries(buildings);
  const artwork = await getCandyBuildingArtwork();
  const serverName = cleanDisplayName(guild.name ?? 'PVCool');
  const cards = entries.map(([id, building], index) => {
    const x = 48 + index * 263;
    const isOwned = owned.has(id);
    const cardOpacity = isOwned ? '.96' : '.72';
    return `<g>
      <rect x="${x}" y="170" width="239" height="365" rx="26" fill="${theme.hudStart}" fill-opacity="${cardOpacity}" stroke="${isOwned ? theme.accent : '#fff'}" stroke-opacity="${isOwned ? '.75' : '.16'}" stroke-width="2"/>
      <rect x="${x + 18}" y="190" width="76" height="27" rx="14" fill="${isOwned ? theme.accent : '#fff'}" fill-opacity="${isOwned ? '.9' : '.12'}"/>
      <text x="${x + 56}" y="209" text-anchor="middle" fill="${isOwned ? '#24162c' : '#fff'}" font-size="12" font-weight="900">${isOwned ? 'POSSÉDÉ' : 'À ACHETER'}</text>
      <image href="data:image/png;base64,${artwork[index].toString('base64')}" x="${x + 5}" y="205" width="229" height="180" preserveAspectRatio="xMidYMid meet" filter="url(#estate-shadow)"/>
      <text x="${x + 20}" y="404" fill="#fff" font-size="23" font-weight="900">${escapeXml(building.label)}</text>
      <text x="${x + 20}" y="435" fill="#fff" opacity=".68" font-size="13" font-weight="750">PRIX</text>
      <image href="${CANDY_ICON_DATA_URI}" x="${x + 20}" y="447" width="27" height="27"/>
      <text x="${x + 55}" y="470" fill="#fff" font-size="22" font-weight="900">${building.price}</text>
      <text x="${x + 20}" y="498" fill="#fff" opacity=".68" font-size="13" font-weight="750">LOYER / JOUR</text>
      <text x="${x + 20}" y="522" fill="${theme.accent}" font-size="18" font-weight="900">+${building.rent} flocons · ${Math.ceil(building.price / building.rent)} j</text>
    </g>`;
  }).join('');
  const footer = notice || rentStatus || 'Achète un bâtiment pour commencer.';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="650">
    <defs>
      <style>@font-face{font-family:'LeaderboardInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'LeaderboardInter','Noto Sans',sans-serif}</style>
      <linearGradient id="estate-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${theme.top}"/><stop offset=".55" stop-color="${theme.middle}"/><stop offset="1" stop-color="${theme.bottom}"/></linearGradient>
      <filter id="estate-shadow"><feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="#090611" flood-opacity=".35"/></filter>
      <clipPath id="estate-card"><rect width="1100" height="650" rx="34"/></clipPath>
    </defs>
    <g clip-path="url(#estate-card)"><rect width="1100" height="650" fill="url(#estate-bg)"/><circle cx="960" cy="10" r="300" fill="#fff" opacity=".035"/><circle cx="110" cy="610" r="280" fill="${theme.accent}" opacity=".05"/></g>
    <text x="48" y="54" fill="#fff" font-size="28" font-weight="900">${escapeXml(shorten(serverName, 24))}</text>
    <text x="48" y="83" fill="#fff" opacity=".65" font-size="14" font-weight="800" letter-spacing="4">PATRIMOINE IMMOBILIER</text>
    <g transform="translate(610 34)"><rect width="442" height="95" rx="24" fill="${theme.hudStart}" fill-opacity=".74" stroke="#fff" stroke-opacity=".13"/>
      <text x="25" y="31" fill="#fff" opacity=".67" font-size="13" font-weight="800">TON SOLDE</text><image href="${CANDY_ICON_DATA_URI}" x="22" y="44" width="31" height="31"/><text x="63" y="70" fill="#fff" font-size="26" font-weight="900">${balance}</text>
      <text x="238" y="31" fill="#fff" opacity=".67" font-size="13" font-weight="800">REVENU QUOTIDIEN</text><text x="238" y="70" fill="${theme.accent}" font-size="25" font-weight="900">+${dailyRent} flocons</text>
    </g>
    ${cards}
    <rect x="48" y="558" width="1004" height="62" rx="20" fill="${theme.hudStart}" fill-opacity=".78" stroke="#fff" stroke-opacity=".12"/>
    <text x="75" y="585" fill="${notice ? theme.accent : '#fff'}" font-size="16" font-weight="850">${escapeXml(shorten(footer, 104))}</text>
    <text x="75" y="607" fill="#fff" opacity=".58" font-size="12" font-weight="700">Malus possibles au retrait : entretien −15 % · taxe −25 % · vacance −40 % · aucun retrait direct sur ton solde.</text>
  </svg>`;
  return sharp(Buffer.from(svg)).resize({ width: 3840 }).png({ compressionLevel: 9 }).toBuffer();
}

async function updateCandyPanel(guild) {
  const channel = await guild.channels.fetch(CANDY_LEADERBOARD_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return;
  const guildData = getGuildData(guild.id);
  const candy = ensureCandyStats(guildData);
  const values = candy.counts;
  if (!candy.panelMessageId) {
    const recent = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    candy.panelMessageId = recent?.find((message) => (
      message.author.id === guild.client.user.id
      && message.attachments.some((attachment) => attachment.name === 'classement-flocons.png')
    ))?.id ?? null;
  }
  const image = await renderCandyLeaderboardImage(guild, values);
  candy.panelMessageId = await upsertImage(
    channel,
    candy.panelMessageId,
    image,
    'classement-flocons.png',
    [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('candy:profile')
        .setLabel('Mon profil')
        .setEmoji('❄️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('candy:shop')
        .setLabel('Boutique')
        .setEmoji('🛒')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('candy:buildings')
        .setLabel('Bâtiments')
        .setEmoji('🏢')
        .setStyle(ButtonStyle.Secondary),
    )],
  );
  await saveStore();
}

async function ensureCandyBoostMessage(guild) {
  const channel = await guild.channels.fetch(CANDY_LEADERBOARD_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return;
  const candy = ensureCandyStats(getGuildData(guild.id));
  const permanentContent = '❄️ **BONUS FLOCON ×5**\nRéagis avec ❄️ pour multiplier ton prochain gain de flocons par **5** !';
  if (candy.boostMessageId) {
    const existing = await channel.messages.fetch(candy.boostMessageId).catch(() => null);
    if (existing) {
      await existing.edit({
        content: permanentContent,
        allowedMentions: { parse: [] },
      }).catch(console.error);
      const formerCandyReaction = existing.reactions.cache
        .find((cachedReaction) => cachedReaction.emoji.name === '\u{1F36C}');
      await formerCandyReaction?.remove().catch(() => null);
      if (!existing.reactions.cache.some((cachedReaction) => cachedReaction.emoji.name === '❄️')) {
        await existing.react('❄️').catch(console.error);
      }
      return;
    }
  }

  // Si le volume a été réinitialisé, récupère le panneau déjà présent au lieu
  // d'en publier un second. Aucun détenteur n'est reping lors d'un redémarrage.
  const recentMessages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  const recovered = recentMessages?.find((message) => (
    message.author.id === guild.client.user.id
    && message.content.includes('BONUS FLOCON ×5')
  ));
  if (recovered) {
    candy.boostMessageId = recovered.id;
    await recovered.edit({ content: permanentContent, allowedMentions: { parse: [] } }).catch(console.error);
    if (!recovered.reactions.cache.some((reaction) => reaction.emoji.name === '❄️')) {
      await recovered.react('❄️').catch(console.error);
    }
    await saveStore();
    return;
  }

  const boostMessage = await channel.send({
    content: permanentContent,
    allowedMentions: { parse: [] },
  });
  await boostMessage.react('❄️');
  candy.boostMessageId = boostMessage.id;
  await saveStore();
}

export async function registerCandyDrop(message) {
  if (!message.inGuild() || message.channelId !== CANDY_SOURCE_CHANNEL_ID) return;
  const candy = ensureCandyStats(getGuildData(message.guild.id));
  if (!candy.dropMessageIds.includes(message.id)) candy.dropMessageIds.push(message.id);
  while (candy.dropMessageIds.length > 500) {
    const removedId = candy.dropMessageIds.shift();
    delete candy.claims[removedId];
  }
  await saveStore();
}

export async function handleCandyReaction(reaction, user) {
  if (user.bot) return false;
  if (reaction.partial) await reaction.fetch().catch(() => null);
  if (reaction.message.partial) await reaction.message.fetch().catch(() => null);
  const message = reaction.message;
  if (!message.guild || reaction.emoji.name !== '❄️') return false;

  const candy = ensureCandyStats(getGuildData(message.guild.id));
  if (message.channelId === CANDY_LEADERBOARD_CHANNEL_ID
    && message.id === candy.boostMessageId) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member || member.user.bot) return true;
    candy.nextGainMultipliers[user.id] = 5;
    await saveStore();
    return true;
  }

  if (message.channelId !== CANDY_SOURCE_CHANNEL_ID) return false;
  if (!candy.dropMessageIds.includes(message.id)) return false;
  const claimants = new Set(candy.claims[message.id] ?? []);
  if (claimants.has(user.id)) return true;
  const member = await message.guild.members.fetch(user.id).catch(() => null);
  if (!member || member.user.bot) return true;

  claimants.add(user.id);
  candy.claims[message.id] = [...claimants];
  const multiplier = candy.nextGainMultipliers[user.id] ?? 1;
  candy.counts[user.id] = (candy.counts[user.id] ?? 0) + multiplier;
  delete candy.nextGainMultipliers[user.id];
  await saveStore();
  return true;
}

export async function awardCandies(guild, userId, amount) {
  const candy = ensureCandyStats(getGuildData(guild.id));
  const multiplier = candy.nextGainMultipliers[userId] ?? 1;
  candy.counts[userId] = (candy.counts[userId] ?? 0) + amount * multiplier;
  delete candy.nextGainMultipliers[userId];
  await saveStore();
  return candy.counts[userId];
}

export async function awardCandiesBatch(guild, rewards) {
  const candy = ensureCandyStats(getGuildData(guild.id));
  for (const { userId, amount } of rewards) {
    const multiplier = candy.nextGainMultipliers[userId] ?? 1;
    candy.counts[userId] = (candy.counts[userId] ?? 0) + amount * multiplier;
    delete candy.nextGainMultipliers[userId];
  }
  await saveStore();
}

async function personalRoleActivity(guild, stats) {
  const guildData = getGuildData(guild.id);
  await guild.members.fetch().catch(() => null);
  const exemptRoleIds = new Set(guildData.personalRolePositionExemptions ?? []);
  const entries = [];
  const registeredRoles = Object.entries(guildData.personalRoles ?? {});
  const anchor = guild.roles.cache.get(PERSONAL_ROLE_ANCHOR_ID);
  const ceiling = guild.roles.cache.get(PERSONAL_ROLE_CEILING_ID);
  const discoveredRoles = registeredRoles.length || !anchor
    ? registeredRoles
    : [...guild.roles.cache.values()]
      .filter((role) => !role.managed
        && role.id !== guild.id
        && role.position > anchor.position
        && (!ceiling || role.position < ceiling.position))
      .map((role) => [role.members.firstKey() ?? '', role.id]);

  for (const [ownerId, roleId] of discoveredRoles) {
    const role = guild.roles.cache.get(roleId);
    if (!role || exemptRoleIds.has(roleId)) continue;
    const memberIds = new Set([...role.members.keys(), ownerId]);
    let messages = 0;
    let voiceSeconds = 0;
    for (const memberId of memberIds) {
      messages += Number(stats.textCounts[memberId] ?? 0);
      voiceSeconds += Number(stats.voiceSeconds[memberId] ?? 0);
    }
    const value = messages + Math.floor(voiceSeconds / 60);
    const roleColor = role.hexColor === '#000000' ? '#ff78c8' : role.hexColor;
    const roleIcon = await imageData(role.iconURL?.({ extension: 'png', size: 128 }));
    const fallbackIcon = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><circle cx="64" cy="64" r="60" fill="${roleColor}"/><path d="M64 25l11 23 25 4-18 18 4 25-22-12-22 12 4-25-18-18 25-4z" fill="#fff" fill-opacity=".92"/></svg>`).toString('base64')}`;
    entries.push({
      role,
      ownerId,
      value,
      messages,
      voiceSeconds,
      holderCount: role.members.size,
      color: roleColor,
      name: shorten(`@${cleanDisplayName(role.name)} · ${role.members.size} membre${role.members.size > 1 ? 's' : ''}`, 28),
      avatar: roleIcon ?? fallbackIcon,
    });
  }

  entries.sort((left, right) => right.value - left.value || right.role.position - left.role.position);
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

async function reorderPersonalRoles(guild, entries) {
  const anchor = guild.roles.cache.get(PERSONAL_ROLE_ANCHOR_ID);
  const ceiling = guild.roles.cache.get(PERSONAL_ROLE_CEILING_ID);
  const botMember = guild.members.me;
  if (!anchor || !botMember || entries.length < 2) return;

  const topPosition = Math.min(
    ceiling?.position ? ceiling.position - 1 : Number.MAX_SAFE_INTEGER,
    botMember.roles.highest.position - 1,
  );
  const bottomPosition = Math.max(anchor.position + 1, topPosition - entries.length + 1);
  const available = topPosition - bottomPosition + 1;
  if (available <= 0) return;

  const movable = entries.slice(0, available).reverse();
  const positions = movable.map((entry, index) => ({
    role: entry.role.id,
    position: bottomPosition + index,
  }));
  const changed = positions.some(({ role, position }) => guild.roles.cache.get(role)?.position !== position);
  if (changed) await guild.roles.setPositions(positions, 'Classement hebdomadaire des rôles personnels');
}

async function renderPersonalRoleLeaderboard(guild, stats) {
  const entries = await personalRoleActivity(guild, stats);
  await reorderPersonalRoles(guild, entries).catch(console.error);
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  return renderLeaderboardImage({
    guild,
    title: 'RÔLES PERSO',
    subtitle: 'Activité des rôles personnels',
    accent: '#ff78c8',
    stats,
    values: {},
    total,
    activeMembers: entries.filter((entry) => entry.value > 0).length,
    formatter: (value) => `${value} pts`,
    totalLabel: 'Points cumulés',
    providedEntries: entries.slice(0, 10),
  });
}

async function updateGuildPanels(guild) {
  const channel = await guild.channels.fetch(LEADERBOARD_CHANNEL_ID).catch(() => null);
  if (!channel?.isTextBased() || !('messages' in channel)) return;

  const stats = resetWeekIfNeeded(guild);
  checkpointVoice(stats, guild);
  checkpointDuos(stats, guild);
  const roleEntries = await personalRoleActivity(guild, stats);
  await reorderPersonalRoles(guild, roleEntries).catch(console.error);
  const textTotal = Object.values(stats.textCounts).reduce((sum, value) => sum + value, 0);

  const textImage = await renderLeaderboardImage({
    guild,
    title: 'MESSAGES',
    subtitle: 'Classement textuel',
    accent: '#8d7cff',
    stats,
    values: stats.textCounts,
    total: textTotal,
    activeMembers: Object.values(stats.textCounts).filter((value) => value > 0).length,
    formatter: (value) => `${value} msg`,
    totalLabel: 'Messages',
  });
  if (!stats.messageIds.text) {
    const recent = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    stats.messageIds.text = recent?.find((message) => (
      message.author.id === guild.client.user.id
      && message.attachments.some((attachment) => attachment.name === 'classement-messages.png')
    ))?.id ?? null;
  }
  stats.messageIds.text = await upsertImage(
    channel,
    stats.messageIds.text,
    textImage,
    'classement-messages.png',
    leaderboardButtons(),
  );
  await saveStore();
}

function textSimilarity(left, right) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.length < 4 || right.length < 4) return 0;
  const leftPairs = new Map();
  for (let index = 0; index < left.length - 1; index += 1) {
    const pair = left.slice(index, index + 2);
    leftPairs.set(pair, (leftPairs.get(pair) ?? 0) + 1);
  }
  let matches = 0;
  for (let index = 0; index < right.length - 1; index += 1) {
    const pair = right.slice(index, index + 2);
    const available = leftPairs.get(pair) ?? 0;
    if (available > 0) {
      matches += 1;
      leftPairs.set(pair, available - 1);
    }
  }
  return (2 * matches) / (left.length + right.length - 2);
}

export function recordLeaderboardMessage(message) {
  if (!message.inGuild() || message.author.bot) return;
  if (message.channelId === SMASH_OR_PASS_CHANNEL_ID) return;
  if (message.content.startsWith('+') || message.content.startsWith('=')) return;
  const stats = resetWeekIfNeeded(message.guild);
  const now = Date.now();
  const normalized = message.content
    .normalize('NFKC')
    .toLowerCase()
    .replace(/<@!?\d+>|<@&\d+>|<#\d+>/g, ' ')
    .replace(/<a?:\w+:\d+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.replace(/\s/g, '').length < 3) return;

  const antiSpam = stats.messageAntiSpam[message.author.id] ??= {
    lastCountedAt: 0,
    lastContent: '',
    lastContentAt: 0,
    recentCountedAt: [],
  };
  antiSpam.recentCountedAt = antiSpam.recentCountedAt.filter((timestamp) => now - timestamp < 60_000);
  if (now - antiSpam.lastCountedAt < 10_000 || antiSpam.recentCountedAt.length >= 5) return;
  if (now - antiSpam.lastContentAt < 120_000
    && textSimilarity(normalized, antiSpam.lastContent) >= 0.88) return;

  stats.textCounts[message.author.id] = (stats.textCounts[message.author.id] ?? 0) + 1;
  antiSpam.lastCountedAt = now;
  antiSpam.lastContent = normalized.slice(0, 300);
  antiSpam.lastContentAt = now;
  antiSpam.recentCountedAt.push(now);
  scheduleSave();
}

export function recordVoiceState(oldState, newState) {
  if (newState.member?.user.bot) return;
  const stats = resetWeekIfNeeded(newState.guild);
  checkpointVoice(stats, newState.guild);
  checkpointDuos(stats, newState.guild);
  scheduleSave();
}

export async function handleLeaderboardButton(interaction) {
  if (!['leaderboard:voice', 'leaderboard:duos', 'leaderboard:roles'].includes(interaction.customId)) return false;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const stats = resetWeekIfNeeded(interaction.guild);
  checkpointVoice(stats, interaction.guild);
  checkpointDuos(stats, interaction.guild);
  const isDuo = interaction.customId === 'leaderboard:duos';
  const isRoles = interaction.customId === 'leaderboard:roles';
  const image = isRoles
    ? await renderPersonalRoleLeaderboard(interaction.guild, stats)
    : isDuo
    ? await renderDuoLeaderboardImage(interaction.guild, stats)
    : await renderLeaderboardImage({
      guild: interaction.guild,
      title: 'VOCAL',
      subtitle: 'Classement vocal',
      accent: '#62c18f',
      stats,
      values: stats.voiceSeconds,
      total: Object.values(stats.voiceSeconds).reduce((sum, value) => sum + value, 0),
      activeMembers: Object.values(stats.voiceSeconds).filter((value) => value > 0).length,
      formatter: formatDuration,
      totalLabel: 'Temps cumulé',
    });
  await interaction.editReply({
    files: [{ attachment: image, name: isRoles ? 'classement-roles-perso.png' : (isDuo ? 'classement-duos.png' : 'classement-vocal.png') }],
  });
  await saveStore();
  return true;
}

export async function initializeLeaderboards(client) {
  for (const guild of client.guilds.cache.values()) {
    const stats = resetWeekIfNeeded(guild);
    stats.voiceJoinedAt = {};
    stats.voiceSessionStartedAt = {};
    stats.duoActiveSince = {};
    stats.duoSessionStartedAt = {};
    checkpointVoice(stats, guild);
    checkpointDuos(stats, guild);
    await updateGuildPanels(guild).catch(console.error);
  }

  const interval = setInterval(() => {
    for (const guild of client.guilds.cache.values()) {
      updateGuildPanels(guild).catch(console.error);
    }
  }, UPDATE_INTERVAL_MS);
  interval.unref();
}

export async function initializeCandyLeaderboard(client) {
  for (const guild of client.guilds.cache.values()) {
    await updateCandyPanel(guild).catch(console.error);
    await ensureCandyBoostMessage(guild).catch(console.error);
  }

  const interval = setInterval(() => {
    for (const guild of client.guilds.cache.values()) updateCandyPanel(guild).catch(console.error);
  }, UPDATE_INTERVAL_MS);
  interval.unref();
}
