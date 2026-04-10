
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export const getTripPlans = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase
      .from('trip_plans')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTripPlan = async (req: Request, res: Response) => {
  const plan = req.body;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase
      .from('trip_plans')
      .insert([plan])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTripPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { error } = await supabase
      .from('trip_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
