// app/purchases/[id]/page.tsx

import StockLocationMainWithdrawalDetailPage from "@/app/components/inventory/stockwithdrawal/LocMain/view";

interface PurchasePageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PurchasePageProps) {
       return (
            <div className="flex ml-15 mt-10">
              <div className="flex-grow md:ml-60 container mx-auto">
                
        
 <StockLocationMainWithdrawalDetailPage id={params.id} />;              </div>
            </div>
          );
      
}
