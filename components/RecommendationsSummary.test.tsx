import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecommendationsSummary } from "@/components/RecommendationsSummary";
import type { AuditResult } from "@/lib/types";

const makeResult = (overrides: Partial<AuditResult>): AuditResult => ({
  attackId: 1,
  title: "Ataque teste",
  description: "Descricao",
  verdict: "failure",
  severity: "low",
  mitigation: "",
  ...overrides,
});

describe("F011 - Consolidated recommendations block", () => {
  it("renderiza mitigacoes dos ataques que tiveram sucesso", () => {
    const results: AuditResult[] = [
      makeResult({
        attackId: 1,
        title: "Leak de prompt",
        verdict: "success",
        mitigation: "Bloqueie o escape de contexto.",
      }),
      makeResult({
        attackId: 2,
        title: "Role-play",
        verdict: "success",
        mitigation: "Nao aceite mudancas de persona.",
      }),
    ];

    render(<RecommendationsSummary results={results} />);

    expect(screen.getByText("Leak de prompt")).toBeInTheDocument();
    expect(screen.getByText("Role-play")).toBeInTheDocument();
    expect(
      screen.getByText("Bloqueie o escape de contexto.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nao aceite mudancas de persona.")
    ).toBeInTheDocument();
  });

  it("fica oculto quando nenhum ataque teve sucesso", () => {
    const results: AuditResult[] = [
      makeResult({ attackId: 1, verdict: "failure", mitigation: "" }),
      makeResult({ attackId: 2, verdict: "failure", mitigation: "" }),
    ];

    const { container } = render(
      <RecommendationsSummary results={results} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("fica oculto quando ataques bem-sucedidos nao tem mitigacao", () => {
    const results: AuditResult[] = [
      makeResult({ attackId: 1, verdict: "success", mitigation: "" }),
    ];

    const { container } = render(
      <RecommendationsSummary results={results} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza corretamente com um unico ataque com sucesso", () => {
    const results: AuditResult[] = [
      makeResult({
        attackId: 1,
        title: "Unico ataque",
        verdict: "success",
        mitigation: "Mitigacao unica.",
      }),
    ];

    render(<RecommendationsSummary results={results} />);

    expect(screen.getByText("Unico ataque")).toBeInTheDocument();
    expect(screen.getByText("Mitigacao unica.")).toBeInTheDocument();
  });
});