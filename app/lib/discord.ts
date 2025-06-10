import { Client, GatewayIntentBits, Presence } from 'discord.js';

// Create a Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

let isInitialized = false;

client.on('ready', () => {
  console.log('[Discord] Bot is ready!');
  console.log(`[Discord] Logged in as ${client.user?.tag}`);
  isInitialized = true;
});

client.on('error', (error) => {
  console.error('[Discord] Client error:', error);
});

client.on('warn', (warning) => {
  console.warn('[Discord] Client warning:', warning);
});

client.on('debug', (info) => {
  console.debug('[Discord] Debug info:', info);
});

client.on('presenceUpdate', (oldPresence: Presence | null, newPresence: Presence) => {
  console.log('[Discord] Presence update:', {
    userId: newPresence.userId,
    status: newPresence.status,
    activities: newPresence.activities.map(a => ({
      name: a.name,
      type: a.type
    }))
  });
});

export const initializeDiscord = async () => {
  if (!isInitialized) {
    console.log('[Discord] Initializing client...');
    try {
      await client.login(process.env.DISCORD_BOT_TOKEN);
      console.log('[Discord] Login successful');
    } catch (error) {
      console.error('[Discord] Login failed:', error);
      throw error;
    }
  }
  return client;
};

export const getDiscordClient = () => {
  if (!isInitialized) {
    console.warn('[Discord] Client accessed before initialization');
  }
  return client;
}; 