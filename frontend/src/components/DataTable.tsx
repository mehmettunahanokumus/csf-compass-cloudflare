import { useState, type ReactNode } from "react";
import { Search, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
}

interface PaginationConfig {
  pageSize: number;
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  title?: string;
  data: T[];
  columns: ColumnDef<T>[];
  rowActions?: RowAction<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  pagination?: PaginationConfig;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  headerActions?: ReactNode;
  className?: string;
}

function LoadingSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx} className="border-border">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function MobileCard<T>({
  row,
  columns,
  rowActions,
}: {
  row: T;
  columns: ColumnDef<T>[];
  rowActions?: RowAction<T>[];
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        {columns.map((col) => (
          <div key={col.key} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground shrink-0">{col.header}</span>
            <div className="text-sm text-right">{col.render(row)}</div>
          </div>
        ))}
        {rowActions && rowActions.length > 0 && (
          <div className="flex justify-end pt-2 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {rowActions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={() => action.onClick(row)}
                    variant={action.variant}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DataTable<T>({
  title,
  data,
  columns,
  rowActions,
  keyExtractor,
  searchPlaceholder = "Search...",
  onSearch,
  searchValue,
  pagination,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data found.",
  headerActions,
  className,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState("");
  const searchQuery = searchValue ?? internalSearch;
  const handleSearch = onSearch ?? setInternalSearch;

  const hasActions = rowActions && rowActions.length > 0;
  const totalColumns = columns.length + (hasActions ? 1 : 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and header actions */}
      {(onSearch !== undefined || searchValue !== undefined || headerActions) && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {headerActions}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      <Card className="bg-card border-border hidden md:block">
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.headerClassName}>
                    {col.header}
                  </TableHead>
                ))}
                {hasActions && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingSkeleton columns={totalColumns} rows={loadingRows} />
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={totalColumns}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={keyExtractor(row)} className="border-border hover:bg-secondary/20">
                    {columns.map((col) => (
                      <TableCell key={col.key} className={col.cellClassName}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions.map((action) => (
                              <DropdownMenuItem
                                key={action.label}
                                onClick={() => action.onClick(row)}
                                variant={action.variant}
                              >
                                {action.icon}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {title && (
          <h3 className="text-lg font-semibold px-1">{title}</h3>
        )}
        {loading ? (
          Array.from({ length: loadingRows }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                {Array.from({ length: Math.min(columns.length, 4) }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))
        ) : data.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          data.map((row) => (
            <MobileCard
              key={keyExtractor(row)}
              row={row}
              columns={columns}
              rowActions={rowActions}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalItems > pagination.pageSize && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of{" "}
            {Math.ceil(pagination.totalItems / pagination.pageSize)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >=
                Math.ceil(pagination.totalItems / pagination.pageSize)
              }
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
