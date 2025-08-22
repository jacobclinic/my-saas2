'use client';

import React, { useState } from 'react';
import Button from '~/core/ui/Button';
import { Check, Link, Loader2 } from 'lucide-react';
import { createShortUrlAction } from '~/lib/short-links/server-actions-v2';
import { copyToClipboard } from '~/lib/utils/clipboard';
import { toast } from 'sonner';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '~/app/(app)/components/base-v2/ui/tooltip';

interface CopyLinkButtonProps {
    url: string;
    buttonText?: string;
    className?: string;
    tooltipText?: string;
    variant?: 'default' | 'ghost' | 'outline';
    shouldGenerateLink?: boolean;
    buttonIcon?: React.ReactNode;
}

const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({
    url,
    buttonText = 'Copy Link',
    className = '',
    tooltipText = 'Copy link to clipboard',
    variant = 'ghost',
    shouldGenerateLink = false,
    buttonIcon = <Link className="h-4 w-4 mr-2" />
}) => {
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleCopyLink = async () => {
        try {
            if (shouldGenerateLink) {
                setIsGeneratingLink(true);

                const data = await createShortUrlAction({
                    originalUrl: url
                });

                if (data.success && data.shortUrl) {
                    await copyToClipboard(data.shortUrl);
                    setLinkCopied(true);
                    setTimeout(() => {
                        setLinkCopied(false);
                    }, 2000);
                }
            } else {
                await copyToClipboard(url);
                setLinkCopied(true);
                setTimeout(() => {
                    setLinkCopied(false);
                }, 2000);
            }

        } catch (error) {
            toast.error('Failed to generate short link');
        } finally {
            setIsGeneratingLink(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        className={`w-full text-neutral-700 hover:bg-neutral-100 border border-neutral-200 ${className}`}
                        onClick={handleCopyLink}
                        disabled={isGeneratingLink}
                    >
                        {isGeneratingLink ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : linkCopied ? (
                            <Check className="h-4 w-4 mr-2" />
                        ) : (
                            buttonIcon
                        )}
                        {isGeneratingLink
                            ? 'Generating...'
                            : linkCopied
                                ? 'Copied!'
                                : buttonText
                        }
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default CopyLinkButton;