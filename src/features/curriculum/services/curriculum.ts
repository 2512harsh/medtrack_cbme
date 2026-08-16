import { mockStreams, mockProfessionalYears, mockSubjects, mockTopics, mockCompetencies, mockQuestionTemplates } from "../mock/curriculum";
import type { Subject, Topic, Competency } from "@/types";

export async function getStreams() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockStreams;
}

export async function createStream(data: { name: string }) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const stream = {
    id: `stream-${Date.now()}`,
    name: data.name,
  };
  mockStreams.push(stream);
  return stream;
}

export async function getProfessionalYears(streamId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (streamId) {
    return mockProfessionalYears.filter((py) => py.streamId === streamId);
  }
  return mockProfessionalYears;
}

export async function getSubjects(professionalYearId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (professionalYearId) {
    return mockSubjects.filter((s) => s.professionalYearId === professionalYearId);
  }
  return mockSubjects;
}

export async function createSubject(data: Omit<Subject, "id">): Promise<Subject> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const subject: Subject = {
    ...data,
    id: `sub-${Date.now()}`,
  };
  mockSubjects.push(subject);
  return subject;
}

export async function updateSubject(id: string, data: Partial<Omit<Subject, "id">>): Promise<Subject> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockSubjects.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error("Subject not found");
  }
  mockSubjects[index] = { ...mockSubjects[index], ...data };
  return mockSubjects[index];
}

export async function getTopics(subjectId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (subjectId) {
    return mockTopics.filter((t) => t.subjectId === subjectId);
  }
  return mockTopics;
}

export async function createTopic(data: Omit<Topic, "id">): Promise<Topic> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const topic: Topic = {
    ...data,
    id: `topic-${Date.now()}`,
  };
  mockTopics.push(topic);
  return topic;
}

export async function updateTopic(id: string, data: Partial<Omit<Topic, "id">>): Promise<Topic> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockTopics.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error("Topic not found");
  }
  mockTopics[index] = { ...mockTopics[index], ...data };
  return mockTopics[index];
}

export async function getCompetencies(topicId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (topicId) {
    return mockCompetencies.filter((c) => c.topicId === topicId);
  }
  return mockCompetencies;
}

export async function createCompetency(data: Omit<Competency, "id">): Promise<Competency> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const competency: Competency = {
    ...data,
    id: `comp-${Date.now()}`,
  };
  mockCompetencies.push(competency);
  return competency;
}

export async function updateCompetency(id: string, data: Partial<Omit<Competency, "id">>): Promise<Competency> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = mockCompetencies.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Competency not found");
  }
  mockCompetencies[index] = { ...mockCompetencies[index], ...data };
  return mockCompetencies[index];
}

export async function getQuestionTemplates(competencyId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (competencyId) {
    return mockQuestionTemplates.filter((qt) => qt.competencyId === competencyId);
  }
  return mockQuestionTemplates;
}