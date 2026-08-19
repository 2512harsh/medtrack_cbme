import * as XLSX from "xlsx";

export interface ParsedCompetencyRow {
  sheet: string;
  rowNumber: number;
  subject: string;
  topic: string;
  subtopic: string;
  code: string;
  title: string;
  level: string;
  core: boolean;
}

export interface ParseResult {
  rows: ParsedCompetencyRow[];
  sheetErrors: string[];
}

type Field = "subject" | "topic" | "subtopic" | "code" | "title" | "level" | "core";

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
  // (e.g. "Subtopic" before "Topic", "Competency Number" before "Competency").
  claim("subject", (h) => h.includes("subject"));
  claim("subtopic", (h) => h.includes("subtopic") || h.includes("sub topic") || h.includes("sub-topic"));
  claim("code", (h) => h.includes("number") || h === "code");
  claim("level", (h) => h.includes("level"));
  claim("core", (h) => h.includes("core"));
  claim("topic", (h) => h.includes("topic"));
  claim("title", (h) => h.includes("competency") || h.includes("title"));

  return map;
}

function parseCore(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "y" || normalized === "yes" || normalized === "true" || normalized === "1";
}

export async function parseImportFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const rows: ParsedCompetencyRow[] = [];
  const sheetErrors: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as unknown[] | undefined) ?? [];
    const columnMap = resolveColumnMap(headerRow.map((h) => String(h ?? "")));

    if (!columnMap.code || !columnMap.title) {
      sheetErrors.push(
        `Sheet "${sheetName}": couldn't find a "Competency Number" and "Competency" column — this sheet was skipped.`
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

      const code = get("code");
      const title = get("title");
      if (!code && !title) return;

      rows.push({
        sheet: sheetName,
        rowNumber: index + 2,
        subject: get("subject"),
        topic: get("topic") || sheetName,
        subtopic: get("subtopic") || "General",
        code,
        title,
        level: get("level"),
        core: parseCore(get("core")),
      });
    });
  }

  return { rows, sheetErrors };
}
