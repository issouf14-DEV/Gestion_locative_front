import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/formatters';

// ── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="font-semibold text-[var(--primary)]">{entry.name}</span>
      </div>
      <p className="text-muted-foreground">
        Valeur&nbsp;:{' '}
        <span className="font-medium text-[var(--primary)]">
          {typeof entry.value === 'number' && entry.value > 1000
            ? formatCurrency(entry.value)
            : entry.value}
        </span>
      </p>
    </div>
  );
}

// ── Percentage label rendered inside each slice ──────────────────────────────

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null; // hide label on tiny slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ── Custom legend ────────────────────────────────────────────────────────────

function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-3">
      {payload.map((entry) => (
        <div
          key={entry.value}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.payload.color }}
          />
          <span>{entry.value}</span>
          <span className="font-medium text-[var(--primary)]">
            ({entry.payload.value})
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Center label overlaid via absolute positioning ───────────────────────────
// We wrap the chart in a relative container so we can absolutely position text
// in the donut hole without fighting Recharts' SVG coordinate system.

function ChartWithCenterLabel({ data, centerLabel }) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center donut label */}
      {centerLabel && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          // Legend takes ~48px at bottom; pie cy is 50% of total height.
          // We shift up slightly so the label sits in the donut hole, not the legend.
          style={{ paddingBottom: '48px' }}
        >
          <span className="text-xl font-bold text-[var(--primary)]">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-muted-foreground">
      Aucune donnée
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OccupancyChart({ data = [], title, centerLabel }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-[var(--primary)]">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <ChartWithCenterLabel data={data} centerLabel={centerLabel} />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}
