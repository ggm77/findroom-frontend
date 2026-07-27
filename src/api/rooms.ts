export interface RoomStatus {
  buildingName: string;
  roomNumber: number;
  classCode: string | null;
  className: string | null;
  professor: string | null;
  isEmpty: boolean;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function apiGet<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`${path} 요청 실패 (${res.status})`);
  return res.json() as Promise<T>;
}

/** JS Date.getDay() (0=일 ... 6=토) → API dayOfWeek (0=월 ... 6=일) */
export function toApiDayOfWeek(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function toApiTime(hhmm: string): string {
  return `${hhmm}:00`;
}

export function getRoom(params: { buildingName: string; roomNumber: number; dayOfWeek: number; time: string }) {
  return apiGet<RoomStatus>('/api/v1/rooms', params);
}

export function getEmptyRooms(params: { buildingName?: string; dayOfWeek: number; time: string }) {
  return apiGet<RoomStatus[]>('/api/v1/emptyrooms', params);
}
