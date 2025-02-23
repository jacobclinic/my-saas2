import { Badge } from "../base-v2/ui/Badge";
import { Calendar, Clock } from 'lucide-react';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { SessionStudentTableData } from "~/lib/sessions/types/upcoming-sessions";

interface StudentSessionDetailsHeadersProps {
    sessionData: SessionStudentTableData;
    type: "upcoming" | "past" | "next";
}

const StudentSessionDetailsHeader = ({ sessionData, type }: StudentSessionDetailsHeadersProps) => (
  <div className="space-y-3">
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-semibold">{sessionData.name}</h1>
        <p className="text-lg text-blue-600 mt-1">{sessionData.topic}</p>
      </div>
      {type !== 'past' && sessionData.paymentStatus === PAYMENT_STATUS.PENDING && (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
          Payment Pending
        </Badge>
      )}
    </div>
    <div className="flex items-center space-x-6 text-gray-600">
      <div className="flex items-center">
        <Calendar className="h-5 w-5 mr-2" />
        {sessionData.date}
      </div>
      <div className="flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        {sessionData.time}
      </div>
    </div>
  </div>
);

export default StudentSessionDetailsHeader;