import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { batches } from "@/db/schema";
import { requireRole, requireInstitution } from "@/lib/api-auth";

// Batches are institution-scoped cohorts ("MBBS 2024"). Every batch a
// Dean/HOD/Faculty account can see or create is theirs — nobody else's
// batches are ever returned. Super Admin can filter across institutions.
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD", "Faculty", "Super Admin"]);
  if (!auth.ok) return auth.response;

  const conditions = [];

  if (auth.user.role === "Super Admin") {
    const institutionId = request.nextUrl.searchParams.get("institutionId");
    if (institutionId) conditions.push(eq(batches.institutionId, institutionId));
  } else {
    const institutionError = requireInstitution(auth.user);
    if (institutionError) return institutionError;
    conditions.push(eq(batches.institutionId, auth.user.institutionId!));
  }

  const streamId = request.nextUrl.searchParams.get("streamId");
  if (streamId) conditions.push(eq(batches.streamId, streamId));

  const rows = await db
    .select()
    .from(batches)
    .where(conditions.length ? and(...conditions) : undefined);
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["Dean", "HOD"]);
  if (!auth.ok) return auth.response;
  const institutionError = requireInstitution(auth.user);
  if (institutionError) return institutionError;

  const body = await request.json();
  const { name, streamId, admissionYear } = body as {
    name?: string;
    streamId?: string;
    admissionYear?: number;
  };

  if (!name || !streamId || !admissionYear) {
    return NextResponse.json({ message: "name, streamId, and admissionYear are required" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: batches.id })
    .from(batches)
    .where(and(eq(batches.institutionId, auth.user.institutionId!), eq(batches.name, name)));
  if (existing) {
    return NextResponse.json({ message: `Batch "${name}" already exists.` }, { status: 409 });
  }

  const [row] = await db
    .insert(batches)
    .values({ institutionId: auth.user.institutionId!, streamId, name, admissionYear })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
