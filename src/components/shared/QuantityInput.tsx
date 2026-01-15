import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  error?: string;
}

export default function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 999,
  label,
  error,
}: QuantityInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-l-lg border border-r-0 transition-colors',
            value <= min
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
          )}
        >
          <Minus className="w-5 h-5" />
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className={cn(
            'w-20 h-12 text-center text-lg font-semibold border-y',
            'focus:outline-none focus:ring-2 focus:ring-gc-red focus:border-transparent',
            error ? 'border-red-500' : 'border-gray-300'
          )}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-r-lg border border-l-0 transition-colors',
            value >= max
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
