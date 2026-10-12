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

  let combinedEntries: LeaderboardEntry[] = [];

  // 1. Fetch from Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) {
        combinedEntries = [...data];
      } else if (error) {
        console.warn('Supabase leaderboard fetch error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase leaderboard fetch failed:', err);
    }
  }

  // 2. Merge local storage entries & active player's high score
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      if (raw) {
        const localList: LeaderboardEntry[] = JSON.parse(raw);
        if (Array.isArray(localList)) {
          combinedEntries = [...combinedEntries, ...localList];
        }
      }

      // Merge current active player's local personal best if available
      const currentUsername = localStorage.getItem('blockarena_username')?.trim();
      const localHighScoreStr = localStorage.getItem('blockarena_solo_high_score');
      const localHighScore = localHighScoreStr ? parseInt(localHighScoreStr, 10) : 0;

      if (currentUsername && localHighScore > 0) {
        combinedEntries.push({
          id: `local-current-${Date.now()}`,
          username: currentUsername,
          score: localHighScore,
          lines_cleared: 0,
          max_combo: 0,
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore local storage parse errors
    }
  }

  // 3. DEDUPLICATION: Setiap username hanya boleh punya 1 skor tertinggi (Personal Best)
  const userBestMap = new Map<string, LeaderboardEntry>();

  for (const entry of combinedEntries) {
    if (!entry || !entry.username || typeof entry.score !== 'number') continue;
    const cleanName = entry.username.trim();
    if (!cleanName) continue;
    const lowerKey = cleanName.toLowerCase();

    const existing = userBestMap.get(lowerKey);
    if (!existing || entry.score > existing.score) {
      userBestMap.set(lowerKey, {
        ...entry,
        username: cleanName, // Preserve casing of best entry
      });
    }
  }

  const finalLeaderboard = Array.from(userBestMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  return finalLeaderboard;
}

/**
 * Submit score HANYA dari mode SOLO (bukan room)
 * Poin tertinggi (Personal Best), BUKAN akumulasi!
 * Selalu memperbarui Supabase dan LocalStorage agar leaderboard selalu up-to-date.
 */
export async function submitSoloScore(
  username: string,
  score: number,
  linesCleared: number,
  maxCombo: number
): Promise<{ success: boolean; isOnline: boolean }> {
  if (score <= 0) return { success: false, isOnline: false };
  const cleanUsername = username.trim() || 'Anonymous';
  let isOnlineSuccess = false;

  // 1. Sync Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      // Check existing rows for this user (case-insensitive)
      const { data: existing, error: selectErr } = await supabase
        .from('leaderboard')
        .select('*')
        .ilike('username', cleanUsername);

      if (!selectErr && existing && existing.length > 0) {
        // Find existing maximum score
        const maxPrevScore = Math.max(...existing.map((r) => r.score));

        if (score > maxPrevScore) {
          // Player achieved a new higher score! Update the existing row
          const primaryRow = existing[0];
          const { error: updateErr } = await supabase
            .from('leaderboard')
            .update({
              username: cleanUsername,
              score,
              lines_cleared: linesCleared,
              max_combo: maxCombo,
              created_at: new Date().toISOString(),
            })
            .eq('id', primaryRow.id);

          if (!updateErr) {
            isOnlineSuccess = true;
            // Clean up any duplicate legacy rows for this user if delete policy permits
            if (existing.length > 1) {
              const otherIds = existing.slice(1).map((r) => r.id);
              supabase.from('leaderboard').delete().in('id', otherIds).then();
            }
          } else {
            console.warn('Leaderboard update blocked or failed, attempting insert fallback:', updateErr.message);
            // Fallback insert if update RLS policy is not yet applied
            const { error: insertErr } = await supabase.from('leaderboard').insert([
              {
                username: cleanUsername,
                score,
                lines_cleared: linesCleared,
                max_combo: maxCombo,
              },
            ]);
            if (!insertErr) isOnlineSuccess = true;
          }
        } else {
          // Current score is lower than or equal to existing best
          isOnlineSuccess = true;
        }
      } else {
        // First time entry for this username
        const { error: insertErr } = await supabase.from('leaderboard').insert([
          {
            username: cleanUsername,
            score,
            lines_cleared: linesCleared,
            max_combo: maxCombo,
          },
        ]);
        if (!insertErr) isOnlineSuccess = true;
      }
    } catch (err) {
      console.warn('Supabase score submission error:', err);
    }
  }

  // 2. ALWAYS sync LocalStorage so local player cache is immediately updated
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      let localList: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(localList)) localList = [];

      const existingIndex = localList.findIndex(
        (item) => item.username.toLowerCase() === cleanUsername.toLowerCase()
      );

      if (existingIndex >= 0) {
        if (score > localList[existingIndex].score) {
          localList[existingIndex].score = score;
          localList[existingIndex].lines_cleared = linesCleared;
          localList[existingIndex].max_combo = maxCombo;
          localList[existingIndex].created_at = new Date().toISOString();
        }
      } else {
        localList.push({
          id: `local-${Date.now()}`,
          username: cleanUsername,
          score,
          lines_cleared: linesCleared,
          max_combo: maxCombo,
          created_at: new Date().toISOString(),
        });
      }

      // Sort and keep top 30
      const sorted = localList.sort((a, b) => b.score - a.score).slice(0, 30);
      localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(sorted));

      // Also ensure personal best high score in localStorage is updated
      const currentStored = parseInt(localStorage.getItem('blockarena_solo_high_score') || '0', 10);
      if (score > currentStored) {
        localStorage.setItem('blockarena_solo_high_score', String(score));
      }
    } catch {
      // Ignore local storage error
    }
  }

  return { success: true, isOnline: isOnlineSuccess };
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
