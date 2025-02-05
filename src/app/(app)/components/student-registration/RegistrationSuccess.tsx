// app/registration/success/page.tsx
'use client'

import React from 'react';
import { Card, CardContent } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import {
 Copy,
 LogIn,
 Calendar,
 Clock,
 Link2,
 File,
 BookOpen,
 Check
} from 'lucide-react';

interface RegistrationSuccessProps {
 studentDetails: {
   username: string;
   password: string;
   email: string;
   nextClass: {
     date: string;
     time: string;
     zoomLink: string;
   };
   materials: {
     name: string;
     link: string;
   }[];
 };
}

const RegistrationSuccess = ({ studentDetails }: RegistrationSuccessProps) => {
 const [linkCopied, setLinkCopied] = React.useState<{[key: string]: boolean}>({});

 const handleCopy = (text: string, key: string) => {
   navigator.clipboard.writeText(text);
   setLinkCopied({ ...linkCopied, [key]: true });
   setTimeout(() => {
     setLinkCopied({ ...linkCopied, [key]: false });
   }, 2000);
 };

 return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
     <Card className="w-full max-w-2xl">
       <CardContent className="p-6 space-y-6">
         <h1 className="text-2xl font-bold text-blue-600 text-center">Welcome to Comma Education!</h1>

         {/* Next Class Info */}
         <div className="bg-green-50 p-4 rounded-lg space-y-3">
           <h3 className="font-medium">Your Next Class</h3>
           <div className="space-y-2">
             <div className="flex items-center text-gray-600">
               <Calendar className="h-4 w-4 mr-2" />
               {studentDetails.nextClass.date}
             </div>
             <div className="flex items-center text-gray-600">
               <Clock className="h-4 w-4 mr-2" />
               {studentDetails.nextClass.time}
             </div>
             <Button
               variant="outline"
               className="w-full"
               onClick={() => handleCopy(studentDetails.nextClass.zoomLink, 'zoom')}
             >
               {linkCopied.zoom ? (
                 <Check className="h-4 w-4 mr-2" />
               ) : (
                 <Link2 className="h-4 w-4 mr-2" />
               )}
               {linkCopied.zoom ? 'Zoom Link Copied!' : 'Copy Zoom Link'}
             </Button>
           </div>
         </div>

         {/* Portal Access */}
         <Card>
           <CardContent className="p-4 space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="font-medium">Student Portal Access</h3>
               <Badge variant="outline">Important</Badge>
             </div>
             
             <div className="space-y-3">
               <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                 <div>
                   <p className="text-sm text-gray-600">Username</p>
                   <p className="font-medium">{studentDetails.username}</p>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => handleCopy(studentDetails.username, 'username')}
                 >
                   {linkCopied.username ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                 </Button>
               </div>

               <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                 <div>
                   <p className="text-sm text-gray-600">Password</p>
                   <p className="font-medium">{studentDetails.password}</p>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => handleCopy(studentDetails.password, 'password')}
                 >
                   {linkCopied.password ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                 </Button>
               </div>
             </div>

             <Alert className="bg-blue-50 border-blue-200">
               <BookOpen className="h-4 w-4 text-blue-600" />
               <AlertDescription className="text-blue-700">
                 Use these credentials to access class materials, recordings, and zoom links
               </AlertDescription>
             </Alert>

             <Button className="w-full" onClick={() => window.location.href = '/portal/login'}>
               <LogIn className="h-4 w-4 mr-2" />
               Go to Student Portal
             </Button>
           </CardContent>
         </Card>

         {/* Class Materials */}
         {studentDetails.materials.length > 0 && (
           <div className="space-y-3">
             <h3 className="font-medium">Class Materials</h3>
             {studentDetails.materials.map((material, index) => (
               <Button
                 key={index}
                 variant="outline"
                 className="w-full justify-between"
                 onClick={() => handleCopy(material.link, `material-${index}`)}
               >
                 <div className="flex items-center">
                   <File className="h-4 w-4 mr-2 text-blue-600" />
                   {material.name}
                 </div>
                 {linkCopied[`material-${index}`] ? (
                   <Check className="h-4 w-4" />
                 ) : (
                   <Link2 className="h-4 w-4" />
                 )}
               </Button>
             ))}
           </div>
         )}

         <Alert className="bg-green-50 border-green-200">
           <BookOpen className="h-4 w-4 text-green-600" />
           <AlertDescription className="text-green-700">
             We&apos;ve sent these details to your email ({studentDetails.email}). Please check your inbox!
           </AlertDescription>
         </Alert>
       </CardContent>
     </Card>
   </div>
 );
};

export default RegistrationSuccess;