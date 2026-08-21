import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, toNumber } from '../lib/format';
import { listMonthlyRecords } from '../lib/firestore';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const calculateSales = (record) => {
    const expense = toNumber(record.todayExpense);
    const todayCIH = toNumber(record.todayCashInHand);
    const prevCIH = toNumber(record.previousDayCashInHand);
    return expense + todayCIH - prevCIH;
};

const MonthlySummaryPage = () => {
    const [month, setMonth] = useState(getCurrentMonth());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await listMonthlyRecords(month);
            setRecords(data);
            setLoading(false);
        };
        load();
    }, [month]);

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

    const monthlySales = summaryData.reduce((sum, item) => sum + toNumber(item.sales), 0);
    const monthlyExpense = summaryData.reduce((sum, item) => sum + toNumber(item.expense), 0);

    return (
        <div className="space-y-4">
            <div className="card">
                <h1 className="text-lg font-semibold text-slate-900">Monthly Summary</h1>
                <div className="mt-3">
                    <label className="label">Select Month</label>
                    <input
                        type="month"
                        className="input"
                        value={month}
                        onChange={(event) => setMonth(event.target.value)}
                        max={getCurrentMonth()}
                    />
                </div>
            </div>

            {loading ? (
                <div className="card text-center text-slate-600">Loading...</div>
            ) : records.length === 0 ? (
                <div className="card text-center text-slate-600">No records for this month.</div>
            ) : (
                <>
                    {/* Sales Summary */}
                    <div className="card border-emerald-400 bg-emerald-50">
                        <h2 className="text-lg font-semibold text-slate-900">Sales Summary</h2>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-slate-500">Total Sales</p>
                                <p className="text-xl font-bold text-emerald-600">{formatINR(monthlySales)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-slate-500">Total Expense</p>
                                <p className="text-xl font-bold text-red-600">{formatINR(monthlyExpense)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-3">
                                <p className="text-xs text-slate-500">Avg Daily Sales</p>
                                <p className="text-xl font-bold text-emerald-600">
                                    {formatINR(records.length > 0 ? monthlySales / records.length : 0)}
                                </p>
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
                                    to={`/entry/${item.date}?mode=view`}
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

export default MonthlySummaryPage;
