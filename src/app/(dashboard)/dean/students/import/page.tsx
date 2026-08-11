"use client";

import React, { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUploader } from "@/components/shared/FileUploader";
import { OptionGroup } from "@/components/shared/OptionGroup";
import { Accordion } from "@/components/shared/Accordion";
import { Download, FileText, History, HelpCircle, Upload, Trash2, Loader2, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5;

type ImportStage = "idle" | "uploading" | "parsing" | "validating" | "ready" | "importing" | "success" | "partial" | "failed";

const recentImports = [
  { id: "1", date: "Aug 5, 2026", user: "Prof. Meera Reddy", file: "mbbs2025_students.xlsx", records: 148, status: "Success", duration: "2m 04s", result: "148 created" },
  { id: "2", date: "Jul 28, 2026", user: "Dr. Rajesh Kumar", file: "bds_batch_update.csv", records: 63, status: "Partial", duration: "1m 12s", result: "61 created · 2 errors" },
  { id: "3", date: "Jul 10, 2026", user: "Prof. Meera Reddy", file: "py2_students.xlsx", records: 0, status: "Failed", duration: "41s", result: "Validation failed" },
];

const validationSummary = {
  rows: 148,
  duplicates: 1,
  warnings: 3,
  errors: 0,
};

const TEMPLATE_CSV = [
  "Student Name,Roll Number,Batch,Email",
  "Aarav Patel,MBBS2024-001,MBBS-2024,aarav.patel@example.edu",
  "Priya Sharma,MBBS2024-002,MBBS-2024,priya.sharma@example.edu",
].join("\n");

const SAMPLE_CSV = [
  "Student Name,Roll Number,Batch,Email",
  "Rohan Verma,MBBS2024-003,MBBS-2024,rohan.verma@example.edu",
  "Sneha Reddy,MBBS2024-004,MBBS-2024,sneha.reddy@example.edu",
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

export default function StudentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<ImportStage>("idle");
  const [batch, setBatch] = useState("mbbs2025");
  const [importMode, setImportMode] = useState("insert");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const guidelinesRef = useRef<HTMLDivElement>(null);

  const isBusy = stage === "uploading" || stage === "parsing" || stage === "validating" || stage === "importing";
  const canImport = file && !isBusy && stage !== "success";

  const handleFileChange = (selected: File | null) => {
    setUploadError(null);
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
      await delay(100);
      setUploadProgress(i);
    }

    setStage("parsing");
    await delay(1200);

    setStage("validating");
    await delay(900);

    const hasErrors = Math.random() > 0.7;
    if (hasErrors) {
      setStage("failed");
      setImportErrors([
        "Row 15: Missing student roll number",
        "Row 23: Duplicate student detected",
        "Row 42: Invalid batch format",
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
    await delay(1000);

    const partial = Math.random() > 0.85;
    setStage(partial ? "partial" : "success");
  };

  const handleRetry = async () => {
    toast.info("Re-running import...");
    await runImportFlow();
  };

  const handleClear = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setImportErrors([]);
    setStage("idle");
  };

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToGuidelines = () => {
    guidelinesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
            Parsing rows from the file...
          </div>
        );
      case "validating":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Validating data against the schema...
          </div>
        );
      case "ready":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Validation passed. Ready to import {validationSummary.rows} rows.
          </div>
        );
      case "importing":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Importing records into the student registry...
          </div>
        );
      case "success":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Import completed successfully. All {validationSummary.rows} students were processed.
          </div>
        );
      case "partial":
        return (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Import completed with {validationSummary.warnings} warnings. Review the report for details.
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
        title="Student Import"
        description="Import or update student records from an Excel file"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => downloadCsv("student_import_template.csv", TEMPLATE_CSV)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadCsv("student_import_sample.csv", SAMPLE_CSV)}
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
              <CardTitle className="text-lg font-heading font-semibold">Upload File</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag & drop a spreadsheet containing student data
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
                error={uploadError}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="batch">Batch</Label>
                  <Select value={batch} onValueChange={(v) => setBatch(v ?? "mbbs2025")} disabled={isBusy}>
                    <SelectTrigger className="w-full" id="batch">
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mbbs2025">MBBS 2025</SelectItem>
                      <SelectItem value="mbbs2024">MBBS 2024</SelectItem>
                      <SelectItem value="bds2025">BDS 2025</SelectItem>
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
                  {stage === "uploading" ? "Uploading..." : stage === "parsing" ? "Parsing..." : stage === "validating" ? "Validating..." : stage === "importing" ? "Importing..." : stage === "ready" ? "Import Now" : "Import Students"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear} disabled={isBusy}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card ref={historyRef}>
            <CardHeader>
              <CardTitle className="text-lg font-heading font-semibold">Recent Imports</CardTitle>
              <p className="text-sm text-muted-foreground">
                A history of recent student import operations
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentImports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="font-medium">{item.user}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          {item.file}
                        </span>
                      </TableCell>
                      <TableCell>{item.records}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "Success"
                              ? "success"
                              : item.status === "Partial"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.duration}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => toast.info(item.result)}>
                            View Report
                          </Button>
                          {item.status === "Failed" && (
                            <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={isBusy}>
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                { label: "Rows Detected", value: validationSummary.rows, color: "text-foreground" },
                { label: "Duplicate Records", value: validationSummary.duplicates, color: "text-amber-600" },
                { label: "Warnings", value: validationSummary.warnings, color: "text-amber-600" },
                { label: "Errors", value: validationSummary.errors, color: validationSummary.errors > 0 ? "text-destructive" : "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={cn("text-lg font-semibold", item.color)}>{item.value}</span>
                </div>
              ))}
              <div className="rounded-lg border bg-muted/30 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ready to Import</span>
                  <span className="text-lg font-semibold text-emerald-600">{validationSummary.rows}</span>
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
                      <li>Required columns: Student Name, Roll Number, Batch, Email</li>
                      <li>Roll numbers must be unique within the batch</li>
                      <li>Existing students are updated, new ones are created</li>
                      <li>Maximum file size: 5 MB</li>
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
