"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  getBrandingConfig,
  updateBrandingConfig,
} from "@/features/advanced/services/advanced";
import { PageLoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { SettingsCard } from "@/components/shared/SettingsCard";
import { SettingRow } from "@/components/shared/SettingRow";
import { toast } from "sonner";
import { Save, Loader2, Palette, ImageIcon, Eye, Upload } from "lucide-react";
import Image from "next/image";

type Branding = Awaited<ReturnType<typeof getBrandingConfig>>;

export default function BrandingPage() {
  const [config, setConfig] = useState<Branding | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoName, setLogoName] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const c = await getBrandingConfig();
      setConfig(c);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load branding settings"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const set = (patch: Partial<Branding>) =>
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(png|jpe?g|svg)$/i.test(file.name)) {
      toast.error("Logo must be a PNG, JPG, or SVG file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be 2MB or smaller");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoName(file.name);
      set({ logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updateBrandingConfig(config);
      toast.success("Branding settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !config) {
    return (
      <ErrorState
        message="Unable to load branding settings. Please try again."
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="max-w-[1100px] space-y-6">
      <PageHeader
        title="Institutional Branding"
        description="Customize the platform appearance for your institution"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Branding"}
          </Button>
        }
      />

      <SettingsCard
        title="Appearance"
        description="Apply custom colors and logo to the platform"
        icon={<Palette className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-4">
          <div className="divide-y divide-border">
            <SettingRow
              label="Custom Branding Enabled"
              description="Apply custom colors and logo to the platform"
              control={
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => set({ enabled: checked })}
                  aria-label="Custom Branding Enabled"
                />
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inst-name">Institution Name</Label>
              <Input
                id="inst-name"
                value={config.institutionName}
                onChange={(e) => set({ institutionName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-id">Institution ID</Label>
              <Input id="inst-id" value={config.institutionId} disabled />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => set({ primaryColor: e.target.value })}
                className="h-8 w-14 rounded-lg border border-input cursor-pointer bg-transparent"
              />
              <Input
                id="primary-color"
                value={config.primaryColor}
                onChange={(e) => set({ primaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-msg">Login Page Message</Label>
            <Input
              id="login-msg"
              value={config.loginMessage}
              onChange={(e) => set({ loginMessage: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="footer-text">Footer Text</Label>
            <Input
              id="footer-text"
              value={config.footerText}
              onChange={(e) => set({ footerText: e.target.value })}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Logo"
        description="Upload a logo for the login page and header"
        icon={<ImageIcon className="h-5 w-5 text-primary" />}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
            {config.logoUrl ? (
              <Image
                src={config.logoUrl}
                alt="Institution logo"
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            ) : (
              <span
                className="text-2xl font-bold"
                style={{ color: config.primaryColor }}
              >
                {config.institutionName.charAt(0)}
              </span>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent">
            <Upload className="h-4 w-4" />
            {logoName ?? "Upload Logo"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              className="hidden"
              onChange={handleLogoChange}
            />
          </label>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Preview"
        description="How your branding will appear to users"
        icon={<Eye className="h-5 w-5 text-primary" />}
      >
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ backgroundColor: `${config.primaryColor}11` }}
        >
          <div
            className="h-2 w-24 rounded-full"
            style={{ backgroundColor: config.primaryColor }}
          />
          <p className="text-lg font-bold" style={{ color: config.primaryColor }}>
            {config.institutionName}
          </p>
          <p className="text-sm text-muted-foreground">{config.loginMessage}</p>
          <p className="text-xs text-muted-foreground">{config.footerText}</p>
        </div>
      </SettingsCard>
    </div>
  );
}
