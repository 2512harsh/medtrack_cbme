"use client";

import { Document, Page, Text, View, Image, StyleSheet, pdf } from "@react-pdf/renderer";
import type { LogbookCertificate } from "@/features/dean/services/dean";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Times-Roman", color: "#111", lineHeight: 1.5 },
  center: { textAlign: "center" },
  h1: { fontSize: 26, fontFamily: "Times-Bold", textAlign: "center", marginBottom: 4 },
  h2: { fontSize: 16, fontFamily: "Times-Bold", textAlign: "center", marginBottom: 14 },
  sub: { fontSize: 13, textAlign: "center", marginBottom: 4 },
  fine: { fontSize: 9, textAlign: "center", color: "#555", marginTop: 6 },
  box: { borderWidth: 1, borderColor: "#111", padding: 16, marginTop: 28 },
  fieldRow: { flexDirection: "row", marginBottom: 12 },
  fieldLabel: {},
  fieldLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#111", marginLeft: 6 },
  para: { marginBottom: 10 },
  inline: { borderBottomWidth: 1, borderBottomColor: "#111" },
  draft: { marginTop: 14, color: "#92400e", fontFamily: "Times-Italic" },
  certified: { marginTop: 14, color: "#065f46", fontFamily: "Times-Bold", textAlign: "center", fontSize: 13 },
  sigBlock: { marginTop: 26, alignItems: "flex-end" },
  sigImg: { height: 40, width: 160, objectFit: "contain", marginBottom: 2 },
  sigLine: { borderTopWidth: 1, borderTopColor: "#111", paddingTop: 2, minWidth: 220, alignItems: "flex-end" },
  sigName: { fontFamily: "Times-Bold" },
  sigLabel: { fontSize: 10 },
  sigPending: { fontSize: 10, color: "#92400e" },
  compHead: { borderBottomWidth: 2, borderBottomColor: "#111", paddingBottom: 6, marginBottom: 10 },
  compTitle: { fontSize: 14, fontFamily: "Times-Bold" },
  compMeta: { fontSize: 10, color: "#444" },
  attempt: { borderWidth: 1, borderColor: "#ddd", padding: 8, marginBottom: 8 },
  attemptHead: { fontSize: 11, fontFamily: "Times-Bold" },
  attemptMeta: { fontSize: 9, color: "#555" },
  respHead: { fontFamily: "Times-Bold", fontSize: 11, marginTop: 8, marginBottom: 4 },
  qText: { fontSize: 10, fontFamily: "Times-Bold" },
  aText: { fontSize: 10, marginBottom: 4 },
});

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}:</Text>
      <Text style={s.fieldLine}> {value ? String(value) : ""}</Text>
    </View>
  );
}

function SignatureBlock({
  label,
  name,
  image,
  signed,
  signedAt,
}: {
  label: string;
  name: string;
  image: string | null;
  signed: boolean;
  signedAt: string | null;
}) {
  return (
    <View style={s.sigBlock}>
      {signed && image ? (
        // react-pdf <Image> is not an HTML img — no alt attribute exists
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image style={s.sigImg} src={image} />
      ) : (
        <View style={{ height: 40 }} />
      )}
      <View style={s.sigLine}>
        {name ? <Text style={s.sigName}>{name}</Text> : null}
        <Text style={s.sigLabel}>Signature of {label}</Text>
        {signed ? (
          <Text style={s.sigLabel}>
            Signed{signedAt ? ` ${new Date(signedAt).toLocaleDateString()}` : ""}
          </Text>
        ) : (
          <Text style={s.sigPending}>Pending</Text>
        )}
      </View>
    </View>
  );
}

function LogbookDocument({ cert }: { cert: LogbookCertificate }) {
  const { student, slots } = cert;
  const rollAndReg =
    student.registrationNumber && student.registrationNumber !== student.rollNumber
      ? `${student.rollNumber} / ${student.registrationNumber}`
      : student.rollNumber;
  const year = student.professionalYear || "First Professional";

  return (
    <Document title={`${student.name} — ${cert.subjectLabel} Logbook`}>
      {/* Cover */}
      <Page size="A4" style={s.page}>
        <View style={{ marginTop: 40 }}>
          <Text style={s.sub}>Competency Based</Text>
          <Text style={s.h1}>Logbook in {cert.subjectLabel}</Text>
          <Text style={s.sub}>for {year} MBBS</Text>
          <Text style={s.fine}>
            As per the CBME Guidelines · Competency Based Undergraduate Curriculum for the Indian Medical
            Graduate
          </Text>
        </View>
        <View style={s.box}>
          <Field label="Name" value={student.name} />
          <Field label="Roll No." value={student.rollNumber} />
          <Field label="University Registration No." value={student.registrationNumber} />
          <Field label="Date of Admission" />
          <Field label="Permanent Address" />
          <Field label="E-mail ID" value={student.email} />
          <Field label="Batch" value={student.batch} />
          <Field label="Mobile No." />
        </View>
      </Page>

      {/* Certificate A */}
      <Page size="A4" style={s.page}>
        <View style={s.box}>
          <Text style={s.h2}>Certificate A</Text>
          <Text style={s.para}>
            It is hereby certified that Ms./Mr. <Text style={s.inline}> {student.name} </Text>, Roll
            No./University Registration No. <Text style={s.inline}> {rollAndReg} </Text>, who is a student
            of {year} MBBS at <Text style={s.inline}> {cert.institution.name} </Text>, has satisfactorily
            achieved all competencies and completed all assignments mentioned in this logbook.
          </Text>
          <Text style={s.para}>
            She/He is eligible to appear for the {year} MBBS University examinations which will be conducted
            by <Text style={s.inline}> </Text> (name of the affiliating university), from{" "}
            <Text style={s.inline}> </Text> to <Text style={s.inline}> </Text>.
          </Text>

          {cert.certified ? (
            <Text style={s.certified}>CERTIFIED</Text>
          ) : (
            <Text style={s.draft}>
              DRAFT — not valid until signed. {cert.eligibility.completedCount} of{" "}
              {cert.eligibility.totalCount} competencies completed.
            </Text>
          )}

          {slots.map((slot) => (
            <SignatureBlock
              key={slot.role}
              label={
                slot.role === "Faculty-in-charge"
                  ? "Faculty-in-charge"
                  : slot.role === "HOD"
                    ? "Head of the Department"
                    : "Principal/Dean of the College"
              }
              name={slot.name}
              image={slot.signatureImage}
              signed={slot.signed}
              signedAt={slot.signedAt}
            />
          ))}
        </View>
      </Page>

      {/* Competency detail — one per page */}
      {cert.competencies.map((c, i) => (
        <Page key={i} size="A4" style={s.page}>
          <View style={s.compHead}>
            <Text style={s.compTitle}>
              {c.competencyCode} — {c.competencyTitle}
            </Text>
            <Text style={s.compMeta}>
              {c.subjectName} · Faculty: {c.facultyName || "—"} · Status: {c.status}
            </Text>
          </View>

          {c.attempts.length === 0 ? (
            <Text style={{ fontStyle: "italic", color: "#666" }}>No attempts recorded.</Text>
          ) : (
            c.attempts.map((a) => (
              <View key={a.attemptNumber} style={s.attempt}>
                <Text style={s.attemptHead}>
                  Attempt {a.attemptNumber} — {a.rating} · {a.decision}
                </Text>
                <Text style={s.attemptMeta}>
                  {a.facultyName} · {new Date(a.facultySignedAt).toLocaleDateString()}
                  {a.studentAcknowledged ? " · acknowledged by student" : ""}
                </Text>
                {a.remarks ? <Text style={{ marginTop: 4 }}>{a.remarks}</Text> : null}
              </View>
            ))
          )}

          {c.response && c.response.answers.length > 0 ? (
            <View>
              <Text style={s.respHead}>Student response</Text>
              {c.response.answers.map((ans, j) => (
                <View key={j}>
                  <Text style={s.qText}>{ans.question}</Text>
                  <Text style={s.aText}>{ans.answer || "—"}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Page>
      ))}
    </Document>
  );
}

function slug(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function downloadLogbookPdf(cert: LogbookCertificate) {
  const blob = await pdf(<LogbookDocument cert={cert} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(cert.student.name)}-${slug(cert.subjectLabel)}-logbook.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
