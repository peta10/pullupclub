import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import crypto from 'crypto'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create Supabase client for server-side auth
    const supabase = createServerSupabaseClient({ req, res })
    
    // Get the current user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get the Chatbase secret key from environment variables
    const secret = process.env.CHATBASE_SECRET_KEY
    if (!secret) {
      console.error('CHATBASE_SECRET_KEY not found in environment variables')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Generate HMAC hash for user identification
    const userId = user.id // UUID string to identify the user
    const hash = crypto.createHmac('sha256', secret).update(userId).digest('hex')

    return res.status(200).json({
      userId,
      hash,
      success: true
    })

  } catch (error) {
    console.error('Error generating Chatbase verification:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
