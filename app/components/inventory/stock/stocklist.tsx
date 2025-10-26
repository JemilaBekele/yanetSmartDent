'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import { ChevronDown, MoreHorizontal, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

// ======================= Types =======================
interface Product {
  _id: string;
  name: string;
  productCode: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
  productId: Product;
}

interface User {
  _id: string;
  username: string;
}

interface Stock {
  _id: string;
  batchId: ProductBatch; // Populated with ProductBatch and nested productId
  quantity: number;
  userId?: User; // Populated with User
  created_at: string;
  updated_at?: string;
  location?: string; // Optional, adjust based on your Stock model
  status?: string; // Optional, adjust based on your Stock model
}

export function StockTable() {
  const [stocks, setStocks] = React.useState<Stock[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const router = useRouter();

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/inventory/stock');
      setStocks(res.data || []);
    } catch (error) {
      console.error('Error fetching stock entries:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStocks();
  }, []);

  

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      return '-';
    }
  };

  const columns: ColumnDef<Stock>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
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
      accessorFn: (row) => row.batchId?.productId?.name ?? '-',
      id: 'productId',
      header: 'Product',
      cell: ({ row }) => <div>{row.getValue('productId') ?? '-'}</div>,
    },
    {
      accessorFn: (row) => row.batchId?.batchNumber ?? '-',
      id: 'batchId',
      header: 'Batch',
      cell: ({ row }) => <div>{row.getValue('batchId') ?? '-'}</div>,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorFn: (row) => row.userId?.username ?? '-',
      id: 'userId',
      header: 'User',
      cell: ({ row }) => <div>{row.getValue('userId') ?? '-'}</div>,
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }) => <div>{formatDate(row.getValue('created_at'))}</div>,
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => <div>{row.getValue('location') ?? '-'}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <div>{row.getValue('status') ?? '-'}</div>,
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const stock = row.original;
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(stock._id)}>
                Copy stock ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
             
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: stocks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
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
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by product name..."
          value={(table.getColumn('productId')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('productId')?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
                  No stock entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}