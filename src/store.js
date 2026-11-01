import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dataDirectory = path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH || 'data');
const dataFile = path.join(dataDirectory, 'database.json');
const temporaryFile = path.join(dataDirectory, 'database.tmp.json');
let data = { guilds: {} };
let saveQueue = Promise.resolve();

export async function loadStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    const parsed = JSON.parse(await readFile(dataFile, 'utf8'));
    data = parsed?.guilds ? parsed : { guilds: {} };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await saveStore();
  }
}

export function getGuildData(guildId) {
  data.guilds[guildId] ??= {
    whitelist: [],
    personalRoles: {},
    personalRoleBlockedUsers: {},
    personalRolePanelMessageId: null,
    personalRolePositionExemptions: [],
    personalRoleDatabaseCleanupDone: false,
    roleCeilingProtectedIds: [],
    roleCeilingOwnerExemptions: [],
    roleCeilingProtectionInitialized: false,
    roleHolders: {},
    dogs: {},
    lockedNicknames: {},
    dogWhitelist: [],
    welcomeMessageId: null,
    pvWhitelist: [],
    spamWhitelist: [],
    privateVoices: {},
    voicePanelCleanupDone: false,
    channelLocks: {},
    protectedChannels: {},
    roleBackups: {},
    securityBlacklist: [],
    securityForumTemplates: {},
    commandForumTemplates: {},
    voiceAbuseStrikes: {},
    banAbuse: {},
    banWhitelist: [],
    wakeupWhitelist: [],
    wakeupUsage: {},
    locknameWhitelist: [],
    quizWhitelist: [],
    banVotes: {},
    banJudgmentTemplateMessageId: null,
    giveaways: {},
    badwords: [],
    profilePanelMessageId: null,
    voicePanelMessageId: null,
    ticketPanelMessageId: null,
    tickets: {},
    ticketStats: { created: {}, claimed: {}, ratings: {}, ratedTickets: {} },
    ticketPunishments: {},
    leaderboard: {},
    candyLeaderboard: {},
    candyFamilies: {},
  };
  data.guilds[guildId].whitelist ??= [];
  data.guilds[guildId].personalRoles ??= {};
  data.guilds[guildId].personalRoleBlockedUsers ??= {};
  data.guilds[guildId].personalRolePanelMessageId ??= null;
  data.guilds[guildId].personalRolePositionExemptions ??= [];
  data.guilds[guildId].personalRoleDatabaseCleanupDone ??= false;
  data.guilds[guildId].roleCeilingProtectedIds ??= [];
  data.guilds[guildId].roleCeilingOwnerExemptions ??= [];
  data.guilds[guildId].roleCeilingProtectionInitialized ??= false;
  data.guilds[guildId].roleHolders ??= {};
  data.guilds[guildId].dogs ??= {};
  data.guilds[guildId].lockedNicknames ??= {};
  data.guilds[guildId].dogWhitelist ??= [];
  data.guilds[guildId].welcomeMessageId ??= null;
  data.guilds[guildId].pvWhitelist ??= [];
  data.guilds[guildId].spamWhitelist ??= [];
  data.guilds[guildId].privateVoices ??= {};
  data.guilds[guildId].voicePanelCleanupDone ??= false;
  data.guilds[guildId].channelLocks ??= {};
  data.guilds[guildId].protectedChannels ??= {};
  data.guilds[guildId].roleBackups ??= {};
  data.guilds[guildId].securityBlacklist ??= [];
  data.guilds[guildId].securityForumTemplates ??= {};
  data.guilds[guildId].commandForumTemplates ??= {};
  data.guilds[guildId].voiceAbuseStrikes ??= {};
  data.guilds[guildId].banAbuse ??= {};
  data.guilds[guildId].banWhitelist ??= [];
  data.guilds[guildId].wakeupWhitelist ??= [];
  data.guilds[guildId].wakeupUsage ??= {};
  data.guilds[guildId].locknameWhitelist ??= [];
  data.guilds[guildId].quizWhitelist ??= [];
  data.guilds[guildId].banVotes ??= {};
  data.guilds[guildId].banJudgmentTemplateMessageId ??= null;
  data.guilds[guildId].giveaways ??= {};
  data.guilds[guildId].badwords ??= [];
  data.guilds[guildId].profilePanelMessageId ??= null;
  data.guilds[guildId].voicePanelMessageId ??= null;
  data.guilds[guildId].ticketPanelMessageId ??= null;
  data.guilds[guildId].tickets ??= {};
  data.guilds[guildId].ticketStats ??= { created: {}, claimed: {}, ratings: {}, ratedTickets: {} };
  data.guilds[guildId].ticketStats.created ??= {};
  data.guilds[guildId].ticketStats.claimed ??= {};
  data.guilds[guildId].ticketStats.ratings ??= {};
  data.guilds[guildId].ticketStats.ratedTickets ??= {};
  data.guilds[guildId].ticketPunishments ??= {};
  data.guilds[guildId].candyLeaderboard ??= {};
  data.guilds[guildId].candyFamilies ??= {};
  return data.guilds[guildId];
}

export function saveStore() {
  saveQueue = saveQueue.then(async () => {
    await writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporaryFile, dataFile);
  });
  return saveQueue;
}
