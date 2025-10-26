

// Dynamically import components
import DynamicLoginForm from '@/app/components/Login'


export default async function SignInPage() {
 

  // Return either LoginForm or ClientSideRedirect based on session state
  return (
    <div>
     
        <>
          
          <DynamicLoginForm />
        </>
    
    </div>
  );
}
