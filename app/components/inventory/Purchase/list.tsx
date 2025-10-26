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

// Types
interface Supplier {
  _id: string;
  name: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
}

interface ProductUnit {
  _id: string;
  name: string;
  abbreviation: string;
}

interface PurchaseItem {
  _id: string;
  productId: Product;
  batchId: ProductBatch;
  productUnitId: ProductUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  _id: string;
  invoiceNo: string;
  supplierId: Supplier;
  approvalStatus: string;
  totalProducts: number;
  totalQuantity: number;
  Total: number;
  notes?: string;
  purchaseDate: string;
  createdById?: string;
  updatedById?: string;
  created_at: string;
  updated_at: string;
  items: PurchaseItem[];
}

export function PurchaseDataTable() {
  const [purchases, setPurchases] = React.useState<Purchase[]>([])
  const [loading, setLoading] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const router = useRouter();

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/inventory/Purchase");
      setPurchases(res.data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPurchases();
  }, []);

  const deletePurchase = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return;
    try {
      await axios.delete(`/api/inventory/Purchase/${id}`);
      await fetchPurchases();
    } catch (error) {
      console.error("Error deleting purchase:", error);
      alert("Failed to delete purchase");
    }
  };

  const getSupplierName = (purchase: Purchase): string => {
    if (typeof purchase.supplierId === 'object' && purchase.supplierId !== null) {
      return (purchase.supplierId as Supplier).name;
    }
    return "-";
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      return "-";
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">{status}</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: ColumnDef<Purchase>[] = [
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
      accessorKey: "invoiceNo",
      header: "Invoice No",
      cell: ({ row }) => <div className="font-medium">{row.getValue("invoiceNo")}</div>,
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => <div>{getSupplierName(row.original)}</div>,
    },
    {
      accessorKey: "purchaseDate",
      header: "Purchase Date",
      cell: ({ row }) => <div>{formatDate(row.original.purchaseDate)}</div>,
    },
    {
      accessorKey: "totalProducts",
      header: "Products",
      cell: ({ row }) => <div className="text-center">{row.getValue("totalProducts")}</div>,
    },
    {
      accessorKey: "totalQuantity",
      header: "Total Quantity",
      cell: ({ row }) => <div className="text-center">{row.getValue("totalQuantity")}</div>,
    },
    {
      accessorKey: "Total",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="font-medium">{(row.getValue("Total") as number).toFixed(2)}</div>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: "Status",
      cell: ({ row }) => <div>{getApprovalStatusBadge(row.getValue("approvalStatus"))}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const purchase = row.original;
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
                onClick={() => navigator.clipboard.writeText(purchase._id)}
              >
                Copy purchase ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/inventory/Purchase/${purchase._id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit purchase
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/inventory/Purchase/detail/${purchase._id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deletePurchase(purchase._id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete purchase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  const table = useReactTable({
    data: purchases,
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
            placeholder="Filter by invoice no..."
            value={(table.getColumn("invoiceNo")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("invoiceNo")?.setFilterValue(event.target.value)
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
        <div className="overflow-hidden rounded-md border bg-white">
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
                    No purchases found.
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
