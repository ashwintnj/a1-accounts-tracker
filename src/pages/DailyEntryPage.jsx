import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BankAccountsList from '../components/BankAccountsList';
import MoneyReceivedList from '../components/MoneyReceivedList';
import NumberInput from '../components/NumberInput';
import { useAuth } from '../lib/AuthContext';
import { calculateDaily, getFinalDirectionText } from '../lib/calculations';
import { DEFAULT_BANKS, DEFAULT_RECEIVED_LABEL } from '../lib/constants';
import { getDailyRecord, getPreviousDayRecord, saveDailyRecord } from '../lib/firestore';
import { formatINR, todayDateString, toNumber } from '../lib/format';

const generateId = () => crypto.randomUUID();

const createEmptyRecord = () => ({
    banks: DEFAULT_BANKS.map((bank) => ({ ...bank, id: generateId() })),
    moneySentA: '',
    rechargeAddGr: '',
    rechargeAddEg: '',
    moneyReceivedEntries: [{ id: generateId(), label: DEFAULT_RECEIVED_LABEL, amount: '' }],
    oldAeps: '',
    rechargeDoneGr: '',
    rechargeDoneEg: '',
    gpayBusiness: '',
    aeps: '',
    moneyBeforeScreenshot: '',
    // Sales Report fields
    todayExpense: '',
    todayCashInHand: '',
    previousDayCashInHand: ''
});

const DailyEntryPage = () => {
    const { date: paramDate } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [currentDate, setCurrentDate] = useState(paramDate || todayDateString());
    const [record, setRecord] = useState(createEmptyRecord());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showEditWarning, setShowEditWarning] = useState(false);
    const [previousDayCIHFetched, setPreviousDayCIHFetched] = useState(false);

    const isOldDate = currentDate !== todayDateString();

    useEffect(() => {
        const loadRecord = async () => {
            setLoading(true);
            const data = await getDailyRecord(currentDate);
            const prevDayRecord = await getPreviousDayRecord(currentDate);

            if (data) {
                setRecord({
                    ...createEmptyRecord(),
                    ...data,
                    banks: data.banks || DEFAULT_BANKS.map((bank) => ({ ...bank, id: generateId() })),
                    moneyReceivedEntries: data.moneyReceivedEntries?.length
                        ? data.moneyReceivedEntries
                        : [{ id: generateId(), label: DEFAULT_RECEIVED_LABEL, amount: '' }],
                    previousDayCashInHand: data.previousDayCashInHand || prevDayRecord?.todayCashInHand || ''
                });
                setIsEditing(true);
                setPreviousDayCIHFetched(!!prevDayRecord?.todayCashInHand);
            } else {
                setRecord({
                    ...createEmptyRecord(),
                    previousDayCashInHand: prevDayRecord?.todayCashInHand || ''
                });
                setIsEditing(false);
                setPreviousDayCIHFetched(!!prevDayRecord?.todayCashInHand);
            }
            setLoading(false);
        };
        loadRecord();
    }, [currentDate]);

    const computed = calculateDaily(record);

    // Calculate Sales
    const todayExpense = toNumber(record.todayExpense);
    const todayCashInHand = toNumber(record.todayCashInHand);
    const previousDayCashInHand = toNumber(record.previousDayCashInHand);
    const calculatedSales = todayExpense + todayCashInHand - previousDayCashInHand;

    const updateField = (field, value) => {
        setRecord((prev) => ({ ...prev, [field]: value }));
    };

    const handleBankAdd = () => {
        setRecord((prev) => ({
            ...prev,
            banks: [...prev.banks, { id: generateId(), name: '', opening: '', closing: '' }]
        }));
    };

    const handleBankUpdate = (id, field, value) => {
        setRecord((prev) => ({
            ...prev,
            banks: prev.banks.map((bank) => (bank.id === id ? { ...bank, [field]: value } : bank))
        }));
    };

    const handleBankRemove = (id) => {
        setRecord((prev) => ({
            ...prev,
            banks: prev.banks.filter((bank) => bank.id !== id)
        }));
    };

    const handleReceivedAdd = () => {
        setRecord((prev) => ({
            ...prev,
            moneyReceivedEntries: [
                ...prev.moneyReceivedEntries,
                { id: generateId(), label: DEFAULT_RECEIVED_LABEL, amount: '' }
            ]
        }));
    };

    const handleReceivedUpdate = (id, field, value) => {
        setRecord((prev) => ({
            ...prev,
            moneyReceivedEntries: prev.moneyReceivedEntries.map((entry) =>
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        }));
    };

    const handleReceivedRemove = (id) => {
        setRecord((prev) => ({
            ...prev,
            moneyReceivedEntries: prev.moneyReceivedEntries.filter((entry) => entry.id !== id)
        }));
    };

    const handleSave = async () => {
        if (isOldDate && !showEditWarning) {
            setShowEditWarning(true);
            return;
        }
        setSaving(true);
        setMessage('');
        try {
            console.log('Saving record:', currentDate, record);
            await saveDailyRecord(currentDate, record, user?.email);
            setMessage('Saved successfully!');
            setShowEditWarning(false);
            setIsEditing(true);
        } catch (saveError) {
            console.error('Save error:', saveError);
            setMessage('Error saving: ' + (saveError.message || 'Unknown error'));
        } finally {
            setSaving(false);
        }
    };

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        setCurrentDate(newDate);
        navigate(`/entry/${newDate}`, { replace: true });
    };

    if (loading) {
        return <div className="card text-center text-slate-600">Loading...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Date Selector */}
            <div className="card">
                <label className="label">Entry Date</label>
                <input type="date" className="input" value={currentDate} onChange={handleDateChange} max={todayDateString()} />
                {isEditing && <p className="mt-1 text-xs text-amber-600">Editing existing record</p>}
            </div>

            {/* Step 1: Bank Accounts */}
            <section className="card">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 1: Bank Accounts</h2>
                <BankAccountsList
                    banks={record.banks}
                    onAdd={handleBankAdd}
                    onUpdate={handleBankUpdate}
                    onRemove={handleBankRemove}
                />
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-3 text-center text-sm">
                    <div>
                        <p className="text-slate-600">Opening Total</p>
                        <p className="font-semibold">{formatINR(computed.openingTotal)}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">Closing Total</p>
                        <p className="font-semibold">{formatINR(computed.closingTotal)}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">X (Difference)</p>
                        <p className="font-bold text-brand">{formatINR(computed.overallBalanceX)}</p>
                    </div>
                </div>
            </section>

            {/* Step 2: Debits */}
            <section className="card">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 2: Debits (A + B = C)</h2>
                <div className="space-y-3">
                    <div>
                        <label className="label">UPI Money Sent (A)</label>
                        <NumberInput
                            value={record.moneySentA}
                            onChange={(value) => updateField('moneySentA', value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">GR Wallet Add (B₁)</label>
                            <NumberInput
                                value={record.rechargeAddGr}
                                onChange={(value) => updateField('rechargeAddGr', value)}
                            />
                        </div>
                        <div>
                            <label className="label">EG Wallet Add (B₂)</label>
                            <NumberInput
                                value={record.rechargeAddEg}
                                onChange={(value) => updateField('rechargeAddEg', value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-3 text-center text-sm">
                    <div>
                        <p className="text-slate-600">Total Recharge Add (B)</p>
                        <p className="font-semibold">{formatINR(computed.totalRechargeAddB)}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">Total Debited (C)</p>
                        <p className="font-bold text-brand">{formatINR(computed.totalDebitedC)}</p>
                    </div>
                </div>
            </section>

            {/* Step 3: Money Received */}
            <section className="card">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 3: Money Received (D)</h2>
                <MoneyReceivedList
                    entries={record.moneyReceivedEntries}
                    onAdd={handleReceivedAdd}
                    onUpdate={handleReceivedUpdate}
                    onRemove={handleReceivedRemove}
                />
                <div className="mt-3">
                    <label className="label">Old AEPS Settlement (included in D for tally)</label>
                    <NumberInput
                        value={record.oldAeps}
                        onChange={(value) => updateField('oldAeps', value)}
                    />
                </div>
                <div className="mt-4 rounded-lg bg-slate-100 p-3 text-center text-sm">
                    <p className="text-slate-600">Total Money Received (D)</p>
                    <p className="font-bold text-brand">{formatINR(computed.totalMoneyReceivedD)}</p>
                </div>
            </section>

            {/* Step 4: Tally Check */}
            <section className={`card ${computed.tallyMatched ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50'}`}>
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 4: Tally Check (X + D = C)</h2>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                        <p className="text-slate-600">X + D</p>
                        <p className="font-semibold">{formatINR(computed.tallyLeft)}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">C</p>
                        <p className="font-semibold">{formatINR(computed.totalDebitedC)}</p>
                    </div>
                    <div>
                        <p className="text-slate-600">Difference</p>
                        <p className={`font-bold ${computed.tallyMatched ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatINR(computed.tallyDifference)}
                        </p>
                    </div>
                </div>
                {computed.tallyMatched ? (
                    <p className="mt-3 text-center text-emerald-700 font-medium">✓ Tally matches! Proceed to Step 5.</p>
                ) : (
                    <p className="mt-3 text-center text-red-700 font-medium">✗ Tally does not match. Fix before proceeding.</p>
                )}
            </section>

            {/* Steps 5-8: Only visible if tally matches */}
            {computed.tallyMatched && (
                <>
                    {/* Step 5: Recharges Done */}
                    <section className="card">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 5: Recharges Done (E)</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">GR Wallet Recharges (E₁)</label>
                                <NumberInput
                                    value={record.rechargeDoneGr}
                                    onChange={(value) => updateField('rechargeDoneGr', value)}
                                />
                            </div>
                            <div>
                                <label className="label">EG Wallet Recharges (E₂)</label>
                                <NumberInput
                                    value={record.rechargeDoneEg}
                                    onChange={(value) => updateField('rechargeDoneEg', value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-center text-sm">
                            <p className="text-slate-600">Total Recharges (E)</p>
                            <p className="font-bold text-brand">{formatINR(computed.totalRechargesE)}</p>
                        </div>
                    </section>

                    {/* Step 6: Extra Received (F) */}
                    <section className="card">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 6: Extra Received (F)</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="label">GPay Business</label>
                                <NumberInput
                                    value={record.gpayBusiness}
                                    onChange={(value) => updateField('gpayBusiness', value)}
                                />
                            </div>
                            <div>
                                <label className="label">AEPS (Total Transaction Amount)</label>
                                <NumberInput
                                    value={record.aeps}
                                    onChange={(value) => updateField('aeps', value)}
                                />
                            </div>
                            <div>
                                <label className="label">Money Received Before Screenshot (Optional)</label>
                                <NumberInput
                                    value={record.moneyBeforeScreenshot}
                                    onChange={(value) => updateField('moneyBeforeScreenshot', value)}
                                />
                            </div>
                        </div>
                        <div className="mt-4 rounded-lg bg-slate-100 p-3 text-center text-sm">
                            <p className="text-slate-600">Extra Received (F)</p>
                            <p className="font-bold text-brand">{formatINR(computed.extraReceivedF)}</p>
                        </div>
                    </section>

                    {/* Step 7: D_Total */}
                    <section className="card">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 7: D_Total (Auto Calculated)</h2>
                        <p className="text-sm text-slate-600 mb-2">D + F − Old AEPS = D_Total</p>
                        <div className="grid grid-cols-4 gap-2 text-center text-sm">
                            <div>
                                <p className="text-slate-600">D</p>
                                <p className="font-semibold">{formatINR(computed.totalMoneyReceivedD)}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">+ F</p>
                                <p className="font-semibold">{formatINR(computed.extraReceivedF)}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">− Old AEPS</p>
                                <p className="font-semibold">{formatINR(computed.oldAeps)}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">D_Total</p>
                                <p className="font-bold text-brand">{formatINR(computed.dTotal)}</p>
                            </div>
                        </div>
                    </section>

                    {/* Step 8: Final Result */}
                    <section className={`card ${computed.finalAmount >= 0 ? 'border-emerald-400 bg-emerald-50' : 'border-amber-400 bg-amber-50'}`}>
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 8: Final Result</h2>
                        <p className="text-sm text-slate-600 mb-2">G = A + E | Final = G − D_Total</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                            <div>
                                <p className="text-slate-600">A (UPI Sent)</p>
                                <p className="font-semibold">{formatINR(toNumber(record.moneySentA))}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">+ E (Recharges)</p>
                                <p className="font-semibold">{formatINR(computed.totalRechargesE)}</p>
                            </div>
                            <div>
                                <p className="text-slate-600">= G</p>
                                <p className="font-bold">{formatINR(computed.debitRealG)}</p>
                            </div>
                        </div>
                        <div className="rounded-lg bg-white/60 p-4 text-center">
                            <p className="text-slate-600">Final Amount (G − D_Total)</p>
                            <p className={`text-3xl font-bold ${computed.finalAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatINR(computed.finalAmount)}
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-700">{getFinalDirectionText(computed.finalAmount)}</p>
                        </div>
                    </section>

                    {/* Step 9: Sales Report */}
                    <section className="card border-purple-400 bg-purple-50">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">Step 9: Sales Report</h2>
                        <p className="text-sm text-slate-600 mb-3">Sales = Today Expense + Today CIH − Previous Day CIH</p>

                        <div className="space-y-3">
                            <div>
                                <label className="label">Today's Total Expense</label>
                                <NumberInput
                                    value={record.todayExpense}
                                    onChange={(value) => updateField('todayExpense', value)}
                                />
                            </div>
                            <div>
                                <label className="label">Today's Cash In Hand (CIH)</label>
                                <NumberInput
                                    value={record.todayCashInHand}
                                    onChange={(value) => updateField('todayCashInHand', value)}
                                />
                            </div>
                            <div>
                                <label className="label">
                                    Previous Day Cash In Hand
                                    {previousDayCIHFetched && <span className="ml-2 text-xs text-emerald-600">(Auto-fetched)</span>}
                                </label>
                                <NumberInput
                                    value={record.previousDayCashInHand}
                                    onChange={(value) => updateField('previousDayCashInHand', value)}
                                    placeholder="Enter if not available from previous day"
                                />
                            </div>
                        </div>

                        {/* Sales Calculation Display */}
                        <div className="mt-4 rounded-lg bg-white/60 p-4">
                            <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
                                <div>
                                    <p className="text-slate-600">Expense</p>
                                    <p className="font-semibold">{formatINR(todayExpense)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-600">+ Today CIH</p>
                                    <p className="font-semibold">{formatINR(todayCashInHand)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-600">− Prev CIH</p>
                                    <p className="font-semibold">{formatINR(previousDayCashInHand)}</p>
                                </div>
                            </div>
                            <div className="text-center border-t border-purple-200 pt-3">
                                <p className="text-slate-600">Today's Sales</p>
                                <p className="text-3xl font-bold text-purple-700">{formatINR(calculatedSales)}</p>
                            </div>
                        </div>

                        {/* Sales Summary */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="rounded-lg bg-white p-2">
                                <p className="text-slate-500 text-xs">Expense</p>
                                <p className="font-bold text-slate-800">{formatINR(todayExpense)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-2">
                                <p className="text-slate-500 text-xs">Cash In Hand</p>
                                <p className="font-bold text-slate-800">{formatINR(todayCashInHand)}</p>
                            </div>
                            <div className="rounded-lg bg-white p-2">
                                <p className="text-slate-500 text-xs">Sales</p>
                                <p className="font-bold text-purple-700">{formatINR(calculatedSales)}</p>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Edit Warning Modal */}
            {showEditWarning && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-50">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-amber-700">⚠️ Editing Old Record</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            You are editing a record from {currentDate}. Editing old data is not recommended. Are you sure?
                        </p>
                        <div className="mt-4 flex gap-2">
                            <button className="btn-primary flex-1" onClick={handleSave}>
                                Yes, Save Anyway
                            </button>
                            <button className="btn-light flex-1" onClick={() => setShowEditWarning(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="card sticky bottom-4">
                <button
                    type="button"
                    className="btn-primary w-full text-lg"
                    onClick={handleSave}
                    disabled={saving || !computed.tallyMatched}
                >
                    {saving ? 'Saving...' : 'Save Record'}
                </button>
                {!computed.tallyMatched && (
                    <p className="mt-2 text-center text-sm text-red-600">Tally must match before saving.</p>
                )}
                {message && <p className="mt-2 text-center text-sm text-emerald-600">{message}</p>}
            </div>
        </div>
    );
};

export default DailyEntryPage;
