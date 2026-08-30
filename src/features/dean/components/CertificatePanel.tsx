"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Download, Loader2, PenLine, Undo2 } from "lucide-react";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import {
  getLogbookCertificate,
  signLogbookCertificate,
  revokeLogbookCertificateSignoff,
  type LogbookCertificate,
  type SignoffRole,
} from "@/features/dean/services/dean";

const SLOT_LABEL: Record<SignoffRole, string> = {
  "Faculty-in-charge": "Faculty-in-charge",
  HOD: "Head of the Department",
  Dean: "Principal / Dean",
};

function canViewerSign(role: SignoffRole, viewerRole?: string) {
  if (role === "Dean") return viewerRole === "Dean";
  if (role === "HOD") return viewerRole === "HOD";
  return viewerRole === "Faculty";
}

export function CertificatePanel({
  batchId,
  studentId,
  departmentId,
  onChange,
}: {
  batchId: string;
  studentId: string;
  departmentId?: string;
  onChange?: () => void;
}) {
  const { user } = useAuth();
  const [cert, setCert] = useState<LogbookCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCert(await getLogbookCertificate(batchId, studentId, departmentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load certificate");
    } finally {
      setLoading(false);
    }
  }, [batchId, studentId, departmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const sign = async (role: SignoffRole) => {
    setBusy(role);
    try {
      await signLogbookCertificate(batchId, studentId, role, departmentId);
      toast.success(`Signed as ${SLOT_LABEL[role]}`);
      await load();
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign");
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (role: SignoffRole) => {
    setBusy(role);
    try {
      await revokeLogbookCertificateSignoff(batchId, studentId, role, departmentId);
      toast.success(`Revoked ${SLOT_LABEL[role]} signature`);
      await load();
      onChange?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke");
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    if (!cert) return;
    setBusy("download");
    try {
      const { downloadLogbookPdf } = await import("@/features/dean/components/LogbookPdf");
      await downloadLogbookPdf(cert);
    } catch {
      toast.error("Could not generate the PDF");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Certificate A…
      </div>
    );
  }
  if (error || !cert) {
    return (
      <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
        {error ?? "Certificate unavailable"}
      </div>
    );
  }

  const eligible = cert.eligibility.eligible;

  return (
    <div className="mb-4 rounded-lg border bg-muted/20 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Certificate A</span>
        {cert.certified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Certified
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Draft{" "}
            {!eligible &&
              `· ${cert.eligibility.pendingCount} of ${cert.eligibility.totalCount} competencies pending`}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={download}
          disabled={busy === "download"}
        >
          {busy === "download" ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Download PDF
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {cert.slots.map((slot) => {
          const mine = canViewerSign(slot.role, user?.role);
          return (
            <div key={slot.role} className="rounded-md border bg-background p-2.5">
              <div className="text-xs font-medium text-muted-foreground">{SLOT_LABEL[slot.role]}</div>
              <div className="mt-1 text-sm">{slot.name || "—"}</div>
              {slot.signed ? (
                <>
                  {slot.signatureImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.signatureImage}
                      alt="signature"
                      className="mt-1 h-8 max-w-[140px] object-contain"
                    />
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-emerald-600">
                      Signed{slot.signedAt ? ` ${new Date(slot.signedAt).toLocaleDateString()}` : ""}
                    </span>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => revoke(slot.role)}
                        disabled={busy === slot.role}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Undo2 className="h-3 w-3" /> Revoke
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-1.5">
                  {mine ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => sign(slot.role)}
                      disabled={!eligible || busy === slot.role}
                      title={eligible ? undefined : "Student must complete all competencies first"}
                    >
                      {busy === slot.role ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Sign
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
