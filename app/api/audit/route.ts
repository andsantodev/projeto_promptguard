import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

const N8N_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ??
  "https://anderson-n8n.duckdns.org/webhook/promptguard/audit";

interface AttackPayload {
  id: number;
  title: string;
  payload: string;
}

export async function POST(request: Request) {
  let body: { systemPrompt?: string; attacks?: AttackPayload[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON inválido." },
      { status: 400 }
    );
  }

  const systemPrompt = (body.systemPrompt ?? "").trim();
  const attacks = Array.isArray(body.attacks) ? body.attacks : [];

  if (!systemPrompt) {
    return NextResponse.json(
      { error: "O system prompt é obrigatório." },
      { status: 400 }
    );
  }
  if (systemPrompt.length > 4000) {
    return NextResponse.json(
      { error: "O system prompt é muito longo (máx. 4000 caracteres)." },
      { status: 400 }
    );
  }
  if (attacks.length === 0) {
    return NextResponse.json(
      { error: "Selecione ao menos 1 ataque." },
      { status: 400 }
    );
  }

  const auditId = `run-${randomUUID()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let n8nRes: Response;
  try {
    n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId, systemPrompt, attacks }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json(
      { error: "Não foi possível alcançar o serviço de auditoria. Tente novamente." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!n8nRes.ok) {
    return NextResponse.json(
      { error: `O serviço de auditoria falhou (HTTP ${n8nRes.status}).` },
      { status: 502 }
    );
  }

  return NextResponse.json({ auditId });
}