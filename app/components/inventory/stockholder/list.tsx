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
import { ChevronDown, MoreHorizontal, Eye } from "lucide-react"
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
  _id: string
  username: string
  email: string
}

export interface Product {
  _id: string
  name: string
  code: string
}

export interface ProductBatch {
  _id: string
  batchNumber: string
  expiryDate?: string
  productId: Product
}

export interface PersonalStock {
  _id: string
  batchId: ProductBatch
  userId: User
  quantity: number
  status: string
  notes?: string
  lastUpdated: string
  created_at: string
  updated_at: string
}

// -------- Component --------
export function PersonalStockDataTable() {
  const [personalStocks, setPersonalStocks] = React.useState<PersonalStock[]>([])
  const [loading, setLoading] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [userFilter, setUserFilter] = React.useState("")
  const router = useRouter()

  const fetchPersonalStocks = async () => {
    setLoading(true)
    try {
      const res = await axios.get("/api/inventory/Holder")
      setPersonalStocks(res.data || [])
    } catch (error) {
      console.error("Error fetching personal stocks:", error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchPersonalStocks()
  }, [])

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "PP")
    } catch (error) {
      return "-"
    }
  }

  // Filter by user ID
  const filteredStocks = userFilter
    ? personalStocks.filter(
        (stock) =>
          stock.userId?._id === userFilter ||
          (typeof stock.userId === "string" && stock.userId === userFilter),
      )
    : personalStocks

  const columns: ColumnDef<PersonalStock>[] = [
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
      accessorKey: "userId.username",
      header: "User",
      cell: ({ row }) => <div>{row.original.userId?.username || "-"}</div>,
    },
    {
      accessorKey: "batchId.productId.name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          {row.original.batchId?.productId?.name} ({row.original.batchId?.productId?.code})
        </div>
      ),
    },
    {
      accessorKey: "batchId.batchNumber",
      header: "Batch",
      cell: ({ row }) => <div>{row.original.batchId?.batchNumber || "-"}</div>,
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => <div className="text-center">{row.original.quantity}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "ACTIVE"
              ? "default"
              : row.original.status === "RETURNED"
              ? "secondary"
              : "destructive"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => <div>{formatDate(row.original.lastUpdated)}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const stock = row.original
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/inventory/Holder/${stock._id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredStocks,
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
  })

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Filter by user ID..."
          value={userFilter}
          onChange={(event) => setUserFilter(event.target.value)}
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
      <div className="overflow-hidden rounded-md border">
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
                  {userFilter
                    ? "No personal stock found for this user."
                    : "No personal stock found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
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
  )
}
