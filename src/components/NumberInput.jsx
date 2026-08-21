const NumberInput = ({ value, onChange, placeholder = '0', className = '', ...props }) => {
    const handleWheel = (event) => {
        event.target.blur();
    };

    const handleFocus = (event) => {
        const current = String(value ?? '');
        if (current === '0') {
            event.target.select();
        }
    };

    const handleChange = (event) => {
        const rawValue = event.target.value;
        if (rawValue === '') {
            onChange('');
            return;
        }

        const normalizedValue = /^0\d+/.test(rawValue) ? rawValue.replace(/^0+/, '') || '0' : rawValue;
        onChange(normalizedValue);
    };

    return (
        <input
            type="number"
            className={`input ${className}`}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onWheel={handleWheel}
            placeholder={placeholder}
            min="0"
            step="1"
            inputMode="decimal"
            {...props}
        />
    );
};

export default NumberInput;
