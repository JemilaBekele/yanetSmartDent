import CreatePurchasePage from '@/app/components/inventory/Purchase/create';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Purchase',
  description: 'Page to create a new purchase',
};

export default function NewPurchasePage() {
    return (
        <div className="flex ml-15 mt-10">
          <div className="flex-grow md:ml-60 container mx-auto">
            
    
            <CreatePurchasePage />
          </div>
        </div>
      );
  
}