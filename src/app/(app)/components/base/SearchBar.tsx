import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';

interface SearchBarProps {
    name: string;
    plaseholder?: string;
}

export default function SearchBar(props: SearchBarProps) {
    const { name, plaseholder = 'Enter your name' } = props;
    return ( 
        <TextFieldLabel className='flex flex-col items-start justify-start'>
        {name}
        <TextFieldInput
            placeholder={plaseholder}
        />
        </TextFieldLabel>
    )
}