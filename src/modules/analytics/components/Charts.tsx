import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, 
  LineChart, Line 
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
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
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
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
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
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,90%)" />
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
