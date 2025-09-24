import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4242;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

app.use(cors());

// Webhook MUST come before express.json to keep raw body for signature verification
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // whsec_...

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      // Fulfill digital product delivery here
      break;
    case 'payment_intent.payment_failed':
      break;
    default:
      break;
  }

  res.json({ received: true });
});

// After webhook, enable JSON parser for the rest
app.use(express.json());

app.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    defaultCurrency: 'eur'
  });
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, customer_email, payment_methods } = req.body || {};

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount ?? 100, // 1.00 EUR in cents
      currency: currency ?? 'eur',
      automatic_payment_methods: payment_methods?.length
        ? { enabled: true, allow_redirects: 'never' }
        : { enabled: true },
      receipt_email: customer_email,
      metadata: { integration_check: 'elements_custom' }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(400).json({ error: { message: err.message } });
  }
});

// Raw body for webhook signature verification
// (moved webhook above)

// Static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Express 5: use a regex to catch-all static route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
