import { supabase } from '@/lib/supabase';
import { mapSettings, type SettingsRow } from '@/lib/mappers';
import type { Settings } from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = { storeName: 'ElectroMarket', whatsapp: '', currency: 'USD' };

export async function fetchSettings(): Promise<Settings> {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  const settings = mapSettings(data as SettingsRow);
  return settings.storeName === 'Mi Tienda' ? { ...settings, storeName: 'ElectroMarket' } : settings;
}

export async function updateSettings(s: Settings): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ store_name: s.storeName, whatsapp: s.whatsapp, currency: s.currency })
    .eq('id', 1);
  if (error) throw new Error(error.message);
}