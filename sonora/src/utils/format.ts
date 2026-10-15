export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtLongTime(sec: number, min: string, h: string): string {
  if (sec < 60) return `${Math.round(sec)} ${min}`;
  const hours = Math.floor(sec / 3600);
  const mins = Math.round((sec % 3600) / 60);
  return hours > 0 ? `${hours} ${h} ${mins} ${min}` : `${mins} ${min}`;
}

export function timeAgo(ts: number, daysWord: string, agoWord: string, todayWord: string): string {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return todayWord.toLowerCase();
  if (d < 30) return `${d} ${daysWord} ${agoWord}`;
  return `${Math.floor(d / 30)} ${daysWord === 'days' ? 'months' : 'meses'} ${agoWord}`;
}

export function greetingKey(): 'welcome_morning' | 'welcome_afternoon' | 'welcome_evening' {
  const hh = new Date().getHours();
  if (hh < 6) return 'welcome_evening';
  if (hh < 13) return 'welcome_morning';
  if (hh < 20) return 'welcome_afternoon';
  return 'welcome_evening';
}
