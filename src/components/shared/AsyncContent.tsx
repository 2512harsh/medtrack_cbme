"use client";

import React from "react";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

interface AsyncContentProps<T> {
  data: T[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  loadingRows?: number;
  loadingColumns?: number;
  children: (data: T[]) => React.ReactNode;
}

export function AsyncContent<T>({
  data,
  isLoading,
  error,
  onRetry,
  emptyTitle = "No data found",
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  loadingRows = 5,
  loadingColumns = 4,
  children,
}: AsyncContentProps<T>) {
  if (isLoading) {
    return <LoadingSkeleton rows={loadingRows} columns={loadingColumns} />;
  }

  if (error) {
    return (
      <ErrorState
        message="Unable to load data. Please try again."
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return <>{children(data)}</>;
}
