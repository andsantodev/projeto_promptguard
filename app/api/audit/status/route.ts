import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auditId = searchParams.get("auditId");

  if (!auditId) {
    return NextResponse.json({ error: "auditId é obrigatório." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("promptg_audit_progress")
    .select("attack_id, verdict, severity, mitigation, status, reason")
    .eq("run_id", auditId)
    .order("attack_id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Falha ao ler o progresso da auditoria." },
      { status: 500 }
    );
  }

  const rows = data ?? [];
  const blockedRow = rows.find((r) => r.status === "blocked");

  return NextResponse.json({
    auditId,
    blocked: !!blockedRow,
    reason: blockedRow?.reason ?? null,
    verdicts: rows
      .filter((r) => r.status !== "blocked")
      .map((r) => ({
        attackId: r.attack_id,
        verdict: r.verdict,
        severity: r.severity,
        mitigation: r.mitigation,
      })),
  });
}