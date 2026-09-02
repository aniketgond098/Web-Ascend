/**
 * Local timezone date utility functions to prevent UTC rollover bugs
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDateStr.split('-').map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

export function formatReadableDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recent';
  try {
    const date = parseDateString(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatTimeHUD(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

/**
 * Calculates current streak and longest streak from daily records
 * A streak day is counted if it is a PERFECT or successful day (all required missions + habits complete)
 */
export function calculateStreaks(
  dailyRecords: Record<string, { status: string; isPerfectDay?: boolean; isSuccessfulDay?: boolean; completedMissionIds?: string[]; completedHabitIds?: string[] }>,
  todayStr: string
): { currentStreak: number; longestStreak: number } {
  // Sort date keys in ascending order
  const dates = Object.keys(dailyRecords).sort();
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: Date | null = null;

  for (const dateStr of dates) {
    const record = dailyRecords[dateStr];
    const isSuccessful = Boolean(record.isSuccessfulDay || record.isPerfectDay || record.status === 'PERFECT');
    const currentDate = parseDateString(dateStr);

    if (isSuccessful) {
      if (previousDate) {
        const diffTime = currentDate.getTime() - previousDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      } else {
        runningStreak = 1;
      }
      previousDate = currentDate;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      // If it's today and in progress, don't break the previous streak yet
      if (dateStr !== todayStr) {
        runningStreak = 0;
        previousDate = null;
      }
    }
  }

  // Calculate current streak leading up to today or yesterday
  let currentStreak = 0;
  const today = parseDateString(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  // Check if today is completed
  const todayRecord = dailyRecords[todayStr];
  const todayComplete = todayRecord && Boolean(todayRecord.isSuccessfulDay || todayRecord.isPerfectDay || todayRecord.status === 'PERFECT');

  // Check if yesterday is completed
  const yesterdayRecord = dailyRecords[yesterdayStr];
  const yesterdayComplete = yesterdayRecord && Boolean(yesterdayRecord.isSuccessfulDay || yesterdayRecord.isPerfectDay || yesterdayRecord.status === 'PERFECT');

  if (todayComplete) {
    // Count backwards from today
    let checkDate = new Date(today);
    while (true) {
      const dStr = formatDateString(checkDate);
      const rec = dailyRecords[dStr];
      if (rec && Boolean(rec.isSuccessfulDay || rec.isPerfectDay || rec.status === 'PERFECT')) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (yesterdayComplete) {
    // Count backwards from yesterday (streak is still alive for today)
    let checkDate = new Date(yesterday);
    while (true) {
      const dStr = formatDateString(checkDate);
      const rec = dailyRecords[dStr];
      if (rec && Boolean(rec.isSuccessfulDay || rec.isPerfectDay || rec.status === 'PERFECT')) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}
