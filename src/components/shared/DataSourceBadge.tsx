import React from "react";
import { Badge } from "@/components/ui/badge";
import { Database, FlaskConical } from "lucide-react";

export type DataSource = "live" | "demo";

interface DataSourceBadgeProps {
  source: DataSource;
}

export function DataSourceBadge({ source }: DataSourceBadgeProps) {
  if (source === "live") {
    return (
      <Badge variant="success" title="This page reads and writes real data in the database">
        <Database className="h-3 w-3" />
        Live Data
      </Badge>
    );
  }
  return (
    <Badge variant="warning" title="This page uses placeholder data — nothing here is saved">
      <FlaskConical className="h-3 w-3" />
      Demo Data
    </Badge>
  );
}
