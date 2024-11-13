import { TextFieldInput, TextFieldLabel } from '~/core/ui/TextField';

interface SearchBarProps {
    name: string;
}

export default function SearchBar(props: SearchBarProps) {
    const { name } = props;
    return ( 
        <TextFieldLabel className='flex flex-col items-start justify-start'>
        {name}
        <TextFieldInput
            placeholder="Enter your name"
        />
        </TextFieldLabel>
    )
}