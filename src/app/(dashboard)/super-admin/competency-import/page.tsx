"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/shared/FileUploader";
import { OptionGroup } from "@/components/shared/OptionGroup";
import { Accordion } from "@/components/shared/Accordion";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ProgressBar } from "@/components/shared/StatCard";
import {
  Download,
  FileText,
  History,
  HelpCircle,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { getCompetencyImportRecords, createCompetencyImport } from "@/features/super-admin/services/superAdmin";
import { ColumnDef } from "@tanstack/react-table";

const MAX_FILE_SIZE = 10;

type ImportRow = {
  id: string;
  fileName: string;
  source: string;
  type: string;
  totalRecords: number;
  imported: number;
  duplicates: number;
  failed: number;
  importedBy: string;
  importedAt: string;
};

type ImportStage = "idle" | "uploading" | "parsing" | "validating" | "ready" | "importing" | "success" | "partial" | "failed";

const TEMPLATE_CSV = [
  "Competency Code,Competency Title,Subject,Topic",
  "AN8.1,Upper Limb Overview,Anatomy,Upper Limb",
  "AN8.2,Upper Limb - Bones and Joints,Anatomy,Upper Limb",
].join("\n");

const SAMPLE_CSV = [
  "Competency Code,Competency Title,Subject,Topic",
  "AN8.3,Upper Limb - Muscles,Anatomy,Upper Limb",
  "PY1.2,Muscle Physiology,Physiology,Cell Physiology",
  "BI1.1,Biomolecules,Biochemistry,Molecules and Cells",
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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const columns: ColumnDef<AppTableFeatures, ImportRow>[] = [
  {
    accessorKey: "fileName",
    header: "File",
    cell: ({ row }) => (
      <span className="font-medium flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        {row.getValue("fileName")}
      </span>
    ),
  },
  { accessorKey: "source", header: "Source" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "totalRecords", header: "Records" },
  { accessorKey: "imported", header: "Imported" },
  { accessorKey: "duplicates", header: "Duplicates" },
  { accessorKey: "failed", header: "Failed" },
  { accessorKey: "importedBy", header: "Imported By" },
  { accessorKey: "importedAt", header: "Imported At" },
];

async function getImportData(): Promise<ImportRow[]> {
  const records = await getCompetencyImportRecords();
  return records.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    source: r.source,
    type: r.type,
    totalRecords: r.totalRecords,
    imported: r.imported,
    duplicates: r.duplicates,
    failed: r.failed,
    importedBy: r.importedBy,
    importedAt: new Date(r.importedAt).toLocaleDateString(),
  }));
}

export default function CompetencyImportPage() {
  const [data, setData] = useState<ImportRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<ImportStage>("idle");
  const [libraryType, setLibraryType] = useState("professional-year");
  const [importMode, setImportMode] = useState("upsert");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const guidelinesRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await getImportData();
      setData(records);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load import records"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isBusy = stage === "uploading" || stage === "parsing" || stage === "validating" || stage === "importing";
  const canImport = file && !isBusy && stage !== "success";

  const handleFileChange = (selected: File | null) => {
    setImportErrors([]);
    if (!selected) {
      setFile(null);
      setStage("idle");
      return;
    }
    setFile(selected);
    setStage("idle");
    setUploadProgress(0);
  };

  const runImportFlow = async () => {
    setImportErrors([]);
    setStage("uploading");
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await delay(120);
      setUploadProgress(i);
    }

    setStage("parsing");
    await delay(1500);

    setStage("validating");
    await delay(1000);

    const hasErrors = Math.random() > 0.7;
    if (hasErrors) {
      setStage("failed");
      setImportErrors([
        "Row 15: Missing competency code",
        "Row 23: Duplicate competency detected",
        "Row 42: Invalid competency level",
      ]);
      return;
    }

    setStage("ready");
  };

  const handleImport = async () => {
    if (!file) return;
    await runImportFlow();
  };

  const handleExecuteImport = async () => {
    setStage("importing");
    await delay(1200);

    try {
      if (file) {
        await createCompetencyImport({ fileName: file.name, importedBy: "Dr. Anand Sharma" });
        setFile(null);
        await fetchData();
      }
      setStage("success");
    } catch (err) {
      console.error(err);
      setStage("failed");
      setImportErrors(["An unexpected error occurred during import"]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setUploadProgress(0);
    setImportErrors([]);
    setStage("idle");
  };

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToGuidelines = () => {
    guidelinesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const latest = data?.[0];

  const stageBanner = useMemo(() => {
    switch (stage) {
      case "uploading":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Uploading file... {uploadProgress}%
          </div>
        );
      case "parsing":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Parsing competency rows...
          </div>
        );
      case "validating":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Validating against the competency schema...
          </div>
        );
      case "ready":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Validation passed. Ready to import.
          </div>
        );
      case "importing":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Importing records into the competency library...
          </div>
        );
      case "success":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Import completed successfully. The library has been updated.
          </div>
        );
      case "partial":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Import completed with warnings. Review the report for details.
          </div>
        );
      case "failed":
        return (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p className="flex items-center gap-2 font-medium">
              <XCircle className="h-4 w-4" />
              Validation failed. No records were imported.
            </p>
            <ul className="list-inside list-disc space-y-1">
              {importErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  }, [stage, uploadProgress, importErrors]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Library Import"
        description="Import official competency libraries without duplicating existing records"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => downloadCsv("competency_library_template.csv", TEMPLATE_CSV)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadCsv("competency_library_sample.csv", SAMPLE_CSV)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Sample File
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={scrollToHistory}>
              <History className="mr-2 h-4 w-4" />
              Import History
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Import help" onClick={scrollToGuidelines}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold">Import New Library</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag & drop a competency library spreadsheet
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader
                accept=".xlsx,.xls,.csv"
                maxSizeMB={MAX_FILE_SIZE}
                file={file}
                onFileChange={handleFileChange}
                disabled={isBusy}
                uploading={stage === "uploading"}
                uploadProgress={uploadProgress}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="library-type">Library Type</Label>
                  <Select
                    items={{ "professional-year": "Professional Year", subject: "Subject", topic: "Topic" }}
                    value={libraryType}
                    onValueChange={(v) => setLibraryType(v ?? "professional-year")}
                    disabled={isBusy}
                  >
                    <SelectTrigger className="w-full" id="library-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional-year">Professional Year</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="topic">Topic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="import-mode">Import Mode</Label>
                  <OptionGroup
                    value={importMode}
                    onValueChange={setImportMode}
                    disabled={isBusy}
                    options={[
                      { value: "insert", label: "Insert" },
                      { value: "update", label: "Update" },
                      { value: "upsert", label: "Upsert" },
                    ]}
                  />
                </div>
              </div>

              {stageBanner}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={stage === "ready" ? handleExecuteImport : handleImport}
                  disabled={stage === "ready" ? false : (!canImport && stage !== "failed" && stage !== "partial")}
                >
                  {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {stage === "uploading" ? "Uploading..." : stage === "parsing" ? "Parsing..." : stage === "validating" ? "Validating..." : stage === "importing" ? "Importing..." : stage === "ready" ? "Import Now" : "Import"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear} disabled={isBusy}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {latest && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading font-semibold">Latest Import Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{latest.fileName}</span>
                  <span className="text-muted-foreground">
                    {latest.imported} of {latest.totalRecords} imported
                  </span>
                </div>
                <ProgressBar completed={latest.imported} total={latest.totalRecords} />
              </CardContent>
            </Card>
          )}

          <div ref={historyRef}>
            <AsyncContent
              data={data}
              isLoading={isLoading}
              error={error}
              onRetry={fetchData}
              emptyTitle="No imports yet"
              emptyDescription="No competency libraries have been imported."
              loadingColumns={5}
            >
              {(records) => (
                <DataTable
                  columns={columns}
                  data={records}
                  searchPlaceholder="Search imports..."
                />
              )}
            </AsyncContent>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold">Validation Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Results from the last validation run
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[
                { label: "Rows Detected", value: "248", color: "text-foreground" },
                { label: "Duplicate Records", value: "2", color: "text-amber-600" },
                { label: "Warnings", value: "5", color: "text-amber-600" },
                { label: "Errors", value: "0", color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-lg font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
              <div className="rounded-lg border bg-muted/30 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ready to Import</span>
                  <span className="text-lg font-semibold text-emerald-600">248</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div ref={guidelinesRef}>
            <Accordion
              items={[
                {
                  title: "Import Guidelines",
                  content: (
                    <ul className="list-inside list-disc space-y-1.5">
                      <li>File must be in .xlsx, .xls, or .csv format</li>
                      <li>First row must contain column headers</li>
                      <li>Required columns: Competency Code, Competency Title, Subject, Topic</li>
                      <li>Competency codes must be unique</li>
                      <li>Existing competencies are updated, new ones are created</li>
                      <li>Maximum file size: 10 MB</li>
                    </ul>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
