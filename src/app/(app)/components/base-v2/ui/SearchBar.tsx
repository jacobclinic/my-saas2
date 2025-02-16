import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';

interface SearchBarProps {
    name: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}

export default function SearchBar(props: SearchBarProps) {
    const { name, value, onChange, placeholder = 'Enter your name' } = props;
    return ( 
        <TextFieldLabel className='flex flex-col items-start justify-start'>
        {name}
        <TextFieldInput
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
        </TextFieldLabel>
    )
}