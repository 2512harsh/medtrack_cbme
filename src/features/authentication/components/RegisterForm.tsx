"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getRegisterOptions, registerStudent, type RegisterOptions } from "@/features/authentication/services/auth";

type Values = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rollNumber: string;
  registrationNumber: string;
  institutionId: string;
  batchId: string;
  professionalYearId: string;
};

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  rollNumber: "",
  registrationNumber: "",
  institutionId: "",
  batchId: "",
  professionalYearId: "",
};

export function RegisterForm({ onRegistered }: { onRegistered: (email: string) => void }) {
  const [opts, setOpts] = useState<RegisterOptions | null>(null);
  const [optsError, setOptsError] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getRegisterOptions()
      .then(setOpts)
      .catch(() => setOptsError("Couldn't load institutions. Please try again later."));
  }, []);

  const set = <K extends keyof Values>(key: K, v: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const batchesForInstitution = useMemo(
    () => (opts?.batches ?? []).filter((b) => b.institutionId === values.institutionId),
    [opts, values.institutionId]
  );

  const selectedBatch = useMemo(
    () => batchesForInstitution.find((b) => b.id === values.batchId),
    [batchesForInstitution, values.batchId]
  );

  const yearsForBatch = useMemo(
    () => (opts?.professionalYears ?? []).filter((y) => y.streamId === selectedBatch?.streamId),
    [opts, selectedBatch]
  );

  const handleInstitution = (v: string | null) =>
    setValues((prev) => ({ ...prev, institutionId: v ?? "", batchId: "", professionalYearId: "" }));
  const handleBatch = (v: string | null) =>
    setValues((prev) => ({ ...prev, batchId: v ?? "", professionalYearId: "" }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = values;
    if (
      !v.firstName.trim() ||
      !v.lastName.trim() ||
      !v.email.trim() ||
      !v.password ||
      !v.rollNumber.trim() ||
      !v.institutionId ||
      !v.batchId ||
      !v.professionalYearId
    ) {
      setError("Please fill in every field.");
      return;
    }
    if (v.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await registerStudent({
        ...v,
        registrationNumber: v.registrationNumber.trim() || v.rollNumber.trim(),
      });
      onRegistered(v.email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (optsError) {
    return (
      <Alert variant="destructive" className="gap-2">
        <AlertDescription className="text-sm">{optsError}</AlertDescription>
      </Alert>
    );
  }

  const disabled = submitting || !opts;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="gap-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-first">First name</Label>
          <Input
            id="reg-first"
            value={values.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-last">Last name</Label>
          <Input
            id="reg-last"
            value={values.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-10"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-roll">Roll number</Label>
          <Input
            id="reg-roll"
            value={values.rollNumber}
            onChange={(e) => set("rollNumber", e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-registration">University Registration No.</Label>
          <Input
            id="reg-registration"
            placeholder="Defaults to roll number"
            value={values.registrationNumber}
            onChange={(e) => set("registrationNumber", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-institution">Institution</Label>
        <Select value={values.institutionId} onValueChange={handleInstitution} disabled={disabled}>
          <SelectTrigger id="reg-institution">
            <SelectValue placeholder="Select your institution">
              {opts?.institutions.find((i) => i.id === values.institutionId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(opts?.institutions ?? []).map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-batch">Batch</Label>
          <Select
            value={values.batchId}
            onValueChange={handleBatch}
            disabled={disabled || !values.institutionId}
          >
            <SelectTrigger id="reg-batch">
              <SelectValue placeholder="Select batch">{selectedBatch?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {batchesForInstitution.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-year">Professional year</Label>
          <Select
            value={values.professionalYearId}
            onValueChange={(v) => set("professionalYearId", v ?? "")}
            disabled={disabled || !values.batchId}
          >
            <SelectTrigger id="reg-year">
              <SelectValue placeholder="Select year">
                {yearsForBatch.find((y) => y.id === values.professionalYearId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearsForBatch.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={disabled}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
