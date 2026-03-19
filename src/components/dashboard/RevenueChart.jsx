import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatters';

// ── Palette ──────────────────────────────────────────────────────────────────

const NAVY   = 'var(--primary)';
const MAROON = 'var(--accent)';
const STEEL  = 'var(--secondary)';

// ── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="mb-2 font-semibold text-[var(--primary)]">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}&nbsp;:</span>
          <span className="font-medium" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── YAxis tick formatter ─────────────────────────────────────────────────────

function formatYAxis(value) {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(0) + 'K';
  }
  return String(value);
}

// ── Custom legend ────────────────────────────────────────────────────────────

function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="flex justify-center gap-6 pt-2">
      {payload.map((entry) => (
        <span key={entry.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function RevenueChart({ data = [], title, height = 300 }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[var(--primary)]">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            {/* Gradient defs */}
            <defs>
              <linearGradient id="gradRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={NAVY}   stopOpacity={0.18} />
                <stop offset="95%" stopColor={NAVY}   stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradDepenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={MAROON} stopOpacity={0.18} />
                <stop offset="95%" stopColor={MAROON} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={STEEL}  stopOpacity={0.22} />
                <stop offset="95%" stopColor={STEEL}  stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => (typeof val === 'string' ? val.slice(0, 3) : val)}
            />

            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              width={48}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend content={<CustomLegend />} />

            <Area
              type="monotone"
              dataKey="revenus"
              name="Revenus"
              stroke={NAVY}
              strokeWidth={2}
              fill="url(#gradRevenus)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="depenses"
              name="Dépenses"
              stroke={MAROON}
              strokeWidth={2}
              fill="url(#gradDepenses)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="net"
              name="Net"
              stroke={STEEL}
              strokeWidth={2}
              fill="url(#gradNet)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
