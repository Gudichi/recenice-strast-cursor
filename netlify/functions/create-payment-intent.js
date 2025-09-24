import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }
  try {
    const { amount, currency, customer_email, payment_methods } = JSON.parse(req.body || '{}');

    const pi = await stripe.paymentIntents.create({
      amount: amount ?? 100,
      currency: currency ?? 'eur',
      automatic_payment_methods: payment_methods?.length
        ? { enabled: true, allow_redirects: 'never' }
        : { enabled: true },
      receipt_email: customer_email,
      metadata: { integration_check: 'elements_custom' }
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ clientSecret: pi.client_secret }));
  } catch (err) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message: err.message } }));
  }
};
