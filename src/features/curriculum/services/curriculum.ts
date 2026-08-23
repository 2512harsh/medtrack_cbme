import type { Subject, Topic, Subtopic, Competency, Department, ProfessionalYear, QuestionTemplate } from "@/types";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return res.json();
}

async function apiSend<T>(url: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message ?? `Failed to save (${url})`);
  }
  return res.json();
}

export async function getStreams() {
  return apiGet<Array<{ id: string; name: string }>>("/api/curriculum/streams");
}

export async function createStream(data: { name: string }) {
  return apiSend<{ id: string; name: string }>("/api/curriculum/streams", "POST", data);
}

export async function getProfessionalYears(streamId?: string) {
  const url = streamId
    ? `/api/curriculum/professional-years?streamId=${encodeURIComponent(streamId)}`
    : "/api/curriculum/professional-years";
  return apiGet<ProfessionalYear[]>(url);
}

export async function createProfessionalYear(data: { streamId: string; name: string }) {
  return apiSend<ProfessionalYear>("/api/curriculum/professional-years", "POST", data);
}

export async function getCurriculumDepartments() {
  return apiGet<Department[]>("/api/curriculum/departments");
}

export async function getSubjects(professionalYearId?: string) {
  const url = professionalYearId
    ? `/api/curriculum/subjects?professionalYearId=${encodeURIComponent(professionalYearId)}`
    : "/api/curriculum/subjects";
  return apiGet<Subject[]>(url);
}

export async function createSubject(data: Omit<Subject, "id">): Promise<Subject> {
  return apiSend<Subject>("/api/curriculum/subjects", "POST", data);
}

export async function updateSubject(id: string, data: Partial<Omit<Subject, "id">>): Promise<Subject> {
  return apiSend<Subject>(`/api/curriculum/subjects/${id}`, "PATCH", data);
}

export async function getTopics(subjectId?: string) {
  const url = subjectId
    ? `/api/curriculum/topics?subjectId=${encodeURIComponent(subjectId)}`
    : "/api/curriculum/topics";
  return apiGet<Topic[]>(url);
}

export async function createTopic(data: Omit<Topic, "id">): Promise<Topic> {
  return apiSend<Topic>("/api/curriculum/topics", "POST", data);
}

export async function updateTopic(id: string, data: Partial<Omit<Topic, "id">>): Promise<Topic> {
  return apiSend<Topic>(`/api/curriculum/topics/${id}`, "PATCH", data);
}

export async function getSubtopics(topicId?: string) {
  const url = topicId
    ? `/api/curriculum/subtopics?topicId=${encodeURIComponent(topicId)}`
    : "/api/curriculum/subtopics";
  return apiGet<Subtopic[]>(url);
}

export async function createSubtopic(data: Omit<Subtopic, "id">): Promise<Subtopic> {
  return apiSend<Subtopic>("/api/curriculum/subtopics", "POST", data);
}

export async function updateSubtopic(id: string, data: Partial<Omit<Subtopic, "id">>): Promise<Subtopic> {
  return apiSend<Subtopic>(`/api/curriculum/subtopics/${id}`, "PATCH", data);
}

export async function getCompetencies(subtopicId?: string) {
  const url = subtopicId
    ? `/api/curriculum/competencies?subtopicId=${encodeURIComponent(subtopicId)}`
    : "/api/curriculum/competencies";
  return apiGet<Competency[]>(url);
}

export async function createCompetency(data: Omit<Competency, "id">): Promise<Competency> {
  return apiSend<Competency>("/api/curriculum/competencies", "POST", data);
}

export async function updateCompetency(id: string, data: Partial<Omit<Competency, "id">>): Promise<Competency> {
  return apiSend<Competency>(`/api/curriculum/competencies/${id}`, "PATCH", data);
}

export interface ImportCompetencyRow {
  subject?: string;
  topic: string;
  subtopic: string;
  code: string;
  title: string;
  level?: string;
  core: boolean;
  sheet?: string;
  rowNumber?: number;
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; sheet: string; message: string }[];
}

export async function importCompetencies(
  defaultSubjectId: string | undefined,
  mode: "insert" | "update" | "upsert",
  rows: ImportCompetencyRow[]
): Promise<ImportResult> {
  return apiSend<ImportResult>("/api/curriculum/import", "POST", { defaultSubjectId, mode, rows });
}

export async function getQuestionTemplates(competencyId?: string) {
  const url = competencyId
    ? `/api/curriculum/templates?competencyId=${encodeURIComponent(competencyId)}`
    : "/api/curriculum/templates";
  return apiGet<QuestionTemplate[]>(url);
}

export async function createQuestionTemplate(data: {
  competencyId: string;
  title: string;
  instructions?: string;
  questions: { questionText: string; required: boolean }[];
}): Promise<QuestionTemplate> {
  return apiSend<QuestionTemplate>("/api/curriculum/templates", "POST", data);
}
