import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/core/ui/Select';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectComponentProps {
  className?: string;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void; // Callback for value change
}

export default function SelectComponent({
className = '',
  options,
  placeholder = 'Select an option...',
  label,
  value,
  onChange,
}: SelectComponentProps) {
  return (
    <div className={`relative flex h-full w-full flex-1 items-center justify-center ${className}`}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {label && <SelectLabel>{label}</SelectLabel>}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}