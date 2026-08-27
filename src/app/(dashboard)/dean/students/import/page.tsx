"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptionGroup } from "@/components/shared/OptionGroup";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUploader } from "@/components/shared/FileUploader";
import { Accordion } from "@/components/shared/Accordion";
import { Download, Upload, Trash2, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { getCurriculumDepartments } from "@/features/curriculum/services/curriculum";
import { importStudents, type StudentImportResult } from "@/features/dean/services/dean";
import { parseStudentImportFile, type ParseResult } from "@/features/dean/lib/parseStudentImportFile";
import type { Department } from "@/types";

const MAX_FILE_SIZE = 5;

type Stage = "idle" | "parsing" | "ready" | "importing" | "done" | "failed";
type ImportMode = "insert" | "update" | "upsert";

const TEMPLATE_CSV = [
  "First Name,Last Name,Email,Roll Number,Registration Number,Stream,Professional Year,Batch,Admission Year",
  "Aarav,Patel,aarav.patel@example.edu,MBBS2024-001,REG2024-001,MBBS,1st Year,MBBS 2024,2024",
  "Priya,Sharma,priya.sharma@example.edu,MBBS2024-002,REG2024-002,MBBS,1st Year,MBBS 2024,2024",
].join("\n");

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function StudentImportPage() {
  const { user } = useAuth();
  const lockedDepartmentId = user?.role === "HOD" ? user.departmentId : undefined;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [importMode, setImportMode] = useState<ImportMode>("upsert");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);

  useEffect(() => {
    getCurriculumDepartments().then((depts) => {
      setDepartments(depts);
      setDepartmentId((prev) => prev || lockedDepartmentId || depts[0]?.id || "");
    });
  }, [lockedDepartmentId]);

  const canImport = parseResult && parseResult.rows.length > 0 && stage === "ready";

  const handleFileChange = async (selected: File | null) => {
    setParseError(null);
    setParseResult(null);
    setImportResult(null);
    if (!selected) {
      setFile(null);
      setStage("idle");
      return;
    }
    setFile(selected);
    setStage("parsing");
    try {
      const result = await parseStudentImportFile(selected);
      setParseResult(result);
      setStage(result.rows.length > 0 ? "ready" : "failed");
      if (result.rows.length === 0) {
        setParseError("No usable rows were found in this file. Check that it has Name, Email, and Roll Number columns.");
      }
    } catch (err) {
      setStage("failed");
      setParseError(err instanceof Error ? err.message : "Could not read this file.");
    }
  };

  const handleImport = async () => {
    if (!parseResult) return;
    setStage("importing");
    try {
      const result = await importStudents(lockedDepartmentId ?? departmentId ?? undefined, importMode, parseResult.rows);
      setImportResult(result);
      setStage("done");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Import failed.");
      setStage("failed");
    }
  };

  const handleClear = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setImportResult(null);
    setStage("idle");
  };

  const rowsBySheet = useMemo(() => {
    if (!parseResult) return [];
    const counts = new Map<string, number>();
    for (const row of parseResult.rows) {
      counts.set(row.sheet, (counts.get(row.sheet) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [parseResult]);

  const rowsByBatch = useMemo(() => {
    if (!parseResult) return [];
    const counts = new Map<string, number>();
    for (const row of parseResult.rows) {
      const label = row.batch || "(no batch — will error)";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [parseResult]);

  const stageBanner = useMemo(() => {
    switch (stage) {
      case "parsing":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Reading rows from the file...
          </div>
        );
      case "ready":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Found {parseResult?.rows.length ?? 0} student rows across {rowsBySheet.length} sheet
            {rowsBySheet.length === 1 ? "" : "s"}. Ready to import.
          </div>
        );
      case "importing":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Writing rows to the database...
          </div>
        );
      case "done":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Import finished — {importResult?.created ?? 0} created, {importResult?.updated ?? 0} updated,{" "}
            {importResult?.skipped ?? 0} skipped.
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            {parseError ?? "Something went wrong."}
          </div>
        );
      default:
        return null;
    }
  }, [stage, parseResult, rowsBySheet, importResult, parseError]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Import"
        description="Bulk-load student records from a spreadsheet straight into the database"
        dataSource="live"
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => downloadCsv("student_import_template.csv", TEMPLATE_CSV)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold">Upload File</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag & drop a spreadsheet containing student data
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="department">Default Department</Label>
                  <Select
                    items={departments.map((d) => ({ value: d.id, label: d.name }))}
                    value={lockedDepartmentId ?? departmentId}
                    onValueChange={(v) => setDepartmentId(v ?? "")}
                    disabled={stage === "importing" || !!lockedDepartmentId}
                  >
                    <SelectTrigger className="w-full" id="department">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lockedDepartmentId ? (
                    <p className="text-xs text-muted-foreground">Locked to your own department.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Used only for rows that don&apos;t have their own Department column in the file.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="import-mode">Import Mode</Label>
                  <OptionGroup
                    value={importMode}
                    onValueChange={(v) => setImportMode(v as ImportMode)}
                    disabled={stage === "importing"}
                    options={[
                      { value: "insert", label: "Insert" },
                      { value: "update", label: "Update" },
                      { value: "upsert", label: "Upsert" },
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Rows are matched to existing students by Registration Number.
                  </p>
                </div>
              </div>

              <FileUploader
                accept=".xlsx,.xls,.csv"
                maxSizeMB={MAX_FILE_SIZE}
                file={file}
                onFileChange={handleFileChange}
                disabled={stage === "importing"}
                uploading={stage === "parsing"}
              />

              {stageBanner}

              <div className="flex items-center gap-2">
                <Button type="button" onClick={handleImport} disabled={!canImport}>
                  {stage === "importing" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {stage === "importing" ? "Importing..." : "Import Now"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear} disabled={stage === "importing"}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {importResult && importResult.credentials.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-heading font-semibold">New Login Credentials</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadCsv(
                      "student_import_credentials.csv",
                      ["Email,Password", ...importResult.credentials.map((c) => `${c.email},${c.password}`)].join("\n")
                    )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="mb-3 text-xs text-muted-foreground">
                  Share these with the students — passwords are only shown once and can&apos;t be recovered later.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.credentials.map((c) => (
                      <TableRow key={c.email}>
                        <TableCell>{c.email}</TableCell>
                        <TableCell className="font-mono text-xs">{c.password}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {importResult && importResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading font-semibold">Rows that couldn&apos;t be imported</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sheet</TableHead>
                      <TableHead>Row</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{e.sheet}</TableCell>
                        <TableCell className="text-muted-foreground">{e.row}</TableCell>
                        <TableCell>{e.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold">
                {importResult ? "Import Summary" : "Preview"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {importResult ? "Results from the last import" : "What will be imported once you click Import Now"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {importResult ? (
                <>
                  {[
                    { label: "Created", value: importResult.created, color: "text-emerald-600" },
                    { label: "Updated", value: importResult.updated, color: "text-foreground" },
                    { label: "Skipped", value: importResult.skipped, color: "text-amber-600" },
                    { label: "Errors", value: importResult.errors.length, color: importResult.errors.length > 0 ? "text-destructive" : "text-emerald-600" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={cn("text-lg font-semibold", item.color)}>{item.value}</span>
                    </div>
                  ))}
                </>
              ) : parseResult && parseResult.rows.length > 0 ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">Rows Detected</span>
                    <span className="text-lg font-semibold">{parseResult.rows.length}</span>
                  </div>
                  <p className="pt-1 text-xs font-medium text-muted-foreground">By batch</p>
                  {rowsByBatch.map(([batch, count]) => (
                    <div key={batch} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground truncate">{batch}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                  <p className="pt-1 text-xs font-medium text-muted-foreground">By sheet</p>
                  {rowsBySheet.map(([sheet, count]) => (
                    <div key={sheet} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground truncate">{sheet}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                  {parseResult.sheetErrors.map((msg, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {msg}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Upload a file to see a preview here.</p>
              )}
            </CardContent>
          </Card>

          <Accordion
            items={[
              {
                title: "Import Guidelines",
                content: (
                  <ul className="list-inside list-disc space-y-1.5">
                    <li>File must be .xlsx, .xls, or .csv</li>
                    <li>First row of each sheet must contain column headers</li>
                    <li>Required columns: Name (or First Name/Last Name), Email, Roll Number</li>
                    <li>Required columns: Stream, Professional Year, Batch — must match existing names exactly</li>
                    <li>Optional columns: Registration Number (defaults to Roll Number), Admission Year (defaults to the batch&apos;s), Department, Password</li>
                    <li>Streams, Professional Years, and Batches aren&apos;t created automatically — add them first under Curriculum</li>
                    <li>If a row has no Password column, a random one is generated and shown after import — download and share it, it can&apos;t be recovered later</li>
                    <li>Rows are matched to existing students by Registration Number — matching rows update the existing student instead of duplicating it</li>
                  </ul>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
