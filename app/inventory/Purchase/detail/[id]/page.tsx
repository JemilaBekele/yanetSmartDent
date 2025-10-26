// app/purchases/[id]/page.tsx

import PurchaseDetailPage from "@/app/components/inventory/Purchase/view";

interface PurchasePageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PurchasePageProps) {
       return (
            <div className="flex ml-15 mt-10">
              <div className="flex-grow md:ml-60 container mx-auto">
                
        
 <PurchaseDetailPage id={params.id} />;              </div>
            </div>
          );
      
}
