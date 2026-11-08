import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('le stockage persiste uniquement les données nécessaires aux tickets', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'tikonita-store-'));
  process.env.RAILWAY_VOLUME_MOUNT_PATH = directory;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'database.json'), JSON.stringify({
    guilds: {
      'guild-test': {
        legacyFeature: { obsolete: true },
        unrelatedData: { obsolete: true },
        tickets: { existing: { ownerId: 'member', createdAt: 1 } },
        ticketStats: { created: { member: 1 }, claimed: {}, ratings: {}, ratedTickets: {} },
        ticketPunishments: {},
      },
    },
  }));
  const store = await import(`../src/store.js?test=${Date.now()}`);
  await store.loadStore();
  const guild = store.getGuildData('guild-test');
  assert.equal(guild.tickets.existing.ownerId, 'member');
  guild.tickets.channel = { ownerId: 'member', createdAt: 1 };
  guild.ticketStats.created.member = 2;
  guild.ticketPunishments.member = { until: 10 };
  await store.saveStore();
  const saved = JSON.parse(await readFile(path.join(directory, 'database.json'), 'utf8'));
  assert.deepEqual(Object.keys(saved.guilds['guild-test']).sort(), [
    'ticketPanelMessageId', 'ticketPunishments', 'ticketStats', 'tickets',
  ]);
});
