// app/purchases/[id]/page.tsx

import StockLocationWithdrawalDetailPage from "@/app/components/inventory/stockwithdrawal/LoctoLoc/view";

interface PurchasePageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PurchasePageProps) {
       return (
            <div className="flex ml-15 mt-10">
              <div className="flex-grow md:ml-60 container mx-auto">
                
        
 <StockLocationWithdrawalDetailPage id={params.id} />;              </div>
            </div>
          );
      
}
