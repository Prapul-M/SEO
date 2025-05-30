import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        const { repository_id, status } = req.query;

        let query = supabase
          .from('seo_changes')
          .select(`
            *,
            automation_logs (
              repository_id,
              user_id
            )
          `)
          .eq('automation_logs.user_id', userId);

        if (repository_id) {
          query = query.eq('automation_logs.repository_id', repository_id);
        }

        if (status) {
          query = query.eq('status', status);
        }

        const { data: changes, error } = await query;

        if (error) throw error;

        return res.status(200).json(changes);
      } catch (error) {
        console.error('Error fetching changes:', error);
        return res.status(500).json({ error: 'Failed to fetch changes' });
      }

    case 'PATCH':
      try {
        const { changeId } = req.query;
        const { status, feedback } = req.body;

        if (!changeId) {
          return res.status(400).json({ error: 'Change ID is required' });
        }

        // Verify the change belongs to the user
        const { data: change, error: fetchError } = await supabase
          .from('seo_changes')
          .select(`
            *,
            automation_logs (
              user_id
            )
          `)
          .eq('id', changeId)
          .single();

        if (fetchError) throw fetchError;

        if (!change || change.automation_logs.user_id !== userId) {
          return res.status(404).json({ error: 'Change not found' });
        }

        // Update the change status
        const { data: updatedChange, error: updateError } = await supabase
          .from('seo_changes')
          .update({
            status,
            applied_at: status === 'applied' ? new Date().toISOString() : null,
          })
          .eq('id', changeId)
          .select()
          .single();

        if (updateError) throw updateError;

        // If feedback is provided and the change is rejected, use it to improve future suggestions
        if (status === 'rejected' && feedback) {
          try {
            await openai.chat.completions.create({
              model: 'gpt-4-turbo-preview',
              messages: [
                {
                  role: 'system',
                  content: 'You are an AI that learns from SEO change feedback to improve future suggestions.',
                },
                {
                  role: 'user',
                  content: `The following SEO change was rejected:
                    Type: ${change.element_type}
                    Old Value: ${change.old_value}
                    Suggested Value: ${change.new_value}
                    Feedback: ${feedback}
                    
                    Please analyze this feedback and provide insights for future improvements.`,
                },
              ],
            });
          } catch (aiError) {
            console.error('Error processing feedback with AI:', aiError);
            // Don't throw the error as this is a non-critical operation
          }
        }

        return res.status(200).json(updatedChange);
      } catch (error) {
        console.error('Error updating change:', error);
        return res.status(500).json({ error: 'Failed to update change' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
} 