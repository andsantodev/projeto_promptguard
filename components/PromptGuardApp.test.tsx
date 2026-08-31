import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PromptGuardApp } from "@/components/PromptGuardApp";

vi.mock("@/lib/attacks", () => ({
  fetchAttacks: vi.fn(),
}));

vi.mock("@/lib/auditClient", () => ({
  startAudit: vi.fn(),
  pollAudit: vi.fn(),
}));

import { fetchAttacks } from "@/lib/attacks";
import { startAudit, pollAudit } from "@/lib/auditClient";
import type { Attack, AuditResult } from "@/lib/types";

const MOCK_ATTACKS: Attack[] = [
  {
    id: 1,
    category: "Categoria",
    title: "Ataque de teste 1",
    description: "Descricao 1",
    payload: "payload",
  },
  {
    id: 2,
    category: "Categoria",
    title: "Ataque de teste 2",
    description: "Descricao 2",
    payload: "payload",
  },
];

async function renderApp() {
  render(<PromptGuardApp />);
  await screen.findByRole("button", { name: /Iniciar auditoria/i });
}

describe("F001 - Walking skeleton", () => {
  beforeEach(() => {
    vi.mocked(startAudit).mockResolvedValue("run-test");
    vi.mocked(pollAudit).mockImplementation(
      async (
        _auditId: string,
        _attacks: Attack[],
        opts: {
          onProgress: (
            results: AuditResult[],
            done: boolean,
            blocked?: string | null
          ) => void;
          intervalMs?: number;
          maxAttempts?: number;
        }
      ) => {
        opts.onProgress(
          MOCK_ATTACKS.map((a) => ({
            attackId: a.id,
            title: a.title,
            description: a.description,
            verdict: "failure" as const,
            mitigation: "",
          })),
          true
        );
      }
    );
    vi.mocked(fetchAttacks).mockResolvedValue(MOCK_ATTACKS);
  });

  it("renderiza a tela inicial sem pantalla em branco", async () => {
    await renderApp();

    const heading = screen.getByRole("heading", {
      name: /Auditoria de seguranca para o seu system prompt/i,
    });
    expect(heading).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Iniciar auditoria" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre a modal ao clicar no botao primario e fecha ao fechar", async () => {
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Iniciar auditoria" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Configurar auditoria/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar auditoria" })
    ).toBeInTheDocument();
  });

  it("roda a auditoria real (mockado) e mostra os resultados", async () => {
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Iniciar auditoria" }));

    fireEvent.change(screen.getByLabelText(/System prompt/i), {
      target: { value: "Voce e um assistente util." },
    });

    const attackButton = screen.getByRole("checkbox", {
      name: /^Ataque de teste 1 - Descricao 1$/,
    });
    fireEvent.click(attackButton);

    const confirm = screen.getByRole("button", { name: "Rodar auditoria" });
    expect(confirm).not.toBeDisabled();
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(startAudit).toHaveBeenCalled();
      expect(pollAudit).toHaveBeenCalled();
    });
    expect(
      screen.getByRole("heading", { name: /Veredito por ataque/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Ataque de teste 1/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nova auditoria" }));
    expect(
      screen.getByRole("button", { name: "Iniciar auditoria" })
    ).toBeInTheDocument();
  });
});