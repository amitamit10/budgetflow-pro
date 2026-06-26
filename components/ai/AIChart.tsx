'use client'

import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5', '#7c3aed', '#ddd6fe']

interface ChartSpec {
  type: 'bar' | 'pie' | 'line'
  title: string
  data: { label: string; value: number }[]
}

function fmt(v: number) { return `₪${Number(v).toLocaleString()}` }

export function AIChart({ spec }: { spec: ChartSpec }) {
  const { type, title, data } = spec

  return (
    <div className="my-3 p-3 rounded-lg border border-border bg-background not-prose">
      <p className="text-xs font-semibold text-muted-foreground mb-3 text-center uppercase tracking-wide">{title}</p>

      {type === 'bar' && (
        <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']} />
            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {type === 'pie' && (() => {
        const pieData = data.map((d) => ({ ...d, name: d.label }))
        return (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} innerRadius={40} paddingAngle={2}
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(Number(v)), '']} />
              <Legend iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )
      })()}

      {type === 'line' && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [fmt(Number(v)), 'Amount']} />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const spec = JSON.parse(raw) as ChartSpec
    if (!spec.type || !Array.isArray(spec.data)) return null
    return spec
  } catch {
    return null
  }
}
