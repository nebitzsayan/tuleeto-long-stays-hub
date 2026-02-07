 import { Suspense } from 'react';
 import { Outlet } from 'react-router-dom';
 import { SidebarProvider } from '@/components/ui/sidebar';
 import { AdminSidebar, AdminMobileHeader } from '@/components/admin/AdminSidebar';
 import { PropertyLoader } from '@/components/ui/property-loader';
 
 const AdminLayout = () => {
   return (
     <SidebarProvider>
       <div className="flex min-h-screen w-full flex-col md:flex-row">
         <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AdminMobileHeader />
            <main className="flex-1 p-2 sm:p-3 md:p-6 lg:p-8 bg-background overflow-x-hidden overflow-y-auto">
             <Suspense
               fallback={
                 <div className="flex items-center justify-center min-h-[50vh]">
                   <PropertyLoader size="lg" text="Loading..." />
                 </div>
               }
             >
               <Outlet />
             </Suspense>
           </main>
         </div>
       </div>
     </SidebarProvider>
   );
 };
 
 export default AdminLayout;