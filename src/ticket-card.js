import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const INTER_FONT_DATA = readFileSync(
  new URL('../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', import.meta.url),
).toString('base64');
const TICKET_CARD_WAITING_BACKGROUND_DATA = readFileSync(
  new URL('../assets/ticket-card-waiting-background.png', import.meta.url),
).toString('base64');
const TICKET_CARD_CLAIMED_BACKGROUND_DATA = readFileSync(
  new URL('../assets/ticket-card-claimed-background.png', import.meta.url),
).toString('base64');

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
  const backgroundData = claimed
    ? TICKET_CARD_CLAIMED_BACKGROUND_DATA
    : TICKET_CARD_WAITING_BACKGROUND_DATA;
  const displayName = shorten(member?.displayName ?? user?.username ?? 'Membre', 22).toUpperCase();
  const name = escapeXml(displayName);
  const count = claimed ? Number(stats.claimed ?? 1) : Number(stats.created ?? 1);
  const responseSeconds = claimed ? Math.max(0, Math.round((ticket.claimedAt - ticket.createdAt) / 1000)) : 0;
  const response = responseSeconds < 60 ? `${responseSeconds}s` : `${Math.floor(responseSeconds / 60)}m ${responseSeconds % 60}s`;
  const joinedDays = member?.joinedTimestamp
    ? Math.max(0, Math.floor((Date.now() - member.joinedTimestamp) / (24 * 60 * 60 * 1000)))
    : 0;
  const joinedMonths = Math.floor(joinedDays / 30.44);
  const serverTenure = joinedMonths >= 1
    ? `${joinedMonths} mois`
    : `${joinedDays} jour${joinedDays === 1 ? '' : 's'}`;
  const rating = Number(stats.rating ?? 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : '—';
  const ratingsCount = Number(stats.ratingsCount ?? 0);
  const milestones = [2, 5, 10, 25, 50, 100, 250, 500];
  const nextMilestone = milestones.find((milestone) => milestone > count) ?? Math.ceil((count + 1) / 500) * 500;
  const previousMilestone = [...milestones].reverse().find((milestone) => milestone <= count) ?? 0;
  const progressRatio = Math.min(1, Math.max(0, (count - previousMilestone) / (nextMilestone - previousMilestone)));
  const progressWidth = Math.max(8, Math.round(1020 * progressRatio));
  const middleValue = claimed ? ratingLabel : Number(stats.vouchesGiven ?? 0);
  const middleLabel = claimed ? 'NOTE MOYENNE' : 'AVIS';
  const lastValue = claimed ? response : serverTenure;
  const lastLabel = claimed ? 'TEMPS DE RÉPONSE' : 'ANCIENNETÉ';
  const status = claimed ? 'PRIS EN CHARGE' : 'NOUVEAU TICKET';
  const ticketTypeLabels = { help: 'BESOIN D’AIDE', owner: 'CONTACT OWNER' };
  const ticketTag = escapeXml(shorten(
    ticket.typeLabel ?? ticketTypeLabels[ticket.type] ?? ticket.type ?? 'SUPPORT',
    20,
  ).toUpperCase());
  const ticketTagWidth = Math.min(240, Math.max(132, ticketTag.length * 10 + 38));
  const footer = claimed
    ? 'TIKONITA · UNE ÉQUIPE À VOTRE ÉCOUTE'
    : `PROCHAIN PALIER · ${count}/${nextMilestone} TICKETS`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="380">
    <defs>
      <style>@font-face{font-family:'TicketInter';src:url(data:font/woff2;base64,${INTER_FONT_DATA}) format('woff2');font-weight:100 900}text{font-family:'TicketInter','Noto Sans',sans-serif}</style>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#07080c"/><stop offset=".52" stop-color="#11090d"/><stop offset="1" stop-color="#31060c"/></linearGradient>
      <linearGradient id="red" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ff2538"/><stop offset="1" stop-color="#a70015"/></linearGradient>
      <radialGradient id="glow"><stop stop-color="#ff1832" stop-opacity=".32"/><stop offset="1" stop-color="#ff1832" stop-opacity="0"/></radialGradient>
      <pattern id="grain" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r="1" fill="#fff" opacity=".035"/><path d="M8 22L22 8" stroke="#fff" stroke-opacity=".025"/></pattern>
      <clipPath id="card"><rect width="1200" height="380" rx="30"/></clipPath>
      <clipPath id="avatar"><circle cx="132" cy="185" r="72"/></clipPath>
      <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity=".65"/></filter>
    </defs>
    <g clip-path="url(#card)">
      <image href="data:image/png;base64,${backgroundData}" x="0" y="0" width="1200" height="380" preserveAspectRatio="xMidYMid slice"/>
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
    <g transform="translate(245 214)">
      <text x="0" y="0" fill="#fff" font-size="37" font-weight="950">${count}</text><text x="0" y="28" fill="#9e99a4" font-size="13" font-weight="850" letter-spacing="1.3">${claimed ? 'TICKETS PRIS' : 'TICKETS'}</text>
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
