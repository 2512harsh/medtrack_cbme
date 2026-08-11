import { mockStreams, mockProfessionalYears, mockSubjects, mockTopics, mockCompetencies, mockQuestionTemplates } from "../mock/curriculum";

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

export async function getTopics(subjectId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (subjectId) {
    return mockTopics.filter((t) => t.subjectId === subjectId);
  }
  return mockTopics;
}

export async function getCompetencies(topicId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (topicId) {
    return mockCompetencies.filter((c) => c.topicId === topicId);
  }
  return mockCompetencies;
}

export async function getQuestionTemplates(competencyId?: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (competencyId) {
    return mockQuestionTemplates.filter((qt) => qt.competencyId === competencyId);
  }
  return mockQuestionTemplates;
}