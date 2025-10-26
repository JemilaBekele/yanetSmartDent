// app/purchases/[id]/page.tsx

import StockWithdrawalDetailPage from "@/app/components/inventory/stockwithdrawal/view";

interface PurchasePageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PurchasePageProps) {
       return (
            <div className="flex ml-15 mt-10">
              <div className="flex-grow md:ml-60 container mx-auto">
                
        
 <StockWithdrawalDetailPage id={params.id} />;              </div>
            </div>
          );
      
}
