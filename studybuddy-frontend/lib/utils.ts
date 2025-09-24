import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatTime(timestamp: number): string {
  if (!timestamp) return "a long time ago";

  const now = new Date();
  const date = new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // within a day → show HH:MM
  if (diffDay < 1) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // within a week → show weekday
  if (diffDay < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }

  // older → show full date
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFileType(url: string) {
    const extension = url.split('.').pop()?.toLowerCase();
    if (!extension) return "unknown";

    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
    const videoTypes = ["mp4", "webm", "ogg"];
    const docTypes = ["pdf", "doc", "docx", "txt"];

    if (imageTypes.includes(extension)) return "photo";
    if (videoTypes.includes(extension)) return "video";
    if (docTypes.includes(extension)) return "document";
    return "other";
}

