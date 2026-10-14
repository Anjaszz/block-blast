export const DAILY_REWARDS = [1, 1, 1, 1, 1, 4, 7]; // Hari 1-5: 1, Hari 6: 4, Hari 7: 7

const GEMS_STORAGE_KEY = 'blockarena_user_gems';
const CHECKIN_DATE_KEY = 'blockarena_last_checkin_date';
const CHECKIN_STREAK_KEY = 'blockarena_checkin_streak';

export interface CheckinStatus {
  canClaimToday: boolean;
  currentStreak: number; // 0 to 7 (or next day index)
  nextClaimDay: number; // 1 to 7
  todayReward: number;
  gems: number;
  lastCheckinDate: string | null;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserGems(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(GEMS_STORAGE_KEY);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function setUserGems(amount: number): number {
  const valid = Math.max(0, Math.floor(amount));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GEMS_STORAGE_KEY, String(valid));
    } catch {
      // Ignore
    }
  }
  return valid;
}

export function addGems(amount: number): number {
  const current = getUserGems();
  const updated = current + Math.max(0, amount);
  return setUserGems(updated);
}

export function consumeGem(amount: number = 1): boolean {
  const current = getUserGems();
  if (current >= amount) {
    setUserGems(current - amount);
    return true;
  }
  return false;
}

export function getCheckinStatus(): CheckinStatus {
  if (typeof window === 'undefined') {
    return {
      canClaimToday: false,
      currentStreak: 0,
      nextClaimDay: 1,
      todayReward: 1,
      gems: 0,
      lastCheckinDate: null,
    };
  }

  const today = getTodayString();
  const yesterday = getYesterdayString();
  const lastDate = localStorage.getItem(CHECKIN_DATE_KEY) || null;
  const rawStreak = parseInt(localStorage.getItem(CHECKIN_STREAK_KEY) || '0', 10);
  const gems = getUserGems();

  const alreadyClaimedToday = lastDate === today;

  let currentStreak = rawStreak;
  let nextClaimDay = 1;

  if (alreadyClaimedToday) {
    // Already claimed today, show the day they claimed
    nextClaimDay = currentStreak;
  } else {
    // Not claimed yet today
    if (lastDate === yesterday) {
      // Continued streak
      nextClaimDay = currentStreak >= 7 ? 1 : currentStreak + 1;
    } else {
      // Missed streak or first time
      nextClaimDay = 1;
    }
  }

  const rewardIndex = Math.max(0, Math.min(6, nextClaimDay - 1));
  const todayReward = DAILY_REWARDS[rewardIndex];

  return {
    canClaimToday: !alreadyClaimedToday,
    currentStreak: alreadyClaimedToday ? currentStreak : (lastDate === yesterday ? currentStreak : 0),
    nextClaimDay,
    todayReward,
    gems,
    lastCheckinDate: lastDate,
  };
}

export function claimDailyCheckin(): {
  success: boolean;
  rewardGems: number;
  newStreak: number;
  totalGems: number;
  message?: string;
} {
  if (typeof window === 'undefined') {
    return { success: false, rewardGems: 0, newStreak: 0, totalGems: 0 };
  }

  const status = getCheckinStatus();
  if (!status.canClaimToday) {
    return {
      success: false,
      rewardGems: 0,
      newStreak: status.currentStreak,
      totalGems: status.gems,
      message: 'Kamu sudah melakukan check-in hari ini! Kembali lagi besok.',
    };
  }

  const today = getTodayString();
  const newStreak = status.nextClaimDay;
  const rewardIndex = Math.max(0, Math.min(6, newStreak - 1));
  const rewardGems = DAILY_REWARDS[rewardIndex];

  const totalGems = addGems(rewardGems);

  try {
    localStorage.setItem(CHECKIN_DATE_KEY, today);
    localStorage.setItem(CHECKIN_STREAK_KEY, String(newStreak));
  } catch {
    // Ignore
  }

  return {
    success: true,
    rewardGems,
    newStreak,
    totalGems,
    message: `Berhasil check-in Hari ke-${newStreak}! +${rewardGems} Permata 💎 didapatkan.`,
  };
}
