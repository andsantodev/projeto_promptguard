import { describe, expect, it } from "vitest";
import {
  checkRateLimit,
  getSessionToken,
  recordAudit,
  type TimestampStorage,
} from "@/lib/rateLimiter";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN = "test-token";

class MemoryStorage implements TimestampStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("F013 - Session rate limiter", () => {
  it("permite as 3 primeiras auditorias dentro da mesma hora", () => {
    const storage = new MemoryStorage();
    const base = Date.now();
    recordAudit(storage, base, TOKEN);
    recordAudit(storage, base + 1000, TOKEN);
    const status = checkRateLimit(storage, base + 2000, undefined, TOKEN);
    expect(status.allowed).toBe(true);
    expect(status.remainingInHour).toBe(1);
  });

  it("bloqueia a 4a auditoria na mesma hora com reason 'hour'", () => {
    const storage = new MemoryStorage();
    const base = Date.now();
    for (let i = 0; i < 3; i++) {
      recordAudit(storage, base + i * 1000, TOKEN);
    }
    const status = checkRateLimit(storage, base + 5000, undefined, TOKEN);
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe("hour");
    expect(status.remainingInHour).toBe(0);
  });

  it("bloqueia a 11a auditoria no mesmo dia com reason 'day'", () => {
    const storage = new MemoryStorage();
    const base = Date.now();
    for (let i = 0; i < 10; i++) {
      recordAudit(storage, base + i * 2 * HOUR_MS, TOKEN);
    }
    const status = checkRateLimit(
      storage,
      base + 9 * 2 * HOUR_MS + 1000,
      undefined,
      TOKEN
    );
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe("day");
    expect(status.remainingInDay).toBe(0);
  });

  it("ignora timestamps expirados fora da janela de 1h", () => {
    const storage = new MemoryStorage();
    const base = Date.now();
    for (let i = 0; i < 3; i++) {
      recordAudit(storage, base - HOUR_MS * 2 + i * 1000, TOKEN);
    }
    const status = checkRateLimit(storage, base, undefined, TOKEN);
    expect(status.allowed).toBe(true);
    expect(status.remainingInHour).toBe(3);
  });

  it("retorna cotas cheias para um storage vazio", () => {
    const storage = new MemoryStorage();
    const status = checkRateLimit(storage, Date.now(), undefined, TOKEN);
    expect(status.allowed).toBe(true);
    expect(status.remainingInHour).toBe(3);
    expect(status.remainingInDay).toBe(10);
  });

  it("gera e reutiliza um token de sessao estavel", () => {
    const storage = new MemoryStorage();
    const a = getSessionToken(storage);
    const b = getSessionToken(storage);
    expect(a).toBe(b);
    expect(a).toBeTruthy();
  });

  it("expira a cota diaria apos 24h", () => {
    const storage = new MemoryStorage();
    const base = Date.now();
    for (let i = 0; i < 10; i++) {
      recordAudit(storage, base - DAY_MS - 2 * HOUR_MS + i * 1000, TOKEN);
    }
    const status = checkRateLimit(storage, base, undefined, TOKEN);
    expect(status.allowed).toBe(true);
    expect(status.remainingInDay).toBe(10);
  });
});