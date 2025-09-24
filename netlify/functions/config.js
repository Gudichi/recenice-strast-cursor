import Stripe from 'stripe';

export default async (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    defaultCurrency: 'eur'
  }));
};
