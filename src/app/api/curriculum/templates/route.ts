import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { questionTemplates, questions } from "@/db/schema";

export async function GET(request: NextRequest) {
  const competencyId = request.nextUrl.searchParams.get("competencyId");
  const templates = competencyId
    ? await db.select().from(questionTemplates).where(eq(questionTemplates.competencyId, competencyId))
    : await db.select().from(questionTemplates);

  if (templates.length === 0) {
    return NextResponse.json([]);
  }

  const templateIds = templates.map((t) => t.id);
  const allQuestions = await db.select().from(questions).where(inArray(questions.templateId, templateIds));

  const result = templates.map((t) => ({
    ...t,
    questions: allQuestions
      .filter((q) => q.templateId === t.id)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { competencyId, title, instructions, questions: questionRows } = body as {
    competencyId: string;
    title: string;
    instructions?: string;
    questions: { questionText: string; required: boolean }[];
  };

  if (!competencyId || !title?.trim() || !Array.isArray(questionRows) || questionRows.length === 0) {
    return NextResponse.json(
      { message: "competencyId, title, and at least one question are required" },
      { status: 400 }
    );
  }

  const [template] = await db
    .insert(questionTemplates)
    .values({ competencyId, title: title.trim(), instructions: instructions || null })
    .returning();

  const newQuestions = await db
    .insert(questions)
    .values(
      questionRows.map((q, i) => ({
        templateId: template.id,
        questionText: q.questionText.trim(),
        displayOrder: i + 1,
        required: q.required,
      }))
    )
    .returning();

  return NextResponse.json({ ...template, questions: newQuestions }, { status: 201 });
}
