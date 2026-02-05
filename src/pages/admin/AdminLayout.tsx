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
         <div className="flex-1 flex flex-col">
           <AdminMobileHeader />
           <main className="flex-1 p-4 md:p-8 bg-background overflow-auto">
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