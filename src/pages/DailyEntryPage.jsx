import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import NumberInput from '../components/NumberInput';
import ScreenshotScanner from '../components/ScreenshotScanner';
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
    todayExpense: '',
    todayCashInHand: '',
    previousDayCashInHand: '',
    notes: '',
    tallyAdjustment: ''
});

const STEP_TITLES = {
    1: 'Opening Balance',
    2: 'Closing Balance',
    3: 'GPay Sended',
    4: 'GPay Recieved',
    5: 'Tally',
    6: 'Recharge',
    7: 'GPayBusiness & AEPS',
    8: 'Result'
};

const DailyEntryPage = () => {

    const { date: paramDate } = useParams();
    const [searchParams] = useSearchParams();
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
    const [currentStep, setCurrentStep] = useState(1);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'sales' ? 'sales' : 'accounts');

    const isOldDate = currentDate !== todayDateString();
    const isViewMode = searchParams.get('mode') === 'view';

    useEffect(() => {
        const loadRecord = async () => {
            if (!user?.uid) return;
            setLoading(true);
            const data = await getDailyRecord(user.uid, currentDate);
            const prevDayRecord = await getPreviousDayRecord(user.uid, currentDate);

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
            } else {
                setRecord({
                    ...createEmptyRecord(),
                    previousDayCashInHand: prevDayRecord?.todayCashInHand || ''
                });
                setIsEditing(false);
            }

            setPreviousDayCIHFetched(!!prevDayRecord?.todayCashInHand);
            setLoading(false);
        };

        loadRecord();
    }, [currentDate, user?.uid]);

    const computed = calculateDaily(record);
    const isTallyDone = computed.tallyMatched;

    const todayExpense = toNumber(record.todayExpense);
    const todayCashInHand = toNumber(record.todayCashInHand);
    const previousDayCashInHandVal = toNumber(record.previousDayCashInHand);
    const calculatedSales = todayExpense + todayCashInHand - previousDayCashInHandVal;
    const moneySentA = toNumber(record.moneySentA);
    const rechargeGreatB1 = toNumber(record.rechargeDoneGr);
    const rechargeEgB2 = toNumber(record.rechargeDoneEg);
    const gpayBusinessAmount = toNumber(record.gpayBusiness);
    const aepsAmount = toNumber(record.aeps);
    const step7GpayBusinessAndAeps = gpayBusinessAmount + aepsAmount;
    const tab7Total = step7GpayBusinessAndAeps + toNumber(record.moneyBeforeScreenshot);

    const updateField = (field, value) => setRecord((prev) => ({ ...prev, [field]: value }));

    const handleBankUpdate = (id, field, value) => {
        setRecord((prev) => ({
            ...prev,
            banks: prev.banks.map((bank) => (bank.id === id ? { ...bank, [field]: value } : bank))
        }));
    };

    const handleBankAdd = () => {
        setRecord((prev) => ({
            ...prev,
            banks: [...prev.banks, { id: generateId(), name: 'New Bank', opening: '', closing: '' }]
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
        if (isViewMode) {
            return;
        }
        if (!user?.uid) { // Safety check
            setMessage('Error: You must be logged in to save.');
            return;
        }
        if (isOldDate && !showEditWarning) {
            setShowEditWarning(true);
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            await saveDailyRecord(user.uid, currentDate, record, user?.email);
            setMessage('Saved successfully!');
            setShowEditWarning(false);
            setIsEditing(true);
        } catch (saveError) {
            setMessage(`Error: ${saveError.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        setCurrentDate(newDate);
        setCurrentStep(1);
        navigate(`/entry/${newDate}${isViewMode ? '?mode=view' : ''}`, { replace: true });
    };

    const canProceed = () => {
        if (currentStep === 5) return computed.tallyMatched;
        return true;
    };

    const nextStep = () => {
        if (currentStep < 8 && canProceed()) setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    };

    const goToStep = (step) => {
        if (step > 5 && !isTallyDone) return;
        setCurrentStep(step);
    };

    const getStepChipClass = (step) => {
        if (step.id === currentStep) {
            if (step.id === 1) return 'bg-blue-600 text-white';
            if (step.id === 2) return 'bg-indigo-600 text-white';
            if (step.id === 3) return 'bg-red-600 text-white';
            if (step.id === 4) return 'bg-emerald-600 text-white';
            if (step.id === 5) return 'bg-amber-600 text-white';
            if (step.id === 6) return 'bg-purple-600 text-white';
            if (step.id === 7) return 'bg-teal-600 text-white';
            return 'bg-slate-700 text-white';
        }

        if (step.id < currentStep) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (step.id > 5 && !isTallyDone) return 'bg-slate-100 text-slate-400 border-slate-200';
        return 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50';
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
                    <p className="mt-3 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl space-y-4">
            <div className="rounded-2xl bg-gradient-to-r from-brand to-blue-700 p-4 text-white shadow-lg">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Daily Entry</h1>
                        {isViewMode ? (
                            <p className="text-xs text-blue-100">View mode (read-only)</p>
                        ) : isEditing ? (
                            <p className="text-xs text-blue-100">Editing existing record</p>
                        ) : null}
                    </div>
                    <input
                        type="date"
                        value={currentDate}
                        onChange={handleDateChange}
                        className="rounded-xl border-0 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700"
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`rounded-xl py-2.5 text-sm font-bold tracking-tight ${activeTab === 'accounts' ? 'bg-gradient-to-r from-brand to-blue-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                        Tab 1 • Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`rounded-xl py-2.5 text-sm font-bold tracking-tight ${activeTab === 'sales' ? 'bg-gradient-to-r from-brand to-blue-700 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                        Tab 2 • Sales
                    </button>
                </div>
            </div>

            {activeTab === 'accounts' && (
                <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-500">Flow Progress</span>
                            <span className="font-bold text-brand">Step {currentStep} / 8</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full bg-gradient-to-r from-brand to-blue-500" style={{ width: `${(currentStep / 8) * 100}%` }} />
                        </div>
                    </div>

                    <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide">
                        <div className="flex min-w-max gap-2 pb-1">
                            {Object.entries(STEP_TITLES).map(([id, title]) => {
                                const step = { id: Number(id), title };
                                const locked = step.id > 5 && !isTallyDone;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => goToStep(step.id)}
                                        disabled={locked}
                                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${getStepChipClass(step)}`}
                                    >
                                        {step.id}. {step.title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <fieldset disabled={isViewMode} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm disabled:opacity-95">
                        <h2 className="mb-3 text-base font-bold text-slate-900">{STEP_TITLES[currentStep]}</h2>

                        {currentStep === 1 && (
                            <div className="space-y-3">
                                {!isViewMode && (
                                    <ScreenshotScanner
                                        mode="opening"
                                        onApply={(ocrResults) => {
                                            setRecord((prev) => ({
                                                ...prev,
                                                banks: prev.banks.map((bank) => {
                                                    const match = ocrResults.find((r) =>
                                                        bank.name.includes(r.suffix)
                                                    );
                                                    return match ? { ...bank, opening: Math.floor(match.amount) } : bank;
                                                })
                                            }));
                                        }}
                                    />
                                )}
                                {record.banks.map((bank) => (
                                    <div key={bank.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <input
                                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                value={bank.name}
                                                onChange={(event) => handleBankUpdate(bank.id, 'name', event.target.value)}
                                                placeholder="Bank name"
                                            />
                                            <button onClick={() => handleBankRemove(bank.id)} className="rounded-lg bg-red-100 px-3 py-2 text-red-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>

                                            </button>
                                        </div>
                                        <NumberInput value={bank.opening} onChange={(value) => handleBankUpdate(bank.id, 'opening', value)} placeholder="Opening Balance" />
                                    </div>
                                ))}
                                <button onClick={handleBankAdd} className="w-full rounded-xl border border-dashed border-blue-300 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700">+ Add Account</button>
                                <div className="rounded-xl bg-blue-600 p-3 text-center text-white">
                                    <p className="text-xs text-blue-100">Total Opening</p>
                                    <p className="text-2xl font-bold">{formatINR(computed.openingTotal)}</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-3">
                                {!isViewMode && (
                                    <ScreenshotScanner
                                        mode="closing"
                                        onApply={(ocrResults) => {
                                            setRecord((prev) => ({
                                                ...prev,
                                                banks: prev.banks.map((bank) => {
                                                    const match = ocrResults.find((r) =>
                                                        bank.name.includes(r.suffix)
                                                    );
                                                    return match ? { ...bank, closing: Math.floor(match.amount) } : bank;
                                                })
                                            }));
                                        }}
                                    />
                                )}
                                {record.banks.map((bank) => (
                                    <div key={bank.id} className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                                        <p className="mb-2 text-sm font-semibold text-slate-800">{bank.name}</p>
                                        <p className="mb-2 text-xs text-indigo-700">Opening: {formatINR(toNumber(bank.opening))}</p>
                                        <NumberInput value={bank.closing} onChange={(value) => handleBankUpdate(bank.id, 'closing', value)} placeholder="Closing Balance" />
                                    </div>
                                ))}
                                <div className="rounded-xl bg-indigo-600 p-3 text-center text-white">
                                    <p className="text-xs text-indigo-100">Total Closing</p>
                                    <p className="text-2xl font-bold">{formatINR(computed.closingTotal)}</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-3">
                                <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-red-700">UPI Money Sent (A)</label>
                                    <NumberInput value={record.moneySentA} onChange={(value) => updateField('moneySentA', value)} placeholder="0" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                                        <label className="mb-2 block text-xs font-semibold text-red-700">GR Wallet Add</label>
                                        <NumberInput value={record.rechargeAddGr} onChange={(value) => updateField('rechargeAddGr', value)} placeholder="0" />
                                    </div>
                                    <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                                        <label className="mb-2 block text-xs font-semibold text-red-700">EG Wallet Add</label>
                                        <NumberInput value={record.rechargeAddEg} onChange={(value) => updateField('rechargeAddEg', value)} placeholder="0" />
                                    </div>
                                </div>
                                <div className="rounded-xl bg-red-600 p-3 text-center text-white">
                                    <p className="text-xs text-red-100">Total Debited (C)</p>
                                    <p className="text-2xl font-bold">{formatINR(computed.totalDebitedC)}</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-3">
                                {record.moneyReceivedEntries.map((entry) => (
                                    <div key={entry.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                                        <div className="flex items-end gap-2">
                                            <div className="w-[30%]">
                                                <label className="mb-1 block text-xs text-emerald-600">Name</label>
                                                <input
                                                    value={entry.label}
                                                    onChange={(event) => handleReceivedUpdate(entry.id, 'label', event.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm h-10"
                                                />
                                            </div>
                                            <div className="w-[60%]">
                                                <label className="mb-1 block text-xs text-emerald-600">Amount</label>
                                                <NumberInput value={entry.amount} onChange={(value) => handleReceivedUpdate(entry.id, 'amount', value)} className="w-full h-10" placeholder="0" />
                                            </div>
                                            <button onClick={() => handleReceivedRemove(entry.id)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200" title="Delete">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleReceivedAdd} className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700">+ Add Entry</button>
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-emerald-700">Old AEPS Settlement</label>
                                    <NumberInput value={record.oldAeps} onChange={(value) => updateField('oldAeps', value)} placeholder="0" />
                                </div>
                                <div className="rounded-xl bg-emerald-600 p-3 text-center text-white">
                                    <p className="text-xs text-emerald-100">Total Recieved (D)</p>
                                    <p className="text-2xl font-bold">{formatINR(computed.totalMoneyReceivedD)}</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-3">
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Opening Balance - Closing Balance</span>
                                        <strong>{formatINR(computed.overallBalanceX)}</strong>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Total Gpay Recieved (D)</span>
                                        <div className="flex items-center gap-1"><span className="font-bold text-amber-700">+</span><strong>{formatINR(computed.totalMoneyReceivedD)}</strong></div>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Tally</span>
                                        <div className="flex items-center gap-1"><span className="font-bold text-amber-700">=</span><strong>{formatINR(computed.tallyLeft)}</strong></div>
                                    </div>
                                </div>

                                {/* NEW: Tally Adjustment Box */}
                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-blue-800">Tally Adjustment (To Bypass)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        className="input"
                                        value={record.tallyAdjustment}
                                        onWheel={(e) => e.target.blur()} // Disables mouse scroll changing values
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Automatically slices off any decimal typed
                                            const noDecimals = val.includes('.') ? val.split('.')[0] : val;
                                            updateField('tallyAdjustment', noDecimals);
                                        }}
                                        placeholder="Enter difference (e.g., 10 or -10)"
                                    />
                                    <p className="mt-1 text-xs text-blue-600">Enter a positive or negative amount to offset any mismatch</p>
                                </div>

                                <div className={`rounded-xl p-4 text-center text-white ${computed.tallyMatched ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                    <p className="text-xs opacity-90">Should equal C (Debited)</p>
                                    <p className="text-2xl font-bold">{formatINR(computed.totalDebitedC)}</p>
                                    {computed.tallyMatched ? <p className="mt-1 text-sm font-semibold">[OK] Tally Matched</p> : <p className="mt-1 text-sm font-semibold">[X] Mismatch: {formatINR(computed.tallyDifference)}</p>}
                                </div>
                                {!computed.tallyMatched && <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">Complete tally to unlock step 6, 7 and 8</p>}
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="space-y-3">
                                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-purple-700">Great Recharge Wallet</label>
                                    <NumberInput value={record.rechargeDoneGr} onChange={(value) => updateField('rechargeDoneGr', value)} placeholder="0" />
                                </div>
                                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-purple-700">Eg Payment Recharge</label>
                                    <NumberInput value={record.rechargeDoneEg} onChange={(value) => updateField('rechargeDoneEg', value)} placeholder="0" />
                                </div>
                                <div className="rounded-xl bg-purple-600 p-3 text-center text-white">
                                    <p className="text-xs text-purple-100">Total Recharge (E)</p>
                                    <p className="text-2xl font-bold">{formatINR(computed.totalRechargesE)}</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 7 && (
                            <div className="space-y-3">
                                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-teal-700">GPay Business</label>
                                    <NumberInput value={record.gpayBusiness} onChange={(value) => updateField('gpayBusiness', value)} placeholder="0" />
                                </div>
                                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-teal-700">AEPS</label>
                                    <NumberInput value={record.aeps} onChange={(value) => updateField('aeps', value)} placeholder="0" />
                                </div>
                                <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
                                    <label className="mb-2 block text-sm font-semibold text-teal-700">Money Before Screenshot</label>
                                    <NumberInput value={record.moneyBeforeScreenshot} onChange={(value) => updateField('moneyBeforeScreenshot', value)} placeholder="0" />
                                </div>
                                <div className="rounded-xl bg-teal-600 p-3 text-center text-white">
                                    <p className="text-xs text-teal-100">Total (GPay Business + AEPS + Money Before Screenshot)</p>
                                    <p className="text-2xl font-bold">{formatINR(tab7Total)}</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 8 && (
                            <div className="space-y-3">
                                <div className="space-y-2 text-sm">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <div className="rounded-md bg-white border border-slate-100 px-2 py-2 space-y-1">
                                            <div className="flex items-center justify-between py-0.5">
                                                <p className="text-slate-700">Gpay Money Sent (A)</p>
                                                <p className="font-bold text-slate-900">{formatINR(moneySentA)}</p>
                                            </div>
                                            <div className="flex items-center justify-between py-0.5">
                                                <p className="text-slate-700">Great Recharge (B1)</p>
                                                <p className="font-bold text-slate-900">{formatINR(rechargeGreatB1)}</p>
                                            </div>
                                            <div className="flex items-center justify-between py-0.5">
                                                <p className="text-slate-700">EG Payment (B2)</p>
                                                <p className="font-bold text-slate-900">{formatINR(rechargeEgB2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                            <p className="text-slate-700">Total Debited (A + B1 + B2)</p>
                                            <p className="font-bold text-slate-900">{formatINR(computed.debitRealG)}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-slate-700">Total Gpay Recieved (C)</p>
                                            <p className="font-bold text-slate-900">{formatINR(computed.dTotal)}</p>
                                        </div>
                                        <div className="mt-2 rounded-md bg-slate-100 px-2.5 py-2 text-xs text-slate-600">
                                            <div className="flex items-center justify-between py-0.5">
                                                <p>Gpay Recieved Total</p>
                                                <p className="font-semibold text-slate-700">{formatINR(computed.totalMoneyReceivedD)}</p>
                                            </div>
                                            <div className="flex items-center justify-between py-0.5">
                                                <p>Gpay Business</p>
                                                <p className="font-semibold text-slate-700">{formatINR(gpayBusinessAmount)}</p>
                                            </div>
                                            <div className="flex items-center justify-between py-0.5">
                                                <p>AEPS</p>
                                                <p className="font-semibold text-slate-700">{formatINR(aepsAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`rounded-xl p-5 text-center text-white ${computed.finalAmount >= 0 ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                                    <p className="text-xs opacity-90">Final Amount</p>
                                    <p className="text-3xl font-bold">{formatINR(Math.abs(computed.finalAmount))}</p>
                                    <p className="mt-1 text-sm">{getFinalDirectionText(computed.finalAmount)}</p>
                                </div>
                            </div>
                        )}
                    </fieldset>

                    <div className="flex gap-2">
                        <button onClick={prevStep} disabled={currentStep === 1} className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 font-semibold text-slate-700 disabled:opacity-50">Back</button>
                        {currentStep < 8 ? (
                            <button onClick={nextStep} disabled={!canProceed()} className="flex-1 rounded-xl bg-brand py-2.5 font-semibold text-white disabled:opacity-50">Next</button>
                        ) : (
                            <button onClick={handleSave} disabled={saving || isViewMode} className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Record'}</button>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'sales' && (
                <fieldset disabled={isViewMode} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm disabled:opacity-95">
                    <h2 className="mb-3 text-lg font-bold text-slate-900">Sales</h2>
                    <div className="space-y-3">
                        <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                            <label className="mb-2 block text-sm font-semibold text-red-700">Today's Total Expense</label>
                            <NumberInput value={record.todayExpense} onChange={(value) => updateField('todayExpense', value)} placeholder="0" />
                        </div>
                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                            <label className="mb-2 block text-sm font-semibold text-violet-700">Today's Cash In Hand</label>
                            <NumberInput value={record.todayCashInHand} onChange={(value) => updateField('todayCashInHand', value)} placeholder="0" />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700">Previous Day Cash-in-Hand</label>
                                {previousDayCIHFetched && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Auto</span>}
                            </div>
                            <NumberInput value={record.previousDayCashInHand} onChange={(value) => updateField('previousDayCashInHand', value)} placeholder="0" />
                        </div>

                        <div className="rounded-xl bg-emerald-600 p-5 text-center text-white">
                            <p className="text-xs text-emerald-100">Today's Sales</p>
                            <p className="text-3xl font-bold">{formatINR(calculatedSales)}</p>
                            <div className="mt-2 flex justify-center gap-2 text-xs">
                                <span className="rounded-full bg-white/20 px-2 py-1">Expense: {formatINR(todayExpense)}</span>
                                <span className="rounded-full bg-white/20 px-2 py-1">Cash-in-Hand: {formatINR(todayCashInHand)}</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Notes (Optional)</label>
                            <textarea
                                value={record.notes || ''}
                                onChange={(event) => updateField('notes', event.target.value)}
                                placeholder="Add any notes here..."
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                rows={3}
                            />
                        </div>

                        <button onClick={handleSave} disabled={saving || isViewMode} className="w-full rounded-xl bg-emerald-600 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Record'}</button>
                    </div>
                </fieldset>
            )}

            {message && (
                <div className={`rounded-xl px-3 py-2 text-center text-sm font-semibold ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {message}
                </div>
            )}

            {showEditWarning && !isViewMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
                        <h3 className="text-lg font-bold text-amber-700">Editing Old Record</h3>
                        <p className="mt-2 text-sm text-slate-600">You are editing {currentDate}. Continue?</p>
                        <div className="mt-4 flex gap-2">
                            <button className="btn-primary flex-1" onClick={handleSave}>Yes, Save</button>
                            <button className="btn-light flex-1" onClick={() => setShowEditWarning(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyEntryPage;
