import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get raw body (replaces micro's buffer)
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await getRawBody(req);
    const sig = req.headers['stripe-signature']!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log(`[Webhook] Processing event: ${event.type}`);

    // Handle specific webhook events that affect your Pull-Up Club system
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Webhook] Checkout completed:', session.id);
        
        // Update user profile with payment status
        if (session.metadata?.user_id) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              is_paid: true,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.user_id);

          if (updateError) {
            console.error('[Webhook] Error updating profile:', updateError);
          } else {
            console.log('[Webhook] Profile updated successfully for user:', session.metadata.user_id);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] Subscription ${event.type}:`, subscription.id);
        
        // Update subscription status in your database
        const isActive = subscription.status === 'active';
        
        if (subscription.metadata?.user_id) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              is_paid: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.metadata.user_id);

          if (updateError) {
            console.error('[Webhook] Error updating subscription status:', updateError);
          } else {
            console.log('[Webhook] Subscription status updated for user:', subscription.metadata.user_id);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Webhook] Payment failed:', invoice.id);
        
        // Handle failed payment - could trigger email notification
        // Your existing edge functions can handle this
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Webhook] Error processing webhook:', err);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}