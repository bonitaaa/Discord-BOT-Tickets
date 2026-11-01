import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { buildCommands } from './commands.js';

const botMode = (process.env.BOT_MODE ?? 'support').trim().toLowerCase();
if (!['all', 'main'].includes(botMode)) {
  console.log(`Déploiement des commandes principales ignoré en mode ${botMode}.`);
  process.exit(0);
}

const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Variables manquantes : ${missing.join(', ')}`);
}

const token = process.env.DISCORD_TOKEN.trim().replace(/^Bot\s+/i, '');
const rest = new REST({ version: '10' }).setToken(token);
const guildId = process.env.GUILD_ID.trim();
const guildRoles = await rest.get(Routes.guildRoles(guildId));
const roleNames = Object.fromEntries(guildRoles.map((role) => [role.id, role.name]));
const commands = buildCommands(roleNames);

await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID.trim(), guildId),
  { body: commands },
);

console.log(`${commands.length} commandes enregistrées sur le serveur.`);
