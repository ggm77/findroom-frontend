import { useEffect, useRef, useState, type CSSProperties } from 'react';
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

function buildHourOptions(): number[] {
  const opts: number[] = [];
  for (let h = 8; h <= 21; h++) opts.push(h);
  return opts;
}

const HOUR_OPTIONS = buildHourOptions();
const MINUTE_OPTIONS = [0, 30];

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

type DropdownOption = { value: string; label: string };

function Dropdown({
  value,
  options,
  onChange,
  open,
  onOpenChange,
  ariaLabel,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="rf-dropdown" ref={rootRef}>
      <button
        type="button"
        className="rf-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => onOpenChange(!open)}
      >
        <span>{selected?.label ?? ''}</span>
        <span className={`rf-dropdown-chevron${open ? ' rf-dropdown-chevron-open' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul className="rf-dropdown-list" role="listbox" aria-label={ariaLabel}>
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`rf-dropdown-option${opt.value === value ? ' rf-dropdown-option-active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                onOpenChange(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoomFinder() {
  const [mode, setMode] = useState<Mode>('now');
  const [building, setBuilding] = useState('all');
  const [day, setDay] = useState(initialWeekday);
  const [time, setTime] = useState('09:00');
  const [timeHour, timeMinute] = time.split(':');
  const [openTimeField, setOpenTimeField] = useState<'hour' | 'minute' | null>(null);

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
          <div className="rf-brand">
            <img src="/findroom.svg" alt="빈 강의실 찾기 로고" className="rf-logo" />
            <div className="rf-eyebrow">빈 강의실 찾기</div>
          </div>
          <div className="rf-title">지금 바로, 빈 강의실 찾기</div>
          <div className="rf-disclaimer">학교 공식 서비스가 아닌, 개인이 만든 서비스예요</div>

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
              <div className="rf-time-picker">
                <div className="rf-time-field">
                  <Dropdown
                    ariaLabel="시"
                    value={timeHour}
                    options={HOUR_OPTIONS.map((h) => ({ value: pad(h), label: `${h}시` }))}
                    open={openTimeField === 'hour'}
                    onOpenChange={(o) => setOpenTimeField(o ? 'hour' : null)}
                    onChange={(v) => {
                      const h = Number(v);
                      const m = h === 21 ? 0 : Number(timeMinute);
                      setTime(`${pad(h)}:${pad(m)}`);
                    }}
                  />
                </div>
                <div className="rf-time-divider" aria-hidden="true" />
                <div className="rf-time-field">
                  <Dropdown
                    ariaLabel="분"
                    value={timeMinute}
                    options={MINUTE_OPTIONS.filter((m) => !(Number(timeHour) === 21 && m === 30)).map((m) => ({
                      value: pad(m),
                      label: `${pad(m)}분`,
                    }))}
                    open={openTimeField === 'minute'}
                    onOpenChange={(o) => setOpenTimeField(o ? 'minute' : null)}
                    onChange={(v) => setTime(`${timeHour}:${v}`)}
                  />
                </div>
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
                <div className="rf-section-title">
                  {isTimeMode ? (
                    '이 시간대 비어있어요'
                  ) : (
                    <>
                      지금 비어있어요 <span className="rf-section-sub">{nowLabel} 기준</span>
                    </>
                  )}
                </div>
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

        <footer className="rf-footer">
          <p className="rf-footer-notice">
            본 서비스는 학교의 공식 서비스가 아닌 비공식 정보 제공 서비스입니다.
            <br />
            강의실/시설 정보는 예고 없이 변경될 수 있으니, 정확한 정보는 학교 공식 채널을 통해 확인하세요.
          </p>
          <p className="rf-footer-contact">
            문의: <a href="mailto:shm040806@gmail.com">shm040806@gmail.com</a>
          </p>
          <p className="rf-footer-links">
            <a href="/privacy.html">개인정보처리방침</a>
          </p>
          <p className="rf-footer-copyright">© 2026 FindRoom. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default RoomFinder;
