import { 
    Select, 
    SelectTrigger, 
    SelectValue,
    SelectContent,
    SelectLabel,
    SelectGroup,
    SelectItem
} from '~/core/ui/Select';
import { TextFieldLabel } from '~/core/ui/TextField';

interface SimpleOption {
    label: string;
    value: string;
}

interface GroupedOption {
    groupLabel: string;
    subOptions: {
        label: string;
        value: string;
    }[];
}

interface FilterProps {
    name: string;
    placeholder: string;
    isGroupedOption?: boolean;
    options: SimpleOption[] | GroupedOption[];
    width?: string;
}

export default function Filter(props: FilterProps) {
    const { name, placeholder, isGroupedOption, options, width = '' } = props;
    return ( 
        <TextFieldLabel className={`flex flex-col items-start justify-start ${width ? `w-[${width}]` : ""}`}>
            {name}
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
            
                <SelectContent>
                    {isGroupedOption
                        ? (options as GroupedOption[]).map(({ groupLabel, subOptions }) => (
                              <SelectGroup key={groupLabel}>
                                  <SelectLabel>{groupLabel}</SelectLabel>
                                  {subOptions.map(({ label, value }) => (
                                      <SelectItem key={value} value={value}>
                                          {label}
                                      </SelectItem>
                                  ))}
                              </SelectGroup>
                          ))
                        : (options as SimpleOption[]).map(({ label, value }) => (
                              <SelectItem key={value} value={value}>
                                  {label}
                              </SelectItem>
                          ))}
                </SelectContent>
            </Select>
        </TextFieldLabel>
    )
}