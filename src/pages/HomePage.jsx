import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatINR, todayDateString, toNumber } from '../lib/format';
import { listRecentRecords } from '../lib/firestore';

const calculateSales = (record) => {
    const expense = toNumber(record.todayExpense);
    const todayCIH = toNumber(record.todayCashInHand);
    const prevCIH = toNumber(record.previousDayCashInHand);
    return expense + todayCIH - prevCIH;
};

const HomePage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await listRecentRecords(12);
            setRecords(data);
            setLoading(false);
        };
        load();
    }, []);

    const today = todayDateString();

    return (
        <div className="space-y-4">
            <section className="card">
                <h2 className="text-lg font-semibold text-slate-900">Today</h2>
                <p className="text-sm text-slate-600">Entry Date: {today}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/entry" className="btn-primary">
                        Open Daily Entry
                    </Link>
                    <Link to="/history" className="btn-light">
                        View History
                    </Link>
                    <Link to="/monthly-summary" className="btn-light">
                        Monthly Summary
                    </Link>
                </div>
            </section>

            <section className="card">
                <h2 className="text-lg font-semibold text-slate-900">Recent Records</h2>
                {loading ? <p className="mt-2 text-sm text-slate-600">Loading records...</p> : null}
                {!loading && records.length === 0 ? <p className="mt-2 text-sm text-slate-600">No records yet.</p> : null}
                <div className="mt-3 space-y-2">
                    {records.map((record) => {
                        const sales = calculateSales(record);
                        const expense = toNumber(record.todayExpense);
                        const cih = toNumber(record.todayCashInHand);
                        return (
                            <Link
                                key={record.id}
                                to={`/entry/${record.date}?mode=view`}
                                className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-slate-900">{record.date}</p>
                                    <p className="font-bold text-emerald-600">Sales: {formatINR(sales)}</p>
                                </div>
                                <div className="flex gap-4 text-xs">
                                    <span className="text-red-600">Expense: {formatINR(expense)}</span>
                                    <span className="text-violet-600">Cash-in-Hand: {formatINR(cih)}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
