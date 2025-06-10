import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeDiscord } from '../../app/lib/discord';
import { Presence } from 'discord.js';

const USER_ID = '1253675087195017359';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.DISCORD_BOT_TOKEN) {
    res.status(500).json({ error: 'Discord bot token not configured' });
    return;
  }

  try {
    const client = await initializeDiscord();
    const user = await client.users.fetch(USER_ID);
    if (!user) {
      throw new Error('User not found');
    }

    const guilds = Array.from(client.guilds.cache.values());
    let presence: Presence | null = null;
    for (const guild of guilds) {
      try {
        const member = await guild.members.fetch(USER_ID);
        if (member) {
          presence = member.presence;
          break;
        }
      } catch (error) {
        // Ignore errors silently
      }
    }

    const status = presence?.status || 'offline';
    const activity = presence?.activities.find(a => a.type === 0)?.name || '';

    const response = {
      username: user.globalName || user.username,
      status: status,
      activity: activity,
      avatarURL: user.displayAvatarURL({ size: 256 })
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch Discord data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 