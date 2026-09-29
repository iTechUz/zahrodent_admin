import * as React from "react";
import { IMaskInput } from "react-imask";
import { cn } from "@/shared/lib/utils";

export type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "defaultValue"> & {
  /** E.164 value, e.g. "+998901234567" ("" when empty) */
  value?: string;
  /** Receives the E.164 value without spaces, or "" when only the prefix is left */
  onChange?: (value: string) => void;
};

/**
 * Normalises an inserted chunk (paste / autofill) before it reaches the mask.
 * The mask has a fixed "+998" prefix, so a full number such as "998331112233"
 * must lose its country code, otherwise "998" is taken as local digits
 * (→ +998998331112, a valid-looking wrong number).
 */
export function normalizePhoneChunk(chunk: string): string {
  const digits = chunk.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("998")) return digits.slice(3, 12);
  return chunk;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    return (
      <IMaskInput
        mask="+{998} 00 000 00 00"
        lazy={false}
        eager={true}
        value={value ?? ''}
        unmask={false}
        prepare={(chunk: string, _masked: unknown, flags?: { raw?: boolean }) =>
          // only user input (typing / paste) — not the re-application of an already masked value
          flags?.raw ? normalizePhoneChunk(chunk) : chunk
        }
        onAccept={(_val: string, mask: { unmaskedValue: string }) => {
          if (onChange) {
            const unmasked = mask.unmaskedValue;
            // Only emit value if user typed beyond the prefix (998)
            onChange(unmasked && unmasked.length > 3 ? `+${unmasked}` : '');
          }
        }}
        inputRef={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
