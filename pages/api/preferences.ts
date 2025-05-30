import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  switch (req.method) {
    case 'GET':
      try {
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        if (!preferences) {
          // Create default preferences if they don't exist
          const defaultPreferences = {
            user_id: userId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            automation_enabled: false,
            automation_schedule: '02:00:00',
            email_frequency: 'weekly',
          };

          const { data: newPreferences, error: insertError } = await supabase
            .from('user_preferences')
            .insert([defaultPreferences])
            .select()
            .single();

          if (insertError) throw insertError;

          return res.status(200).json(newPreferences);
        }

        return res.status(200).json(preferences);
      } catch (error) {
        console.error('Error fetching preferences:', error);
        return res.status(500).json({ error: 'Failed to fetch preferences' });
      }

    case 'PATCH':
      try {
        const updates = req.body;

        // Validate the updates
        const allowedFields = [
          'timezone',
          'automation_enabled',
          'automation_schedule',
          'email_frequency',
        ];

        const validUpdates = Object.keys(updates).reduce((acc, key) => {
          if (allowedFields.includes(key)) {
            acc[key] = updates[key];
          }
          return acc;
        }, {} as Record<string, any>);

        const { data: updatedPreferences, error } = await supabase
          .from('user_preferences')
          .update(validUpdates)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json(updatedPreferences);
      } catch (error) {
        console.error('Error updating preferences:', error);
        return res.status(500).json({ error: 'Failed to update preferences' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 