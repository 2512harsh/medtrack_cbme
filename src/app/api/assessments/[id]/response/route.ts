import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { studentResponses, studentResponseAnswers } from "@/db/schema";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/assessments/[id]/response">) {
  const { id } = await ctx.params;

  const [response] = await db
    .select()
    .from(studentResponses)
    .where(eq(studentResponses.assessmentId, id))
    .orderBy(desc(studentResponses.submittedAt))
    .limit(1);

  if (!response) {
    return NextResponse.json({ message: "No response found for this assessment" }, { status: 404 });
  }

  const answers = await db
    .select()
    .from(studentResponseAnswers)
    .where(eq(studentResponseAnswers.responseId, response.id));

  return NextResponse.json({
    templateId: response.templateId,
    submittedAt: response.submittedAt,
    answers: answers.map((a) => ({ questionId: a.questionId, answerText: a.answerText })),
  });
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/assessments/[id]/response">) {
  const { id } = await ctx.params;
  const body = await request.json();
  const { questionTemplateId, answers } = body as {
    questionTemplateId?: string;
    answers?: { questionId: string; answerText: string }[];
  };

  if (!questionTemplateId || !Array.isArray(answers)) {
    return NextResponse.json({ message: "questionTemplateId and answers are required" }, { status: 400 });
  }

  const existing = await db.select().from(studentResponses).where(eq(studentResponses.assessmentId, id));
  if (existing.length > 0) {
    await db.delete(studentResponses).where(eq(studentResponses.assessmentId, id));
  }

  const [response] = await db
    .insert(studentResponses)
    .values({ assessmentId: id, templateId: questionTemplateId })
    .returning();

  const insertedAnswers = answers.length
    ? await db
        .insert(studentResponseAnswers)
        .values(answers.map((a) => ({ responseId: response.id, questionId: a.questionId, answerText: a.answerText })))
        .returning()
    : [];

  return NextResponse.json({
    templateId: response.templateId,
    submittedAt: response.submittedAt,
    answers: insertedAnswers.map((a) => ({ questionId: a.questionId, answerText: a.answerText })),
  });
}
