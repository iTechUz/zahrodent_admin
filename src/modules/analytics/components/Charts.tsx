import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  LineChart, Line, Legend
} from 'recharts';

interface ChartDataPoint {
  [key: string]: string | number;
}

interface SourceDataPoint {
  name: string;
  value: number;
}

interface ChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export const GrowthChart = ({ data, height = 260 }: ChartProps) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="hsl(174,62%,38%)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="hsl(174,62%,38%)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
      <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v} ta`, 'Bemorlar']} />
      <Area type="monotone" dataKey="count" stroke="hsl(174,62%,38%)" fill="url(#gp)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
);

export const RevenueChart = ({ data, height = 260 }: ChartProps) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
      <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v} mln so'm`, 'Daromad']} />
      <Bar dataKey="revenue" fill="hsl(174,62%,38%)" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const ConversionChart = ({ data, height = 260 }: ChartProps) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
      <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,46%)" />
      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
      <Line type="monotone" dataKey="booked" stroke="hsl(210,80%,52%)" strokeWidth={2} dot={{ r: 3 }} name="Yozilganlar" />
      <Line type="monotone" dataKey="completed" stroke="hsl(152,60%,40%)" strokeWidth={2} dot={{ r: 3 }} name="Yakunlanganlar" />
    </LineChart>
  </ResponsiveContainer>
);

interface SourceChartProps {
  data: SourceDataPoint[];
  colors: string[];
  height?: number;
}

export const SourcePieChart = ({ data, colors, height = 220 }: SourceChartProps) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Pie 
        data={data} 
        cx="50%" 
        cy="50%" 
        innerRadius={55} 
        outerRadius={85} 
        paddingAngle={4} 
        dataKey="value"
      >
        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
      </Pie>
      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
    </PieChart>
  </ResponsiveContainer>
);

// ─── NEW: Doctor Efficiency Horizontal Bar Chart ──────────────────────────────
export interface DoctorEfficiencyStat {
  name: string;
  totalBookings: number;
  totalVisits: number;
  conversionRate: number;
  avgCheck: number;
  totalRevenue: number;
}

export const DoctorEfficiencyChart = ({ data, height = 280 }: { data: DoctorEfficiencyStat[]; height?: number }) => {
  const normalized = data.slice(0, 8).map(d => ({
    name: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name,
    Qabullar: d.totalBookings,
    Tashriflar: d.totalVisits,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(height, normalized.length * 44)}>
      <BarChart data={normalized} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220,10%,46%)" />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(220,10%,46%)" width={85} />
        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
        <Bar dataKey="Qabullar" fill="hsl(210,80%,52%)" radius={[0, 4, 4, 0]} barSize={10} />
        <Bar dataKey="Tashriflar" fill="hsl(152,60%,40%)" radius={[0, 4, 4, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─── NEW: Service Revenue Horizontal Bar Chart ───────────────────────────────
export interface ServiceRevenueItem {
  name: string;
  revenue: number;
  patients: number;
}

export const ServiceRevenueHBarChart = ({ data, height = 280 }: { data: ServiceRevenueItem[]; height?: number }) => {
  const sorted = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const formatted = sorted.map(s => ({
    name: s.name.length > 20 ? s.name.slice(0, 20) + '…' : s.name,
    revenueM: +(s.revenue / 1_000_000).toFixed(2),
    patients: s.patients,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(height, formatted.length * 40)}>
      <BarChart data={formatted} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220,10%,46%)" unit=" mln" />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(220,10%,46%)" width={110} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
          formatter={(v: number, name: string) => [
            name === 'revenueM' ? `${v} mln so'm` : `${v} ta`,
            name === 'revenueM' ? 'Daromad' : 'Bemorlar',
          ]}
        />
        <Bar dataKey="revenueM" fill="hsl(174,62%,38%)" radius={[0, 4, 4, 0]} barSize={14} name="Daromad" />
      </BarChart>
    </ResponsiveContainer>
  );
};
