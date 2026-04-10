
import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

export const getUserProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUserProfile = async (req: Request, res: Response) => {
  const profile = req.body;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUserAccount = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    // 1. Delete from public.users (RLS should handle this if we use service role or if user is authenticated)
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Delete from auth.users using admin API (requires service role key)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId as string);
    if (authError) throw authError;

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
