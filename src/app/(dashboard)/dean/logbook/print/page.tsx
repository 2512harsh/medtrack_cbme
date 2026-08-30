"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { getLogbookCertificate, type LogbookCertificate } from "@/features/dean/services/dean";
import { Printer } from "lucide-react";

const PRINT_CSS = `
@page { size: A4; margin: 16mm; }
@media print {
  /* Hide the surrounding dashboard chrome, show only the logbook. */
  body * { visibility: hidden !important; }
  .lb-root, .lb-root * { visibility: visible !important; }
  .lb-root { position: absolute !important; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
  .lb-page { page-break-after: always; }
  .lb-page:last-child { page-break-after: auto; }
  .lb-comp { page-break-before: always; }
}
.lb-line { border-bottom: 1px solid #111; min-width: 220px; display: inline-block; }
`;

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
      <span style={{ whiteSpace: "nowrap" }}>{label}:</span>
      <span className="lb-line" style={{ flex: 1 }}>{value ?? " "}</span>
    </div>
  );
}

function SignatureBlock({
  label,
  name,
  image,
}: {
  label: string;
  name: string;
  image: string | null;
}) {
  return (
    <div style={{ marginTop: 28, textAlign: "right" }}>
      <div style={{ height: 48, display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={label} style={{ maxHeight: 48, maxWidth: 200, objectFit: "contain" }} />
        ) : null}
      </div>
      <div style={{ borderTop: "1px solid #111", display: "inline-block", paddingTop: 2, minWidth: 220 }}>
        {name ? <div style={{ fontWeight: 600 }}>{name}</div> : null}
        <div style={{ fontSize: 13 }}>{label}</div>
      </div>
    </div>
  );
}

function LogbookPrint() {
  const params = useSearchParams();
  const { user } = useAuth();
  const batchId = params.get("batchId") ?? "";
  const studentId = params.get("studentId") ?? "";
  const departmentId = params.get("departmentId") ?? undefined;

  const [data, setData] = useState<LogbookCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId || !studentId) {
      setError("Missing batch or student.");
      return;
    }
    getLogbookCertificate(batchId, studentId, user?.role === "Dean" ? departmentId : undefined)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [batchId, studentId, departmentId, user?.role]);

  const rollAndReg = useMemo(() => {
    if (!data) return "";
    const { rollNumber, registrationNumber } = data.student;
    return registrationNumber && registrationNumber !== rollNumber
      ? `${rollNumber} / ${registrationNumber}`
      : rollNumber;
  }, [data]);

  if (error) {
    return <div style={{ padding: 32, fontFamily: "system-ui" }}>{error}</div>;
  }
  if (!data) {
    return <div style={{ padding: 32, fontFamily: "system-ui" }}>Loading…</div>;
  }

  return (
    <div
      className="lb-root"
      style={{ background: "#fff", color: "#111", fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <style>{PRINT_CSS}</style>

      <div
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          display: "flex",
          gap: 12,
          padding: "12px 16px",
          background: "#f4f4f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
        {!data.eligibility.eligible && (
          <span style={{ alignSelf: "center", fontSize: 13, color: "#92400e" }}>
            Not yet eligible for Certificate A — {data.eligibility.pendingCount} of{" "}
            {data.eligibility.totalCount} competencies pending.
          </span>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Page 1 — Cover */}
        <section className="lb-page" style={{ minHeight: "60vh" }}>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ fontSize: 22 }}>Competency Based</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>Logbook in {data.subjectLabel}</div>
            <div style={{ fontSize: 18, marginTop: 8 }}>
              for {data.student.professionalYear || "First Professional"} MBBS
            </div>
            <div style={{ fontSize: 13, marginTop: 8, color: "#444" }}>
              As per the CBME Guidelines · Competency Based Undergraduate Curriculum for the Indian
              Medical Graduate
            </div>
          </div>

          <div style={{ border: "1px solid #111", padding: 20, marginTop: 48 }}>
            <Field label="Name" value={data.student.name} />
            <Field label="Roll No." value={data.student.rollNumber} />
            <Field label="University Registration No." value={data.student.registrationNumber} />
            <Field label="Date of Admission" />
            <Field label="Permanent Address" />
            <Field label="E-mail ID" value={data.student.email} />
            <Field label="Batch" value={data.student.batch} />
            <Field label="Mobile No." />
          </div>
        </section>

        {/* Page 2 — Certificate A */}
        <section className="lb-page">
          <div style={{ border: "1px solid #111", padding: 24 }}>
            <h2 style={{ textAlign: "center", fontSize: 18, marginBottom: 20 }}>Certificate A</h2>
            <p style={{ lineHeight: 1.9 }}>
              It is hereby certified that Ms./Mr. <span className="lb-line">{data.student.name}</span>, Roll
              No./University Registration No. <span className="lb-line">{rollAndReg}</span>, who is a student
              of {data.student.professionalYear || "Ist Professional"} MBBS at{" "}
              <span className="lb-line">{data.institution.name}</span>, has satisfactorily achieved all
              competencies and completed all assignments mentioned in this logbook.
            </p>
            <p style={{ lineHeight: 1.9, marginTop: 12 }}>
              She/He is eligible to appear for the {data.student.professionalYear || "Ist Professional"} MBBS
              University examinations which will be conducted by <span className="lb-line">&nbsp;</span>{" "}
              (name of the affiliating university), from <span className="lb-line">&nbsp;</span> to{" "}
              <span className="lb-line">&nbsp;</span>.
            </p>

            {!data.eligibility.eligible && (
              <p style={{ marginTop: 16, color: "#92400e", fontStyle: "italic" }}>
                Draft — {data.eligibility.completedCount} of {data.eligibility.totalCount} competencies
                completed. Not to be signed until all competencies are complete.
              </p>
            )}

            <SignatureBlock
              label="Signature of Faculty-in-charge"
              name={data.signatories.facultyInCharge.name}
              image={data.signatories.facultyInCharge.signatureImage}
            />
            <SignatureBlock
              label="Signature of Head of the Department"
              name={data.signatories.hod.name}
              image={data.signatories.hod.signatureImage}
            />
            <SignatureBlock
              label="Signature of Principal/Dean of the College"
              name={data.signatories.dean.name}
              image={data.signatories.dean.signatureImage}
            />
          </div>
        </section>

        {/* Pages 3+ — Competency detail, one per page */}
        {data.competencies.map((c, idx) => (
          <section key={idx} className="lb-page lb-comp">
            <div style={{ borderBottom: "2px solid #111", paddingBottom: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {c.competencyCode} — {c.competencyTitle}
              </div>
              <div style={{ fontSize: 13, color: "#444" }}>
                {c.subjectName} · Faculty: {c.facultyName || "—"} · Status: {c.status}
              </div>
            </div>

            {c.attempts.length === 0 ? (
              <p style={{ fontStyle: "italic", color: "#666" }}>No attempts recorded.</p>
            ) : (
              c.attempts.map((a) => (
                <div
                  key={a.attemptNumber}
                  style={{ border: "1px solid #ddd", padding: 12, marginBottom: 10 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Attempt {a.attemptNumber} — {a.rating} · {a.decision}
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    {a.facultyName} · {new Date(a.facultySignedAt).toLocaleDateString()}
                    {a.studentAcknowledged ? " · acknowledged by student" : ""}
                  </div>
                  {a.remarks && <p style={{ marginTop: 6 }}>{a.remarks}</p>}
                </div>
              ))
            )}

            {c.response && c.response.answers.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Student response</div>
                {c.response.answers.map((ans, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ans.question}</div>
                    <div style={{ fontSize: 13 }}>{ans.answer || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default function LogbookPrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Loading…</div>}>
      <LogbookPrint />
    </Suspense>
  );
}
