import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Product from '@/app/(models)/inventory/Product';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import { InventoryRequest } from '@/app/(models)/inventory/request';
import { InventoryWithdrawalRequest, WithdrawalStatus } from '@/app/(models)/inventory/InventoryWithdrawalRequest ';
import { Purchase, PurchaseItem } from '@/app/(models)/inventory/Purchase';
import { LocationItemStock } from '@/app/(models)/inventory/locationstock';
import { PersonalStock } from '@/app/(models)/inventory/personal';
import Stock from '@/app/(models)/inventory/Stock';



export async function GET(request: NextRequest) {
  try {
    // Run the authorization middleware
    await authorizedMiddleware(request);

    // Calculate all KPIs in parallel for better performance
    const [
      totalProducts,
      totalStockValue,
      lowStockAlerts,
      pendingRequests,
      activeSuppliers
    ] = await Promise.all([
      // 1. Total Products (count of products in the system)
      Product.countDocuments(),
      
      // 2. Total Stock Value (sum of batch price × quantity)
      calculateTotalStockValue(),
      
      // 3. Low Stock Alerts (count of batches below warningQuantity)
      countLowStockBatches(),
      
      // 4. Pending Requests (inventory + withdrawal requests with status = PENDING)
      countPendingRequests(),
      
      // 5. Suppliers Active (number of suppliers linked to purchases)
      countActiveSuppliers()
    ]);

    // Return the KPIs
    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        totalStockValue,
        lowStockAlerts,
        pendingRequests,
        activeSuppliers
      },
    });
  } catch (error) {
    // Handle errors and return a response
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching inventory statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate total stock value
async function calculateTotalStockValue(): Promise<number> {
  try {
    // Get latest unit price for each batch from purchase items
    const batchPrices = await PurchaseItem.aggregate([
      {
        $sort: { created_at: -1 } // Get the most recent purchase
      },
      {
        $group: {
          _id: '$batchId',
          unitPrice: { $first: '$unitPrice' },
          productId: { $first: '$productId' }
        }
      }
    ]);

    if (batchPrices.length === 0) return 0;

    const batchIds = batchPrices.map(item => item._id);
    
    // Get total quantities from all stock types
    const [locationStocks, personalStocks, mainStocks] = await Promise.all([
      LocationItemStock.aggregate([
        { $match: { batchId: { $in: batchIds } } },
        { $group: { _id: '$batchId', totalQuantity: { $sum: '$quantity' } } }
      ]),
      
      PersonalStock.aggregate([
        { 
          $match: { 
            batchId: { $in: batchIds },
            status: 'ACTIVE'
          }
        },
        { $group: { _id: '$batchId', totalQuantity: { $sum: '$quantity' } } }
      ]),
      
      Stock.aggregate([
        { 
          $match: { 
            batchId: { $in: batchIds },
            status: 'Available'
          }
        },
        { $group: { _id: '$batchId', totalQuantity: { $sum: '$quantity' } } }
      ])
    ]);

    // Combine quantities
    const allStocks = [...locationStocks, ...personalStocks, ...mainStocks];
    const batchQuantities = allStocks.reduce((acc, stock) => {
      acc[stock._id.toString()] = (acc[stock._id.toString()] || 0) + stock.totalQuantity;
      return acc;
    }, {});

    // Calculate total value (1:1 conversion)
    let totalValue = 0;
    
    for (const batch of batchPrices) {
      const batchId = batch._id.toString();
      const quantity = batchQuantities[batchId] || 0;
      totalValue += quantity * batch.unitPrice;
    }

    return totalValue;
  } catch (error) {
    console.error('Error calculating total stock value:', error);
    return 0;
  }
}

// Helper function to count low stock batches
async function countLowStockBatches(): Promise<number> {
  return ProductBatch.countDocuments({
    $expr: { $lt: ['$quantity', '$warningQuantity'] }
  });
}

// Helper function to count pending requests
async function countPendingRequests(): Promise<number> {
  const [inventoryRequests, withdrawalRequests] = await Promise.all([
    InventoryRequest.countDocuments({ approvalStatus: 'PENDING' }),
    InventoryWithdrawalRequest.countDocuments({ status: WithdrawalStatus.PENDING })
  ]);
  
  return inventoryRequests + withdrawalRequests;
}

// Helper function to count active suppliers
async function countActiveSuppliers(): Promise<number> {
  const suppliersWithPurchases = await Purchase.distinct('supplierId');
  return suppliersWithPurchases.length;
}