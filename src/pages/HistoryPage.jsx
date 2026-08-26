// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { formatINR, toNumber } from '../lib/format';
// import { deleteDailyRecord, listRecentRecords } from '../lib/firestore';
// import { useAuth } from '../lib/AuthContext';

// const calculateSales = (record) => {
//     const expense = toNumber(record.todayExpense);
//     const todayCIH = toNumber(record.todayCashInHand);
//     const prevCIH = toNumber(record.previousDayCashInHand);
//     return expense + todayCIH - prevCIH;
// };

// const HistoryPage = () => {
//     const { user } = useAuth();
//     const [records, setRecords] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [deleting, setDeleting] = useState(null);
//     const [deleteTargetDate, setDeleteTargetDate] = useState('');
//     const [deleteText, setDeleteText] = useState('');
//     const [deleteTextError, setDeleteTextError] = useState('');
//     const [searchDate, setSearchDate] = useState('');
//     const [filterType, setFilterType] = useState('all'); // all, positive, negative

//     const loadRecords = async () => {
//         if (!user?.uid) return;
//         setLoading(true);
//         const data = await listRecentRecords(user.uid, 100);
//         setRecords(data);
//         setLoading(false);
//     };

//     useEffect(() => {
//         loadRecords();
//     }, [user?.uid]);

//     const openDeleteConfirm = (date) => {
//         setDeleteTargetDate(date);
//         setDeleteText('');
//         setDeleteTextError('');
//     };

//     const closeDeleteConfirm = () => {
//         setDeleteTargetDate('');
//         setDeleteText('');
//         setDeleteTextError('');
//     };

//     const handleDelete = async () => {
//         if (deleteText !== 'DELETE') {
//             setDeleteTextError('Type DELETE exactly to continue.');
//             return;
//         }

//         const date = deleteTargetDate;
//         if (!date) {
//             return;
//         }

//         setDeleting(date);
//         try {
//             await deleteDailyRecord(user.uid, date);
//             setRecords((prev) => prev.filter((record) => record.date !== date));
//             closeDeleteConfirm();
//         } catch (error) {
//             alert('Failed to delete: ' + (error.message || 'Unknown error'));
//         } finally {
//             setDeleting(null);
//         }
//     };

//     if (loading) {
//         return <div className="card text-center text-slate-600">Loading history...</div>;
//     }

//     if (records.length === 0) {
//         return (
//             <div className="card text-center">
//                 <p className="text-slate-600">No records found.</p>
//                 <Link to="/entry" className="btn-primary mt-3 inline-block">
//                     Create First Entry
//                 </Link>
//             </div>
//         );
//     }

//     // Filter records based on search and filter criteria
//     const filteredRecords = records.filter((record) => {
//         // Date search filter
//         if (searchDate && !record.date.includes(searchDate)) {
//             return false;
//         }
//         // Sales filter
//         const sales = calculateSales(record);
//         if (filterType === 'positive' && sales <= 0) return false;
//         if (filterType === 'negative' && sales >= 0) return false;
//         return true;
//     });

//     return (
//         <div className="space-y-4">
//             <div className="card">
//                 <h1 className="text-lg font-semibold text-slate-900">History</h1>
//                 <p className="text-sm text-slate-600">Click a record to view/edit. Recent {records.length} records shown.</p>

//                 {/* Search and Filter Section */}
//                 <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
//                     <div>
//                         <label className="label">Search by Date</label>
//                         <input
//                             type="date"
//                             className="input"
//                             value={searchDate}
//                             onChange={(e) => setSearchDate(e.target.value)}
//                             placeholder="Search date..."
//                         />
//                     </div>
//                     <div>
//                         <label className="label">Filter by Sales</label>
//                         <select
//                             className="input"
//                             value={filterType}
//                             onChange={(e) => setFilterType(e.target.value)}
//                         >
//                             <option value="all">All Records</option>
//                             <option value="positive">Positive Sales Only</option>
//                             <option value="negative">Negative Sales Only</option>
//                         </select>
//                     </div>
//                 </div>
//                 {(searchDate || filterType !== 'all') && (
//                     <div className="mt-2 flex items-center gap-2">
//                         <span className="text-sm text-slate-600">Showing {filteredRecords.length} of {records.length} records</span>
//                         <button
//                             type="button"
//                             className="text-sm text-brand hover:underline"
//                             onClick={() => { setSearchDate(''); setFilterType('all'); }}
//                         >
//                             Clear Filters
//                         </button>
//                     </div>
//                 )}
//             </div>

//             <div className="space-y-2">
//                 {filteredRecords.map((record) => {
//                     const sales = calculateSales(record);
//                     const expense = toNumber(record.todayExpense);
//                     const cih = toNumber(record.todayCashInHand);
//                     return (
//                         <div key={record.id} className="card flex items-center justify-between gap-3">
//                             <div className="flex-1">
//                                 <div className="flex items-center justify-between mb-2">
//                                     <p className="font-medium text-slate-900">{record.date}</p>
//                                     <p className="font-bold text-emerald-600">Sales: {formatINR(sales)}</p>
//                                 </div>
//                                 <div className="flex gap-4 text-xs">
//                                     <span className="text-red-600">Expense: {formatINR(expense)}</span>
//                                     <span className="text-violet-600">Cash-in-Hand: {formatINR(cih)}</span>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-1">
//                                 <Link to={`/entry/${record.date}?mode=view`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200" title="View">
//                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
//                                 </Link>
//                                 <Link to={`/entry/${record.date}?mode=edit`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white hover:bg-blue-800" title="Edit">
//                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
//                                 </Link>
//                                 <button
//                                     type="button"
//                                     className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
//                                     onClick={() => openDeleteConfirm(record.date)}
//                                     disabled={deleting === record.date}
//                                     title="Delete"
//                                 >
//                                     {deleting === record.date ? '...' : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
//                                 </button>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>

//             {deleteTargetDate && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//                     <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
//                         <h3 className="text-lg font-semibold text-red-700">Delete Old Data</h3>
//                         <p className="mt-2 text-sm text-slate-600">
//                             You are deleting the record for <span className="font-semibold">{deleteTargetDate}</span>. This cannot be undone.
//                         </p>
//                         <p className="mt-2 text-sm text-slate-600">
//                             If you wish to continue, type <span className="font-bold text-red-700">DELETE</span> below.
//                         </p>

//                         <input
//                             className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
//                             value={deleteText}
//                             onChange={(event) => {
//                                 setDeleteText(event.target.value);
//                                 if (deleteTextError) {
//                                     setDeleteTextError('');
//                                 }
//                             }}
//                             placeholder="Type DELETE"
//                         />

//                         {deleteTextError && <p className="mt-2 text-sm text-red-600">{deleteTextError}</p>}

//                         <div className="mt-4 flex gap-2">
//                             <button
//                                 type="button"
//                                 className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
//                                 onClick={handleDelete}
//                                 disabled={deleting === deleteTargetDate}
//                             >
//                                 {deleting === deleteTargetDate ? 'Deleting...' : 'Confirm Delete'}
//                             </button>
//                             <button
//                                 type="button"
//                                 className="flex-1 rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
//                                 onClick={closeDeleteConfirm}
//                                 disabled={deleting === deleteTargetDate}
//                             >
//                                 Cancel
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default HistoryPage;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, toNumber } from '../lib/format';
import { deleteDailyRecord, listRecentRecords } from '../lib/firestore';
import { useAuth } from '../lib/AuthContext';

const calculateSales = (record) => {
    const expense = toNumber(record.todayExpense);
    const todayCIH = toNumber(record.todayCashInHand);
    const prevCIH = toNumber(record.previousDayCashInHand);
    return expense + todayCIH - prevCIH;
};

const HistoryPage = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [deleteTargetDate, setDeleteTargetDate] = useState('');
    const [deleteText, setDeleteText] = useState('');
    const [deleteTextError, setDeleteTextError] = useState('');

    const [searchDate, setSearchDate] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, positive, negative

    const loadRecords = async () => {
        if (!user?.uid) return;
        setLoading(true);
        const data = await listRecentRecords(user.uid, 100);
        setRecords(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, [user?.uid]);

    const openDeleteConfirm = (date) => {
        setDeleteTargetDate(date);
        setDeleteText('');
        setDeleteTextError('');
    };

    const closeDeleteConfirm = () => {
        setDeleteTargetDate('');
        setDeleteText('');
        setDeleteTextError('');
    };

    const handleDelete = async () => {
        if (deleteText !== 'DELETE') {
            setDeleteTextError('Type DELETE exactly to continue.');
            return;
        }
        const date = deleteTargetDate;
        if (!date) {
            return;
        }

        setDeleting(date);
        try {
            await deleteDailyRecord(user.uid, date);
            setRecords((prev) => prev.filter((record) => record.date !== date));
            closeDeleteConfirm();
        } catch (error) {
            alert('Failed to delete: ' + (error.message || 'Unknown error'));
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return <div className="card text-center text-slate-600 dark:text-[#9ca3af]">Loading history...</div>;
    }

    if (records.length === 0) {
        return (
            <div className="card text-center">
                <p className="text-slate-600 dark:text-[#9ca3af]">No records found.</p>
                <Link to="/entry" className="btn-primary mt-3 inline-block">
                    Create First Entry
                </Link>
            </div>
        );
    }

    // Filter records based on search and filter criteria
    const filteredRecords = records.filter((record) => {
        // Date search filter
        if (searchDate && !record.date.includes(searchDate)) {
            return false;
        }
        // Sales filter
        const sales = calculateSales(record);
        if (filterType === 'positive' && sales <= 0) return false;
        if (filterType === 'negative' && sales >= 0) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div className="card">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-[#faf7f2]">History</h1>
                <p className="text-sm text-slate-600 dark:text-[#9ca3af]">Click a record to view/edit. Recent {records.length} records shown.</p>

                {/* Search and Filter Section */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="label">Search by Date</label>
                        <input
                            type="date"
                            className="input"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            placeholder="Search date..."
                        />
                    </div>
                    <div>
                        <label className="label">Filter by Sales</label>
                        <select
                            className="input"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Records</option>
                            <option value="positive">Positive Sales Only</option>
                            <option value="negative">Negative Sales Only</option>
                        </select>
                    </div>
                </div>

                {(searchDate || filterType !== 'all') && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-slate-600 dark:text-[#9ca3af]">Showing {filteredRecords.length} of {records.length} records</span>
                        <button
                            type="button"
                            className="text-sm text-brand dark:text-[#f3c78e] hover:underline"
                            onClick={() => { setSearchDate(''); setFilterType('all'); }}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {filteredRecords.map((record) => {
                    const sales = calculateSales(record);
                    const expense = toNumber(record.todayExpense);
                    const cih = toNumber(record.todayCashInHand);

                    return (
                        <div key={record.id} className="card flex items-center justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-slate-900 dark:text-[#f3efe6]">{record.date}</p>
                                    <p className="font-bold text-emerald-600 dark:text-[#34d399]">Sales: {formatINR(sales)}</p>
                                </div>
                                <div className="flex gap-4 text-xs">
                                    <span className="text-red-600 dark:text-[#f87171]">Expense: {formatINR(expense)}</span>
                                    <span className="text-violet-600 dark:text-[#a78bfa]">Cash-in-Hand: {formatINR(cih)}</span>
                                </div>
                            </div>

                            {/* FIXED ROW ACTION BUTTONS */}
                            <div className="flex items-center gap-1.5">
                                <Link to={`/entry/${record.date}?mode=view`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1a2335] dark:text-[#9ca3af] dark:hover:bg-[#263145] dark:hover:text-[#f3c78e] transition-colors" title="View">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </Link>
                                <Link to={`/entry/${record.date}?mode=edit`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand hover:bg-blue-100 dark:bg-[rgba(243,199,142,0.12)] dark:text-[#f3c78e] dark:hover:bg-[rgba(243,199,142,0.2)] transition-colors" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </Link>
                                <button
                                    type="button"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-[rgba(239,68,68,0.12)] dark:text-[#f87171] dark:hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-50 transition-colors"
                                    onClick={() => openDeleteConfirm(record.date)}
                                    disabled={deleting === record.date}
                                    title="Delete"
                                >
                                    {deleting === record.date ? '...' : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FIXED DELETE MODAL */}
            {deleteTargetDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111724] p-6 shadow-2xl border border-transparent dark:border-[#232c3f]">

                        <div className="mb-4 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-[rgba(239,68,68,0.12)] p-3 text-red-600 dark:text-[#f87171]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-lg font-bold">Delete Old Data</h3>
                        </div>

                        <p className="mt-2 text-sm text-slate-600 dark:text-[#9ca3af]">
                            You are deleting the record for <span className="font-bold text-slate-900 dark:text-[#f3efe6]">{deleteTargetDate}</span>. This cannot be undone.
                        </p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-[#9ca3af]">
                            If you wish to continue, type <span className="font-bold text-red-600 dark:text-[#ef4444]">DELETE</span> below.
                        </p>

                        <input
                            className="mt-4 w-full rounded-lg border border-slate-300 dark:border-[#273347] bg-white dark:bg-[#141c2a] px-4 py-3 text-sm text-slate-900 dark:text-[#fdfbf7] focus:border-red-500 dark:focus:border-[#ef4444] focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-[rgba(239,68,68,0.2)] transition-colors"
                            value={deleteText}
                            onChange={(event) => {
                                setDeleteText(event.target.value);
                                if (deleteTextError) {
                                    setDeleteTextError('');
                                }
                            }}
                            placeholder="Type DELETE"
                        />
                        {deleteTextError && <p className="mt-2 text-sm font-medium text-red-600 dark:text-[#ef4444]">{deleteTextError}</p>}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                className="flex-1 rounded-xl px-4 py-2.5 font-bold transition-all duration-300"
                                style={{
                                    backgroundColor: deleteText === 'DELETE' ? '#dc2626' : 'rgba(239, 68, 68, 0.15)',
                                    color: deleteText === 'DELETE' ? '#ffffff' : 'rgba(239, 68, 68, 0.5)',
                                    cursor: deleteText === 'DELETE' ? 'pointer' : 'not-allowed',
                                    boxShadow: deleteText === 'DELETE' ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none'
                                }}
                                onClick={handleDelete}
                                disabled={deleteText !== 'DELETE' || deleting === deleteTargetDate}
                            >
                                {deleting === deleteTargetDate ? 'Deleting...' : 'Confirm Delete'}
                            </button>

                            <button
                                type="button"
                                className="flex-1 rounded-xl bg-slate-100 dark:bg-[#1a2335] px-4 py-2.5 font-bold text-slate-700 dark:text-[#9ca3af] hover:bg-slate-200 dark:hover:bg-[#263145] dark:hover:text-[#e5e7eb] transition-colors"
                                onClick={closeDeleteConfirm}
                                disabled={deleting === deleteTargetDate}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;