import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../../src/lib/auth";
import { db } from "../../../../../src/lib/db";
import { generateEmailDraft } from "../../../../../src/services/ai-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const customerId = body.customerId as string | undefined;
    const purpose = (body.purpose as string | undefined) ?? "followup";
    const tone = (body.tone as string | undefined) ?? "professional";
    const windowDays = Number(body.windowDays ?? 30);
    const mustInclude = Array.isArray(body.mustInclude)
      ? body.mustInclude
      : undefined;

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 },
      );
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (auth.role !== "ADMIN" && customer.ownerId !== auth.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const since = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * Math.max(1, windowDays),
    );
    const activities = await db.activity.findMany({
      where: { customerId, occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      take: 50,
    });

    const draft = await generateEmailDraft({
      customer: {
        name: customer.name,
        email: customer.email,
        company: customer.company,
        status: customer.status,
        notes: customer.notes,
      },
    activities: activities.map((a: { type: string; content: string; occurredAt: Date }) => ({
        type: a.type,
        content: a.content,
        occurredAt: a.occurredAt,
      })),
      purpose,
      tone,
      mustInclude,
    });

    return NextResponse.json(draft);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to generate email draft" },
      { status: 500 },
    );
  }
}

