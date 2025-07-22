'use client';

import React, { useState } from 'react';
import BaseDialog from '../base-v2/BaseDialog';
import { Button } from '../base-v2/ui/Button';
import { Badge } from '../base-v2/ui/Badge';
import {
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import UserType from '~/lib/user/types/user';
import { approveTutorAction } from '~/lib/user/actions/approve-tutor-action';
import { toast } from 'sonner';

// Extended UserType to include additional tutor-specific fields
interface ExtendedUserType extends UserType {
  activeClassesCount?: number;
}

interface TutorViewProps {
  open: boolean;
  onClose: () => void;
  tutor: ExtendedUserType | null;
  onTutorUpdate?: (updatedTutor: ExtendedUserType) => void;
}

const TutorView: React.FC<TutorViewProps> = ({
  open,
  onClose,
  tutor,
  onTutorUpdate,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!tutor) return null;

  const handleViewIdentityProof = () => {
    if (tutor.identity_url) {
      window.open(tutor.identity_url, '_blank');
    }
  };

  const handleApproveReject = async (approve: boolean) => {
    if (!tutor.id) return;

    setIsProcessing(true);
    try {
      const result = await approveTutorAction(tutor.id, approve);

      if (result.success) {
        toast.success(
          approve
            ? 'Tutor approved successfully!'
            : 'Tutor rejected successfully!',
        );
        // Update the tutor with the new status and approval state
        const updatedTutor = {
          ...tutor,
          status: approve ? 'ACTIVE' : 'REJECTED',
          is_approved: approve,
        };
        onTutorUpdate?.(updatedTutor);
        onClose();
      } else {
        toast.error(result.error || 'Failed to update tutor status');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error updating tutor status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Active
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Pending
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Inactive
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Tutor Details"
      maxWidth="2xl"
      showCloseButton={true}
      closeButtonText="Close"
    >
      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{tutor.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{tutor.phone_number || '-'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {tutor.birthday
                    ? new Date(tutor.birthday).toLocaleDateString()
                    : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Education Level</p>
                <p className="font-medium">{tutor.education_level || '-'}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 md:col-span-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {tutor.address ||
                    (tutor.city && tutor.district
                      ? `${tutor.city}, ${tutor.district}`
                      : tutor.city || tutor.district || '-')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Teaching Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects_teach && tutor.subjects_teach.length > 0 ? (
                  tutor.subjects_teach.map((subject, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      {subject}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Preferred Class Size</p>
              <p className="font-medium">
                {tutor.class_size ? `${tutor.class_size} students` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            Status Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Current Status</p>
              {getStatusBadge(tutor.status)}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Active Classes</p>
              <p className="font-medium">
                {tutor.activeClassesCount || 0} classes
              </p>
            </div>
          </div>
        </div>

        {/* Identity Proof */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            Identity Proof
          </h3>

          {tutor.identity_url ? (
            <div className="bg-gray-50 border rounded-lg p-1">
              <div className="relative overflow-hidden rounded">
                <a
                  href={tutor.identity_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full shadow-md z-10"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </a>

                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-6">
                  <div className="text-center space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-blue-500" />
                    <p className="text-gray-700">
                      Identity proof document available
                    </p>
                    <Button
                      variant="default"
                      onClick={handleViewIdentityProof}
                      className="inline-flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Identity Proof
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 italic">
                No identity proof available
              </p>
            </div>
          )}

          {/* Approval Actions - Show only if identity proof is uploaded and tutor is not already approved/rejected */}
          {tutor.identity_url &&
            tutor.status !== 'ACTIVE' &&
            tutor.status !== 'REJECTED' && (
              <div className="flex justify-end gap-2 w-full">
                <Button
                  variant="destructive"
                  onClick={() => handleApproveReject(false)}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleApproveReject(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isProcessing ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            )}

          {/* Show current approval status */}
          {(tutor.status === 'ACTIVE' || tutor.status === 'REJECTED') && (
            <div
              className={`border rounded-lg p-4 ${
                tutor.status === 'ACTIVE'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {tutor.status === 'ACTIVE' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      tutor.status === 'ACTIVE'
                        ? 'text-green-900'
                        : 'text-red-900'
                    }`}
                  >
                    {tutor.status === 'ACTIVE'
                      ? 'Tutor Approved'
                      : 'Tutor Rejected'}
                  </p>
                  <p
                    className={`text-sm ${
                      tutor.status === 'ACTIVE'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {tutor.status === 'ACTIVE'
                      ? 'This tutor has been approved and can start teaching'
                      : 'This tutor application has been rejected'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseDialog>
  );
};

export default TutorView;
