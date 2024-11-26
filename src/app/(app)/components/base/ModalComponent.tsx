'use client';

import { useState } from 'react';
import Button from '~/core/ui/Button';
import Modal from '~/core/ui/Modal';

interface ModalComponentProps {
    children: React.ReactNode;
    modalName: string;
    heading?: string;
    noFooter?: boolean;
    specialFooter?: React.ReactNode | null;
}

export default function ModalComponent(props: ModalComponentProps) {
    const { children, modalName, heading = "", noFooter = false, specialFooter = null } = props;
    const [open, setOpen] = useState(false);
    const toggleModal = () => setOpen(!open);

    return (
        <>
        <Button variant="default" onClick={() => setOpen(true)}>
            {modalName}
        </Button>   
        <Modal heading={heading} isOpen={open} setIsOpen={setOpen}>
            <div className="flex flex-col space-y-4 h-full overflow-y-auto">
                {/* Header         */}

                {/* Body         */}
                <div className='h-full overflow-y-auto'>
                    {children}
                </div>

                {/* Footer         */}
                {!noFooter ? (
                    !specialFooter ? (
                    <div className="flex gap-3 justify-end">
                        <div className="flex justify-end min-w-24">
                            <Button variant="default">Save</Button>
                        </div>
                        <div className="flex justify-end min-w-24">
                            <Button variant="secondary" onClick={toggleModal}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                    ) : (
                    specialFooter
                    )
                ) : null}
            </div>
        </Modal>
        </>
    );
}