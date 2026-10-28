import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Forecast } from '@/api/types';
import { formatDay, formatKes, formatNumber, formatShortDate } from '@/lib/format';

const COLORS = { high: '#12b76a', expected: '#2e90fa', low: '#7a5af8' };

/**
 * Expected line with the low/high range shaded (always show the band, not only the line).
 * A visually hidden table carries the same numbers for screen readers.
 */
export function ForecastChart({ forecast }: { forecast: Forecast }) {
  const data = forecast.forecast;
  return (
    <figure>
      <div
        className="h-72 w-full"
        role="img"
        aria-label="14-day sales forecast with low, expected and high values"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fontSize: 11, fill: '#64748b' }}
              width={56}
              label={{
                value: 'Sales (KES)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: '#64748b' },
              }}
            />
            <Tooltip
              labelFormatter={(d: string) => formatDay(d)}
              formatter={(v: number, name: string) => [formatKes(v), name]}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            <Area
              type="monotone"
              dataKey="high"
              name="High"
              stroke={COLORS.high}
              fill={COLORS.high}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expected_sales"
              name="Expected"
              stroke={COLORS.expected}
              fill={COLORS.expected}
              fillOpacity={0.2}
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="low"
              name="Low"
              stroke={COLORS.low}
              fill={COLORS.low}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Forecast values by day (KES)</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Low</th>
            <th>Expected</th>
            <th>High</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.date}>
              <td>{formatDay(p.date)}</td>
              <td>{formatKes(p.low)}</td>
              <td>{formatKes(p.expected_sales)}</td>
              <td>{formatKes(p.high)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
