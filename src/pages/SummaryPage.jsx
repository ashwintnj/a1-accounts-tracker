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
                                <Link
                                    key={item.date}
                                    to={`/entry/${item.date}?mode=view&tab=sales`}
                                    className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-slate-900">{item.date}</p>
                                        <p className="font-bold text-emerald-600">Sales: {formatINR(item.sales)}</p>
                                    </div>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-red-600">Expense: {formatINR(item.expense)}</span>
                                        <span className="text-violet-600">Cash-in-Hand: {formatINR(item.cih)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SummaryPage;