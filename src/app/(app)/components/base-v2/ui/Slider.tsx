import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../../lib/utils";

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  className,
  disabled = false,
}) => {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={disabled ? undefined : ([val]) => onChange(val)}
      disabled={disabled}
    >
      <SliderPrimitive.Track className="relative h-2 w-full rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className={cn(
          "block h-5 w-5 rounded-full border-2 border-primary bg-background shadow transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "cursor-not-allowed"
        )}
        aria-label="Slider Thumb"
      />
    </SliderPrimitive.Root>
  );
};