import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { competencyAssignments, faculty, users, competencies } from "@/db/schema";

async function embedAssignments(rows: (typeof competencyAssignments.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const facultyIds = [...new Set(rows.map((r) => r.facultyId))];
  const competencyIds = [...new Set(rows.map((r) => r.competencyId))];

  const facultyRows = await db
    .select()
    .from(faculty)
    .innerJoin(users, eq(faculty.userId, users.id))
    .where(inArray(faculty.id, facultyIds));
  const competencyRows = await db.select().from(competencies).where(inArray(competencies.id, competencyIds));

  const facultyById = new Map(
    facultyRows.map((r) => [
      r.faculty.id,
      {
        id: r.faculty.id,
        userId: r.faculty.userId,
        departmentId: r.faculty.departmentId,
        designation: r.faculty.designation,
        employeeCode: r.faculty.employeeCode,
        specialization: r.faculty.specialization ?? undefined,
        user: {
          id: r.users.id,
          firstName: r.users.firstName,
          lastName: r.users.lastName,
          email: r.users.email,
          role: r.users.role,
          status: r.users.status,
          departmentId: r.users.departmentId ?? undefined,
          createdAt: r.users.createdAt,
          updatedAt: r.users.updatedAt,
        },
      },
    ])
  );
  const competencyById = new Map(competencyRows.map((c) => [c.id, c]));

  return rows.map((r) => ({
    ...r,
    faculty: facultyById.get(r.facultyId),
    competency: competencyById.get(r.competencyId),
  }));
}

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("departmentId");
  const rows = await db.select().from(competencyAssignments);

  let filtered = rows;
  if (departmentId) {
    const deptFaculty = await db.select({ id: faculty.id }).from(faculty).where(eq(faculty.departmentId, departmentId));
    const deptFacultyIds = new Set(deptFaculty.map((f) => f.id));
    filtered = rows.filter((r) => deptFacultyIds.has(r.facultyId));
  }

  return NextResponse.json(await embedAssignments(filtered));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { facultyId, competencyId, batch } = body as { facultyId?: string; competencyId?: string; batch?: string };

  if (!facultyId || !competencyId || !batch) {
    return NextResponse.json({ message: "facultyId, competencyId, and batch are required" }, { status: 400 });
  }

  const [deanUser] = await db.select({ id: users.id }).from(users).where(eq(users.role, "Dean")).limit(1);
  if (!deanUser) {
    return NextResponse.json(
      { message: "No Dean user exists to attribute this assignment to. Run `npm run db:seed`." },
      { status: 500 }
    );
  }

  const [row] = await db
    .insert(competencyAssignments)
    .values({ facultyId, competencyId, batch, assignedBy: deanUser.id })
    .returning();

  const [embedded] = await embedAssignments([row]);
  return NextResponse.json(embedded, { status: 201 });
}
