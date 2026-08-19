import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  institutions,
  departments,
  streams,
  professionalYears,
  subjects,
  topics,
  subtopics,
  competencies,
  users,
  faculty,
} from "./schema";

const TOPIC_DEFS = [
  { subject: "Anatomy", title: "Upper Limb", order: 1 },
  { subject: "Anatomy", title: "Lower Limb", order: 2 },
  { subject: "Anatomy", title: "Head and Neck", order: 3 },
  { subject: "Anatomy", title: "Thorax", order: 4 },
  { subject: "Anatomy", title: "Abdomen", order: 5 },
  { subject: "Anatomy", title: "Pelvis and Perineum", order: 6 },
  { subject: "Anatomy", title: "Brain", order: 7 },
  { subject: "Anatomy", title: "Spinal Cord", order: 8 },
  { subject: "Physiology", title: "General Physiology", order: 1 },
  { subject: "Physiology", title: "Cardiovascular Physiology", order: 2 },
  { subject: "Physiology", title: "Respiratory Physiology", order: 3 },
  { subject: "Physiology", title: "Renal Physiology", order: 4 },
  { subject: "Physiology", title: "Nerve Physiology", order: 5 },
  { subject: "Biochemistry", title: "Biomolecules", order: 1 },
  { subject: "Biochemistry", title: "Enzymology", order: 2 },
  { subject: "Biochemistry", title: "Carbohydrate Metabolism", order: 3 },
  { subject: "Biochemistry", title: "Lipid Metabolism", order: 4 },
  { subject: "Biochemistry", title: "Protein Metabolism", order: 5 },
  { subject: "Biochemistry", title: "Nucleic Acid Metabolism", order: 6 },
  { subject: "Biochemistry", title: "Molecular Biology", order: 7 },
] as const;

const COMPETENCY_DEFS = [
  { topic: "Upper Limb", code: "AN8.1", title: "Upper Limb Overview", description: "Describe the bony framework, joints, and movements of the upper limb", level: "Know", core: true },
  { topic: "Upper Limb", code: "AN8.2", title: "Upper Limb - Bones and Joints", description: "Identify and describe the bones and joints of the upper limb", level: "Know", core: true },
  { topic: "Upper Limb", code: "AN8.3", title: "Upper Limb - Muscles", description: "Describe the muscles of the upper limb and their actions", level: "Know", core: false },
  { topic: "Upper Limb", code: "AN8.4", title: "Upper Limb - Nerves and Vessels", description: "Describe the nerve supply and blood supply of the upper limb", level: "Know", core: true },
  { topic: "Lower Limb", code: "AN9.1", title: "Lower Limb Overview", description: "Describe the bony framework, joints, and movements of the lower limb", level: "Know", core: true },
  { topic: "Lower Limb", code: "AN9.2", title: "Lower Limb - Bones and Joints", description: "Identify and describe the bones and joints of the lower limb", level: "Know", core: true },
  { topic: "Head and Neck", code: "AN10.1", title: "Head and Neck Overview", description: "Describe the structures of the head and neck", level: "Know", core: true },
  { topic: "Head and Neck", code: "AN10.2", title: "Brain and Cranial Nerves", description: "Describe the anatomy of the brain and cranial nerves", level: "Know", core: true },
  { topic: "Thorax", code: "AN11.1", title: "Thorax - Thoracic Wall", description: "Describe the thoracic wall and its contents", level: "Know", core: true },
  { topic: "Thorax", code: "AN11.2", title: "Heart - Anatomy", description: "Describe the anatomy of the heart", level: "Know", core: true },
  { topic: "General Physiology", code: "PY1.1", title: "Cell Physiology", description: "Describe the basic functions of cells", level: "Know", core: true },
  { topic: "General Physiology", code: "PY1.2", title: "Muscle Physiology", description: "Describe the physiology of skeletal, smooth, and cardiac muscle", level: "Know", core: true },
  { topic: "Cardiovascular Physiology", code: "PY2.1", title: "Cardiac Cycle", description: "Describe the cardiac cycle and cardiac output", level: "Know", core: true },
  { topic: "Cardiovascular Physiology", code: "PY2.2", title: "Blood Pressure Regulation", description: "Describe the mechanisms of blood pressure regulation", level: "Know", core: true },
  { topic: "Respiratory Physiology", code: "PY3.1", title: "Respiratory Physiology", description: "Describe the mechanics of breathing and gas exchange", level: "Know", core: true },
  { topic: "Respiratory Physiology", code: "PY3.2", title: "Nerve Physiology", description: "Describe the physiology of nerve impulses and synaptic transmission", level: "Know", core: true },
  { topic: "Biomolecules", code: "BI1.1", title: "Biomolecules", description: "Describe the structure and function of biomolecules", level: "Know", core: true },
  { topic: "Biomolecules", code: "BI1.2", title: "Protein Structure", description: "Describe the levels of protein structure", level: "Know", core: true },
  { topic: "Enzymology", code: "BI2.1", title: "Enzyme Kinetics", description: "Describe enzyme kinetics and enzyme regulation", level: "Know", core: true },
  { topic: "Carbohydrate Metabolism", code: "BI3.1", title: "Glycolysis", description: "Describe the glycolysis pathway", level: "Know", core: true },
  { topic: "Carbohydrate Metabolism", code: "BI3.2", title: "Gluconeogenesis", description: "Describe the gluconeogenesis pathway", level: "Know", core: false },
  { topic: "Lipid Metabolism", code: "BI4.1", title: "Fatty Acid Oxidation", description: "Describe beta-oxidation of fatty acids", level: "Know", core: true },
  { topic: "Protein Metabolism", code: "BI5.1", title: "Amino Acid Metabolism", description: "Describe amino acid metabolism and transamination", level: "Know", core: true },
  { topic: "Nucleic Acid Metabolism", code: "BI6.1", title: "Nucleotide Metabolism", description: "Describe purine and pyrimidine metabolism", level: "Know", core: false },
  { topic: "Molecular Biology", code: "BI7.1", title: "DNA Replication", description: "Describe the process of DNA replication", level: "Know", core: true },
] as const;

const FACULTY_DEFS = [
  { department: "Anatomy", firstName: "Rajesh", lastName: "Kumar", email: "rajesh.kumar@medtrack.edu", designation: "Professor", employeeCode: "EMP001", specialization: "Gross Anatomy" },
  { department: "Anatomy", firstName: "Sunita", lastName: "Devi", email: "sunita.devi@medtrack.edu", designation: "Associate Professor", employeeCode: "EMP002", specialization: "Histology" },
  { department: "Physiology", firstName: "Amit", lastName: "Singh", email: "amit.singh@medtrack.edu", designation: "Assistant Professor", employeeCode: "EMP003", specialization: "Cardiovascular Physiology" },
  { department: "Biochemistry", firstName: "Priya", lastName: "Nair", email: "priya.nair@medtrack.edu", designation: "Lecturer", employeeCode: "EMP004", specialization: "Enzymology" },
] as const;

// No real auth/login is wired to this `users` table yet, so there is no real
// password to hash — this placeholder just satisfies the NOT NULL column.
const PLACEHOLDER_PASSWORD_HASH = "unset";

async function ensureInstitutionAndDepartments(): Promise<Map<string, string>> {
  const existingDepartments = await db.select().from(departments);
  if (existingDepartments.length > 0) {
    return new Map(existingDepartments.map((d) => [d.name, d.id]));
  }

  const [institution] = await db
    .insert(institutions)
    .values({ name: "Demo Medical College", code: "DMC" })
    .returning();

  const departmentRows = await db
    .insert(departments)
    .values([
      { institutionId: institution.id, name: "Anatomy" },
      { institutionId: institution.id, name: "Physiology" },
      { institutionId: institution.id, name: "Biochemistry" },
    ])
    .returning();

  console.log(`Seeded: 1 institution, ${departmentRows.length} departments.`);
  return new Map(departmentRows.map((d) => [d.name, d.id]));
}

async function seedCurriculum(departmentIdByName: Map<string, string>) {
  const existing = await db.select({ id: subjects.id }).from(subjects).limit(1);
  if (existing.length > 0) {
    console.log("Curriculum already seeded — skipping.");
    return;
  }

  const [stream] = await db.insert(streams).values({ name: "MBBS" }).returning();

  const yearRows = await db
    .insert(professionalYears)
    .values([
      { streamId: stream.id, name: "First Professional MBBS", sequence: 1 },
      { streamId: stream.id, name: "Second Professional MBBS", sequence: 2 },
      { streamId: stream.id, name: "Third Professional MBBS", sequence: 3 },
      { streamId: stream.id, name: "Final Professional MBBS", sequence: 4 },
    ])
    .returning();
  const firstYearId = yearRows[0].id;

  const subjectRows = await db
    .insert(subjects)
    .values([
      { professionalYearId: firstYearId, departmentId: departmentIdByName.get("Anatomy")!, name: "Anatomy", code: "AN" },
      { professionalYearId: firstYearId, departmentId: departmentIdByName.get("Physiology")!, name: "Physiology", code: "PY" },
      { professionalYearId: firstYearId, departmentId: departmentIdByName.get("Biochemistry")!, name: "Biochemistry", code: "BI" },
    ])
    .returning();
  const subjectIdByName = new Map(subjectRows.map((s) => [s.name, s.id]));

  const topicRows = await db
    .insert(topics)
    .values(
      TOPIC_DEFS.map((t) => ({
        subjectId: subjectIdByName.get(t.subject)!,
        title: t.title,
        displayOrder: t.order,
      }))
    )
    .returning();
  const topicIdByTitle = new Map(topicRows.map((t) => [t.title, t.id]));

  const subtopicRows = await db
    .insert(subtopics)
    .values(
      topicRows.map((t) => ({
        topicId: t.id,
        title: "General",
        displayOrder: 1,
      }))
    )
    .returning();
  const subtopicIdByTopicId = new Map(subtopicRows.map((s) => [s.topicId, s.id]));

  await db.insert(competencies).values(
    COMPETENCY_DEFS.map((c) => ({
      subtopicId: subtopicIdByTopicId.get(topicIdByTitle.get(c.topic)!)!,
      competencyCode: c.code,
      competencyTitle: c.title,
      competencyDescription: c.description,
      competencyLevel: c.level,
      core: c.core,
      status: "Active",
    }))
  );

  console.log(
    `Seeded: 1 stream, ${yearRows.length} professional years, ${subjectRows.length} subjects, ${topicRows.length} topics, ${subtopicRows.length} subtopics, ${COMPETENCY_DEFS.length} competencies.`
  );
}

async function seedFaculty(departmentIdByName: Map<string, string>) {
  const existing = await db.select({ id: faculty.id }).from(faculty).limit(1);
  if (existing.length > 0) {
    console.log("Faculty already seeded — skipping.");
    return;
  }

  const userRows = await db
    .insert(users)
    .values(
      FACULTY_DEFS.map((f) => ({
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        passwordHash: PLACEHOLDER_PASSWORD_HASH,
        role: "Faculty" as const,
        status: "ACTIVE" as const,
        departmentId: departmentIdByName.get(f.department)!,
      }))
    )
    .returning();

  await db.insert(faculty).values(
    FACULTY_DEFS.map((f, i) => ({
      userId: userRows[i].id,
      departmentId: departmentIdByName.get(f.department)!,
      designation: f.designation,
      employeeCode: f.employeeCode,
      specialization: f.specialization,
    }))
  );

  console.log(`Seeded: ${userRows.length} faculty members.`);
}

async function ensureDefaultDean() {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.role, "Dean")).limit(1);
  if (existing.length > 0) {
    return;
  }
  await db.insert(users).values({
    firstName: "Meera",
    lastName: "Reddy",
    email: "dean@medtrack.edu",
    passwordHash: PLACEHOLDER_PASSWORD_HASH,
    role: "Dean",
    status: "ACTIVE",
  });
  console.log("Seeded: 1 default Dean user (used to attribute new competency assignments).");
}

async function seed() {
  const departmentIdByName = await ensureInstitutionAndDepartments();
  await seedCurriculum(departmentIdByName);
  await seedFaculty(departmentIdByName);
  await ensureDefaultDean();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
