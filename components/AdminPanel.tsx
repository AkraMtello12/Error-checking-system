import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
    getEmployees, addEmployee, deleteEmployee,
    getErrorCategories, addErrorCategory, deleteErrorCategory, updateErrorCategory,
    getErrorTypes, addErrorType, deleteErrorType,
    addErrorLog, getFilteredErrorLogs, deleteErrorLog
} from '../services/firebaseService';
import { type Employee, type ErrorCategory, type ErrorType, type PopulatedErrorLog } from '../types';

interface PopulatedErrorType extends ErrorType {
    categoryName: string;
}

type AdminTab = 'data' | 'logs';

const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);
const CancelIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-primary text-white' : 'text-slate-400 hover:bg-base-300'}`}
    >
        {children}
    </button>
);

const AdminPanel: React.FC = () => {
    // State
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [errorCategories, setErrorCategories] = useState<ErrorCategory[]>([]);
    const [errorTypes, setErrorTypes] = useState<PopulatedErrorType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<AdminTab>('data');
    const [activeDataManagementTab, setActiveDataManagementTab] = useState<'employees' | 'categories' | 'types'>('employees');

    // Form states
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newErrorTypeName, setNewErrorTypeName] = useState('');
    const [selectedErrorTypeCategory, setSelectedErrorTypeCategory] = useState('');
    const [selectedLogEmployee, setSelectedLogEmployee] = useState('');
    const [selectedLogErrorType, setSelectedLogErrorType] = useState('');
    
    // Log Management states
    const [managedLogs, setManagedLogs] = useState<PopulatedErrorLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logFilterYear, setLogFilterYear] = useState(new Date().getFullYear());
    const [logFilterMonth, setLogFilterMonth] = useState(new Date().getMonth() + 1);
    const [logFilterEmployee, setLogFilterEmployee] = useState('all');

    // Edit states
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    // UI states
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [emps, cats, types] = await Promise.all([
                getEmployees(),
                getErrorCategories(),
                getErrorTypes()
            ]);
            setEmployees(emps);
            setErrorCategories(cats);
            setErrorTypes(types);
            if (cats.length > 0 && !selectedErrorTypeCategory) setSelectedErrorTypeCategory(cats[0].id);
            if (emps.length > 0 && !selectedLogEmployee) setSelectedLogEmployee(emps[0].id);
            if (types.length > 0 && !selectedLogErrorType) setSelectedLogErrorType(types[0].id);
        } catch (e) {
            console.error(e);
            setError("Failed to fetch admin data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFetchManagedLogs = async () => {
        setLoadingLogs(true);
        setError(null);
        try {
            const allLogs = await getFilteredErrorLogs(logFilterMonth, logFilterYear);
            if (logFilterEmployee === 'all') {
                setManagedLogs(allLogs);
            } else {
                setManagedLogs(allLogs.filter(log => log.employeeId === logFilterEmployee));
            }
        } catch (err) {
            console.error("Failed to fetch logs", err);
            setError("Could not retrieve error logs.");
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleAdd = async (type: string, action: () => Promise<any>, resetState: () => void) => {
        setSubmitting(prev => ({ ...prev, [type]: true }));
        setError(null);
        try {
            await action();
            resetState();
            await fetchData();
        } catch (err) {
            console.error(`Failed to add ${type}`, err);
            setError(`Failed to add item. There might be a connection issue.`);
        } finally {
            setSubmitting(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleDelete = async (type: string, id: string, action: (id: string) => Promise<any>) => {
        if (window.confirm(`Are you sure? This will permanently delete the item and all associated records.`)) {
            setError(null);
            try {
                await action(id);
                await fetchData();
            } catch (err) {
                console.error(`Failed to delete ${type}`, err);
                setError(`Failed to delete item. It may be linked to other data or there's a connection issue.`);
            }
        }
    };
    
    const handleDeleteLog = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this specific error log? This action cannot be undone.')) {
            setError(null);
            try {
                await deleteErrorLog(id);
                await handleFetchManagedLogs(); // Refresh the list
            } catch (err) {
                 console.error(`Failed to delete log`, err);
                setError(`Failed to delete log entry.`);
            }
        }
    };

    const handleSaveCategory = async (id: string) => {
        if (!editingCategoryName.trim()) {
            setError("Category name cannot be empty.");
            return;
        }
        setError(null);
        try {
            await updateErrorCategory(id, editingCategoryName);
            setEditingCategoryId(null);
            await fetchData();
        } catch (err) {
            console.error('Failed to update category', err);
            setError("Failed to update category name.");
        }
    };

    const renderLoader = () => (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
    
    if (loading) return renderLoader();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-100">Admin Panel</h2>
                <div className="flex items-center gap-2 border-b-2 border-base-200">
                    <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')}>Manage Data</TabButton>
                    <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>Manage Logs</TabButton>
                </div>
            </div>
            
            {error && <div className="p-4 text-center text-error bg-error/10 rounded-lg">{error}</div>}
            
            {activeTab === 'data' && (
                <>
                    <div className="p-6 bg-base-200 rounded-xl shadow-lg border border-base-300">
                        <h3 className="text-xl font-bold mb-4 text-slate-100">Log a New Error</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleAdd('errorLog', () => addErrorLog(selectedLogEmployee, selectedLogErrorType), () => {}); }} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label htmlFor="log-employee" className="block mb-2 text-sm font-medium text-slate-400">Employee</label>
                                <select id="log-employee" value={selectedLogEmployee} onChange={e => setSelectedLogEmployee(e.target.value)} className="w-full p-2.5 bg-base-100 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary transition">
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="log-error-type" className="block mb-2 text-sm font-medium text-slate-400">Error Type</label>
                                <select id="log-error-type" value={selectedLogErrorType} onChange={e => setSelectedLogErrorType(e.target.value)} className="w-full p-2.5 bg-base-100 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary transition">
                                    {errorTypes.map(type => <option key={type.id} value={type.id}>{type.name} ({type.categoryName})</option>)}
                                </select>
                            </div>
                            <button type="submit" disabled={submitting.errorLog || !selectedLogEmployee || !selectedLogErrorType} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md shadow-primary/20 disabled:bg-base-300 disabled:shadow-none disabled:cursor-not-allowed">
                                {submitting.errorLog ? 'Logging...' : 'OK'}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 bg-base-200 rounded-xl shadow-lg border border-base-300 space-y-4">
                         <div className="flex items-center gap-2 border-b border-base-300 pb-4">
                            <TabButton active={activeDataManagementTab === 'employees'} onClick={() => setActiveDataManagementTab('employees')}>Employees</TabButton>
                            <TabButton active={activeDataManagementTab === 'categories'} onClick={() => setActiveDataManagementTab('categories')}>Categories</TabButton>
                            <TabButton active={activeDataManagementTab === 'types'} onClick={() => setActiveDataManagementTab('types')}>Error Types</TabButton>
                        </div>
                        
                        {activeDataManagementTab === 'employees' && (
                            <div className="space-y-4">
                                <form onSubmit={(e) => { e.preventDefault(); handleAdd('employee', () => addEmployee(newEmployeeName), () => setNewEmployeeName('')); }} className="flex gap-2">
                                    <input type="text" value={newEmployeeName} onChange={e => setNewEmployeeName(e.target.value)} placeholder="New employee name" className="flex-grow p-2 bg-base-100 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary" required />
                                    <button type="submit" disabled={submitting.employee} className="px-4 py-2 bg-secondary text-white font-semibold rounded-lg hover:bg-violet-500 transition-colors disabled:bg-base-300 flex items-center gap-2"><AddIcon /> Add</button>
                                </form>
                                <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {employees.map(emp => (
                                        emp.name && (
                                            <li key={emp.id} className="flex justify-between items-center bg-base-100 p-3 rounded-md">
                                                <span className="text-slate-300 font-medium">{emp.name}</span>
                                                <button onClick={() => handleDelete('employee', emp.id, deleteEmployee)} className="text-error/70 hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"><TrashIcon /></button>
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {activeDataManagementTab === 'categories' && (
                            <div className="space-y-4">
                                <form onSubmit={(e) => { e.preventDefault(); handleAdd('category', () => addErrorCategory(newCategoryName), () => setNewCategoryName('')); }} className="flex gap-2">
                                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-grow p-2 bg-base-100 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary" required />
                                    <button type="submit" disabled={submitting.category} className="px-4 py-2 bg-secondary text-white font-semibold rounded-lg hover:bg-violet-500 transition-colors disabled:bg-base-300 flex items-center gap-2"><AddIcon /> Add</button>
                                </form>
                                <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {errorCategories.map(cat => (
                                        cat.name && (
                                            <li key={cat.id} className="flex justify-between items-center bg-base-100 p-3 rounded-md">
                                                {editingCategoryId === cat.id ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            value={editingCategoryName}
                                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                                            className="flex-grow p-1 bg-base-300 rounded-md border border-base-300 focus:outline-none focus:ring-1 focus:ring-primary"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-1 ml-2">
                                                            <button onClick={() => handleSaveCategory(cat.id)} className="text-success/70 hover:text-success p-1 rounded-full hover:bg-success/10"><CheckIcon /></button>
                                                            <button onClick={() => setEditingCategoryId(null)} className="text-slate-400 hover:text-slate-200 p-1 rounded-full hover:bg-slate-500/10"><CancelIcon /></button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-slate-300 font-medium">{cat.name}</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} className="text-primary/70 hover:text-primary transition-colors p-1 rounded-full hover:bg-primary/10"><EditIcon /></button>
                                                            <button onClick={() => handleDelete('category', cat.id, deleteErrorCategory)} className="text-error/70 hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"><TrashIcon /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </div>
                        )}

                        {activeDataManagementTab === 'types' && (
                            <div className="space-y-4">
                                <form onSubmit={(e) => { e.preventDefault(); handleAdd('errorType', () => addErrorType(newErrorTypeName, selectedErrorTypeCategory), () => setNewErrorTypeName('')); }} className="space-y-3 p-4 bg-base-100 rounded-lg">
                                    <input type="text" value={newErrorTypeName} onChange={e => setNewErrorTypeName(e.target.value)} placeholder="New error type name" className="w-full p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary" required />
                                    <select value={selectedErrorTypeCategory} onChange={e => setSelectedErrorTypeCategory(e.target.value)} className="w-full p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary">
                                        {errorCategories.map(cat => cat.name && <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    <button type="submit" disabled={submitting.errorType || !selectedErrorTypeCategory} className="w-full px-4 py-2 bg-secondary text-white font-semibold rounded-lg hover:bg-violet-500 transition-colors disabled:bg-base-300 flex items-center justify-center gap-2"><AddIcon /> Add</button>
                                </form>
                                <ul className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                    {errorTypes.map(type => (
                                        type.name && (
                                            <li key={type.id} className="flex justify-between items-center bg-base-100 p-3 rounded-md">
                                                <div>
                                                    <p className="text-slate-300 font-medium">{type.name}</p>
                                                    <p className="text-xs text-slate-500">{type.categoryName}</p>
                                                </div>
                                                <button onClick={() => handleDelete('errorType', type.id, deleteErrorType)} className="text-error/70 hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"><TrashIcon /></button>
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            )}
            {activeTab === 'logs' && (
                 <div className="p-6 bg-base-200 rounded-xl shadow-lg border border-base-300 space-y-4">
                    <h3 className="text-xl font-bold text-slate-100">Find and Manage Error Logs</h3>
                     <div className="flex flex-wrap gap-4 items-end p-4 bg-base-100 rounded-lg">
                        <div>
                            <label htmlFor="log-filter-year" className="block mb-2 text-sm font-medium text-slate-400">Year</label>
                            <input type="number" id="log-filter-year" value={logFilterYear} onChange={e => setLogFilterYear(parseInt(e.target.value))} className="w-full md:w-32 p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div>
                            <label htmlFor="log-filter-month" className="block mb-2 text-sm font-medium text-slate-400">Month</label>
                            <input type="number" id="log-filter-month" value={logFilterMonth} min="1" max="12" onChange={e => setLogFilterMonth(parseInt(e.target.value))} className="w-full md:w-32 p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="log-filter-employee" className="block mb-2 text-sm font-medium text-slate-400">Employee</label>
                            <select id="log-filter-employee" value={logFilterEmployee} onChange={e => setLogFilterEmployee(e.target.value)} className="w-full p-2 bg-base-300 rounded-lg border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="all">All Employees</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>
                        <button onClick={handleFetchManagedLogs} disabled={loadingLogs} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:bg-base-300">
                            {loadingLogs ? 'Searching...' : 'Search Logs'}
                        </button>
                    </div>

                    {loadingLogs ? (
                        <div className="flex justify-center items-center h-40">
                             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-[500px]">
                             <table className="w-full text-left">
                                <thead className="sticky top-0 bg-base-200">
                                    <tr className="border-b border-base-300 bg-base-300/50 text-sm font-semibold text-slate-300">
                                        <th className="p-3 rounded-tl-lg">Employee</th>
                                        <th className="p-3">Error Type</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3 rounded-tr-lg">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {managedLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-base-300 last:border-none hover:bg-base-300/40 transition-colors">
                                            <td className="p-3 font-medium">{log.employeeName}</td>
                                            <td className="p-3">{log.errorTypeName}</td>
                                            <td className="p-3 text-slate-400">{log.errorCategoryName}</td>
                                            <td className="p-3 text-slate-400 text-sm font-mono">{log.created_at.toDate().toLocaleString()}</td>
                                            <td className="p-3">
                                                <button onClick={() => handleDeleteLog(log.id)} className="text-error/70 hover:text-error transition-colors p-1 rounded-full hover:bg-error/10"><TrashIcon /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {managedLogs.length === 0 && (
                                <div className="text-center p-10 text-slate-500">
                                    <p>No logs found for the selected criteria. Try a different filter.</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

export default AdminPanel;
