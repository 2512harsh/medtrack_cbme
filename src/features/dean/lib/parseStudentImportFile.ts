import * as XLSX from "xlsx";

export interface ParsedStudentRow {
  sheet: string;
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber: string;
  registrationNumber: string;
  stream: string;
  professionalYear: string;
  batch: string;
  admissionYear: string;
  password: string;
}

export interface ParseResult {
  rows: ParsedStudentRow[];
  sheetErrors: string[];
}

type Field =
  | "firstName"
  | "lastName"
  | "name"
  | "email"
  | "rollNumber"
  | "registrationNumber"
  | "stream"
  | "professionalYear"
  | "batch"
  | "admissionYear"
  | "password";

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

function resolveColumnMap(headers: string[]): Partial<Record<Field, string>> {
  const used = new Set<string>();
  const map: Partial<Record<Field, string>> = {};

  const claim = (field: Field, test: (h: string) => boolean) => {
    const match = headers.find((h) => !used.has(h) && test(normalize(h)));
    if (match) {
      map[field] = match;
      used.add(match);
    }
  };

  // Order matters: more specific headers are claimed before generic ones
  // (e.g. "Registration Number" before "Roll Number", "First Name" before "Name").
  claim("firstName", (h) => h.includes("first name") || h === "firstname");
  claim("lastName", (h) => h.includes("last name") || h === "lastname");
  claim("name", (h) => h.includes("student name") || h === "name");
  claim("email", (h) => h.includes("email"));
  claim("registrationNumber", (h) => h.includes("registration"));
  claim("rollNumber", (h) => h.includes("roll"));
  claim("professionalYear", (h) => h.includes("professional year") || h.includes("year"));
  claim("stream", (h) => h.includes("stream"));
  claim("batch", (h) => h.includes("batch"));
  claim("admissionYear", (h) => h.includes("admission"));
  claim("password", (h) => h.includes("password"));

  return map;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1).trim() };
}

export async function parseStudentImportFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const rows: ParsedStudentRow[] = [];
  const sheetErrors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as unknown[] | undefined) ?? [];
    const columnMap = resolveColumnMap(headerRow.map((h) => String(h ?? "")));

    const hasName = columnMap.firstName || columnMap.name;
    if (!hasName || !columnMap.email || !columnMap.rollNumber) {
      sheetErrors.push(
        `Sheet "${sheetName}": couldn't find Name, Email, and Roll Number columns — this sheet was skipped.`
      );
      continue;
    }

    const sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    sheetRows.forEach((row, index) => {
      const get = (field: Field) => {
        const key = columnMap[field];
        if (!key) return "";
        return String(row[key] ?? "").trim();
      };

      const rollNumber = get("rollNumber");
      const email = get("email");
      if (!rollNumber && !email) return;

      let firstName = get("firstName");
      let lastName = get("lastName");
      if (!firstName && columnMap.name) {
        const split = splitName(get("name"));
        firstName = split.firstName;
        lastName = lastName || split.lastName;
      }

      rows.push({
        sheet: sheetName,
        rowNumber: index + 2,
        firstName,
        lastName,
        email,
        rollNumber,
        registrationNumber: get("registrationNumber") || rollNumber,
        stream: get("stream"),
        professionalYear: get("professionalYear"),
        batch: get("batch"),
        admissionYear: get("admissionYear"),
        password: get("password"),
      });
    });
  }

  return { rows, sheetErrors };
}
