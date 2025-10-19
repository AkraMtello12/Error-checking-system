import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getFilteredErrorLogs, getEmployees } from '../services/firebaseService';
import { type PopulatedErrorLog, type Employee } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

type SortConfig = {
    key: 'name' | 'count';
    direction: 'ascending' | 'descending';
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#ef4444', '#0ea5e9', '#64748b'];

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-base-200 p-6 rounded-xl shadow-lg border border-base-300 flex items-center gap-6">
        <div className="bg-primary/20 text-primary p-4 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const [logs, setLogs] = useState<PopulatedErrorLog[]>([]);
    const [allLogs, setAllLogs] = useState<PopulatedErrorLog[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const [year, setYear] = useState<number>(currentYear);
    const [month, setMonth] = useState<number>(currentMonth);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'count', direction: 'descending' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [logsData, empsData] = await Promise.all([
                getFilteredErrorLogs(month, year),
                getEmployees()
            ]);
            setAllLogs(logsData);
            setEmployees(empsData);
        } catch (e) {
            console.error(e);
            setError("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (selectedEmployee === 'all') {
            setLogs(allLogs);
        } else {
            setLogs(allLogs.filter(log => log.employeeId === selectedEmployee));
        }
    }, [selectedEmployee, allLogs]);
    
    const categoryData = useMemo(() => {
        const counts = logs.reduce((acc, log) => {
            acc[log.errorCategoryName] = (acc[log.errorCategoryName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [logs]);

    const employeeData = useMemo(() => {
        const counts = logs.reduce((acc, log) => {
            acc[log.employeeName] = (acc[log.employeeName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [logs]);

    const employeeCategoryData = useMemo(() => {
        if (logs.length === 0) return { data: [], categories: [] };

        const allCategories = [...new Set(allLogs.map(log => log.errorCategoryName))].sort();
        
        const dataByEmployee = logs.reduce((acc, log) => {
            const employeeName = log.employeeName;
            if (!acc[employeeName]) {
                acc[employeeName] = { name: employeeName };
                allCategories.forEach(cat => {
                    acc[employeeName][cat] = 0;
                });
            }
            acc[employeeName][log.errorCategoryName]++;
            return acc;
        }, {} as Record<string, any>);
        
        const finalData = Object.values(dataByEmployee).map(employee => {
            const total = allCategories.reduce((sum, cat) => sum + (employee[cat] || 0), 0);
            return { ...employee, total };
        });

        return {
            data: finalData,
            categories: allCategories
        };
    }, [logs, allLogs]);


    const sortedEmployeeData = useMemo(() => {
        let sortableItems = [...employeeData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [employeeData, sortConfig]);

    const requestSort = (key: 'name' | 'count') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: 'name' | 'count') => {
        if (!sortConfig || sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }

    const selectedEmployeeName = useMemo(() => {
        if (selectedEmployee === 'all') return 'All Employees';
        return employees.find(e => e.id === selectedEmployee)?.name || '';
    }, [selectedEmployee, employees]);
    
    return (
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-100">Dashboard</h2>
                <div className="text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div className="p-6 bg-base-200 rounded-xl shadow-lg border border-base-300">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label htmlFor="year" className="block mb-2 text-sm font-medium text-slate-400">Year</label>
                        <input type="number" id="year" value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-full md:w-32 p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                    <div>
                        <label htmlFor="month" className="block mb-2 text-sm font-medium text-slate-400">Month</label>
                        <input type="number" id="month" value={month} min="1" max="12" onChange={e => setMonth(parseInt(e.target.value))} className="w-full md:w-32 p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary"/>
                    </div>
                    <div className="flex-grow">
                        <label htmlFor="employee" className="block mb-2 text-sm font-medium text-slate-400">Employee</label>
                        <select id="employee" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="all">All Employees</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="text-center p-10 text-error bg-error/10 rounded-lg">{error}</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Total Errors" value={logs.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                        <StatCard title="Employee/Team" value={selectedEmployeeName} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3 p-6 bg-base-200 rounded-xl shadow-lg border border-base-300">
                            <h3 className="text-xl font-bold mb-6 text-slate-100">Error Distribution by Category</h3>
                             <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                            const RADIAN = Math.PI / 180;
                                            const numInnerRadius = Number(innerRadius);
                                            const numOuterRadius = Number(outerRadius);
                                            const numCx = Number(cx);
                                            const numCy = Number(cy);
                                            const numMidAngle = Number(midAngle);
                                            const numPercent = Number(percent);
                                            const radius = numInnerRadius + (numOuterRadius - numInnerRadius) * 0.5;
                                            const x = numCx + radius * Math.cos(-numMidAngle * RADIAN);
                                            const y = numCy + radius * Math.sin(-numMidAngle * RADIAN);
                                            return (numPercent > 0.05) ? (
                                                <text x={x} y={y} fill="white" textAnchor={x > numCx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-semibold">
                                                    {`${(numPercent * 100).toFixed(0)}%`}
                                                </text>
                                            ) : null;
                                        }}>
                                            {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} />
                                        <Legend wrapperStyle={{fontSize: '14px'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 p-6 bg-base-200 rounded-xl shadow-lg border border-base-300">
                            <h3 className="text-xl font-bold mb-4">Detailed Employee Report</h3>
                            <div className="overflow-y-auto max-h-[350px]">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-base-200">
                                        <tr className="border-b border-base-300 bg-base-300/50 text-sm font-semibold text-slate-300">
                                            <th className="p-3 cursor-pointer hover:bg-base-300 rounded-tl-lg" onClick={() => requestSort('name')}>
                                                <div className="flex items-center justify-start gap-2">
                                                    <span>Employee Name</span>
                                                    <span>{getSortIndicator('name')}</span>
                                                </div>
                                            </th>
                                            <th className="p-3 cursor-pointer hover:bg-base-300 rounded-tr-lg" onClick={() => requestSort('count')}>
                                                 <div className="flex items-center justify-end gap-2">
                                                    <span>Total Errors</span>
                                                    <span>{getSortIndicator('count')}</span>
                                                 </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedEmployeeData.map((item, index) => (
                                            <tr key={index} className="border-b border-base-300 last:border-none hover:bg-base-300/40 transition-colors">
                                                <td className="p-3 font-medium">{item.name}</td>
                                                <td className="p-3 text-center font-mono font-bold text-lg text-secondary">{item.count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-base-200 rounded-xl shadow-lg border border-base-300">
                        <h3 className="text-xl font-bold mb-6 text-slate-100">Employee Error Analysis by Category</h3>
                        <div style={{ width: '100%', height: Math.max(200, employeeCategoryData.data.length * 80) }}>
                            {employeeCategoryData.data.length > 0 ? (
                                <ResponsiveContainer>
                                    <BarChart
                                        layout="vertical"
                                        data={employeeCategoryData.data}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#e2e8f0' }} stroke="#334155" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} />
                                        <Legend verticalAlign="bottom" wrapperStyle={{paddingTop: '20px'}} />
                                        {employeeCategoryData.categories.map((category, index) => (
                                            <Bar key={category} dataKey={category} stackId="a" fill={COLORS[index % COLORS.length]}>
                                                {index === employeeCategoryData.categories.length - 1 && 
                                                    <LabelList dataKey="total" position="right" offset={10} style={{ fill: '#e2e8f0', fontWeight: 'bold' }} />
                                                }
                                            </Bar>
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <p>No data available for this chart.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {selectedEmployee !== 'all' && logs.length > 0 && (
                        <div className="p-6 bg-base-200 rounded-xl shadow-lg border border-base-300">
                            <h3 className="text-xl font-bold mb-4">Detailed Error Log for {selectedEmployeeName}</h3>
                             <div className="overflow-y-auto max-h-[400px]">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-base-200">
                                        <tr className="border-b border-base-300 bg-base-300/50 text-sm font-semibold text-slate-300">
                                            <th className="p-3 rounded-tl-lg">Error Type</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3 rounded-tr-lg">Date & Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b border-base-300 last:border-none hover:bg-base-300/40 transition-colors">
                                                <td className="p-3 font-medium">{log.errorTypeName}</td>
                                                <td className="p-3 text-slate-400">{log.errorCategoryName}</td>
                                                <td className="p-3 text-slate-400 font-mono text-sm">{log.created_at.toDate().toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;