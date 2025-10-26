"use client"

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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Edit, Trash2, Package, User, MapPin, Layers } from "lucide-react"
import axios from "axios"

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
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export interface ProductFormValues {
  id?: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: string;
  subCategoryId?: string;
}

export interface Category {
  _id: string;
  name: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  procategoryId: string;
}

export interface Product {
  _id: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: string | Category;
  subCategoryId?: string | SubCategory;
  createdAt?: string;
  updatedAt?: string;
  category?: Category;
  subCategory?: SubCategory;
  stockCount?: number;
  personalStockCount?: number;
  locationStockCount?: number;
  totalStock?: number;
}

interface DataTableProps {
  onEdit: (product: Product) => void;
  refreshTrigger: number;
}

export function ProductDataTable({ onEdit, refreshTrigger }: DataTableProps) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const router = useRouter();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/inventory/Product");
      console.log("API Response:", res.data);
      
      // The API returns the array directly, not nested in a products property
      setProducts(res.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await axios.delete(`/api/inventory/Product/${id}`);
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  // Helper function to get category name
  const getCategoryName = (product: Product): string => {
    if (typeof product.categoryId === 'object' && product.categoryId !== null) {
      return (product.categoryId as Category).name;
    }
    return product.category?.name || "-";
  };

  // Helper function to get subcategory name
  const getSubCategoryName = (product: Product): string => {
    if (typeof product.subCategoryId === 'object' && product.subCategoryId !== null) {
      return (product.subCategoryId as SubCategory).name;
    }
    return product.subCategory?.name || "-";
  };

  const columns: ColumnDef<Product>[] = [
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
      accessorKey: "productCode",
      header: "Product Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("productCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <div>{getCategoryName(row.original)}</div>
      ),
    },
    {
      id: "subCategory",
      header: "Sub Category",
      cell: ({ row }) => (
        <div>{getSubCategoryName(row.original)}</div>
      ),
    },
    {
      accessorKey: "stockCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            <Package className="h-4 w-4" />
            Warehouse
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {row.getValue("stockCount") || 0}
        </Badge>
      ),
    },
    {
      accessorKey: "personalStockCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            <User className="h-4 w-4" />
            Personal
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          {row.getValue("personalStockCount") || 0}
        </Badge>
      ),
    },
    {
      accessorKey: "locationStockCount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            <MapPin className="h-4 w-4" />
            Location
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          {row.getValue("locationStockCount") || 0}
        </Badge>
      ),
    },
    {
      accessorKey: "totalStock",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1"
          >
            <Layers className="h-4 w-4" />
            Total Stock
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-gray-100 text-gray-900 font-bold">
          {row.getValue("totalStock") || 0}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;

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
                onClick={() => navigator.clipboard.writeText(product._id)}
              >
                Copy product ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit product 
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/Product/${product._id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                View 
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/inventory/Product/batches/${product._id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Create Batches for this product
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteProduct(product._id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  const table = useReactTable({
    data: products,
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
    );
  }

  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter products..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
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
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="overflow-hidden rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="bg-white">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-white">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="bg-white hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="bg-white">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center bg-white"
                  >
                    No products found.
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
    </div>
  )
}