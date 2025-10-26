import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import { LocationItemStatus, LocationItemStock } from '@/app/(models)/inventory/locationstock';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Stock from '@/app/(models)/inventory/Stock';
import { PersonalStock } from '@/app/(models)/inventory/personal';


// Define types for the aggregated data
interface CategoryStockData {
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  totalStockValue: number;
  productCount: number;
}

interface LocationStockData {
  locationId: mongoose.Types.ObjectId;
  locationName: string;
  totalQuantity: number;
  batchCount: number;
}

interface ExpiringBatchData {
  batchId: mongoose.Types.ObjectId;
  batchNumber: string;
  productName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantity: number;
  location: string;
}

interface DamagedReservedStockData {
  itemId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  batchNumber: string;
  productName: string;
  quantity: number;
  status: string;
  locationName?: string;
  userName?: string;
  type: 'location' | 'personal' | 'main';
}

export async function GET(request: NextRequest) {
  try {
    // Perform authorization
    await authorizedMiddleware(request);

    // Calculate all metrics in parallel for better performance
    const [
      stockByCategory,
      stockByLocation,
      expiringBatches,
      damagedReservedStock
    ] = await Promise.all([
      calculateStockByCategory(),
      calculateStockByLocation(),
      getExpiringBatches(),
      getDamagedReservedStock()
    ]);

    // Return the dashboard data as JSON response
    return NextResponse.json({
      message: 'Inventory dashboard data retrieved successfully',
      success: true,
      data: {
        stockByCategory,
        stockByLocation,
        expiringBatches,
        damagedReservedStock
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching inventory dashboard data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve inventory dashboard data',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 1. Stock by Category (pie/donut chart data)
async function calculateStockByCategory(): Promise<CategoryStockData[]> {
  try {
    // Get stock value by category through Product -> StockLedger relationship
    const categoryStock = await StockLedger.aggregate([
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
          from: 'procategories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'purchaseitems',
          let: { productId: '$productId', batchId: '$batchId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$batchId', '$$batchId'] }
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
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalStockValue: {
            $sum: {
              $multiply: [
                '$quantity',
                { $ifNull: ['$purchaseItem.unitPrice', 0] }
              ]
            }
          },
          productCount: { $addToSet: '$productId' }
        }
      },
      {
        $project: {
          categoryId: '$_id',
          categoryName: 1,
          totalStockValue: { $round: ['$totalStockValue', 2] },
          productCount: { $size: '$productCount' }
        }
      },
      { $sort: { totalStockValue: -1 } }
    ]);

    return categoryStock;
  } catch (error) {
    console.error('Error calculating stock by category:', error);
    return [];
  }
}

// 2. Stock by Location (bar chart data)
async function calculateStockByLocation(): Promise<LocationStockData[]> {
  try {
    const locationStock = await LocationItemStock.aggregate([
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
          status: LocationItemStatus.ACTIVE // Only count active stock
        }
      },
      {
        $group: {
          _id: '$locationId',
          locationName: { $first: '$location.name' },
          totalQuantity: { $sum: '$quantity' },
          batchCount: { $addToSet: '$batchId' }
        }
      },
      {
        $project: {
          locationId: '$_id',
          locationName: 1,
          totalQuantity: 1,
          batchCount: { $size: '$batchCount' }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    return locationStock;
  } catch (error) {
    console.error('Error calculating stock by location:', error);
    return [];
  }
}

// 3. Expiring Soon Batches (within 30 days)
async function getExpiringBatches(): Promise<ExpiringBatchData[]> {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringBatches = await ProductBatch.aggregate([
      {
        $match: {
          expiryDate: {
            $gte: new Date(),
            $lte: thirtyDaysFromNow
          }
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
          totalQuantity: {
            $sum: '$locationStock.quantity'
          },
          mainLocation: {
            $arrayElemAt: ['$locationStock.locationId', 0]
          }
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
          daysUntilExpiry: {
            $ceil: {
              $divide: [
                { $subtract: ['$expiryDate', new Date()] },
                1000 * 60 * 60 * 24 // milliseconds in a day
              ]
            }
          },
          quantity: '$totalQuantity',
          location: { $ifNull: ['$location.name', 'Unknown'] }
        }
      },
      { $sort: { expiryDate: 1 } }, // Sort by soonest expiry first
      { $limit: 20 } // Limit to top 20 expiring batches
    ]);

    return expiringBatches;
  } catch (error) {
    console.error('Error fetching expiring batches:', error);
    return [];
  }
}

// 4. Damaged / Reserved Stock
async function getDamagedReservedStock(): Promise<DamagedReservedStockData[]> {
  try {
    // Get damaged/reserved stock from all three sources
    const [locationStockResults, personalStockResults, mainStockResults] = await Promise.all([
      // Location Item Stock (damaged status)
      LocationItemStock.aggregate([
        {
          $match: {
            status: { $in: [LocationItemStatus.DAMAGED, LocationItemStatus.RESERVED] }
          }
        },
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
          $project: {
            itemId: '$_id',
            batchId: 1,
            batchNumber: '$batch.batchNumber',
            productName: '$product.name',
            quantity: 1,
            status: 1,
            locationName: '$location.name',
            type: { $literal: 'location' }
          }
        }
      ]),

      // Personal Stock (damaged/lost status)
      PersonalStock.aggregate([
        {
          $match: {
            status: { $in: ['DAMAGED', 'LOST'] }
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
            batchId: 1,
            batchNumber: '$batch.batchNumber',
            productName: '$product.name',
            quantity: 1,
            status: 1,
            userName: '$user.name',
            type: { $literal: 'personal' }
          }
        }
      ]),

      // Main Stock (damaged/reserved status)
      Stock.aggregate([
        {
          $match: {
            status: { $in: ['Damaged', 'Reserved'] }
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
            batchId: 1,
            batchNumber: '$batch.batchNumber',
            productName: '$product.name',
            quantity: 1,
            status: 1,
            userName: '$user.name',
            type: { $literal: 'main' }
          }
        }
      ])
    ]);

    // Combine all results
    const allDamagedReservedStock = [
      ...locationStockResults,
      ...personalStockResults,
      ...mainStockResults
    ];

    // Sort by quantity descending
    return allDamagedReservedStock.sort((a, b) => b.quantity - a.quantity);

  } catch (error) {
    console.error('Error fetching damaged/reserved stock:', error);
    return [];
  }
}

export const dynamic = 'force-dynamic';