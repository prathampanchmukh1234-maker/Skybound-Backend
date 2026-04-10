import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Request, Response } from 'express';

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
}

function createRazorpayClient() {
  const config = getRazorpayConfig();

  if (!config) {
    return null;
  }

  return new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });
}

export const createOrder = async (req: Request, res: Response) => {
  const { amount } = req.body; // amount in INR
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const razorpay = createRazorpayClient();
  if (!razorpay) {
    return res.status(503).json({ error: 'Razorpay is not configured on the server' });
  }
  
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    });
    res.json({ orderId: order.id, amount: order.amount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const config = getRazorpayConfig();
  if (!config) {
    return res.status(503).json({ status: 'failed', message: 'Razorpay is not configured on the server' });
  }

  const hmac = crypto.createHmac('sha256', config.keySecret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generated_signature = hmac.digest('hex');
  
  if (generated_signature === razorpay_signature) {
    res.json({ status: 'success', message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ status: 'failed', message: 'Invalid payment signature' });
  }
};
