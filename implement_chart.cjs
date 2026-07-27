const fs = require('fs');

let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Add import
const importRecharts = `import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';\n`;
if (!content.includes('recharts')) {
  content = content.replace("import { Link, useNavigate } from 'react-router-dom';", importRecharts + "import { Link, useNavigate } from 'react-router-dom';");
}

// Add salesData inside the Admin component, just before stats
const salesDataCode = `
  const salesData = [
    { name: 'Jan', jamaah: 45, pendapatan: 1.25 },
    { name: 'Feb', jamaah: 52, pendapatan: 1.45 },
    { name: 'Mar', jamaah: 88, pendapatan: 2.55 },
    { name: 'Apr', jamaah: 35, pendapatan: 0.95 },
    { name: 'Mei', jamaah: 60, pendapatan: 1.80 },
    { name: 'Jun', jamaah: 75, pendapatan: 2.10 },
    { name: 'Jul', jamaah: 92, pendapatan: 2.80 },
  ];
`;
content = content.replace("const stats = [", salesDataCode + "\n  const stats = [");

// Replace the placeholder with the actual chart
const chartPlaceholder = `<div className="flex-1 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200">
                    <BarChart3 className="w-8 h-8 mr-2 opacity-50" /> [Area Grafik: Chart.js / Recharts]
                  </div>`;
                  
const realChartCode = `<div className="flex-1 bg-white pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4c7c59" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4c7c59" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => \`\${val}M\`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [\`Rp \${value} Milyar\`, 'Pendapatan']}
                          labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="pendapatan" stroke="#4c7c59" strokeWidth={3} fillOpacity={1} fill="url(#colorPendapatan)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>`;

content = content.replace(chartPlaceholder, realChartCode);

fs.writeFileSync('src/pages/Admin.tsx', content, 'utf8');
