import React from "react";
import {
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Column<T> = {
  header: string;
  key: keyof T;
  render: (item: T) => React.ReactNode;
};

type DataTableProps<T extends object> = {
  data?: T[]; // Optional data
  columns: Column<T>[];
  caption?: string;
  actions?: (item: T) => React.ReactNode;
  pageSizeOptions?: number[]; // Pagination options
};

const DataTable = <T extends object>({
  data = [], // Default to an empty array
  columns,
  caption,
  actions,
  pageSizeOptions = [10, 20, 30, 40, 50], // Default page size options
}: DataTableProps<T>) => {
  // Define columns based on the input props
  const columnDefs: ColumnDef<T>[] = columns.map((column) => ({
    accessorKey: column.key,
    header: column.header,
    cell: (info) => column.render(info.row.original),
  }));

  // Set up table using @tanstack/react-table
  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: pageSizeOptions[0] } },
  });

  return (
    <div>
      <Table>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.header}</TableHead>
            ))}
            {actions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>{column.render(row.original)}</TableCell>
              ))}
              {actions && <TableCell>{actions(row.original)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Section */}
      <div className="flex items-center justify-between px-2 mt-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <DoubleLeftOutlined className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <LeftOutlined className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <RightOutlined className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <DoubleRightOutlined className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;