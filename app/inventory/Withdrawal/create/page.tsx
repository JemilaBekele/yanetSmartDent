import CreateWithdrawalRequestPage from '@/app/components/inventory/WithdrawalRequests/create';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Withdrawal Request',
  description: 'Page to create a new inventory withdrawal request',
};

export default function NewWithdrawalRequestPage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <CreateWithdrawalRequestPage />
      </div>
    </div>
  );
}
