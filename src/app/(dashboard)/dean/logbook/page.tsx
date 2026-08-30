"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AsyncContent } from "@/components/shared/AsyncContent";
import { ProgressBar } from "@/components/shared/StatCard";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { getBatches, getDepartments, getLogbook, type Logbook } from "@/features/dean/services/dean";
import { CertificatePanel } from "@/features/dean/components/CertificatePanel";
import type { Batch, Department } from "@/types";
import { CheckCircle2, ChevronRight } from "lucide-react";

const statusTone: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700",
  "Reattempt Scheduled": "bg-amber-100 text-amber-700",
  "Waiting for Student Acknowledgement": "bg-blue-100 text-blue-700",
  Submitted: "bg-blue-100 text-blue-700",
  Draft: "bg-gray-100 text-gray-600",
  "Not Started": "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function LogbookPage() {
  const { user } = useAuth();
  const isDean = user?.role === "Dean";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchId, setBatchId] = useState<string>("");

  const [data, setData] = useState<Logbook | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getBatches().then(setBatches).catch(() => setBatches([]));
    if (isDean) {
      getDepartments().then(setDepartments).catch(() => setDepartments([]));
    }
  }, [isDean]);

  const canLoad = !!batchId && (!isDean || !!departmentId);

  const fetchData = useCallback(async () => {
    if (!canLoad) return;
    setIsLoading(true);
    setError(null);
    try {
      setData(await getLogbook(batchId, isDean ? departmentId : undefined));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load logbook"));
    } finally {
      setIsLoading(false);
    }
  }, [canLoad, batchId, departmentId, isDean]);

  useEffect(() => {
    if (canLoad) fetchData();
    else setData(undefined);
  }, [canLoad, fetchData]);

  const eligibleCount = useMemo(
    () => (data?.students ?? []).filter((s) => s.eligibleForCertificate).length,
    [data]
  );
  const competencyById = useMemo(
    () => new Map((data?.competencies ?? []).map((c) => [c.assignmentId, c])),
    [data]
  );

  // Lazy-mount each student's detail body (and its per-student certificate
  // fetch) only while the row is expanded.
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string, open: boolean) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logbook"
        description="Per-student competency record for a batch — attempts, faculty remarks, and student responses"
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          {isDean && (
            <div className="space-y-1.5">
              <Label htmlFor="lb-dept" className="text-sm text-muted-foreground">
                Department
              </Label>
              <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
                <SelectTrigger id="lb-dept" className="w-64">
                  <SelectValue placeholder="Select a department">
                    {departments.find((d) => d.id === departmentId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="lb-batch" className="text-sm text-muted-foreground">
              Batch
            </Label>
            <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
              <SelectTrigger id="lb-batch" className="w-64">
                <SelectValue placeholder="Select a batch">
                  {batches.find((b) => b.id === batchId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {data && (
            <div className="ml-auto text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{data.department.name}</span> · {data.students.length}{" "}
              student{data.students.length === 1 ? "" : "s"} · {eligibleCount} eligible for Certificate A
            </div>
          )}
        </CardContent>
      </Card>

      {!canLoad ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {isDean
              ? "Pick a department and a batch to view the logbook."
              : "Pick a batch to view the logbook."}
          </CardContent>
        </Card>
      ) : (
        <AsyncContent
          data={data?.students}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyTitle="Nothing to show"
          emptyDescription="No competencies are assigned to this batch under this department yet."
          loadingColumns={3}
        >
          {(studentRows) => (
            <div className="space-y-3">
              {studentRows.map((s) => (
                <details
                  key={s.id}
                  className="group rounded-lg border bg-card"
                  onToggle={(e) => toggleOpen(s.id, (e.currentTarget as HTMLDetailsElement).open)}
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.rollNumber}</span>
                        {s.eligibleForCertificate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Certificate A
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="w-40">
                          <ProgressBar completed={s.completedCount} total={s.totalCount} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {s.completedCount}/{s.totalCount} competencies
                        </span>
                      </div>
                    </div>
                  </summary>

                  {openIds.has(s.id) && (
                  <div className="border-t px-4 py-3">
                    <CertificatePanel
                      batchId={batchId}
                      studentId={s.id}
                      departmentId={isDean ? departmentId : undefined}
                      onChange={fetchData}
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Competency</th>
                            <th className="py-2 pr-3 font-medium">Faculty</th>
                            <th className="py-2 pr-3 font-medium">Status</th>
                            <th className="py-2 pr-3 font-medium">Attempts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.entries.map((e) => {
                            const c = competencyById.get(e.assignmentId);
                            const hasDetail = e.attempts.length > 0 || !!e.response;
                            return (
                              <React.Fragment key={e.assignmentId}>
                                <tr className="border-t align-top">
                                  <td className="py-2 pr-3">
                                    <div className="font-medium">{c?.competencyCode}</div>
                                    <div className="text-xs text-muted-foreground">{c?.competencyTitle}</div>
                                  </td>
                                  <td className="py-2 pr-3 text-muted-foreground">{c?.facultyName || "—"}</td>
                                  <td className="py-2 pr-3">
                                    <StatusBadge status={e.status} />
                                  </td>
                                  <td className="py-2 pr-3 text-muted-foreground">{e.attemptCount}</td>
                                </tr>
                                {hasDetail && (
                                  <tr className="border-t bg-muted/20">
                                    <td colSpan={4} className="px-3 py-3">
                                      {e.attempts.map((a) => (
                                        <div key={a.attemptNumber} className="mb-2 last:mb-0">
                                          <div className="flex flex-wrap items-center gap-2 text-xs">
                                            <span className="font-medium">Attempt {a.attemptNumber}</span>
                                            <span className="text-muted-foreground">·</span>
                                            <span>{a.rating}</span>
                                            <span className="text-muted-foreground">·</span>
                                            <span>{a.decision}</span>
                                            <span className="text-muted-foreground">
                                              · {a.facultyName} ·{" "}
                                              {new Date(a.facultySignedAt).toLocaleDateString()}
                                            </span>
                                            {a.studentAcknowledged && (
                                              <span className="text-emerald-600">· acknowledged</span>
                                            )}
                                          </div>
                                          {a.remarks && (
                                            <p className="mt-0.5 text-sm text-muted-foreground">{a.remarks}</p>
                                          )}
                                        </div>
                                      ))}
                                      {e.response && e.response.answers.length > 0 && (
                                        <div className="mt-2 border-t pt-2">
                                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                                            Student response
                                          </p>
                                          {e.response.answers.map((ans, i) => (
                                            <div key={i} className="mb-1.5 last:mb-0">
                                              <p className="text-xs font-medium">{ans.question}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {ans.answer || "—"}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  )}
                </details>
              ))}
            </div>
          )}
        </AsyncContent>
      )}
    </div>
  );
}
