import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { questionTemplates, questions } from "@/db/schema";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/curriculum/templates/[id]">) {
  const { id } = await ctx.params;
  const [template] = await db.select().from(questionTemplates).where(eq(questionTemplates.id, id));
  if (!template) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  const templateQuestions = await db.select().from(questions).where(eq(questions.templateId, id));

  return NextResponse.json({
    ...template,
    questions: templateQuestions.sort((a, b) => a.displayOrder - b.displayOrder),
  });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/curriculum/templates/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { title, instructions, questions: questionRows } = body as {
    title?: string;
    instructions?: string | null;
    questions?: { id?: string; questionText: string; required: boolean }[];
  };

  const [existing] = await db.select().from(questionTemplates).where(eq(questionTemplates.id, id));
  if (!existing) {
    return NextResponse.json({ message: "Template not found" }, { status: 404 });
  }

  const updates: Partial<typeof questionTemplates.$inferInsert> = {};
  if (title !== undefined) {
    if (!title.trim()) {
      return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });
    }
    updates.title = title.trim();
  }
  if (instructions !== undefined) {
    updates.instructions = instructions?.trim() || null;
  }

  let template = existing;
  if (Object.keys(updates).length > 0) {
    [template] = await db.update(questionTemplates).set(updates).where(eq(questionTemplates.id, id)).returning();
  }

  let resultQuestions: (typeof questions.$inferSelect)[];
  if (questionRows) {
    const cleanRows = questionRows
      .map((q) => ({ ...q, questionText: q.questionText.trim() }))
      .filter((q) => q.questionText);

    if (cleanRows.length === 0) {
      return NextResponse.json({ message: "At least one question is required" }, { status: 400 });
    }

    const currentQuestions = await db.select().from(questions).where(eq(questions.templateId, id));
    const keepIds = new Set(cleanRows.filter((q) => q.id).map((q) => q.id as string));
    const toDeleteIds = currentQuestions.filter((q) => !keepIds.has(q.id)).map((q) => q.id);

    if (toDeleteIds.length > 0) {
      await db.delete(questions).where(inArray(questions.id, toDeleteIds));
    }

    resultQuestions = [];
    for (const [index, q] of cleanRows.entries()) {
      if (q.id) {
        const [updated] = await db
          .update(questions)
          .set({ questionText: q.questionText, required: q.required, displayOrder: index + 1 })
          .where(eq(questions.id, q.id))
          .returning();
        resultQuestions.push(updated);
      } else {
        const [inserted] = await db
          .insert(questions)
          .values({ templateId: id, questionText: q.questionText, required: q.required, displayOrder: index + 1 })
          .returning();
        resultQuestions.push(inserted);
      }
    }
  } else {
    const currentQuestions = await db.select().from(questions).where(eq(questions.templateId, id));
    resultQuestions = currentQuestions.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return NextResponse.json({ ...template, questions: resultQuestions });
}
