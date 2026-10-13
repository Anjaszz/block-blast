import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeaderboardEntry, RoomInfo, StageMode } from './types';

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
    if (rawLb) {
      if (rawLb.includes('VortexMaster') || rawLb.includes('CyberBlast')) {
        localStorage.removeItem(LOCAL_LEADERBOARD_KEY);
      } else {
        const currentName = localStorage.getItem('blockarena_username')?.trim().toLowerCase();
        let list: LeaderboardEntry[] = JSON.parse(rawLb);
        if (Array.isArray(list) && currentName && currentName !== 'player' && currentName !== 'player_1') {
          // Bersihkan entri duplikat 'Player' / 'Player_1' jika user punya nama sendiri
          const filtered = list.filter((item) => {
            const itemLower = item.username.trim().toLowerCase();
            return itemLower !== 'player' && itemLower !== 'player_1';
          });
          if (filtered.length !== list.length) {
            localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(filtered));
          }
        }
      }
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

  const activeUser = typeof window !== 'undefined'
    ? localStorage.getItem('blockarena_username')?.trim().toLowerCase()
    : '';

  for (const entry of combinedEntries) {
    if (!entry || !entry.username || typeof entry.score !== 'number') continue;
    const cleanName = entry.username.trim();
    if (!cleanName) continue;
    const lowerKey = cleanName.toLowerCase();

    // Abaikan entri default 'player' / 'player_1' jika pemain saat ini sudah memiliki username custom
    if (activeUser && activeUser !== 'player' && activeUser !== 'player_1') {
      if (lowerKey === 'player' || lowerKey === 'player_1') {
        continue;
      }
    }

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

/**
 * Validasi apakah username unik dan belum digunakan oleh pemain lain.
 * Username tidak boleh sama dengan username pemain lain (case-insensitive).
 */
export async function checkUsernameAvailable(
  desiredUsername: string,
  currentUsername?: string
): Promise<{ available: boolean; message?: string }> {
  const cleanDesired = desiredUsername.trim();
  const cleanCurrent = currentUsername?.trim() || '';

  if (!cleanDesired) {
    return { available: false, message: 'Username tidak boleh kosong.' };
  }

  if (cleanDesired.length < 3) {
    return { available: false, message: 'Username minimal 3 karakter.' };
  }

  // Jika username sama persis dengan username sendiri saat ini, maka valid
  if (cleanCurrent && cleanDesired.toLowerCase() === cleanCurrent.toLowerCase()) {
    return { available: true };
  }

  // 1. Cek di Supabase jika terkonfigurasi
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('username')
        .ilike('username', cleanDesired)
        .limit(1);

      if (!error && data && data.length > 0) {
        return {
          available: false,
          message: `Username "${cleanDesired}" sudah digunakan oleh pemain lain.`,
        };
      }
    } catch (err) {
      console.warn('Gagal cek username di Supabase:', err);
    }
  }

  // 2. Cek di Local Storage Leaderboard
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      if (raw) {
        const localList: LeaderboardEntry[] = JSON.parse(raw);
        if (Array.isArray(localList)) {
          const exists = localList.some(
            (entry) =>
              entry.username.trim().toLowerCase() === cleanDesired.toLowerCase() &&
              entry.username.trim().toLowerCase() !== cleanCurrent.toLowerCase()
          );
          if (exists) {
            return {
              available: false,
              message: `Username "${cleanDesired}" sudah digunakan oleh pemain lain.`,
            };
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return { available: true };
}

/**
 * Memperbarui nama player lama ke nama baru di leaderboard agar tidak menduplikasi skor.
 * Mengganti nama di record database Supabase dan localStorage.
 */
export async function migrateUsernameInLeaderboard(
  oldUsername: string,
  newUsername: string
): Promise<void> {
  const cleanOld = oldUsername.trim();
  const cleanNew = newUsername.trim();

  if (!cleanOld || !cleanNew || cleanOld.toLowerCase() === cleanNew.toLowerCase()) {
    return;
  }

  // 1. Update di Supabase jika terkonfigurasi
  if (isSupabaseConfigured && supabase) {
    try {
      // Ambil record yang menggunakan username lama
      const { data: oldRecords } = await supabase
        .from('leaderboard')
        .select('*')
        .ilike('username', cleanOld);

      if (oldRecords && oldRecords.length > 0) {
        // Cek apakah username baru sudah memiliki record di DB
        const { data: newRecords } = await supabase
          .from('leaderboard')
          .select('*')
          .ilike('username', cleanNew);

        const bestOld = [...oldRecords].sort((a, b) => b.score - a.score)[0];

        if (newRecords && newRecords.length > 0) {
          // Username baru sudah ada: perbarui skor baru jika skor lama lebih tinggi
          const bestNew = [...newRecords].sort((a, b) => b.score - a.score)[0];
          if (bestOld.score > bestNew.score) {
            await supabase
              .from('leaderboard')
              .update({
                score: bestOld.score,
                lines_cleared: bestOld.lines_cleared,
                max_combo: bestOld.max_combo,
                created_at: new Date().toISOString(),
              })
              .eq('id', bestNew.id);
          }
          // Hapus semua record lama agar tidak menduplikasi nama di leaderboard
          const oldIds = oldRecords.map((r) => r.id);
          await supabase.from('leaderboard').delete().in('id', oldIds);
        } else {
          // Username baru belum ada: update record lama menjadi nama baru
          const { error: updateErr } = await supabase
            .from('leaderboard')
            .update({
              username: cleanNew,
              created_at: new Date().toISOString(),
            })
            .eq('id', bestOld.id);

          if (!updateErr && oldRecords.length > 1) {
            const otherOldIds = oldRecords.slice(1).map((r) => r.id);
            supabase.from('leaderboard').delete().in('id', otherOldIds).then();
          }
        }
      }
    } catch (err) {
      console.warn('Gagal migrasi username di Supabase:', err);
    }
  }

  // 2. Update di LocalStorage Leaderboard Cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
      if (raw) {
        let localList: LeaderboardEntry[] = JSON.parse(raw);
        if (Array.isArray(localList)) {
          // Ganti nama lama menjadi nama baru
          localList = localList.map((entry) => {
            if (entry.username.trim().toLowerCase() === cleanOld.toLowerCase()) {
              return {
                ...entry,
                username: cleanNew,
                created_at: new Date().toISOString(),
              };
            }
            return entry;
          });

          // Deduplikasi berdasarkan username (case-insensitive)
          const dedupeMap = new Map<string, LeaderboardEntry>();
          for (const item of localList) {
            const key = item.username.trim().toLowerCase();
            const ex = dedupeMap.get(key);
            if (!ex || item.score > ex.score) {
              dedupeMap.set(key, item);
            }
          }

          const cleaned = Array.from(dedupeMap.values()).sort((a, b) => b.score - a.score);
          localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(cleaned));
        }
      }
    } catch {
      // Ignore
    }
  }
}

// ==========================================
// ROOM FUNCTIONS (Create, Browse & Delete Rooms)
// ==========================================

export function parseRoomMeta(rawName: string): { cleanName: string; mode: StageMode; duration_minutes?: number } {
  let mode: StageMode = 'survival';
  let duration_minutes: number | undefined = undefined;
  let cleanName = rawName || '';

  const timerMatch = rawName.match(/\s*\[TIMER:(\d+)\]/i);
  const survivalMatch = rawName.match(/\s*\[SURVIVAL\]/i);

  if (timerMatch) {
    mode = 'timer';
    duration_minutes = parseInt(timerMatch[1], 10) || 2;
    cleanName = rawName.replace(/\s*\[TIMER:\d+\]/i, '').trim();
  } else if (survivalMatch) {
    mode = 'survival';
    cleanName = rawName.replace(/\s*\[SURVIVAL\]/i, '').trim();
  }

  return { cleanName: cleanName || rawName, mode, duration_minutes };
}

export async function createRoomInDb(params: {
  name: string;
  is_private: boolean;
  password?: string;
  host_name: string;
  host_id: string;
  mode?: StageMode;
  duration_minutes?: number;
}): Promise<RoomInfo> {
  const code = generateRoomCode();
  const baseName = params.name.trim() || `Stage ${code}`;
  const mode: StageMode = params.mode || 'survival';
  const duration_minutes = mode === 'timer' ? (params.duration_minutes || 2) : undefined;
  const encodedName = mode === 'timer' ? `${baseName} [TIMER:${duration_minutes}]` : `${baseName} [SURVIVAL]`;

  const roomData: RoomInfo = {
    id: `room-${Date.now()}`,
    code,
    name: baseName,
    is_private: params.is_private,
    password: params.password?.trim() || undefined,
    mode,
    duration_minutes,
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
            name: encodedName,
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
    rooms.unshift({ ...roomData, name: encodedName });
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
  }

  return roomData;
}

export async function fetchRoomsFromDb(searchQuery?: string): Promise<RoomInfo[]> {
  sanitizeLocalCache();

  const now = Date.now();
  const MAX_ROOM_AGE_MS = 10 * 60 * 1000; // 10 menit maksimal untuk room 'waiting'

  const currentLocalPlayerId = typeof window !== 'undefined'
    ? localStorage.getItem('blockarena_player_id')
    : null;
  const currentActiveRoom = typeof window !== 'undefined'
    ? sessionStorage.getItem('blockarena_active_room')
    : null;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(30);

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (!error && data !== null) {
        const validRooms: RoomInfo[] = [];

        for (const r of data) {
          const roomAge = now - new Date(r.created_at).getTime();

          // 1. Jika room sudah lebih dari 10 menit dan masih 'waiting', anggap abandoned & hapus
          if (roomAge > MAX_ROOM_AGE_MS) {
            deleteRoomFromDb(r.code);
            continue;
          }

          // 2. Jika host adalah player ini sendiri, tapi player ini TIDAK sedang berada di room tersebut
          // (misal baru buka kembali website setelah close tab), otomatis hapus room lama ini!
          if (currentLocalPlayerId && r.host_id === currentLocalPlayerId && currentActiveRoom !== r.code) {
            deleteRoomFromDb(r.code);
            continue;
          }

          const { cleanName, mode, duration_minutes } = parseRoomMeta(r.name);
          validRooms.push({
            id: r.id,
            code: r.code,
            name: cleanName,
            is_private: r.is_private,
            password: r.password,
            mode,
            duration_minutes,
            player_count: 1,
            max_players: r.max_players || 5,
            status: r.status,
            host_name: r.host_name,
            host_id: r.host_id,
            created_at: r.created_at,
          });
        }

        return validRooms;
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

    // Filter stale rooms & orphaned rooms
    rooms = rooms.filter((r) => {
      const roomAge = now - new Date(r.created_at).getTime();
      if (roomAge > MAX_ROOM_AGE_MS) return false;
      if (currentLocalPlayerId && r.host_id === currentLocalPlayerId && currentActiveRoom !== r.code) {
        return false;
      }
      return true;
    });
    localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rooms = rooms.filter(
        (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
      );
    }
    return rooms.map((r) => {
      const { cleanName, mode, duration_minutes } = parseRoomMeta(r.name);
      return {
        ...r,
        name: cleanName,
        mode,
        duration_minutes,
      };
    });
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
        const { cleanName, mode, duration_minutes } = parseRoomMeta(data.name);
        return {
          id: data.id,
          code: data.code,
          name: cleanName,
          is_private: data.is_private,
          password: data.password,
          mode,
          duration_minutes,
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
    const found = rooms.find((r) => r.code.toUpperCase() === cleanCode);
    if (found) {
      const { cleanName, mode, duration_minutes } = parseRoomMeta(found.name);
      return {
        ...found,
        name: cleanName,
        mode,
        duration_minutes,
      };
    }
    return null;
  }

  return null;
}

/**
 * Hapus / tutup room ketika Room Master keluar atau tab ditutup.
 * Menggunakan direct fetch dengan keepalive: true agar request tetap dikirim
 * meskipun tab/browser sedang di-close.
 */
export async function deleteRoomFromDb(code: string): Promise<boolean> {
  const cleanCode = code.toUpperCase().trim();
  if (!cleanCode) return true;

  // 1. Sinkronisasi seketika di localStorage & sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
      if (raw) {
        const rooms: RoomInfo[] = JSON.parse(raw);
        const filtered = rooms.filter((r) => r.code.toUpperCase() !== cleanCode);
        localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(filtered));
      }
      const active = sessionStorage.getItem('blockarena_active_room');
      if (active === cleanCode) {
        sessionStorage.removeItem('blockarena_active_room');
      }
    } catch {
      // Ignore
    }
  }

  // 2. Direct HTTP fetch dengan keepalive: true (dijamin dikirim saat browser tab close / beforeunload)
  if (isSupabaseConfigured && supabaseUrl && supabaseAnonKey) {
    try {
      const restEndpoint = `${supabaseUrl}/rest/v1/rooms?code=eq.${encodeURIComponent(cleanCode)}`;
      fetch(restEndpoint, {
        method: 'DELETE',
        keepalive: true,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      }).catch(() => {});

      fetch(restEndpoint, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ status: 'closed' }),
      }).catch(() => {});
    } catch (err) {
      console.warn('Keepalive delete failed:', err);
    }
  }

  // 3. Regular Supabase client delete (untuk leave biasa di dalam aplikasi)
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('rooms')
        .delete()
        .eq('code', cleanCode);

      await supabase
        .from('rooms')
        .update({ status: 'closed' })
        .eq('code', cleanCode);
    } catch (err) {
      console.warn('Failed to delete room from Supabase:', err);
    }
  }

  return true;
}
