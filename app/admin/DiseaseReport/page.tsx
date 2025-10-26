"use client";


import DiseaseStatistics from '@/app/components/static/admin/disease';


export default function Disease() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-2 ">
              <div>
                <DiseaseStatistics />
            </div>
            
          
        </div>
    );
}
