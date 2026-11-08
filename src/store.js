import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dataDirectory = path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH || 'data');
const dataFile = path.join(dataDirectory, 'database.json');
const temporaryFile = path.join(dataDirectory, 'database.tmp.json');
let data = { guilds: {} };
let saveQueue = Promise.resolve();

const emptyTicketStats = () => ({ created: {}, claimed: {}, ratings: {}, ratedTickets: {} });

function normalizeGuild(source = {}) {
  const ticketStats = source.ticketStats ?? emptyTicketStats();
  return {
    ticketPanelMessageId: source.ticketPanelMessageId ?? null,
    tickets: source.tickets ?? {},
    ticketStats: {
      created: ticketStats.created ?? {},
      claimed: ticketStats.claimed ?? {},
      ratings: ticketStats.ratings ?? {},
      ratedTickets: ticketStats.ratedTickets ?? {},
    },
    ticketPunishments: source.ticketPunishments ?? {},
  };
}

export async function loadStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    const parsed = JSON.parse(await readFile(dataFile, 'utf8'));
    data = parsed?.guilds
      ? { guilds: Object.fromEntries(Object.entries(parsed.guilds).map(([id, guild]) => [id, normalizeGuild(guild)])) }
      : { guilds: {} };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await saveStore();
  }
}

export function getGuildData(guildId) {
  data.guilds[guildId] ??= normalizeGuild();
  const guild = data.guilds[guildId];
  guild.ticketPanelMessageId ??= null;
  guild.tickets ??= {};
  guild.ticketStats ??= emptyTicketStats();
  guild.ticketStats.created ??= {};
  guild.ticketStats.claimed ??= {};
  guild.ticketStats.ratings ??= {};
  guild.ticketStats.ratedTickets ??= {};
  guild.ticketPunishments ??= {};
  return guild;
}

export function saveStore() {
  saveQueue = saveQueue.then(async () => {
    await writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporaryFile, dataFile);
  });
  return saveQueue;
}
