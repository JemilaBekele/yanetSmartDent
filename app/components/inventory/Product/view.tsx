'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Add this import
import { Package, Calendar, User, Info, DollarSign, Loader2, Warehouse, MapPin, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatDate } from '@/app/lib/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Types
interface Category {
  _id: string;
  name: string;
}

interface SubCategory {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  username: string;
}

interface ProductUnit {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: Category;
  subCategoryId?: SubCategory;
  productUnitId?: ProductUnit;
  createdById: User;
  created_at: string;
  updated_at: string;
}

interface ProductBatch {
  _id: string;
  batchNumber: string;
  price: number;
  size?: string;
  manufactureDate?: string;
  expiryDate?: string;
  warningQuantity: number;
  createdById: User;
  created_at: string;
  updated_at: string;
}

interface StockItem {
  _id: string;
  batchId: ProductBatch;
  quantity: number;
  userId?: User;
  created_at?: string;
}

interface PersonalStockItem {
  _id: string;
  batchId: ProductBatch;
  quantity: number;
  userId?: User;
  status: string;
  created_at?: string;
}

interface LocationStockItem {
  _id: string;
  batchId: ProductBatch;
  quantity: number;
  locationId?: {
    _id: string;
    name: string;
  };
  status: string;
  created_at?: string;
}

interface StockLedgerItem {
  _id: string;
  productId: string;
  batchId: ProductBatch;
  movementType: string;
  quantity: number;
  productUnitId?: ProductUnit;
  userId?: User;
  movementDate: string;
  reference: string;
  notes?: string;
  created_at: string;
  stockType: string
}

interface StockData {
  mainStock: StockItem[];
  personalStock: PersonalStockItem[];

  locationStock: LocationStockItem[];
  ledger: StockLedgerItem[];
  totals: {
    stockCount: number;
    personalStockCount: number;
    locationStockCount: number;
    totalStock: number;
  };
}

interface ProductWithStock {
  _id: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: Category;
  subCategoryId?: SubCategory;
  productUnitId?: ProductUnit;
  createdById: User;
  created_at: string;
  updated_at: string;
  batches: ProductBatch[];
      productUnits: ProductUnit[]; // ✅ new

  stockData: StockData;
}
interface UnitOfMeasure {
  _id: string;
  name: string;
  symbol?: string;
}

interface ProductUnit {
  _id: string;
  conversionToBase: number;
  isDefault: boolean;
  unitOfMeasureId: UnitOfMeasure;
}


type ProductDetailProps = {
  id?: string;
};

const ProductDetailPage: React.FC<ProductDetailProps> = ({ id }) => {
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [loading, setLoading] = useState(true);
    const [activeLedgerTab, setActiveLedgerTab] = useState('summary');

  const router = useRouter();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        if (id) {
          const response = await fetch(`/api/inventory/Product/stock/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch product details');
          }
          const productData = await response.json();
                    console.log(productData)

          setProduct(productData);
        }
      } catch (error) {
        toast.error('Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin mr-2 text-green-600" />
        <p className="text-green-600">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-600">Product not found</p>
      </div>
    );
  }
   const safeStockData = product.stockData || {
    mainStock: [],
    personalStock: [],
    locationStock: [],
    ledger: [],
    totals: {
      stockCount: 0,
      personalStockCount: 0,
      locationStockCount: 0,
      totalStock: 0
    }
  };
const StockType = Object.freeze({
  MAIN: 'MAIN',
  PERSONAL: 'PERSONAL',
  LOCATION: 'Location',
});
  const normalizeStockType = (stockType: string) => {
    if (stockType === 'Location') return 'LOCATION';
    return stockType;
  };

  // Get unique stock types from ledger
  const getUniqueStockTypes = () => {
    if (!product?.stockData?.ledger) return [];
    
    const types = product.stockData.ledger.map(entry => 
      normalizeStockType(entry.stockType)
    );
    return Array.from(new Set(types));
  };

  // Get ledger entries by type
  const getLedgerEntriesByType = (type: string) => {
    if (!product?.stockData?.ledger) return [];
    return product.stockData.ledger.filter(
      entry => normalizeStockType(entry.stockType) === type
    );
  };

  // Calculate totals for a specific stock type
  const calculateStockTypeTotals = (type: string) => {
    const typeEntries = getLedgerEntriesByType(type);
    
    const inTotal = typeEntries
      .filter(entry => entry.movementType === 'IN')
      .reduce((sum, entry) => sum + entry.quantity, 0);
      
    const outTotal = typeEntries
      .filter(entry => entry.movementType === 'OUT')
      .reduce((sum, entry) => sum + entry.quantity, 0);
      
    const balance = inTotal - outTotal;
    
    return { inTotal, outTotal, balance, count: typeEntries.length };
  };
  const uniqueStockTypes = getUniqueStockTypes();
  const renderLedgerTable = (type: string) => {
    const typeEntries = getLedgerEntriesByType(type);
    
    if (typeEntries.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No ledger entries found for {type} stock
        </div>
      );
    }

    let runningBalance = 0;

    const getIcon = (stockType: string) => {
      switch (stockType) {
        case 'MAIN': return <Warehouse className="h-5 w-5" />;
        case 'PERSONAL': return <Users className="h-5 w-5" />;
        case 'LOCATION': return <MapPin className="h-5 w-5" />;
        default: return <MapPin className="h-5 w-5" />;
      }
    };

    const totals = calculateStockTypeTotals(type);
   return (
      <div className="space-y-4">
        {/* Summary Card for this specific stock type */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getIcon(type)}
                <div>
                  <h3 className="font-semibold text-lg">{type} Stock Summary</h3>
                  <p className="text-sm text-gray-600">{totals.count} ledger entries</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total In</p>
                  <p className="text-xl font-bold text-green-600">{totals.inTotal}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Out</p>
                  <p className="text-xl font-bold text-red-600">{totals.outTotal}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Balance</p>
                  <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.balance}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-50">
                <TableHead className="text-green-800 font-semibold">Date</TableHead>
                <TableHead className="text-green-800 font-semibold">Batch</TableHead>
                <TableHead className="text-green-800 font-semibold">Movement Type</TableHead>
                <TableHead className="text-green-800 font-semibold">Quantity</TableHead>
                <TableHead className="text-green-800 font-semibold">Balance</TableHead>
                <TableHead className="text-green-800 font-semibold">User</TableHead>
                <TableHead className="text-green-800 font-semibold">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeEntries.map((entry) => {
                runningBalance += entry.movementType === 'IN' 
                  ? entry.quantity 
                  : -entry.quantity;
                
                return (
                  <TableRow key={entry._id} className="hover:bg-gray-50 border-b">
                    <TableCell className="text-gray-700 py-3">
                      {formatDate(entry.movementDate)}
                    </TableCell>
                    <TableCell className="font-medium text-gray-800 py-3">
                      {entry.batchId?.batchNumber || 'N/A'}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={
                        entry.movementType === 'IN' ? 'default' : 
                        entry.movementType === 'OUT' ? 'destructive' : 'secondary'
                      } className="text-xs">
                        {entry.movementType}
                      </Badge>
                    </TableCell> 
                    <TableCell className={`font-medium py-3 ${
                      entry.movementType === 'IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.movementType === 'IN' ? '+' : '-'}{entry.quantity}
                    </TableCell>
                    <TableCell className={`font-medium py-3 ${
                      runningBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {runningBalance}
                    </TableCell>
                    <TableCell className="text-gray-700 py-3">
                      {entry.userId?.username || 'N/A'}
                    </TableCell>
                    <TableCell className="text-gray-700 py-3 font-mono text-xs">
                      {entry.reference}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 bg-gray-50">
      {/* Product Details Card */}
      <Card className="shadow-lg border border-gray-200">
        <CardHeader className="bg-green-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2 text-green-800">
              <Package className="text-green-600" />
              Product: {product.name}
              <Badge className="ml-2 bg-green-100 text-green-800">
                Code: {product.productCode}
              </Badge>
            </CardTitle>
             <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Warehouse className="h-3 w-3 mr-1" />
                Main: {safeStockData.totals.stockCount}
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Users className="h-3 w-3 mr-1" />
                Personal: {safeStockData.totals.personalStockCount}
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                <MapPin className="h-3 w-3 mr-1" />
                Location: {safeStockData.totals.locationStockCount}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                Total: {safeStockData.totals.totalStock} {product.productUnitId?.name || ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Info className="h-5 w-5 text-green-500" />
                Product Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span> {product.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Product Code:</span> {product.productCode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Category:</span> {product.categoryId?.name || 'N/A'}
                  </p>
                </div>
                {product.subCategoryId && (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Subcategory:</span> {product.subCategoryId.name}
                    </p>
                  </div>
                )}
                {product.productUnitId && (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Unit:</span> {product.productUnitId.name}
                    </p>
                  </div>
                )}
                {product.description && (
                  <div>
                    <p className="font-medium text-gray-700">Description:</p>
                    <p className="text-gray-600">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Date Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-700">
                <Calendar className="h-5 w-5 text-green-500" />
                Date Details
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-700">Created At:</p>
                  <p className="text-gray-600">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Updated At:</p>
                  <p className="text-gray-600">{formatDate(product.updated_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">Total Batches:</span> {product.batches.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Information Tabs */}
         {/* Stock Information Tabs */}
<Tabs defaultValue="batches" className="w-full">
  <TabsList className="grid grid-cols-6 mb-4"> {/* Changed from 5 to 6 columns */}
    <TabsTrigger value="batches">Batches</TabsTrigger>
    <TabsTrigger value="units">Units</TabsTrigger>
    <TabsTrigger value="main-stock">Main Stock</TabsTrigger>
    <TabsTrigger value="personal-stock">Personal Stock</TabsTrigger>
    <TabsTrigger value="location-stock">Location Stock</TabsTrigger>
    <TabsTrigger value="ledger">Stock Ledger</TabsTrigger>
  </TabsList>

  {/* Batches Tab */}
  <TabsContent value="batches">
    {product.batches.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="text-green-800">Batch Number</TableHead>
            <TableHead className="text-green-800">Size</TableHead>
            <TableHead className="text-green-800">Price</TableHead>
            <TableHead className="text-green-800">Manufacture Date</TableHead>
            <TableHead className="text-green-800">Expiry Date</TableHead>
            <TableHead className="text-green-800">Warning Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.batches.map((batch) => (
            <TableRow key={batch._id} className="hover:bg-gray-100">
              <TableCell className="font-medium text-gray-800">{batch.batchNumber}</TableCell>
              <TableCell className="text-gray-700">{batch.size || 'N/A'}</TableCell>
              <TableCell className="text-gray-700">{batch.price.toFixed(2)}</TableCell>
              <TableCell className="text-gray-700">
                {batch.manufactureDate ? formatDate(batch.manufactureDate) : 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">
                {batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">{batch.warningQuantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="text-center py-4 text-gray-500">No batches found for this product</div>
    )}
  </TabsContent>

  {/* Product Units Tab */}
  <TabsContent value="units">
    {product.productUnits && product.productUnits.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="text-green-800">Unit Name</TableHead>
            <TableHead className="text-green-800">Symbol</TableHead>
            <TableHead className="text-green-800">Conversion To Base</TableHead>
            <TableHead className="text-green-800">Default</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.productUnits.map((unit) => (
            <TableRow key={unit._id} className="hover:bg-gray-100">
              <TableCell className="font-medium text-gray-800">
                {unit.unitOfMeasureId?.name || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">
                {unit.unitOfMeasureId?.symbol || '-'}
              </TableCell>
              <TableCell className="text-gray-700">
                {unit.conversionToBase}
              </TableCell>
              <TableCell>
                {unit.isDefault ? (
                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">No</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="text-center py-4 text-gray-500">
        No product units found for this product
      </div>
    )}
  </TabsContent>

  {/* Main Stock Tab */}
  <TabsContent value="main-stock">
    {product.stockData.mainStock.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="text-green-800">Batch Number</TableHead>
            <TableHead className="text-green-800">Quantity</TableHead>
            <TableHead className="text-green-800">User</TableHead>
            <TableHead className="text-green-800">Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.stockData.mainStock.map((stock) => (
            <TableRow key={stock._id} className="hover:bg-gray-100">
              <TableCell className="font-medium text-gray-800">
                {stock.batchId?.batchNumber || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">{stock.quantity}</TableCell>
              <TableCell className="text-gray-700">
                {stock.userId?.username || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">
                {stock.created_at ? formatDate(stock.created_at) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="text-center py-4 text-gray-500">No main stock found for this product</div>
    )}
  </TabsContent>

  {/* Personal Stock Tab */}
  <TabsContent value="personal-stock">
    {product.stockData.personalStock.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="text-green-800">Batch Number</TableHead>
            <TableHead className="text-green-800">Quantity</TableHead>
            <TableHead className="text-green-800">User</TableHead>
            <TableHead className="text-green-800">Status</TableHead>
            <TableHead className="text-green-800">Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.stockData.personalStock.map((stock) => (
            <TableRow key={stock._id} className="hover:bg-gray-100">
              <TableCell className="font-medium text-gray-800">
                {stock.batchId?.batchNumber || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">{stock.quantity}</TableCell>
              <TableCell className="text-gray-700">
                {stock.userId?.username || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">
                <Badge variant={stock.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {stock.status}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-700">
                {stock.created_at ? formatDate(stock.created_at) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="text-center py-4 text-gray-500">No personal stock found for this product</div>
    )}
  </TabsContent>

  {/* Location Stock Tab */}
  <TabsContent value="location-stock">
    {product.stockData.locationStock.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="text-green-800">Batch Number</TableHead>
            <TableHead className="text-green-800">Location</TableHead>
            <TableHead className="text-green-800">Quantity</TableHead>
            <TableHead className="text-green-800">Status</TableHead>
            <TableHead className="text-green-800">Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {product.stockData.locationStock.map((stock) => (
            <TableRow key={stock._id} className="hover:bg-gray-100">
              <TableCell className="font-medium text-gray-800">
                {stock.batchId?.batchNumber || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">
                {stock.locationId?.name || 'N/A'}
              </TableCell>
              <TableCell className="text-gray-700">{stock.quantity}</TableCell>
              <TableCell className="text-gray-700">
                <Badge variant={stock.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {stock.status}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-700">
                {stock.created_at ? formatDate(stock.created_at) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="text-center py-4 text-gray-500">No location stock found for this product</div>
    )}
  </TabsContent>
<TabsContent value="ledger">
              {product.stockData.ledger.length > 0 ? (
                <div className="space-y-4">
                  {/* Nested Tabs for different ledger views */}
                  <Tabs value={activeLedgerTab} onValueChange={setActiveLedgerTab} className="w-full">
                    <TabsList className="grid grid-cols-4 mb-6">
                      <TabsTrigger value="summary" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Summary
                      </TabsTrigger>
                      {uniqueStockTypes.map((type) => (
                        <TabsTrigger 
                          key={type} 
                          value={type.toLowerCase()} 
                          className="flex items-center gap-2"
                        >
                          {type === 'MAIN' && <Warehouse className="h-4 w-4" />}
                          {type === 'PERSONAL' && <Users className="h-4 w-4" />}
                          {type === 'LOCATION' && <MapPin className="h-4 w-4" />}
                          {type} Ledger
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* Summary Tab */}
                    <TabsContent value="summary" className="space-y-6">
                      {/* Balance Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {uniqueStockTypes.map((type) => {
                          const totals = calculateStockTypeTotals(type);
                          
                          const getIcon = (stockType: string) => {
                            switch (stockType) {
                              case 'MAIN': return <Warehouse className="h-4 w-4 mr-2" />;
                              case 'PERSONAL': return <Users className="h-4 w-4 mr-2" />;
                              case 'LOCATION': return <MapPin className="h-4 w-4 mr-2" />;
                              default: return <MapPin className="h-4 w-4 mr-2" />;
                            }
                          };
                          
                          return (
                            <Card key={type} className="shadow-sm hover:shadow-md transition-shadow">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center">
                                  {getIcon(type)}
                                  {type} Stock
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div>
                                    <p className="text-xs text-muted-foreground">In</p>
                                    <p className="text-lg font-bold text-green-600">{totals.inTotal}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Out</p>
                                    <p className="text-lg font-bold text-red-600">{totals.outTotal}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Balance</p>
                                    <p className={`text-lg font-bold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {totals.balance}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 text-center">
                                  <p className="text-xs text-muted-foreground">
                                    {totals.count} entries
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Quick Links to Individual Ledgers */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Quick Navigation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {uniqueStockTypes.map((type) => {
                              const totals = calculateStockTypeTotals(type);
                              return (
                                <Button
                                  key={type}
                                  variant="outline"
                                  className="flex flex-col items-center justify-center p-4 h-auto"
                                  onClick={() => setActiveLedgerTab(type.toLowerCase())}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    {type === 'MAIN' && <Warehouse className="h-5 w-5" />}
                                    {type === 'PERSONAL' && <Users className="h-5 w-5" />}
                                    {type === 'LOCATION' && <MapPin className="h-5 w-5" />}
                                    <span className="font-semibold">{type}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {totals.count} entries • Balance: {totals.balance}
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Individual Stock Type Ledger Tabs */}
                    {uniqueStockTypes.map((type) => (
                      <TabsContent key={type} value={type.toLowerCase()}>
                        {renderLedgerTable(type)}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No ledger entries found for this product
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => router.push('/inventory/Product')}
          className="border-green-500 text-green-500 hover:bg-green-50"
        >
          Back to Products
        </Button>
      </div>
    </div>
  );
};

export default ProductDetailPage;