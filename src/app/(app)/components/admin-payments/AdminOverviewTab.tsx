// 'use client'

// import React from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
// import { Button } from "../base-v2/ui/Button";
// import { Badge } from "../base-v2/ui/Badge";
// import { DollarSign, Clock, ArrowRight } from 'lucide-react';

// interface PaymentSummary {
//   total: number;
//   pending: number;
//   pendingVerification: number;
//   verified: number;
//   rejected: number;
//   totalVerifiedAmount: number;
// }

// interface AdminOverviewTabProps {
//   paymentSummary: PaymentSummary | null;
//   isLoading: boolean;
//   onTabChange: (tab: string) => void;
// }

// const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ 
//   paymentSummary, 
//   isLoading, 
//   onTabChange 
// }) => {
//   return (
//     <div className="space-y-6">
//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex justify-between items-start">
//               <div className="space-y-2">
//                 <p className="text-sm text-gray-500">Total Payments</p>
//                 <p className="text-3xl font-bold">
//                   {isLoading ? (
//                     <span className="animate-pulse">...</span>
//                   ) : (
//                     paymentSummary?.total || 0
//                   )}
//                 </p>
//               </div>
//               <div className="p-2 bg-blue-100 rounded-full">
//                 <DollarSign className="h-5 w-5 text-blue-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex justify-between items-start">
//               <div className="space-y-2">
//                 <p className="text-sm text-gray-500">Pending Review</p>
//                 <p className="text-3xl font-bold text-amber-600">
//                   {isLoading ? (
//                     <span className="animate-pulse">...</span>
//                   ) : (
//                     (paymentSummary?.pending || 0) + (paymentSummary?.pendingVerification || 0)
//                   )}
//                 </p>
//               </div>
//               <div className="p-2 bg-amber-100 rounded-full">
//                 <Clock className="h-5 w-5 text-amber-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex justify-between items-start">
//               <div className="space-y-2">
//                 <p className="text-sm text-gray-500">Verified Payments</p>
//                 <p className="text-3xl font-bold text-green-600">
//                   {isLoading ? (
//                     <span className="animate-pulse">...</span>
//                   ) : (
//                     paymentSummary?.verified || 0
//                   )}
//                 </p>
//               </div>
//               <div className="p-2 bg-green-100 rounded-full">
//                 <DollarSign className="h-5 w-5 text-green-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex justify-between items-start">
//               <div className="space-y-2">
//                 <p className="text-sm text-gray-500">Total Amount</p>
//                 <p className="text-3xl font-bold">
//                   {isLoading ? (
//                     <span className="animate-pulse">...</span>
//                   ) : (
//                     `Rs. ${(paymentSummary?.totalVerifiedAmount || 0).toLocaleString()}`
//                   )}
//                 </p>
//               </div>
//               <div className="p-2 bg-purple-100 rounded-full">
//                 <DollarSign className="h-5 w-5 text-purple-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
      
//       {/* Quick Access Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <Card className="flex flex-col justify-between">
//           <CardHeader>
//             <CardTitle className="flex justify-between items-center">
//               <span>Student Payments</span>
//               <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 min-w-20">
//                 {isLoading ? '...' : ((paymentSummary?.pending || 0) + (paymentSummary?.pendingVerification || 0))} Pending
//               </Badge>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="mb-4 text-gray-600">
//               There are {isLoading ? '...' : ((paymentSummary?.pending || 0) + (paymentSummary?.pendingVerification || 0))} student payments waiting for review.
//             </p>
//             <Button 
//               className="w-full"
//               onClick={() => {
//                 onTabChange('student-payments');
//                 console.log("AdminOverviewTab-Review Payments-button-clicked", 'student-payments');
//               }}
//             >
//               Review Payments
//               <ArrowRight className="ml-2 h-4 w-4" />
//             </Button>
//           </CardContent>
//         </Card>
        
//         <Card className="flex flex-col justify-between">
//           <CardHeader>
//             <CardTitle className="flex justify-between items-center">
//               <span>Tutor Payouts</span>
//               <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
//                 Monthly
//               </Badge>
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="mb-4 text-gray-600">
//               Manage tutor payments and process monthly payouts.
//             </p>
//             <Button 
//               className="w-full"
//               onClick={() => {
//                 onTabChange('tutor-payments');
//                 console.log("AdminOverviewTab-View Tutor Payments-button-clicked", 'tutor-payments');
//               }}
//             >
//               View Tutor Payments
//               <ArrowRight className="ml-2 h-4 w-4" />
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default AdminOverviewTab; 

'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { DollarSign, Clock, ArrowRight, AlertCircle } from 'lucide-react';

interface PaymentSummary {
  total: number;
  pending: number;
  pendingVerification: number;
  verified: number;
  rejected: number;
  notPaid: number;
  totalVerifiedAmount: number;
}

interface AdminOverviewTabProps {
  paymentSummary: PaymentSummary | null;
  isLoading: boolean;
  onTabChange: (tab: string) => void;
}

const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({ 
  paymentSummary, 
  isLoading, 
  onTabChange 
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-3xl font-bold">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    paymentSummary?.total || 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-amber-600">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    (paymentSummary?.pending || 0) + (paymentSummary?.pendingVerification || 0)
                  )}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-full">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Verified Payments</p>
                <p className="text-3xl font-bold text-green-600">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    paymentSummary?.verified || 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Not Paid</p>
                <p className="text-3xl font-bold text-gray-600">
                  {isLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    paymentSummary?.notPaid || 0
                  )}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Student Payments</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 min-w-20">
                {isLoading ? '...' : ((paymentSummary?.pending || 0) + (paymentSummary?.pendingVerification || 0))} Pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              There are {isLoading ? '...' : ((paymentSummary?.pending || 0) + (paymentSummary?.pendingVerification || 0))} student payments waiting for review.
            </p>
            <Button 
              className="w-full"
              onClick={() => {
                onTabChange('student-payments');
                console.log("AdminOverviewTab-Review Payments-button-clicked", 'student-payments');
              }}
            >
              Review Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Tutor Payouts</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                Monthly
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Manage tutor payments and process monthly payouts.
            </p>
            <Button 
              className="w-full"
              onClick={() => {
                onTabChange('tutor-payments');
                console.log("AdminOverviewTab-View Tutor Payments-button-clicked", 'tutor-payments');
              }}
            >
              View Tutor Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewTab;