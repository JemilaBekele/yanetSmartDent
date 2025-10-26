"use client";

import FetchStatic from '@/app/components/invoice/report/j';
import StatisticsTable from '@/app/components/static/StatisticsTable';

export default function Home() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-2 ">
              <div>
                <FetchStatic />
            </div>
            <div>
                <StatisticsTable />
            </div>
          
        </div>
    );
}
