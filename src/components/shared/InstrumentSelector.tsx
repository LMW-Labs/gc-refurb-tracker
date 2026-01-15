import { Select } from '../ui';
import { INSTRUMENT_DATA, CATEGORIES, BRANDS } from '../../lib/constants';
import type { Category } from '../../types';

interface InstrumentSelectorProps {
  category: Category | '';
  instrumentType: string;
  brand: string;
  onCategoryChange: (category: Category | '') => void;
  onInstrumentTypeChange: (type: string) => void;
  onBrandChange: (brand: string) => void;
  errors?: {
    category?: string;
    instrumentType?: string;
    brand?: string;
  };
}

export default function InstrumentSelector({
  category,
  instrumentType,
  brand,
  onCategoryChange,
  onInstrumentTypeChange,
  onBrandChange,
  errors = {},
}: InstrumentSelectorProps) {
  const categoryOptions = CATEGORIES.map((cat) => ({ value: cat, label: cat }));

  const instrumentOptions = category
    ? INSTRUMENT_DATA[category].map((inst) => ({ value: inst, label: inst }))
    : [];

  const brandOptions = BRANDS.map((b) => ({ value: b, label: b }));

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as Category | '';
    onCategoryChange(newCategory);
    // Reset instrument type when category changes
    onInstrumentTypeChange('');
  };

  return (
    <div className="space-y-4">
      <Select
        id="category"
        label="Category *"
        value={category}
        onChange={handleCategoryChange}
        options={categoryOptions}
        placeholder="Select category..."
        error={errors.category}
      />

      <Select
        id="instrumentType"
        label="Instrument Type *"
        value={instrumentType}
        onChange={(e) => onInstrumentTypeChange(e.target.value)}
        options={instrumentOptions}
        placeholder={category ? 'Select instrument...' : 'Select category first'}
        disabled={!category}
        error={errors.instrumentType}
      />

      <Select
        id="brand"
        label="Brand *"
        value={brand}
        onChange={(e) => onBrandChange(e.target.value)}
        options={brandOptions}
        placeholder="Select brand..."
        error={errors.brand}
      />
    </div>
  );
}
