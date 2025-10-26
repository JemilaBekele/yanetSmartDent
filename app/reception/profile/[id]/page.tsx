"use client";


import EditUser from '@/app/components/profile/iduserprofile'

 // Import Spinner component

type UserDetailsProps = {
  params: {
    id: string;
  };
};
export default function Profile({ params }: UserDetailsProps) {
 
  // Once loading is complete, render the actual content
  return (

    <div >
      <EditUser params={params} />
      
    </div>
  );
}
