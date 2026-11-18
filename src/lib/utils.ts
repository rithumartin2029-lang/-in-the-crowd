import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function formatCountdown(target: string | number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
} {
  const targetMs = typeof target === "string" ? new Date(target).getTime() : target;
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

// Deterministic avatar gradient from a seed
export function avatarGradient(seed: number): string {
  const gradients = [
    "linear-gradient(135deg, #5BA3FF, #9D8DFF)",
    "linear-gradient(135deg, #13203F, #5BA3FF)",
    "linear-gradient(135deg, #9D8DFF, #5BA3FF)",
    "linear-gradient(135deg, #1B2A52, #9D8DFF)",
    "linear-gradient(135deg, #2E4A8F, #9D8DFF)",
    "linear-gradient(135deg, #0A1228, #5BA3FF)",
    "linear-gradient(135deg, #5BA3FF, #13203F)",
    "linear-gradient(135deg, #9D8DFF, #1B2A52)",
  ];
  return gradients[seed % gradients.length];
}

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatConcertDate(iso: string): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Unscheduled";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function coverClass(index: number): string {
  return `cover-${((index - 1) % 8) + 1}`;
}

// "Many in the crowd" soft count
export function softCount(n: number, gentle: boolean): string {
  if (gentle) return "Many in the crowd";
  if (n === 0) return "Be the first";
  if (n < 10) return `${n} in the crowd`;
  if (n < 100) return `${n} in the crowd`;
  return `${Math.round(n / 10) * 10}+ in the crowd`;
}
