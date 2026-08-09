"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, AppTableFeatures } from "@/components/tables/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileText, Users as UsersIcon, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAssignedStudents,
} from "@/features/faculty/services/faculty";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import type { Student } from "@/types";

// Mock Data for Hierarchy based on CBME spreadsheet
const mockSubjects = [
  { id: "sub-1", name: "General Anatomy" },
  { id: "sub-2", name: "Upper Limb" },
  { id: "sub-3", name: "Lower Limb" },
];

const mockTopics = [
  { id: "top-1", subjectId: "sub-1", name: "Topic 1: Anatomical terminology" },
  { id: "top-2", subjectId: "sub-1", name: "Topic 2: General features of bones & Joints" },
  { id: "top-3", subjectId: "sub-2", name: "Topic 1: Pectoral Region" },
];

const mockCompetencies = [
  { id: "comp-1", topicId: "top-1", code: "AN1.1", title: "Describe & Demonstrate normal anatomical position, various planes, relation..." },
  { id: "comp-2", topicId: "top-1", code: "AN1.2", title: "Describe composition of bone and bone marrow" },
  { id: "comp-3", topicId: "top-2", code: "AN2.1", title: "Describe parts, types, peculiarities of each type, blood and nerve supply of bones." },
  { id: "comp-4", topicId: "top-2", code: "AN2.2", title: "Describe the laws of ossification, epiphysis, its various types and their importance" },
  { id: "comp-5", topicId: "top-3", code: "AN9.1", title: "Describe attachments, nerve supply and action of pectoralis major and minor" },
  { id: "comp-6", topicId: "top-3", code: "AN9.2", title: "Describe breast - location, blood supply, lymphatic drainage" },
];

export default function AssessmentFormPage() {
  const { user } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Table State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedCompetency, setSelectedCompetency] = useState("");
  const [attempt, setAttempt] = useState("First Attempt");
  const [rating, setRating] = useState("");
  const [remarks, setRemarks] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await getAssignedStudents();
      setStudents(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStudentSelection = (studentId: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  };

  const columns: ColumnDef<AppTableFeatures, Student>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={students.length > 0 && selectedStudentIds.size === students.length}
          onCheckedChange={toggleAllStudents}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedStudentIds.has(row.original.id)}
          onCheckedChange={() => toggleStudentSelection(row.original.id)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {student.user ? `${student.user.firstName} ${student.user.lastName}` : "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">{student.rollNumber}</span>
          </div>
        );
      },
    },
    {
      id: "batch",
      header: "Batch",
      cell: ({ row }) => <span>{row.original.batch}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedStudentIds(new Set([row.original.id]));
            setIsModalOpen(true);
          }}
        >
          Evaluate
        </Button>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedTopic || !selectedCompetency || !attempt || !rating || !remarks) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Mock submission for all selected students
      for (const studentId of Array.from(selectedStudentIds)) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      toast.success(`Successfully submitted assessments for ${selectedStudentIds.size} student(s)`);
      setIsModalOpen(false);
      
      // Reset form
      setSelectedStudentIds(new Set());
      setSelectedSubject("");
      setSelectedTopic("");
      setSelectedCompetency("");
      setAttempt("First Attempt");
      setRating("");
      setRemarks("");
      
    } catch (err) {
      toast.error("An error occurred while submitting assessments");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTopics = mockTopics.filter((t) => t.subjectId === selectedSubject);
  const filteredCompetencies = mockCompetencies.filter((c) => c.topicId === selectedTopic);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pending Assessments" description="Select students to evaluate" />
        <PageLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Assessments"
        description="Select one or multiple students to evaluate them together"
        actions={
          <Button
            onClick={() => {
              if (selectedStudentIds.size === 0) {
                toast.error("Please select at least one student from the table");
                return;
              }
              setIsModalOpen(true);
            }}
            disabled={selectedStudentIds.size === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            Bulk Evaluate ({selectedStudentIds.size})
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Select students below to begin assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Search students..."
          />
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => !isSubmitting && setIsModalOpen(open)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluate Students</DialogTitle>
            <DialogDescription>
              Fill out the assessment details below for the selected student(s).
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
                <UsersIcon className="h-4 w-4 text-primary" />
                Selected Students ({selectedStudentIds.size})
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/20">
                {students
                  .filter((s) => selectedStudentIds.has(s.id))
                  .map((s) => (
                    <div key={s.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">
                        {s.user ? `${s.user.firstName} ${s.user.lastName}` : "Unknown"}
                      </span>
                      <span className="text-muted-foreground">{s.rollNumber}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Competency Selection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSelectedTopic(""); setSelectedCompetency(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject">
                        {mockSubjects.find((s) => s.id === selectedSubject)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {mockSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Topic *</Label>
                  <Select value={selectedTopic} onValueChange={(v) => { setSelectedTopic(v); setSelectedCompetency(""); }} disabled={!selectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic">
                        {mockTopics.find((t) => t.id === selectedTopic)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTopics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Competency *</Label>
                <Select value={selectedCompetency} onValueChange={setSelectedCompetency} disabled={!selectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a competency">
                      {selectedCompetency ? (
                        <span>
                          <span className="font-medium mr-2">
                            {mockCompetencies.find((c) => c.id === selectedCompetency)?.code}
                          </span>
                          <span className="truncate">
                            {mockCompetencies.find((c) => c.id === selectedCompetency)?.title}
                          </span>
                        </span>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCompetencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="font-medium mr-2">{c.code}</span>
                        <span className="truncate">{c.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Evaluation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Attempt *</Label>
                  <Select value={attempt} onValueChange={setAttempt} disabled={!selectedCompetency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attempt type">
                        {attempt}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Attempt">First Attempt</SelectItem>
                      <SelectItem value="Repeat">Repeat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <Select value={rating} onValueChange={setRating} disabled={!selectedCompetency || !attempt}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating">
                        {rating === "M" ? "Meets Expectations (M)" : rating === "E" ? "Exceeds Expectations (E)" : rating === "N" ? "Needs Remediation (N)" : ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Meets Expectations (M)</SelectItem>
                      <SelectItem value="E">Exceeds Expectations (E)</SelectItem>
                      <SelectItem value="N">Needs Remediation (N)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Decision</Label>
                <Input value="Completed" disabled readOnly className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Remarks *</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter final remarks for the selected students..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={!rating}
                />
              </div>
              
              <div className="text-xs text-muted-foreground pt-2">
                Created At: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end w-full border-t pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
