const NumberInput = ({ value, onChange, placeholder = '0', className = '', ...props }) => {
    const handleWheel = (event) => {
        event.target.blur();
    };

    const handleChange = (event) => {
        onChange(event.target.value);
    };

    return (
        <input
            type="number"
            className={`input ${className}`}
            value={value}
            onChange={handleChange}
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
