import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../src/lib/db";

export const runtime = "nodejs";

function getProvidedToken(req: NextRequest) {
  const header = req.headers.get("x-bootstrap-token");
  if (header) return header;
  const { searchParams } = new URL(req.url);
  return searchParams.get("token") || "";
}

export async function POST(req: NextRequest) {
  const expected = process.env.BOOTSTRAP_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "Missing BOOTSTRAP_TOKEN" },
      { status: 500 },
    );
  }

  const provided = getProvidedToken(req);
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const demoPassword = process.env.DEMO_PASSWORD || "password123";
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    const [admin, staff1, staff2] = await Promise.all([
      db.user.upsert({
        where: { email: "admin@demo.local" },
        create: {
          email: "admin@demo.local",
          name: "Admin",
          role: "ADMIN",
          passwordHash,
        },
        update: {
          name: "Admin",
          role: "ADMIN",
          passwordHash,
        },
      }),
      db.user.upsert({
        where: { email: "staff1@demo.local" },
        create: {
          email: "staff1@demo.local",
          name: "Staff One",
          role: "STAFF",
          passwordHash,
        },
        update: {
          name: "Staff One",
          role: "STAFF",
          passwordHash,
        },
      }),
      db.user.upsert({
        where: { email: "staff2@demo.local" },
        create: {
          email: "staff2@demo.local",
          name: "Staff Two",
          role: "STAFF",
          passwordHash,
        },
        update: {
          name: "Staff Two",
          role: "STAFF",
          passwordHash,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      demoUsers: {
        admin: { email: admin.email, password: demoPassword },
        staff1: { email: staff1.email, password: demoPassword },
        staff2: { email: staff2.email, password: demoPassword },
      },
    });
  } catch (e: any) {
    // Keep response details useful for production debugging (demo project).
    console.error("Bootstrap failed:", e);
    return NextResponse.json(
      {
        error: "Bootstrap failed",
        details: e?.message ?? String(e),
      },
      { status: 500 },
    );
  }
}

