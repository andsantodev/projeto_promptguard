"use client";

export function SystemPromptInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-stack-sm">
      <label
        htmlFor="audit-prompt"
        className="text-sm font-medium text-ink-600"
      >
        System prompt
      </label>
      <textarea
        id="audit-prompt"
        rows={10}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cole aqui o system prompt da sua aplicacao de IA."
        className="min-h-44 w-full resize-y rounded-md border border-line bg-base-900 px-3 py-3 font-mono text-xs leading-relaxed text-ink-600 placeholder:text-ink-500 focus:border-accent-400/50 focus:outline-none focus:ring-2 focus:ring-accent-400/25"
      />
      {value.trim() === "" && (
        <p className="text-xs text-danger-400" role="status">
          Cole o system prompt antes de rodar.
        </p>
      )}
    </div>
  );
}