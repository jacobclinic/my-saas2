"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "~/app/(app)/lib/utils"

interface MobileTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  className?: string
  forceTouch?: boolean // Force touch handling even for non-disabled elements
}

const MobileTooltip = ({
  children,
  content,
  side = "top",
  sideOffset = 4,
  className,
  forceTouch = false
}: MobileTooltipProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()
  const touchStarted = React.useRef(false)

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
    // Set auto-hide timer for 4 seconds to give more time to read
    timeoutRef.current = setTimeout(() => setIsOpen(false), 4000)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(false)
  }

  const toggleTooltip = () => {
    if (isOpen) {
      hideTooltip()
    } else {
      showTooltip()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    touchStarted.current = true
    toggleTooltip()
  }

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click event if touch was used (avoid double triggering)
    if (touchStarted.current) {
      touchStarted.current = false
      e.preventDefault()
      e.stopPropagation()
      return
    }

    // Only handle click for disabled buttons (forceTouch)
    if (forceTouch) {
      e.preventDefault()
      e.stopPropagation()
      toggleTooltip()
    }
  }

  const handleMouseEnter = () => {
    // Don't interfere if touch was just used
    if (touchStarted.current) return
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    // Don't interfere if touch was just used
    if (touchStarted.current) return
    
    hideTooltip()
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // For disabled buttons (forceTouch = true), use custom tooltip that works with both hover and touch
  if (forceTouch) {
    return (
      <div className="relative inline-block w-full">
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onClick={handleClick}
          className="cursor-pointer w-full"
        >
          {children}
        </div>
        {isOpen && (
          <div
            className={cn(
              "absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 whitespace-nowrap",
              side === "top" && "bottom-full left-1/2 transform -translate-x-1/2",
              side === "bottom" && "top-full left-1/2 transform -translate-x-1/2",
              side === "left" && "right-full top-1/2 transform -translate-y-1/2",
              side === "right" && "left-full top-1/2 transform -translate-y-1/2",
              className
            )}
            style={{
              marginBottom: side === "top" ? sideOffset : undefined,
              marginTop: side === "bottom" ? sideOffset : undefined,
              marginRight: side === "left" ? sideOffset : undefined,
              marginLeft: side === "right" ? sideOffset : undefined,
            }}
          >
            {content}
          </div>
        )}
      </div>
    )
  }

  // For enabled buttons, use regular Radix tooltip for best experience
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className="w-full">
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={sideOffset}
          className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export { MobileTooltip }