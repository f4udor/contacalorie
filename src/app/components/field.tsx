import type { HTMLAttributes } from "react";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  hint?: string;
  placeholder?: string;
}

/** Campo di testo con etichetta, suggerimento e messaggio d'errore accanto al campo. */
export function TextField({ id, label, value, onChange, error, required, inputMode = "decimal", hint, placeholder }: TextFieldProps) {
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
        {required && <span className="text-bad"> *</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-xl bg-bg px-3 text-[17px] outline-none focus:ring-2 focus:ring-accent ${error ? "ring-2 ring-bad" : ""}`}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
