"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { AsyncContent } from "@/components/shared/AsyncContent";
import {
  getEvidenceRecords,
  uploadEvidence,
} from "@/features/advanced/services/advanced";
import { getMyCompetencies } from "@/features/student/services/student";
import { toast } from "sonner";
import {
  Upload,
  Paperclip,
  Video,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

type EvidenceRow = {
  id: string;
  competencyCode: string;
  competencyTitle: string;
  fileName: string;
  fileType: string;
  description: string;
  uploadedAt: string;
  status: string;
};

const statusIcon = (status: string) => {
  if (status === "APPROVED") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "REJECTED") return <XCircle className="h-4 w-4 text-red-600" />;
  return <Clock className="h-4 w-4 text-amber-600" />;
};

const fileIcon = (type: string) => {
  if (type === "VIDEO") return <Video className="h-4 w-4 text-primary" />;
  if (type === "IMAGE") return <ImageIcon className="h-4 w-4 text-primary" />;
  return <FileText className="h-4 w-4 text-primary" />;
};

const columns: ColumnDef<AppTableFeatures, EvidenceRow>[] = [
  {
    accessorKey: "competencyCode",
    header: "Competency",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("competencyCode")}</span>
    ),
  },
  {
    accessorKey: "fileName",
    header: "File",
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        {fileIcon(row.getValue("fileType"))}
        {row.getValue("fileName")}
      </span>
    ),
  },
  { accessorKey: "fileType", header: "Type" },
  { accessorKey: "uploadedAt", header: "Uploaded At" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span className="flex items-center gap-2">
          {statusIcon(status)}
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : status === "REJECTED"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {status}
          </span>
        </span>
      );
    },
  },
];

const evidenceColumns: ColumnDef<AppTableFeatures, EvidenceRow>[] = columns;

async function getEvidenceData(): Promise<EvidenceRow[]> {
  const records = await getEvidenceRecords();
  return records.map((r) => ({
    id: r.id,
    competencyCode: r.competencyCode,
    competencyTitle: r.competencyTitle,
    fileName: r.fileName,
    fileType: r.fileType,
    description: r.description,
    uploadedAt: new Date(r.uploadedAt).toLocaleDateString(),
    status: r.status,
  }));
}

export default function EvidenceUploadPage() {
  const [data, setData] = useState<EvidenceRow[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [competencies, setCompetencies] = useState<{ id: string; label: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [form, setForm] = useState({
    competencyId: "",
    description: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [records, comps] = await Promise.all([
        getEvidenceData(),
        getMyCompetencies(),
      ]);
      setData(records);
      setCompetencies(
        comps.map((c) => ({
          id: c.id,
          label: `${c.competency?.competencyCode} - ${c.competency?.competencyTitle}`,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load evidence"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0]?.name ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !form.competencyId) {
      toast.error("Please select a file and competency");
      return;
    }
    setUploading(true);
    try {
      const comp = competencies.find((c) => c.id === form.competencyId);
      const type = selectedFile.split(".").pop()?.toUpperCase();
      const fileType =
        type === "PDF" ? "PDF" : type === "MP4" || type === "MOV" ? "VIDEO" : "IMAGE";
      await uploadEvidence({
        competencyId: form.competencyId,
        competencyCode: comp?.label.split(" - ")[0] ?? "",
        competencyTitle: comp?.label.split(" - ")[1] ?? "",
        fileName: selectedFile,
        fileType,
        description: form.description,
      });
      toast.success("Evidence uploaded for review");
      setSelectedFile(null);
      setForm({ competencyId: "", description: "" });
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload evidence");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Upload"
        description="Submit supplementary evidence for your assigned competencies"
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Competency *</Label>
            <Select
              value={form.competencyId}
              onValueChange={(value) =>
                setForm({ ...form, competencyId: value ?? "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select competency" />
              </SelectTrigger>
              <SelectContent>
                {competencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer bg-muted/50 hover:bg-accent transition-colors">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              {selectedFile ?? "Choose a file (PDF, video, or image)"}
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.mp4,.mov"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <div className="space-y-2">
            <Label htmlFor="ev-desc">Description</Label>
            <textarea
              id="ev-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this evidence (optional)"
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Evidence"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AsyncContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
        emptyTitle="No evidence uploaded"
        emptyDescription="Upload evidence above to support your competency submissions."
        loadingColumns={5}
      >
        {(records) => (
          <DataTable
            columns={evidenceColumns}
            data={records}
            searchPlaceholder="Search evidence..."
          />
        )}
      </AsyncContent>
    </div>
  );
}