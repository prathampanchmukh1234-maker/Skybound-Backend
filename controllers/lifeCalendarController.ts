import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export const getProfile = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('travel_profiles').select('*').eq('user_id', req.params.userId).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
};

export const upsertProfile = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('travel_profiles').upsert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const getDestinations = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('dream_destinations').select('*').eq('user_id', req.params.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createDestination = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('dream_destinations').insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const updateDestination = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('dream_destinations').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const deleteDestination = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await supabase.from('dream_destinations').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const getTrips = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('life_trips').select('*').eq('user_id', req.params.userId).order('year', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createTrip = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('life_trips').insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const updateTrip = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { data, error } = await supabase.from('life_trips').update(req.body).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const deleteTrip = async (req: Request, res: Response) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });
  const { error } = await supabase.from('life_trips').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};
