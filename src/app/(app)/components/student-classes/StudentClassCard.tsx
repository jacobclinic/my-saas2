// components/classes/StudentClassList.tsx
'use client'

import React, { useState } from 'react';
import { Card, CardContent } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import {
  Calendar,
  Clock,
  DollarSign
} from 'lucide-react';
import PaymentHistoryDialog from './PaymentHistoryDialog';
import { StudentClassListType } from '~/lib/classes/types/class-v2';

const StudentClassCard = ({ classData }: { classData: StudentClassListType }) => {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {classData?.name || 'Class Name'}
              </h3>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {classData?.schedule || 'Schedule'}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                Next class: {classData?.nextClass || 'Next Class'}
              </div>
            </div>
            <Badge variant="outline">{classData?.subject || 'Subject'}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Monthly Fee</p>
              <p className="font-medium">Rs. {classData?.fee || 'xxx'}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPaymentHistory(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Payment History
            </Button>
          </div>
        </div>
      </CardContent>
      <PaymentHistoryDialog
        open={showPaymentHistory}
        onClose={() => setShowPaymentHistory(false)}
        payments={classData?.payments || []}
      />
    </Card>
  );
};

export default StudentClassCard;