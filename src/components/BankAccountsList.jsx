import NumberInput from './NumberInput';

const BankAccountsList = ({ banks, onAdd, onUpdate, onRemove }) => {
    return (
        <div className="space-y-4">
            {banks.map((bank, index) => (
                <div key={bank.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <input
                            className="input flex-1 bg-white font-medium"
                            value={bank.name}
                            onChange={(event) => onUpdate(bank.id, 'name', event.target.value)}
                            placeholder={`Bank ${index + 1}`}
                        />
                        <button type="button" className="ml-2 btn-light px-2 py-1 text-red-600" onClick={() => onRemove(bank.id)}>
                            Remove
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Opening Balance</label>
                            <NumberInput
                                value={bank.opening}
                                onChange={(value) => onUpdate(bank.id, 'opening', value)}
                            />
                        </div>
                        <div>
                            <label className="label">Closing Balance</label>
                            <NumberInput
                                value={bank.closing}
                                onChange={(value) => onUpdate(bank.id, 'closing', value)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" onClick={onAdd} className="btn-light w-full">
                + Add Bank Account
            </button>
        </div>
    );
};

export default BankAccountsList;
