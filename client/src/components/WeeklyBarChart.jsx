/**
 * WeeklyBarChart — Plain-SVG column chart of appointments per day (Mon–Sun).
 * Thin columns with rounded tops, hairline gridlines, the busiest day labeled,
 * a hover/keyboard tooltip on every day, and a table view for screen readers.
 */
import { useEffect, useRef, useState } from 'react';
import { formatDate } from '../utils/formatters';

const HEIGHT = 230;
const MARGIN = { top: 26, right: 8, bottom: 38, left: 32 };
const MAX_BAR_WIDTH = 24;

/** Rounds the axis up to a clean number with 1, 2 or 5 as the step. */
function getTicks(max) {
  const step = max <= 5 ? 1 : max <= 10 ? 2 : 5;
  const top = Math.max(4, Math.ceil(max / step) * step);
  return Array.from({ length: top / step + 1 }, (_, index) => index * step);
}

/** Column path: 4px rounded data-end at the top, square at the baseline. */
function columnPath(x, y, width, height) {
  const r = Math.min(4, height, width / 2);
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

export default function WeeklyBarChart({ data, title = 'Appointments this week' }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(560);
  const [activeIndex, setActiveIndex] = useState(null);
  const [showTable, setShowTable] = useState(false);

  // Render the SVG at its real pixel width so columns keep their exact thickness.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, [showTable]);

  const ticks = getTicks(Math.max(...data.map((d) => d.count), 0));
  const top = ticks.at(-1);
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = plotWidth / data.length;
  const barWidth = Math.min(MAX_BAR_WIDTH, band * 0.5);
  const yFor = (value) => MARGIN.top + plotHeight - (value / top) * plotHeight;
  const peak = Math.max(...data.map((d) => d.count));
  const peakIndex = peak > 0 ? data.findIndex((d) => d.count === peak) : -1;
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const active = activeIndex === null ? null : data[activeIndex];

  return (
    <figure className="weekly-chart">
      <figcaption className="chart-head">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">
            {total} booked visit{total === 1 ? '' : 's'} · cancelled excluded
          </p>
        </div>
        <button type="button" className="chart-toggle" onClick={() => setShowTable((value) => !value)} aria-pressed={showTable}>
          {showTable ? 'Chart view' : 'Table view'}
        </button>
      </figcaption>

      {showTable ? (
        <table className="table chart-table">
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col" className="text-end">
                Appointments
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date} className={day.isToday ? 'is-today' : ''}>
                <td>
                  {formatDate(day.date, 'EEEE, MMM d')}
                  {day.isToday && ' (today)'}
                </td>
                <td className="text-end">{day.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="chart-canvas" ref={wrapRef}>
          <svg width={width} height={HEIGHT} role="group" aria-label={`${title}: bar chart, use Tab to read each day`}>
            {ticks.map((tick) => (
              <g key={tick} className="chart-gridline">
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yFor(tick)} y2={yFor(tick)} />
                <text x={MARGIN.left - 10} y={yFor(tick)} dy="0.32em" textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}

            {data.map((day, index) => {
              const center = MARGIN.left + band * index + band / 2;
              const barHeight = (day.count / top) * plotHeight;
              const y = yFor(day.count);
              const label = `${formatDate(day.date, 'EEEE, MMM d')}: ${day.count} appointment${day.count === 1 ? '' : 's'}`;
              return (
                <g
                  key={day.date}
                  className={`chart-day${activeIndex === index ? ' is-active' : ''}${day.isToday ? ' is-today' : ''}`}
                  tabIndex={0}
                  role="img"
                  aria-label={label}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                >
                  <rect className="chart-hit" x={center - band / 2} y={MARGIN.top} width={band} height={plotHeight + 30} />
                  {barHeight > 0 && <path className="chart-bar" d={columnPath(center - barWidth / 2, y, barWidth, barHeight)} />}
                  {index === peakIndex && (
                    <text className="chart-value" x={center} y={y - 8} textAnchor="middle">
                      {day.count}
                    </text>
                  )}
                  <text className="chart-axis-label" x={center} y={HEIGHT - MARGIN.bottom + 18} textAnchor="middle">
                    {formatDate(day.date, 'EEE')}
                  </text>
                  {day.isToday && (
                    <text className="chart-today-label" x={center} y={HEIGHT - MARGIN.bottom + 32} textAnchor="middle">
                      Today
                    </text>
                  )}
                </g>
              );
            })}

            <line className="chart-baseline" x1={MARGIN.left} x2={width - MARGIN.right} y1={yFor(0)} y2={yFor(0)} />
          </svg>

          {active && (
            <div
              className="chart-tooltip"
              style={{ left: MARGIN.left + band * activeIndex + band / 2, top: Math.max(4, yFor(active.count) - 64) }}
              aria-hidden="true"
            >
              <strong>
                {active.count} appointment{active.count === 1 ? '' : 's'}
              </strong>
              <span>{formatDate(active.date, 'EEEE, MMM d')}</span>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
