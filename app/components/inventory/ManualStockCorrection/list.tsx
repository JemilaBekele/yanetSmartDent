'use client'

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// -------- Types --------
export interface User {
  _id: string;
  username: string;
  email?: string;
}

export interface Product {
  _id: string;
  name: string;
  code: string;
}

export interface ProductBatch {
  _id: string;
  batchNumber: string;
  expiryDate?: string;
}

export interface ProductUnit {
  _id: string;
  name: string;
  conversionToBase: number;
  unitOfMeasureId?: {
    _id: string;
    name: string;
    symbol: string;
  };
}

export interface PersonalStock {
  _id: string;
  quantity: number;
}

export interface Stock {
  _id: string;
  quantity: number;
}

export interface LocationItemStock {
  _id: string;
  quantity: number;
}

export interface CorrectionItem {
  _id: string;
  productId: Product;
  batchId: ProductBatch;
  productUnitId: ProductUnit;
  oldQuantity: number;
  newQuantity: number;
  difference: number;
  notes?: string;
  personalStockId?: PersonalStock;
  stockId?: Stock;
  locationItemStockId?: LocationItemStock;
}

export interface ManualStockCorrection {
  _id: string;
  reference: string;
  reason: string;
  status: string;
  createdById: User;
  approvedById?: User;
  notes?: string;
  items: CorrectionItem[];
  created_at: string;
  updated_at: string;
}

// -------- Component --------
export function ManualCorrectionDataTable() {
  const [corrections, setCorrections] = React.useState<ManualStockCorrection[]>([])
  const [loading, setLoading] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const router = useRouter();

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/manual-stock-correction");
      setCorrections(res.data.corrections || []);
    } catch (error) {
      console.error("Error fetching manual corrections:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCorrections();
  }, []);

  const deleteCorrection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manual correction?")) return;
    try {
      await axios.delete(`/api/manual-stock-correction/${id}`);
      await fetchCorrections();
    } catch (error) {
      console.error("Error deleting manual correction:", error);
      alert("Failed to delete manual correction");
    }
  };

  const getCreatorName = (correction: ManualStockCorrection): string => {
    if (correction.createdById && typeof correction.createdById === "object") {
      return correction.createdById.username || "-";
    }
    return "-";
  };

  const getApproverName = (correction: ManualStockCorrection): string => {
    if (correction.approvedById && typeof correction.approvedById === "object") {
      return correction.approvedById.username || "-";
    }
    return "-";
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "PP");
    } catch (error) {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">{status}</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTotalProducts = (correction: ManualStockCorrection): number => {
    return correction.items?.length || 0;
  };

  const getTotalAdjustment = (correction: ManualStockCorrection): number => {
    if (!correction.items) return 0;
    return correction.items.reduce((sum, item) => sum + (item.difference || 0), 0);
  };

  const getStockType = (item: CorrectionItem): string => {
    if (item.personalStockId) return "Personal";
    if (item.stockId) return "General";
    if (item.locationItemStockId) return "Location";
    return "Unknown";
  };

  const columns: ColumnDef<ManualStockCorrection>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <div className="font-mono">{row.original.reference}</div>,
    },
    {
      accessorKey: "createdById",
      header: "Created By",
      cell: ({ row }) => <div>{getCreatorName(row.original)}</div>,
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => <div>{formatDate(row.original.created_at)}</div>,
    },
    {
      id: "totalProducts",
      header: "Products",
      cell: ({ row }) => <div className="text-center">{getTotalProducts(row.original)}</div>,
    },
    {
      id: "totalAdjustment",
      header: "Total Adjustment",
      cell: ({ row }) => {
        const total = getTotalAdjustment(row.original);
        return (
          <div className={`text-center font-medium ${total > 0 ? 'text-green-600' : total < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {total > 0 ? '+' : ''}{total}
          </div>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <div className="max-w-xs truncate">{row.original.reason}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <div>{getStatusBadge(row.getValue("status"))}</div>,
    },
    {
      id: "approvedBy",
      header: "Approved By",
      cell: ({ row }) => <div>{getApproverName(row.original)}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const correction = row.original;
        const isPending = correction.status === "PENDING";
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(correction._id)}
              >
                Copy correction ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(correction.reference)}
              >
                Copy reference
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {isPending && (
                <DropdownMenuItem onClick={() => router.push(`/inventory/manual-correction/${correction._id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit correction
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => router.push(`/inventory/manual-correction/detail/${correction._id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
             
              {isPending && (
                <DropdownMenuItem
                  onClick={() => deleteCorrection(correction._id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete correction
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  const table = useReactTable({
    data: corrections,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by reference..."
            value={(table.getColumn("reference")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("reference")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Table with white background */}
        <div className="overflow-hidden rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No manual corrections found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}