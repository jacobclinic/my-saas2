import React, { useState } from 'react'
import BaseDialog from '../base-v2/BaseDialog';
import { RadioGroup, RadioGroupItem, RadioGroupItemLabel } from '~/core/ui/RadioGroup';
import { SessionUpdateOption } from '~/lib/enums';


type SessionEditConfirmationDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (updateOption: SessionUpdateOption) => void;
}


const SessionEditConfirmationDialog: React.FC<SessionEditConfirmationDialogProps> = (props) => {
    const [updateOption, setUpdateOption] = useState<SessionUpdateOption>(SessionUpdateOption.ALL_OCCURRENCES);

    return (
        <BaseDialog
            open={props.open}
            onClose={props.onClose}
            title="Are you sure you want to edit this session?"
            description="This action cannot be undone."
            onConfirm={() => {
                props.onConfirm(updateOption);
                props.onClose();
            }}
            confirmButtonText="Confirm"
            showCloseButton={false}
        >
            <RadioGroup
                value={updateOption}
                onValueChange={(value) => setUpdateOption(value as SessionUpdateOption)}
                className="space-y-2"
            >
                <RadioGroupItemLabel >
                    <div className="flex items-center space-x-3">
                        <RadioGroupItem value="all" id="update-all" />
                        <div>
                            <div className="font-medium text-gray-900">Update all upcoming occurrences</div>
                            <div className="text-sm text-gray-500">This will update all future sessions with the same pattern</div>
                        </div>
                    </div>
                </RadioGroupItemLabel>

                <RadioGroupItemLabel>
                    <div className="flex items-center space-x-3">
                        <RadioGroupItem value="next" id="update-next" />
                        <div>
                            <div className="font-medium text-gray-900">Update next occurrence only</div>
                            <div className="text-sm text-gray-500">This will only update the current session</div>
                        </div>
                    </div>
                </RadioGroupItemLabel>
            </RadioGroup>
        </BaseDialog>
    )
}

export default SessionEditConfirmationDialog