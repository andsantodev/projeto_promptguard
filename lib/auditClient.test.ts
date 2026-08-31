import { describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import {
  startAudit,
  pollAudit,
  type AuditProgress,
} from "@/lib/auditClient";
import type { Attack } from "@/lib/types";

const ATK: Attack = {
  id: 3,
  category: "C",
  title: "Role-play",
  description: "Desc",
  payload: "payload",
};

describe("auditClient", () => {
  it("startAudit posta o payload no contrato e retorna auditId", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ auditId: "run-abc" }),
    });

    const auditId = await startAudit("prompt", [ATK]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/audit",
      expect.objectContaining({ method: "POST" })
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      systemPrompt: "prompt",
      attacks: [{ id: 3, title: "Role-play", payload: "payload" }],
    });
    expect(auditId).toBe("run-abc");
  });

  it("startAudit lança erro quando o servidor rejeita (400)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "O system prompt é obrigatório." }),
    });

    await expect(startAudit("  ", [ATK])).rejects.toThrow(
      "O system prompt é obrigatório."
    );
  });

  it("pollAudit reidrata vereditos e para quando todos chegam", async () => {
    const progress: AuditProgress = {
      auditId: "run-abc",
      blocked: false,
      verdicts: [
        { attackId: 3, verdict: "success", severity: "low", mitigation: "fix" },
      ],
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => progress,
    });

    const onProgress = vi.fn();
    await pollAudit("run-abc", [ATK], {
      onProgress,
      intervalMs: 10,
      maxAttempts: 5,
    });

    expect(onProgress).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          attackId: 3,
          title: "Role-play",
          description: "Desc",
          verdict: "success",
        }),
      ],
      true,
      null
    );
  });

  it("pollAudit marca como hint done=true após esgotar tentativas", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        ({ auditId: "run-x", blocked: false, verdicts: [] }) as AuditProgress,
    });

    const onProgress = vi.fn();
    await pollAudit("run-x", [ATK], {
      onProgress,
      intervalMs: 5,
      maxAttempts: 2,
    });

    expect(onProgress).toHaveBeenLastCalledWith([], true, null);
  });
});