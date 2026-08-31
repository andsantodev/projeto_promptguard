import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AttackSelection, MAX_ATTACKS } from "@/components/AttackSelection";
import type { Attack } from "@/lib/types";

const MOCK_ATTACKS: Attack[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  category: `Categoria ${i + 1}`,
  title: `Ataque ${i + 1}`,
  description: `Descricao ${i + 1}`,
  payload: "payload",
}));

describe("F006 - Attack selection UI", () => {
  it("renderiza as 10 opcoes com titulo e descricao visiveis", () => {
    const onToggle = () => undefined;
    render(
      <AttackSelection attacks={MOCK_ATTACKS} selectedIds={[]} onToggle={onToggle} />
    );

    for (const attack of MOCK_ATTACKS) {
      expect(screen.getByText(attack.title)).toBeInTheDocument();
      expect(screen.getByText(attack.description)).toBeInTheDocument();
    }

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(10);
  });

  it("permite selecionar de 1 a 6 e bloqueia o 7o", () => {
    let selected: number[] = [];
    const toggle = (id: number) => {
      selected = selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id];
    };
    const renderSel = () => (
      <AttackSelection attacks={MOCK_ATTACKS} selectedIds={selected} onToggle={toggle} />
    );
    const { rerender } = render(renderSel());

    for (let i = 0; i < MAX_ATTACKS; i++) {
      fireEvent.click(
        screen.getByRole("checkbox", { name: new RegExp(`^Ataque ${i + 1} -`) })
      );
      rerender(renderSel());
    }

    expect(screen.getByText(`6/${MAX_ATTACKS}`)).toBeInTheDocument();

    const seventh = screen.getByRole("checkbox", {
      name: /^Ataque 7 -/,
    });
    expect(seventh).toBeDisabled();

    const unselected = screen.getByRole("checkbox", {
      name: /^Ataque 8 -/,
    });
    fireEvent.click(unselected);
    rerender(renderSel());
    expect(unselected).toBeDisabled();
    expect(screen.getByText(`6/${MAX_ATTACKS}`)).toBeInTheDocument();
  });

  it("aceita desmarcar para liberar vaga", () => {
    let selected = [1, 2, 3, 4, 5, 6];
    const toggle = (id: number) => {
      selected = selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id];
    };
    const renderSel = () => (
      <AttackSelection attacks={MOCK_ATTACKS} selectedIds={selected} onToggle={toggle} />
    );
    const { rerender } = render(renderSel());

    const first = screen.getByRole("checkbox", { name: /^Ataque 1 -/ });
    expect(first).toHaveAttribute("aria-checked", "true");
    fireEvent.click(first);
    rerender(renderSel());

    expect(screen.getByText(`5/${MAX_ATTACKS}`)).toBeInTheDocument();

    const sevent = screen.getByRole("checkbox", { name: /^Ataque 7 -/ });
    expect(sevent).not.toBeDisabled();
    fireEvent.click(sevent);
    rerender(renderSel());

    expect(sevent).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(`6/${MAX_ATTACKS}`)).toBeInTheDocument();
  });
});