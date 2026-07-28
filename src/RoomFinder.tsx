import { useEffect, useState, type CSSProperties } from 'react';
import { getEmptyRooms, toApiDayOfWeek, toApiTime, type RoomStatus } from './api/rooms';
import { buildingName, buildingOrderIndex } from './constants/buildings';
import './RoomFinder.css';

type Mode = 'now' | 'time';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
// index = API dayOfWeek (0=월 ... 4=금)
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function buildTimeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 8; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) continue;
      opts.push(`${pad(h)}:${pad(m)}`);
    }
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

function pillStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    border: 'none',
    cursor: 'pointer',
    borderRadius: 'var(--radius-pill)',
    padding: '9px 8px',
    fontFamily: 'var(--font-text)',
    fontSize: 13,
    fontWeight: 600,
    transition: 'transform .15s',
    background: active ? '#fff' : 'transparent',
    color: active ? 'var(--color-ink)' : 'var(--color-ink-muted-48)',
  };
}

function chipStyle(active: boolean): CSSProperties {
  return {
    border: active ? 'none' : '1px solid var(--color-hairline)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-pill)',
    padding: '8px 16px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: 'var(--font-text)',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    background: active ? 'var(--color-ink)' : '#fff',
    color: active ? '#fff' : 'var(--color-ink)',
  };
}

function initialWeekday() {
  const apiDay = toApiDayOfWeek(new Date().getDay());
  return apiDay > 4 ? 0 : apiDay;
}

function RoomFinder() {
  const [mode, setMode] = useState<Mode>('now');
  const [building, setBuilding] = useState('all');
  const [day, setDay] = useState(initialWeekday);
  const [time, setTime] = useState('09:00');

  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  const nowDay = now.getDay();
  const ampm = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const nowLabel = `${DAY_NAMES[nowDay]}요일 ${ampm} ${hour12}:${pad(mins)}`;

  const isTimeMode = mode === 'time';

  useEffect(() => {
    const dayOfWeek = isTimeMode ? day : toApiDayOfWeek(new Date().getDay());
    const timeParam = isTimeMode
      ? toApiTime(time)
      : toApiTime(`${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`);

    let cancelled = false;
    setLoading(true);
    setError(null);
    getEmptyRooms({ dayOfWeek, time: timeParam })
      .then((result) => {
        if (!cancelled) setRooms(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '강의실 정보를 불러오지 못했어요.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isTimeMode, day, time]);

  const buildingList = [
    'all',
    ...Array.from(new Set(rooms.map((r) => r.buildingName))).sort(
      (a, b) => buildingOrderIndex(a) - buildingOrderIndex(b),
    ),
  ];

  const filtered = building === 'all' ? rooms : rooms.filter((r) => r.buildingName === building);
  const sorted = [...filtered].sort((a, b) =>
    a.buildingName === b.buildingName
      ? a.roomNumber - b.roomNumber
      : buildingOrderIndex(a.buildingName) - buildingOrderIndex(b.buildingName),
  );

  return (
    <div className="rf-page">
      <div className="rf-container">
        <header className="rf-header">
          <div className="rf-eyebrow">빈 강의실 찾기</div>
          <div className="rf-title">지금 바로, 빈 강의실 찾아줄게</div>
          <div className="rf-sub">{nowLabel} 기준</div>

          <div className="rf-mode-toggle">
            <button type="button" onClick={() => setMode('now')} style={pillStyle(!isTimeMode)}>
              지금 비어있는 강의실
            </button>
            <button type="button" onClick={() => setMode('time')} style={pillStyle(isTimeMode)}>
              특정 시간대로 찾기
            </button>
          </div>

          <div className="rf-building-chips">
            {buildingList.map((b) => (
              <button key={b} type="button" onClick={() => setBuilding(b)} style={chipStyle(building === b)}>
                {b === 'all' ? '전체' : buildingName(b)}
              </button>
            ))}
          </div>

          {isTimeMode && (
            <div className="rf-time-panel">
              <div className="rf-day-chips">
                {WEEKDAY_LABELS.map((label, apiDay) => (
                  <button key={apiDay} type="button" onClick={() => setDay(apiDay)} style={chipStyle(day === apiDay)}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="rf-time-range">
                <select className="rf-select" value={time} onChange={(e) => setTime(e.target.value)}>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        <main className="rf-main">
          {loading && <div className="rf-banner">강의실 정보를 불러오는 중...</div>}
          {!loading && error && <div className="rf-banner">{error}</div>}

          {!loading && !error && (
            <>
              <div className="rf-section-heading">
                <div className="rf-section-title">{isTimeMode ? '이 시간대 비어있어요' : '지금 비어있어요'}</div>
                <div className="rf-section-count rf-section-count-primary">{sorted.length}개</div>
              </div>

              <div className="rf-room-list">
                {sorted.map((room) => (
                  <div className="rf-room-card" key={`${room.buildingName}-${room.roomNumber}`}>
                    <div>
                      <div className="rf-room-name">{buildingName(room.buildingName)} {room.roomNumber}</div>
                      <div className="rf-room-meta">{Math.floor(room.roomNumber / 100)}층</div>
                    </div>
                    <div className="rf-room-status">
                      <div className="rf-room-status-label rf-room-status-label-primary">비어있음</div>
                    </div>
                  </div>
                ))}
                {sorted.length === 0 && (
                  <div className="rf-empty">이 조건에 맞는 빈 강의실이 없어요.</div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default RoomFinder;
