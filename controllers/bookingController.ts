import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export const getBookings = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createBooking = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await supabase.from('bookings').insert([req.body]);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const cancelBooking = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};
