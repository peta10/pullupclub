import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@13.6.0";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '', 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20'
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Enhanced function to find user by email (optimized for Payment Links)
async function findUserByEmail(customerEmail: string) {
  console.log(`Searching for user with email: ${customerEmail}`);
  
  try {
    // Strategy 1: Look in profiles table
    const { data: profileUser, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('email', customerEmail)
      .maybeSingle();
      
    if (!profileError && profileUser) {
      console.log('Found user in profiles:', profileUser);
      return profileUser;
    }
    
    // Strategy 2: Look in auth.users table
    console.log('Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!authError && authUsers?.users) {
      const matchingAuthUser = authUsers.users.find(user => 
        user.email?.toLowerCase() === customerEmail.toLowerCase()
      );
      
      if (matchingAuthUser) {
        console.log('Found matching auth user:', matchingAuthUser.id);
        
        // Check if this auth user has a profile
        const { data: authProfile, error: authProfileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, stripe_customer_id')
          .eq('id', matchingAuthUser.id)
          .maybeSingle();
          
        if (!authProfileError && authProfile) {
          console.log('Found profile for auth user:', authProfile);
          return authProfile;
        } else {
          console.log('Auth user exists but no profile found - will create profile entry');
          // Return auth user info so we can create profile
          return {
            id: matchingAuthUser.id,
            email: matchingAuthUser.email,
            stripe_customer_id: null,
            isAuthUserOnly: true
          };
        }
      }
    }
    
    console.log('No user found with email:', customerEmail);
    return null;
    
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    return null;
  }
}

async function updateUserPaymentStatus(userId: string, customerId: string, customerEmail: string, isAuthUserOnly = false) {
  console.log(`Updating payment status for user: ${userId}, customer: ${customerId}`);
  
  try {
    if (isAuthUserOnly) {
      // User exists in auth but no profile - create profile
      console.log('Creating profile for auth user');
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: customerEmail,
          stripe_customer_id: customerId,
          is_paid: true,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      console.log('Successfully created profile with payment status');
      return data;
    } else {
      // Update existing profile
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          stripe_customer_id: customerId,
          is_paid: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();
        
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Successfully updated profile payment status');
      return data;
    }
  } catch (error) {
    console.error('Error in updateUserPaymentStatus:', error);
    throw error;
  }
}

async function verifyStripeSignature(req: Request) {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return { valid: false };
    }
    
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body, 
      signature, 
      stripeWebhookSecret, 
      undefined, 
      cryptoProvider
    );
    
    return { valid: true, event };
  } catch (err) {
    console.error('Error verifying Stripe signature:', err);
    return { valid: false };
  }
}

console.log('Payment Link Compatible Stripe Webhook initialized!');

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { valid, event } = await verifyStripeSignature(req);
    if (!valid || !event) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status !== 'paid') {
          console.log('Payment not completed, skipping');
          break;
        }

        const customerEmail = session.customer_details?.email;
        const customerId = session.customer as string;
        
        if (!customerEmail) {
          console.log('No customer email found in session');
          break;
        }
        
        if (!customerId) {
          console.log('No customer ID found in session');
          break;
        }

        console.log(`Processing payment for: ${customerEmail}, customer: ${customerId}`);

        // Find user by email (works for both custom checkout and Payment Links)
        const user = await findUserByEmail(customerEmail);

        if (user) {
          console.log('User found! Updating payment status...');
          await updateUserPaymentStatus(
            user.id, 
            customerId, 
            customerEmail, 
            user.isAuthUserOnly || false
          );
          
          // Handle subscription record creation
          if (session.subscription && typeof session.subscription === 'string') {
            try {
              const subscription = await stripe.subscriptions.retrieve(session.subscription);
              
              // Check if subscription record already exists
              const { data: existingSubscription } = await supabaseAdmin
                .from('subscriptions')
                .select('id')
                .eq('stripe_subscription_id', subscription.id)
                .maybeSingle();
                
              if (!existingSubscription) {
                const { error: subscriptionError } = await supabaseAdmin
                  .from('subscriptions')
                  .insert({
                    user_id: user.id,
                    stripe_subscription_id: subscription.id,
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                  });
                  
                if (subscriptionError) {
                  console.error('Error creating subscription record:', subscriptionError);
                } else {
                  console.log('Subscription record created successfully');
                }
              } else {
                console.log('Subscription record already exists');
              }
            } catch (stripeError) {
              console.error('Error retrieving subscription:', stripeError);
            }
          }
          
          console.log(`Successfully processed payment for user: ${user.id}`);
        } else {
          console.log(`No user found with email: ${customerEmail}`);
          console.log('This might be a payment from a user who hasnt created an account yet');
          console.log('Customer details:', {
            email: customerEmail,
            customerId: customerId,
            name: session.customer_details?.name
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (!invoice.customer || typeof invoice.customer !== 'string') {
          break;
        }
        
        if (!invoice.subscription || typeof invoice.subscription !== 'string') {
          break;
        }
        
        console.log(`Processing recurring payment for customer: ${invoice.customer}`);
        
        // For recurring payments, find user by stripe_customer_id
        const { data: user, error } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', invoice.customer)
          .maybeSingle();
        
        if (user) {
          try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
              })
              .eq('stripe_subscription_id', subscription.id);
              
            console.log('Updated subscription for recurring payment');
          } catch (error) {
            console.error('Error updating subscription:', error);
          }
        } else {
          console.log('User not found for recurring payment customer:', invoice.customer);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);
        
        // Check if user should be marked as unpaid
        if (subscription.customer && typeof subscription.customer === 'string') {
          const { data: user } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer)
            .maybeSingle();
          
          if (user) {
            const { data: activeSubscriptions } = await supabaseAdmin
              .from('subscriptions')
              .select('id')
              .eq('user_id', user.id)
              .eq('status', 'active');
              
            if (!activeSubscriptions?.length) {
              await supabaseAdmin
                .from('profiles')
                .update({ is_paid: false })
                .eq('id', user.id);
                
              console.log('Marked user as unpaid due to subscription cancellation');
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true, eventId: event.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Webhook error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});