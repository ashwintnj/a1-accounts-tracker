import { DEFAULT_RECEIVED_LABEL } from '../lib/constants';
import NumberInput from './NumberInput';

const MoneyReceivedList = ({ entries, onAdd, onUpdate, onRemove }) => {
    return (
        <div className="space-y-3">
            {entries.map((entry, index) => (
                <div key={entry.id} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                        <label className="label">Label #{index + 1}</label>
                        <input
                            className="input"
                            value={entry.label}
                            onChange={(event) => onUpdate(entry.id, 'label', event.target.value)}
                            placeholder={DEFAULT_RECEIVED_LABEL}
                        />
                    </div>
                    <div className="col-span-4">
                        <label className="label">Amount</label>
                        <NumberInput
                            value={entry.amount}
                            onChange={(value) => onUpdate(entry.id, 'amount', value)}
                        />
                    </div>
                    <div className="col-span-1 flex items-end">
                        <button type="button" className="btn-light px-2 py-2" onClick={() => onRemove(entry.id)}>
                            ×
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" onClick={onAdd} className="btn-light w-full">
                + Add Money Received Entry
            </button>
        </div>
    );
};

export default MoneyReceivedList;
