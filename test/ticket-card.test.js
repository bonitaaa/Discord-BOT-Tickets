import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTicketCard } from '../src/ticket-card.js';

const user = {
  username: 'Membre',
  displayAvatarURL: () => null,
};
const member = {
  user,
  displayName: 'Membre',
  joinedTimestamp: Date.now() - 86_400_000,
};
const guild = {
  members: { fetch: async () => member },
  client: { users: { fetch: async () => user } },
};

test('génère les cartes des tickets en attente et pris en charge', async () => {
  const waiting = await renderTicketCard(guild, 'member', {
    type: 'help', typeLabel: 'Besoin d’aide', createdAt: Date.now(), claimedBy: null,
  }, { created: 1 });
  const claimed = await renderTicketCard(guild, 'member', {
    type: 'help', typeLabel: 'Besoin d’aide', createdAt: Date.now() - 10_000,
    claimedAt: Date.now(), claimedBy: 'staff',
  }, { claimed: 2, rating: 5, ratingsCount: 1 });
  assert.equal(waiting.subarray(1, 4).toString(), 'PNG');
  assert.equal(claimed.subarray(1, 4).toString(), 'PNG');
});
