import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import {  LocationItemStock } from '@/app/(models)/inventory/locationstock';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import { PersonalStock } from '@/app/(models)/inventory/personal';

import { Purchase, PurchaseItem } from '@/app/(models)/inventory/Purchase';
import Supplier from '@/app/(models)/inventory/Supplier';
import User from '@/app/(models)/User';
import { InventoryRequest } from '@/app/(models)/inventory/request';
import { StockWithdrawalRequest } from '@/app/(models)/inventory/StockWithdrawal';
import Product from '@/app/(models)/inventory/Product';

// Define types for the dashboard data
interface PendingApprovalData {
  requestId: mongoose.Types.ObjectId;
  requestNo: string;
  type: 'inventory' | 'withdrawal' | 'purchase';
  requestedBy: string;
  requestedAt: Date;
  totalItems: number;
  totalQuantity: number;
  status: string;
}

interface RequestTrendData {
  week: string;
  count: number;
}

interface TopRequesterData {
  userId: mongoose.Types.ObjectId;
  userName: string;
  requestCount: number;
}

interface RecentPurchaseData {
  purchaseId: mongoose.Types.ObjectId;
  invoiceNo: string;
  supplierName: string;
  totalAmount: number;
  purchaseDate: Date;
  approvalStatus: string;
}

interface SupplierSpendingData {
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  totalSpent: number;
  purchaseCount: number;
}

interface FrequentProductData {
  productId: mongoose.Types.ObjectId;
  productName: string;
  usageCount: number;
}

interface BatchValueData {
  batchId: mongoose.Types.ObjectId;
  batchNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

interface ProductWithoutBatchesData {
  productId: mongoose.Types.ObjectId;
  productCode: string;
  productName: string;
}

interface LowStockAlertData {
  productId: mongoose.Types.ObjectId;
  productName: string;
  batchNumber: string;
  currentQuantity: number;
  warningQuantity: number;
  locationName: string;
}

interface ExpiredBatchData {
  batchId: mongoose.Types.ObjectId;
  batchNumber: string;
  productName: string;
  expiryDate: Date;
  quantity: number;
  locationName: string;
}

interface UnapprovedRequestData {
  requestId: mongoose.Types.ObjectId;
  requestNo: string;
  type: string;
  requestedBy: string;
  daysPending: number;
}

interface UserStockData {
  userId: mongoose.Types.ObjectId;
  userName: string;
  issuedQuantity: number;
  returnedQuantity: number;
  currentHolding: number;
}

interface LostDamagedItemData {
  itemId: mongoose.Types.ObjectId;
  productName: string;
  batchNumber: string;
  quantity: number;
  userName: string;
  status: string;
  lastUpdated: Date;
}

interface DashboardData {
  // Section 3: Requests & Approvals
  pendingApprovals: PendingApprovalData[];
  requestTrends: RequestTrendData[];
  topRequesters: TopRequesterData[];
  
  // Section 4: Purchases & Suppliers
  recentPurchases: RecentPurchaseData[];
  supplierSpending: SupplierSpendingData[];
  pendingPurchaseApprovals: RecentPurchaseData[];
  
  // Section 5: Product & Batch Insights
  frequentProducts: FrequentProductData[];
  batchValues: BatchValueData[];
  productsWithoutBatches: ProductWithoutBatchesData[];
  
  // Section 6: Alerts & Notifications
  lowStockAlerts: LowStockAlertData[];
  expiredBatches: ExpiredBatchData[];
  unapprovedRequests: UnapprovedRequestData[];
  
  // Section 7: User / Personal Stock
  userStockStats: UserStockData[];
  topUsersHoldingStock: UserStockData[];
  lostDamagedItems: LostDamagedItemData[];
}

export async function GET(request: NextRequest) {
  try {
    // Perform authorization
    await authorizedMiddleware(request);

    // Calculate all metrics in parallel for better performance
    const [
      pendingApprovals,
      requestTrends,
      topRequesters,
      recentPurchases,
      supplierSpending,
      pendingPurchaseApprovals,
      frequentProducts,
      batchValues,
      productsWithoutBatches,
      lowStockAlerts,
      expiredBatches,
      unapprovedRequests,
      userStockStats,
      topUsersHoldingStock,
      lostDamagedItems
    ] = await Promise.all([
      getPendingApprovals(),
      getRequestTrends(),
      getTopRequesters(),
      getRecentPurchases(),
      getSupplierSpending(),
      getPendingPurchaseApprovals(),
      getFrequentProducts(),
      getBatchValues(),
      getProductsWithoutBatches(),
      getLowStockAlerts(),
      getExpiredBatches(),
      getUnapprovedRequests(),
      getUserStockStats(),
      getTopUsersHoldingStock(),
      getLostDamagedItems()
    ]);

    // Return the dashboard data as JSON response
    return NextResponse.json({
      message: 'Comprehensive inventory dashboard data retrieved successfully',
      success: true,
      data: {
        pendingApprovals,
        requestTrends,
        topRequesters,
        recentPurchases,
        supplierSpending,
        pendingPurchaseApprovals,
        frequentProducts,
        batchValues,
        productsWithoutBatches,
        lowStockAlerts,
        expiredBatches,
        unapprovedRequests,
        userStockStats,
        topUsersHoldingStock,
        lostDamagedItems
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching comprehensive dashboard data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve dashboard data',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// ======================= SECTION 3: REQUESTS & APPROVALS =======================

// 3.1 Pending Approvals
async function getPendingApprovals(): Promise<PendingApprovalData[]> {
  try {
    const [inventoryRequests, withdrawalRequests] = await Promise.all([
      // Inventory Requests
      InventoryRequest.aggregate([
        { $match: { approvalStatus: 'PENDING' } },
        {
          $lookup: {
            from: 'users',
            localField: 'requestedById',
            foreignField: '_id',
            as: 'requester'
          }
        },
        { $unwind: '$requester' },
        {
          $project: {
            requestId: '$_id',
            requestNo: 1,
            type: { $literal: 'inventory' },
            requestedBy: '$requester.name',
            requestedAt: '$requestDate',
            totalItems: '$totalProducts',
            totalQuantity: '$totalRequestedQuantity',
            status: '$approvalStatus'
          }
        }
      ]),
      
      // Withdrawal Requests
      StockWithdrawalRequest.aggregate([
        { $match: { status: 'PENDING' } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'requester'
          }
        },
        { $unwind: '$requester' },
        {
          $addFields: {
            totalItems: { $size: '$items' },
            totalQuantity: { $sum: '$items.requestedQuantity' }
          }
        },
        {
          $project: {
            requestId: '$_id',
            requestNo: { $literal: null }, // Withdrawal requests might not have numbers
            type: { $literal: 'withdrawal' },
            requestedBy: '$requester.name',
            requestedAt: '$requestedAt',
            totalItems: 1,
            totalQuantity: 1,
            status: 1
          }
        }
      ])
    ]);

    return [...inventoryRequests, ...withdrawalRequests].sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    ).slice(0, 10); // Return top 10 most recent

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
}

// 3.2 Request Trends (requests per week)
async function getRequestTrends(): Promise<RequestTrendData[]> {
  try {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks ago

    const requestTrends = await InventoryRequest.aggregate([
      {
        $match: {
          requestDate: { $gte: twelveWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$requestDate' },
            week: { $week: '$requestDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          week: {
            $concat: [
              { $toString: '$_id.year' },
              '-W',
              { $toString: '$_id.week' }
            ]
          },
          count: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      { $limit: 12 } // Last 12 weeks
    ]);

    return requestTrends;
  } catch (error) {
    console.error('Error fetching request trends:', error);
    return [];
  }
}

// 3.3 Top Requesters
async function getTopRequesters(): Promise<TopRequesterData[]> {
  try {
    const topRequesters = await InventoryRequest.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'requestedById',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$requestedById',
          userName: { $first: '$user.name' },
          requestCount: { $sum: 1 }
        }
      },
      { $sort: { requestCount: -1 } },
      { $limit: 10 } // Top 10 requesters
    ]);

    return topRequesters.map(item => ({
      userId: item._id,
      userName: item.userName,
      requestCount: item.requestCount
    }));
  } catch (error) {
    console.error('Error fetching top requesters:', error);
    return [];
  }
}

// ======================= SECTION 4: PURCHASES & SUPPLIERS =======================

// 4.1 Recent Purchases
async function getRecentPurchases(): Promise<RecentPurchaseData[]> {
  try {
    const recentPurchases = await Purchase.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: '$supplier' },
      {
        $project: {
          purchaseId: '$_id',
          invoiceNo: 1,
          supplierName: '$supplier.name',
          totalAmount: '$Total',
          purchaseDate: 1,
          approvalStatus: 1
        }
      },
      { $sort: { purchaseDate: -1 } },
      { $limit: 10 } // Last 10 purchases
    ]);

    return recentPurchases;
  } catch (error) {
    console.error('Error fetching recent purchases:', error);
    return [];
  }
}

// 4.2 Spending by Supplier
async function getSupplierSpending(): Promise<SupplierSpendingData[]> {
  try {
    const supplierSpending = await Purchase.aggregate([
      { $match: { approvalStatus: 'APPROVED' } },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: '$supplier' },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplier.name' },
          totalSpent: { $sum: '$Total' },
          purchaseCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 } // Top 10 suppliers by spending
    ]);

    return supplierSpending.map(item => ({
      supplierId: item._id,
      supplierName: item.supplierName,
      totalSpent: item.totalSpent,
      purchaseCount: item.purchaseCount
    }));
  } catch (error) {
    console.error('Error fetching supplier spending:', error);
    return [];
  }
}

// 4.3 Pending Purchase Approvals
async function getPendingPurchaseApprovals(): Promise<RecentPurchaseData[]> {
  try {
    const pendingPurchases = await Purchase.aggregate([
      { $match: { approvalStatus: 'PENDING' } },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: '$supplier' },
      {
        $project: {
          purchaseId: '$_id',
          invoiceNo: 1,
          supplierName: '$supplier.name',
          totalAmount: '$Total',
          purchaseDate: 1,
          approvalStatus: 1
        }
      },
      { $sort: { purchaseDate: -1 } },
      { $limit: 10 } // Last 10 pending purchases
    ]);

    return pendingPurchases;
  } catch (error) {
    console.error('Error fetching pending purchase approvals:', error);
    return [];
  }
}

// ======================= SECTION 5: PRODUCT & BATCH INSIGHTS =======================

// 5.1 Most Frequently Used Products
async function getFrequentProducts(): Promise<FrequentProductData[]> {
  try {
    const frequentProducts = await StockLedger.aggregate([
      { $match: { movementType: 'OUT' } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$product.name' },
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 } // Top 10 frequently used products
    ]);

    return frequentProducts.map(item => ({
      productId: item._id,
      productName: item.productName,
      usageCount: item.usageCount
    }));
  } catch (error) {
    console.error('Error fetching frequent products:', error);
    return [];
  }
}

// 5.2 Batch Value Breakdown
async function getBatchValues(): Promise<BatchValueData[]> {
  try {
    const batchValues = await LocationItemStock.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'productbatches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: '$batch' },
      {
        $lookup: {
          from: 'products',
          localField: 'batch.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'purchaseitems',
          let: { batchId: '$batchId', productId: '$batch.productId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$batchId', '$$batchId'] },
                    { $eq: ['$productId', '$$productId'] }
                  ]
                }
              }
            },
            { $sort: { created_at: -1 } },
            { $limit: 1 }
          ],
          as: 'purchaseItem'
        }
      },
      { $unwind: { path: '$purchaseItem', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$batchId',
          batchNumber: { $first: '$batch.batchNumber' },
          productName: { $first: '$product.name' },
          quantity: { $sum: '$quantity' },
          unitPrice: { $first: { $ifNull: ['$purchaseItem.unitPrice', 0] } }
        }
      },
      {
        $project: {
          batchId: '$_id',
          batchNumber: 1,
          productName: 1,
          quantity: 1,
          unitPrice: 1,
          totalValue: { $multiply: ['$quantity', '$unitPrice'] }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 15 } // Top 15 most valuable batches
    ]);

    return batchValues;
  } catch (error) {
    console.error('Error fetching batch values:', error);
    return [];
  }
}

// 5.3 Products Without Batches
async function getProductsWithoutBatches(): Promise<ProductWithoutBatchesData[]> {
  try {
    const productsWithoutBatches = await Product.aggregate([
      {
        $lookup: {
          from: 'productbatches',
          localField: '_id',
          foreignField: 'productId',
          as: 'batches'
        }
      },
      {
        $match: {
          batches: { $size: 0 }
        }
      },
      {
        $project: {
          productId: '$_id',
          productCode: 1,
          productName: 1
        }
      },
      { $limit: 20 } // Limit to 20 products
    ]);

    return productsWithoutBatches;
  } catch (error) {
    console.error('Error fetching products without batches:', error);
    return [];
  }
}

// ======================= SECTION 6: ALERTS & NOTIFICATIONS =======================

// 6.1 Low Stock Alerts
async function getLowStockAlerts(): Promise<LowStockAlertData[]> {
  try {
    const lowStockAlerts = await LocationItemStock.aggregate([
      {
        $lookup: {
          from: 'productbatches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: '$batch' },
      {
        $lookup: {
          from: 'products',
          localField: 'batch.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: '$location' },
      {
        $match: {
          $expr: {
            $and: [
              { $lt: ['$quantity', '$batch.warningQuantity'] },
              { $gt: ['$batch.warningQuantity', 0] }
            ]
          }
        }
      },
      {
        $project: {
          productId: '$batch.productId',
          productName: '$product.name',
          batchNumber: '$batch.batchNumber',
          currentQuantity: '$quantity',
          warningQuantity: '$batch.warningQuantity',
          locationName: '$location.name'
        }
      },
      { $sort: { currentQuantity: 1 } }, // Sort by most critical first
      { $limit: 20 } // Limit to 20 most critical alerts
    ]);

    return lowStockAlerts;
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return [];
  }
}

// 6.2 Expired Batches
async function getExpiredBatches(): Promise<ExpiredBatchData[]> {
  try {
    const expiredBatches = await ProductBatch.aggregate([
      {
        $match: {
          expiryDate: { $lt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'locationitemstocks',
          localField: '_id',
          foreignField: 'batchId',
          as: 'locationStock'
        }
      },
      {
        $addFields: {
          totalQuantity: { $sum: '$locationStock.quantity' },
          mainLocation: { $arrayElemAt: ['$locationStock.locationId', 0] }
        }
      },
      {
        $lookup: {
          from: 'locations',
          localField: 'mainLocation',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          batchId: '$_id',
          batchNumber: 1,
          productName: '$product.name',
          expiryDate: 1,
          quantity: '$totalQuantity',
          locationName: { $ifNull: ['$location.name', 'Unknown'] }
        }
      },
      { $sort: { expiryDate: -1 } }, // Most recently expired first
      { $limit: 20 } // Limit to 20 batches
    ]);

    return expiredBatches;
  } catch (error) {
    console.error('Error fetching expired batches:', error);
    return [];
  }
}

// 6.3 Unapproved Requests (pending for more than 3 days)
async function getUnapprovedRequests(): Promise<UnapprovedRequestData[]> {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const [inventoryRequests, withdrawalRequests] = await Promise.all([
      // Inventory Requests pending for more than 3 days
      InventoryRequest.aggregate([
        { 
          $match: { 
            approvalStatus: 'PENDING',
            requestDate: { $lt: threeDaysAgo }
          } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'requestedById',
            foreignField: '_id',
            as: 'requester'
          }
        },
        { $unwind: '$requester' },
        {
          $addFields: {
            daysPending: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$requestDate'] },
                  1000 * 60 * 60 * 24 // milliseconds in a day
                ]
              }
            }
          }
        },
        {
          $project: {
            requestId: '$_id',
            requestNo: 1,
            type: { $literal: 'inventory' },
            requestedBy: '$requester.name',
            daysPending: 1
          }
        }
      ]),
      
      // Withdrawal Requests pending for more than 3 days
      StockWithdrawalRequest.aggregate([
        { 
          $match: { 
            status: 'PENDING',
            requestedAt: { $lt: threeDaysAgo }
          } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'requester'
          }
        },
        { $unwind: '$requester' },
        {
          $addFields: {
            daysPending: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$requestedAt'] },
                  1000 * 60 * 60 * 24 // milliseconds in a day
                ]
              }
            }
          }
        },
        {
          $project: {
            requestId: '$_id',
            requestNo: { $literal: null },
            type: { $literal: 'withdrawal' },
            requestedBy: '$requester.name',
            daysPending: 1
          }
        }
      ])
    ]);

    return [...inventoryRequests, ...withdrawalRequests].sort((a, b) => 
      b.daysPending - a.daysPending // Sort by longest pending first
    ).slice(0, 15); // Return top 15 longest pending requests

  } catch (error) {
    console.error('Error fetching unapproved requests:', error);
    return [];
  }
}

// ======================= SECTION 7: USER / PERSONAL STOCK =======================

// 7.1 Issued vs Returned
async function getUserStockStats(): Promise<UserStockData[]> {
  try {
    const userStockStats = await StockLedger.aggregate([
      { 
        $match: { 
          stockType: 'PERSONAL',
          $or: [
            { movementType: 'IN' },  // Issued to user
            { movementType: 'OUT' }  // Returned from user
          ]
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$user.name' },
          issuedQuantity: {
            $sum: {
              $cond: [{ $eq: ['$movementType', 'IN'] }, '$quantity', 0]
            }
          },
          returnedQuantity: {
            $sum: {
              $cond: [{ $eq: ['$movementType', 'OUT'] }, '$quantity', 0]
            }
          }
        }
      },
      {
        $project: {
          userId: '$_id',
          userName: 1,
          issuedQuantity: 1,
          returnedQuantity: 1,
          currentHolding: { $subtract: ['$issuedQuantity', '$returnedQuantity'] }
        }
      },
      { $sort: { currentHolding: -1 } },
      { $limit: 10 } // Top 10 users by current holdings
    ]);

    return userStockStats;
  } catch (error) {
    console.error('Error fetching user stock stats:', error);
    return [];
  }
}

// 7.2 Top Users Holding Stock (same as above but with different sorting)
async function getTopUsersHoldingStock(): Promise<UserStockData[]> {
  try {
    const userStockStats = await getUserStockStats();
    return userStockStats.sort((a, b) => b.currentHolding - a.currentHolding);
  } catch (error) {
    console.error('Error fetching top users holding stock:', error);
    return [];
  }
}

// 7.3 Lost / Damaged Items
async function getLostDamagedItems(): Promise<LostDamagedItemData[]> {
  try {
    const lostDamagedItems = await PersonalStock.aggregate([
      { 
        $match: { 
          status: { $in: ['LOST', 'DAMAGED'] } 
        } 
      },
      {
        $lookup: {
          from: 'productbatches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: '$batch' },
      {
        $lookup: {
          from: 'products',
          localField: 'batch.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          itemId: '$_id',
          productName: '$product.name',
          batchNumber: '$batch.batchNumber',
          quantity: 1,
          userName: '$user.name',
          status: 1,
          lastUpdated: 1
        }
      },
      { $sort: { lastUpdated: -1 } }, // Most recent first
      { $limit: 20 } // Limit to 20 items
    ]);

    return lostDamagedItems;
  } catch (error) {
    console.error('Error fetching lost/damaged items:', error);
    return [];
  }
}

export const dynamic = 'force-dynamic';