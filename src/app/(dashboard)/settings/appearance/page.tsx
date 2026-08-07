"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sun, Moon, LayoutDashboard, Ruler, Type, PanelLeft, Palette } from "lucide-react";
import { SettingRow } from "@/components/shared/SettingRow";
import { OptionGroup } from "@/components/shared/OptionGroup";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: LayoutDashboard },
];

const densityOptions = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

const fontSizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const sidebarOptions = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
];

const accentOptions = [
  { value: "teal", label: "Teal", swatch: "bg-teal-500" },
  { value: "blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "indigo", label: "Indigo", swatch: "bg-indigo-500" },
  { value: "rose", label: "Rose", swatch: "bg-rose-500" },
];

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useState("comfortable");
  const [fontSize, setFontSize] = useState("medium");
  const [sidebar, setSidebar] = useState("expanded");
  const [accent, setAccent] = useState("teal");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleApply = async () => {
    setApplying(true);
    setMessage(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMessage("Appearance preferences saved");
    } catch {
      setMessage("Failed to save appearance preferences. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setTheme("system");
    setDensity("comfortable");
    setFontSize("medium");
    setSidebar("expanded");
    setAccent("teal");
    setMessage("Appearance preferences reset to defaults");
  };

  return (
    <div className="max-w-[1000px] space-y-6">
      {message && (
        <div className="rounded-lg border bg-card px-4 py-3 text-sm">{message}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading font-semibold">Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize how the platform looks and feels for you
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingRow
            icon={Sun}
            label="Theme"
            description="Choose how the interface is displayed"
            control={
              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1" role="radiogroup" aria-label="Theme">
                {themeOptions.map((option) => {
                  const isActive = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            }
          />

          <SettingRow
            icon={Ruler}
            label="Density"
            description="Adjust the spacing between interface elements"
            control={
              <OptionGroup
                value={density}
                onValueChange={setDensity}
                options={densityOptions}
                className="w-full sm:w-64"
              />
            }
          />

          <SettingRow
            icon={Type}
            label="Font Size"
            description="Change the default text size across the platform"
            control={
              <OptionGroup
                value={fontSize}
                onValueChange={setFontSize}
                options={fontSizeOptions}
                className="w-full sm:w-64"
              />
            }
          />

          <SettingRow
            icon={PanelLeft}
            label="Sidebar"
            description="Control the width of the navigation sidebar"
            control={
              <OptionGroup
                value={sidebar}
                onValueChange={setSidebar}
                options={sidebarOptions}
                className="w-full sm:w-64"
              />
            }
          />

          <SettingRow
            icon={Palette}
            label="Accent Color"
            description="Choose a highlight color for links and selections"
            control={
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Accent color">
                {accentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={accent === option.value}
                    aria-label={option.label}
                    title={option.label}
                    onClick={() => setAccent(option.value)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      accent === option.value
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:ring-2 hover:ring-border"
                    )}
                  >
                    <span className={cn("h-5 w-5 rounded-full", option.swatch)} />
                  </button>
                ))}
              </div>
            }
          />
        </CardContent>
        <CardFooter className="border-t bg-muted/30 px-4 py-3">
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" size="sm" disabled={applying} onClick={handleApply}>
              {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {applying ? "Applying..." : "Apply"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
