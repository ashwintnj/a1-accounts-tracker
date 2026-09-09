import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, toNumber, todayDateString } from '../lib/format';
import { listRecordsByDateRange } from '../lib/firestore';
import { useAuth } from '../lib/AuthContext';

// Helper to get the 1st day of the current local month
const getFirstDayOfMonth = () => {
    const date = new Date();
    date.setDate(1);
    const localOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - localOffset);
    return localDate.toISOString().split('T')[0];
};

const calculateSales = (record) => {
    const expense = toNumber(record.todayExpense);
    const todayCIH = toNumber(record.todayCashInHand);
    const prevCIH = toNumber(record.previousDayCashInHand);
    return expense + todayCIH - prevCIH;
};

const SummaryPage = () => {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(getFirstDayOfMonth());
    const [endDate, setEndDate] = useState(todayDateString());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedDate, setCopiedDate] = useState(null);
    useEffect(() => {
        const load = async () => {
            if (!user?.uid || !startDate || !endDate) return;

            // Prevent fetching if From Date is after To Date
            if (startDate > endDate) {
                setRecords([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const data = await listRecordsByDateRange(user.uid, startDate, endDate);
            setRecords(data);
            setLoading(false);
        };
        load();
    }, [user?.uid, startDate, endDate]);

    const summaryData = records.map((record) => {
        const sales = calculateSales(record);
        const expense = toNumber(record.todayExpense);
        const cih = toNumber(record.todayCashInHand);
        return {
            date: record.date,
            sales,
            expense,
            cih
        };
    });

    const totalSales = summaryData.reduce((sum, item) => sum + item.sales, 0);
    const totalExpense = summaryData.reduce((sum, item) => sum + item.expense, 0);
    const avgSales = records.length > 0 ? totalSales / records.length : 0;
    const handleCopyRow = async (e, item) => {
        e.stopPropagation();

        const expense = item.expense ?? 0;
        const sales = item.sales ?? 0;
        const cih = item.cih ?? 0;

        const textToCopy = `Exp - ${expense}\nSales - ${sales}\nCih - ${cih}`;

        const triggerCopied = () => {
            setCopiedDate(item.date);
            setTimeout(() => setCopiedDate(null), 2000);
        };

        if (navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(textToCopy);
                triggerCopied();
                return;
            } catch (err) {
                console.warn('Clipboard API failed, trying fallback...', err);
            }
        }

        try {
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) triggerCopied();
        } catch (fallbackErr) {
            console.error('Copy fallback failed:', fallbackErr);
        }
    };
    return (
        <div className="space-y-4">
            <div className="card">
                <h1 className="text-lg font-semibold text-slate-900">Custom Summary</h1>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="label">From Date</label>
                        <input
                            type="date"
                            className="input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">To Date</label>
                        <input
                            type="date"
                            className="input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="card text-center text-slate-600">Loading...</div>
            ) : startDate > endDate ? (
                <div className="card text-center text-amber-600">"From Date" cannot be later than "To Date".</div>
            ) : records.length === 0 ? (
                <div className="card text-center text-slate-600">No records found for this date range.</div>
            ) : (
                <>
                    {/* Sales Summary */}
                    <div className="card border-brand bg-blue-50">
                        <h2 className="text-lg font-semibold text-slate-900">Date Range Summary</h2>
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                            <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                <p className="text-xs text-slate-500">Total Sales</p>
                                <p className="text-lg sm:text-xl font-bold text-emerald-600">{formatINR(totalSales)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                <p className="text-xs text-slate-500">Total Expense</p>
                                <p className="text-lg sm:text-xl font-bold text-red-600">{formatINR(totalExpense)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                <p className="text-xs text-slate-500">Avg Daily</p>
                                <p className="text-lg sm:text-xl font-bold text-emerald-600">{formatINR(avgSales)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Daily Breakdown */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-slate-900 mb-3">Daily Breakdown</h2>
                        <div className="space-y-2">
                            {summaryData.map((item) => (
                                <div
                                    key={item.date}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition hover:bg-slate-50 dark:border-[#232c3f] dark:bg-[#111724] dark:hover:bg-[#1a2335]"
                                >
                                    {/* Clickable Area to navigate */}
                                    <Link
                                        to={`/entry/${item.date}?mode=view&tab=sales`}
                                        className="flex-1 min-w-0"
                                    >
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <p className="font-semibold text-slate-900 dark:text-[#f3efe6]">{item.date}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-xs">
                                            <span className="text-red-600 font-medium">Expense: {formatINR(item.expense)}</span>
                                            <span className="text-violet-600 font-medium">Cash-in-Hand: {formatINR(item.cih)}</span>
                                        </div>
                                    </Link>

                                    {/* Sales & Copy Button Area */}
                                    <div className="flex items-center gap-3 pl-3">
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                            Sales: {formatINR(item.sales)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => handleCopyRow(e, item)}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:border-[#273347] dark:bg-[#151d2c] dark:text-[#f3c78e] dark:hover:bg-[#1a2335]"
                                            title="Copy Data"
                                        >
                                            {copiedDate === item.date ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SummaryPage;