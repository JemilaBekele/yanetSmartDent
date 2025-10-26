
// app/purchases/[id]/page.tsx

import InventoryRequestDetailPage from "@/app/components/inventory/request/view";

interface PurchasePageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PurchasePageProps) {
       return (
            <div className="flex ml-15 mt-10">
              <div className="flex-grow md:ml-60 container mx-auto">
                
        
 <InventoryRequestDetailPage
 id={params.id} />;              </div>
            </div>
          );
      
}
