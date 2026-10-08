import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeaderboardEntry, RoomInfo } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 10
);

declare global {
  var _supabaseInstance: SupabaseClient | undefined;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? (globalThis._supabaseInstance ??= createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 15,
        },
      },
    }))
  : null;

const LOCAL_LEADERBOARD_KEY = 'blockarena_solo_leaderboard';
const LOCAL_ROOMS_KEY = 'blockarena_rooms_cache';

// Helper to clean up any old dummy mock data if stored in user's browser
function sanitizeLocalCache() {
  if (typeof window === 'undefined') return;
  try {
    const rawLb = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (rawLb && (rawLb.includes('VortexMaster') || rawLb.includes('CyberBlast'))) {
      localStorage.removeItem(LOCAL_LEADERBOARD_KEY);
    }

    const rawRooms = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (rawRooms && (rawRooms.includes('ARENA1') || rawRooms.includes('BATTLE'))) {
      localStorage.removeItem(LOCAL_ROOMS_KEY);
    }
  } catch {
    // Ignore
  }
}

// Helper to generate 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// SOLO LEADERBOARD FUNCTIONS (Poin Tertinggi)
// ==========================================
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  sanitizeLocalCache();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(30);

      if (!error && data !== null) {
        return data as LeaderboardEntry[];
      }
      if (error) {
        console.warn('Supabase query error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase leaderboard fetch failed:', err);
    }
  }

  // LocalStorage fallback (Mulai kosong, tidak ada data dummy)
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
  }
  return [];
}

/**
 * Submit score HANYA dari mode SOLO (bukan room)
 * Poin tertinggi, BUKAN akumulasi!
 */
export async function submitSoloScore(
  username: string,
  score: number,
  linesCleared: number,
  maxCombo: number
): Promise<{ success: boolean; isOnline: boolean }> {
  if (score <= 0) return { success: false, isOnline: false };
  const cleanUsername = username.trim() || 'Anonymous';

  if (isSupabaseConfigured && supabase) {
    try {
      // Check existing best score for this user
      const { data: existing, error: selectErr } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('username', cleanUsername)
        .order('score', { ascending: false })
        .limit(1);

      if (!selectErr && existing && existing.length > 0) {
        const best = existing[0];
        if (score > best.score) {
          // Update to new higher score
          await supabase
            .from('leaderboard')
            .update({
              score,
              lines_cleared: linesCleared,
              max_combo: maxCombo,
              created_at: new Date().toISOString(),
            })
            .eq('id', best.id);
          return { success: true, isOnline: true };
        } else {
          // Current match score is not higher than personal best
          return { success: false, isOnline: true };
        }
      } else {
        // Insert new entry
        await supabase.from('leaderboard').insert([
          {
            username: cleanUsername,
            score,
            lines_cleared: linesCleared,
            max_combo: maxCombo,
          },
        ]);
        return { success: true, isOnline: true };
      }
    } catch (err) {
      console.warn('Supabase score submission error, falling back to local:', err);
    }
  }

  // Fallback Local Storage
  if (typeof window !== 'undefined') {
    const current = await fetchLeaderboard();
    const existingIndex = current.findIndex((item) => item.username.toLowerCase() === cleanUsername.toLowerCase());

    if (existingIndex >= 0) {
      if (score > current[existingIndex].score) {
        current[existingIndex].score = score;
        current[existingIndex].lines_cleared = linesCleared;
        current[existingIndex].max_combo = maxCombo;
        current[existingIndex].created_at = new Date().toISOString();
      }
    } else {
      current.push({
        id: `local-${Date.now()}`,
        username: cleanUsername,
        score,
        lines_cleared: linesCleared,
        max_combo: maxCombo,
        created_at: new Date().toISOString(),
      });
    }

    const sorted = current.sort((a, b) => b.score - a.score).slice(0, 30);
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(sorted));
    return { success: true, isOnline: false };
  }

  return { success: false, isOnline: false };
}

// ==========================================
// ROOM FUNCTIONS (Create, Browse & Delete Rooms)
// ==========================================
export async function createRoomInDb(params: {
  name: string;
  is_private: boolean;
  password?: string;
  host_name: string;
  host_id: string;
}): Promise<RoomInfo> {
  const code = generateRoomCode();
  const roomData: RoomInfo = {
    id: `room-${Date.now()}`,
    code,
    name: params.name.trim() || `Stage ${code}`,
    is_private: params.is_private,
    password: params.password?.trim() || undefined,
    player_count: 1,
    max_players: 5,
    status: 'waiting',
    host_name: params.host_name,
    host_id: params.host_id,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            code: roomData.code,
            name: roomData.name,
            is_private: roomData.is_private,
            password: roomData.password,
            status: 'waiting',
            max_players: 5,
            host_name: roomData.host_name,
            host_id: roomData.host_id,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          ...roomData,
          id: data.id,
        };
      }
    } catch (err) {
      console.warn('Failed to insert room into Supabase:', err);
    }
  }

  // Local storage save
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    const rooms: RoomInfo[] = raw ? JSON.parse(raw) : [];
    rooms.unshift(roomData);
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
  }

  return roomData;
}

export async function fetchRoomsFromDb(searchQuery?: string): Promise<RoomInfo[]> {
  sanitizeLocalCache();

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data !== null) {
        return data.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          is_private: r.is_private,
          password: r.password,
          player_count: 1,
          max_players: r.max_players || 5,
          status: r.status,
          host_name: r.host_name,
          host_id: r.host_id,
          created_at: r.created_at,
        }));
      }
      if (error) {
        console.warn('Supabase rooms query error:', error.message);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms from Supabase:', err);
    }
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    let rooms: RoomInfo[] = raw ? JSON.parse(raw) : [];

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rooms = rooms.filter(
        (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
      );
    }
    return rooms;
  }

  return [];
}

export async function getRoomByCode(code: string): Promise<RoomInfo | null> {
  const cleanCode = code.toUpperCase().trim();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', cleanCode)
        .eq('status', 'waiting')
        .single();

      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          name: data.name,
          is_private: data.is_private,
          password: data.password,
          player_count: 1,
          max_players: data.max_players || 5,
          status: data.status,
          host_name: data.host_name,
          host_id: data.host_id,
          created_at: data.created_at,
        };
      }
    } catch {
      // Ignore error
    }
  }

  // Check local fallback
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    const rooms: RoomInfo[] = raw ? JSON.parse(raw) : [];
    return rooms.find((r) => r.code.toUpperCase() === cleanCode) || null;
  }

  return null;
}

/**
 * Hapus / tutup room ketika Room Master keluar atau room kosong
 */
export async function deleteRoomFromDb(code: string): Promise<boolean> {
  const cleanCode = code.toUpperCase().trim();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try to delete row completely
      await supabase
        .from('rooms')
        .delete()
        .eq('code', cleanCode);

      // 2. Also update status to 'closed' in case delete RLS is pending
      await supabase
        .from('rooms')
        .update({ status: 'closed' })
        .eq('code', cleanCode);

      return true;
    } catch (err) {
      console.warn('Failed to delete room from Supabase:', err);
    }
  }

  // Remove from localStorage cache
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
    if (raw) {
      try {
        const rooms: RoomInfo[] = JSON.parse(raw);
        const filtered = rooms.filter((r) => r.code.toUpperCase() !== cleanCode);
        localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(filtered));
      } catch {
        // Ignore
      }
    }
  }

  return true;
}
