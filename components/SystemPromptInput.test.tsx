import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SystemPromptInput } from "@/components/SystemPromptInput";

describe("F005 - System Prompt input UI", () => {
  it("aceita e exibe o texto colado", () => {
    const onChange = vi.fn();
    render(<SystemPromptInput value="" onChange={onChange} />);

    const textarea: HTMLTextAreaElement = screen.getByLabelText(/System prompt/i);
    fireEvent.change(textarea, {
      target: { value: "Voce e um assistente util." },
    });

    expect(onChange).toHaveBeenCalledWith("Voce e um assistente util.");
  });

  it("mostra o valor controlado no textarea", () => {
    render(
      <SystemPromptInput value="Exemplo colado" onChange={() => undefined} />
    );

    const textarea: HTMLTextAreaElement = screen.getByLabelText(/System prompt/i);
    expect(textarea.value).toBe("Exemplo colado");
  });

  it("exibe a mensagem de validacao quando vazio", () => {
    render(<SystemPromptInput value="" onChange={() => undefined} />);

    expect(screen.getByText(/Cole o system prompt antes de rodar/i)).toBeInTheDocument();
  });
});