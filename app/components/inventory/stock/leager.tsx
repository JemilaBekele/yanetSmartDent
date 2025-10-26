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
}

interface UnitOfMeasure {
  _id: string;
  name: string;
  symbol: string;
}

interface ProductUnit {
  _id: string;
  productId: Product;
  unitOfMeasureId: UnitOfMeasure;
  conversionToBase: number;
  isDefault: boolean;
  created_at: string;
}

interface User {
  _id: string;
  username: string;
}

interface StockLedger {
  _id: string;
  productId: Product;
  batchId?: ProductBatch;
  productUnitId: ProductUnit;
  movementType: string;
  quantity: number;
  reference?: string;
  movementDate: string;
  userId?: User;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function StockLedgerTable() {
  const [ledgers, setLedgers] = React.useState<StockLedger[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const router = useRouter();

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/inventory/stockleager');
      setLedgers(res.data || []);
    } catch (error) {
      console.error('Error fetching stock ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLedgers();
  }, []);

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'PP');
    } catch (error) {
      return '-';
    }
  };

  const columns: ColumnDef<StockLedger>[] = [
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
      accessorFn: (row) => row.productId?.name ?? '-',
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
    { accessorKey: 'movementType', header: 'Movement' },
    { accessorKey: 'quantity', header: 'Quantity' },
    {
      accessorFn: (row) => row.productUnitId?.unitOfMeasureId?.name ?? '-',
      id: 'productUnitId',
      header: 'Unit',
      cell: ({ row }) => <div>{row.getValue('productUnitId') ?? '-'}</div>,
    },
    {
      accessorKey: 'movementDate',
      header: 'Date',
      cell: ({ row }) => <div>{formatDate(row.getValue('movementDate'))}</div>,
    },
    {
      accessorFn: (row) => row.userId?.username ?? '-',
      id: 'userId',
      header: 'User',
      cell: ({ row }) => <div>{row.getValue('userId') ?? '-'}</div>,
    },
    { accessorKey: 'notes', header: 'Notes' },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const ledger = row.original;
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(ledger._id)}>
                Copy ledger ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: ledgers,
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
                  No stock ledger entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}