"use client";

import React from "react";
import {
  useTable,
  coreFeatures,
  coreRowModelsFeature,
  coreRowsFeature,
  coreHeadersFeature,
  coreCellsFeature,
  coreTablesFeature,
  coreColumnsFeature,
  rowSortingFeature,
  rowPaginationFeature,
  createPaginatedRowModel,
  columnFilteringFeature,
  globalFilteringFeature,
  flexRender,
  type ColumnDef,
  type RowData,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeSearchInput } from "@/lib/sanitize";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<AppTableFeatures, TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  className?: string;
}

const appFeatures = {
  coreFeatures,
  coreRowModelsFeature,
  coreRowsFeature,
  coreHeadersFeature,
  coreCellsFeature,
  coreTablesFeature,
  coreColumnsFeature,
  rowSortingFeature,
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
};

export type AppTableFeatures = typeof appFeatures;

interface TableCellLike {
  id: string;
  getContext: () => object;
  column: { columnDef: { cell: unknown } };
}
interface TableRowLike {
  id: string;
  getAllCells: () => TableCellLike[];
}
interface TableApi {
  getHeaderGroups: () => {
    id: string;
    headers: {
      id: string;
      getContext: () => object;
      column: {
        getCanSort: () => boolean;
        getIsSorted: () => "asc" | "desc" | false;
        getToggleSortingHandler: () => (() => void) | undefined;
        columnDef: { header: unknown };
      };
    }[];
  }[];
  getRowModel: () => { rows: TableRowLike[] };
  getFilteredRowModel: () => { rows: unknown[] };
  state: { pagination: PaginationState };
  getPageCount: () => number;
  getCanPreviousPage: () => boolean;
  getCanNextPage: () => boolean;
  setPageSize: (size: number) => void;
  setPageIndex: (index: number) => void;
  previousPage: () => void;
  nextPage: () => void;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  searchPlaceholder = "Search...",
  onSearch,
  searchValue,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: DataTableProps<TData>) {
  const [internalSearch, setInternalSearch] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const isSearchControlled = typeof onSearch === "function";
  const hasExplicitPlaceholder = searchPlaceholder !== "Search...";

  const dataToRender = isSearchControlled
    ? data
    : internalSearch
      ? data.filter((row) =>
          JSON.stringify(row).toLowerCase().includes(internalSearch.toLowerCase())
        )
      : data;

  const table = useTable<AppTableFeatures, TData>({
    data: dataToRender,
    columns,
    features: appFeatures,
    manualFiltering: isSearchControlled,
    manualSorting: false,
    onPaginationChange: setPagination,
    state: {
      sorting: [],
      columnFilters: [],
      globalFilter: isSearchControlled ? searchValue || "" : internalSearch,
      pagination,
    },
  }) as unknown as TableApi;

  if (isLoading) {
    return <LoadingSkeleton rows={5} columns={columns.length} />;
  }

  if (isError) {
    return (
      <ErrorState
        message={errorMessage || "Failed to load data"}
        onRetry={onRetry}
      />
    );
  }

  if (dataToRender.length === 0) {
    return (
      <EmptyState
        title="No data found"
        description="No records match your current filters."
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(isSearchControlled || hasExplicitPlaceholder) && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={isSearchControlled ? searchValue || "" : internalSearch}
            onChange={(e) =>
              isSearchControlled
                ? onSearch?.(sanitizeSearchInput(e.target.value))
                : setInternalSearch(sanitizeSearchInput(e.target.value))
            }
            className="pl-10"
          />
        </div>
      )}

      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortedState = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        isSortable && "cursor-pointer select-none",
                        "whitespace-nowrap"
                      )}
                      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header as unknown as Parameters<typeof flexRender>[0],
                          header.getContext()
                        )}
                        {isSortable && sortedState && (
                          <span className="text-muted-foreground">
                            {sortedState === "asc" ? " ↑" : sortedState === "desc" ? " ↓" : ""}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell as unknown as Parameters<typeof flexRender>[0],
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Rows per page</span>
            <select
              value={table.state.pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              Page {table.state.pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
