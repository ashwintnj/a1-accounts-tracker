import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, toNumber } from '../lib/format';
import { deleteDailyRecord, listRecentRecords } from '../lib/firestore';

const calculateSales = (record) => {
    const expense = toNumber(record.todayExpense);
    const todayCIH = toNumber(record.todayCashInHand);
    const prevCIH = toNumber(record.previousDayCashInHand);
    return expense + todayCIH - prevCIH;
};

const HistoryPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [deleteTargetDate, setDeleteTargetDate] = useState('');
    const [deleteText, setDeleteText] = useState('');
    const [deleteTextError, setDeleteTextError] = useState('');

    const loadRecords = async () => {
        setLoading(true);
        const data = await listRecentRecords(100);
        setRecords(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, []);

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
            await deleteDailyRecord(date);
            setRecords((prev) => prev.filter((record) => record.date !== date));
            closeDeleteConfirm();
        } catch (error) {
            alert('Failed to delete: ' + (error.message || 'Unknown error'));
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return <div className="card text-center text-slate-600">Loading history...</div>;
    }

    if (records.length === 0) {
        return (
            <div className="card text-center">
                <p className="text-slate-600">No records found.</p>
                <Link to="/entry" className="btn-primary mt-3 inline-block">
                    Create First Entry
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="card">
                <h1 className="text-lg font-semibold text-slate-900">History</h1>
                <p className="text-sm text-slate-600">Click a record to view/edit. Recent {records.length} records shown.</p>
            </div>

            <div className="space-y-2">
                {records.map((record) => {
                    const sales = calculateSales(record);
                    const expense = toNumber(record.todayExpense);
                    const cih = toNumber(record.todayCashInHand);
                    return (
                        <div key={record.id} className="card flex items-center justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-slate-900">{record.date}</p>
                                    <p className="font-bold text-emerald-600">Sales: {formatINR(sales)}</p>
                                </div>
                                <div className="flex gap-4 text-xs">
                                    <span className="text-red-600">Expense: {formatINR(expense)}</span>
                                    <span className="text-violet-600">Cash-in-Hand: {formatINR(cih)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Link to={`/entry/${record.date}?mode=view`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200" title="View">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </Link>
                                <Link to={`/entry/${record.date}?mode=edit`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white hover:bg-blue-800" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </Link>
                                <button
                                    type="button"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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

            {deleteTargetDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                        <h3 className="text-lg font-semibold text-red-700">Delete Old Data</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            You are deleting the record for <span className="font-semibold">{deleteTargetDate}</span>. This cannot be undone.
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                            If you wish to continue, type <span className="font-bold text-red-700">DELETE</span> below.
                        </p>

                        <input
                            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                            value={deleteText}
                            onChange={(event) => {
                                setDeleteText(event.target.value);
                                if (deleteTextError) {
                                    setDeleteTextError('');
                                }
                            }}
                            placeholder="Type DELETE"
                        />

                        {deleteTextError && <p className="mt-2 text-sm text-red-600">{deleteTextError}</p>}

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={handleDelete}
                                disabled={deleting === deleteTargetDate}
                            >
                                {deleting === deleteTargetDate ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                                type="button"
                                className="flex-1 rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
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
