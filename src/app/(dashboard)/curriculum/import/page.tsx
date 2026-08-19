"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUploader } from "@/components/shared/FileUploader";
import { OptionGroup } from "@/components/shared/OptionGroup";
import { Accordion } from "@/components/shared/Accordion";
import { Download, Upload, Trash2, Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSubjects,
  importCompetencies,
  type ImportResult,
} from "@/features/curriculum/services/curriculum";
import { parseImportFile, type ParseResult } from "@/features/curriculum/lib/parseImportFile";
import type { Subject } from "@/types";

const MAX_FILE_SIZE = 10;

type Stage = "idle" | "parsing" | "ready" | "importing" | "done" | "failed";

const TEMPLATE_CSV = [
  "Subject,Topic,Subtopic,Competency Number,Competency,Level,Core",
  "Anatomy,Upper Limb,General features of bones & Joints,AN8.1,Upper Limb Overview,SH,Y",
  "Anatomy,Upper Limb,General features of bones & Joints,AN8.2,Upper Limb - Bones and Joints,KH,Y",
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

export default function ExcelImportPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"insert" | "update" | "upsert">("upsert");
  const [stage, setStage] = useState<Stage>("idle");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    getSubjects().then((subs) => {
      setSubjects(subs);
      setSubjectId((prev) => prev || subs[0]?.id || "");
    });
  }, []);

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
      const result = await parseImportFile(selected);
      setParseResult(result);
      setStage(result.rows.length > 0 ? "ready" : "failed");
      if (result.rows.length === 0) {
        setParseError("No usable rows were found in this file. Check that it has Competency Number and Competency columns.");
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
      const result = await importCompetencies(subjectId || undefined, importMode, parseResult.rows);
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

  const defaultSubjectName = subjects.find((s) => s.id === subjectId)?.name;

  const rowsBySubject = useMemo(() => {
    if (!parseResult) return [];
    const counts = new Map<string, number>();
    for (const row of parseResult.rows) {
      const label = row.subject || (defaultSubjectName ? `${defaultSubjectName} (default)` : "(no subject — will error)");
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [parseResult, defaultSubjectName]);

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
            Found {parseResult?.rows.length ?? 0} competency rows across {rowsBySheet.length} sheet
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
        title="Excel Import"
        description="Bulk-load competency data from a spreadsheet straight into the database"
        titleClassName="text-[32px] leading-tight font-heading"
        dataSource="live"
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => downloadCsv("competency_import_template.csv", TEMPLATE_CSV)}
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
                One sheet per topic works best — each sheet name becomes the Topic if there&apos;s no Topic column.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">Default Subject</Label>
                <Select
                  items={subjects.map((s) => ({ value: s.id, label: s.name }))}
                  value={subjectId}
                  onValueChange={(v) => setSubjectId(v ?? "")}
                  disabled={stage === "importing"}
                >
                  <SelectTrigger className="w-full" id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used only for rows that don&apos;t have their own Subject column in the file.
                </p>
              </div>

              <FileUploader
                accept=".xlsx,.xls,.csv"
                maxSizeMB={MAX_FILE_SIZE}
                file={file}
                onFileChange={handleFileChange}
                disabled={stage === "importing"}
                uploading={stage === "parsing"}
              />

              <div className="space-y-1.5">
                <Label htmlFor="import-mode">Import Mode</Label>
                <OptionGroup
                  value={importMode}
                  onValueChange={(v) => setImportMode(v as "insert" | "update" | "upsert")}
                  disabled={stage === "importing"}
                  options={[
                    { value: "insert", label: "Insert only" },
                    { value: "update", label: "Update only" },
                    { value: "upsert", label: "Insert or Update" },
                  ]}
                />
                <p className="text-xs text-muted-foreground">
                  Rows are matched to existing competencies by Competency Number.
                </p>
              </div>

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
                  <p className="pt-1 text-xs font-medium text-muted-foreground">By subject</p>
                  {rowsBySubject.map(([subject, count]) => (
                    <div key={subject} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                      <span className="text-sm text-muted-foreground truncate">{subject}</span>
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
                    <li>Required columns: Topic, Subtopic, Competency Number, Competency</li>
                    <li>Optional columns: Subject, Level (K/KH/SH/P), Core (Y/N)</li>
                    <li>If a row has no Subject column, the Default Subject selected above is used instead</li>
                    <li>Subject names must match an existing subject exactly — new subjects aren&apos;t created automatically (they need a professional year and department first)</li>
                    <li>Multiple sheets are supported — each sheet is treated as a Topic if there&apos;s no Topic column</li>
                    <li>Competency Numbers must be unique — matching rows update the existing competency instead of duplicating it</li>
                    <li>New Topics and Subtopics are created automatically under the resolved Subject</li>
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
