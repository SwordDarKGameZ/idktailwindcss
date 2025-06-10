import type { NextApiRequest, NextApiResponse } from 'next';

const ROBLOX_USER_ID = '388361463'; // Replace with your Roblox user ID

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Fetch Roblox user data
    const userResponse = await fetch(`https://users.roblox.com/v1/users/${ROBLOX_USER_ID}`);
    if (!userResponse.ok) {
      throw new Error('Failed to fetch Roblox user data');
    }
    const userData = await userResponse.json();

    // Fetch Roblox user avatar
    const avatarResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ROBLOX_USER_ID}&size=180x180&format=Png&isCircular=true`);
    if (!avatarResponse.ok) {
      throw new Error('Failed to fetch Roblox avatar');
    }
    const avatarData = await avatarResponse.json();
    const avatarURL = avatarData.data[0].imageUrl;

    // Fetch Roblox user presence (if available)
    const presenceResponse = await fetch(`https://presence.roblox.com/v1/presence/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds: [ROBLOX_USER_ID] }),
    });
    const presenceData = await presenceResponse.json();
    const userPresence = presenceData.userPresences[0];

    let status = userPresence?.userPresenceType || 'offline';
    let activity = userPresence?.lastLocation || '';

    // Handle 'Website' and 'Playing' statuses
    if (status === 'Website') {
      status = 'online'; // Change to 'online' for blue dot
      activity = 'On Website';
    } else if (status === 'Playing') {
      status = 'online'; // Change to 'online' for green dot
      activity = userPresence?.lastLocation || 'Playing a game';
    }

    const response = {
      username: userData.name,
      status: status,
      activity: activity,
      avatarURL: avatarURL,
    };

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch Roblox data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 