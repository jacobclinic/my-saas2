'use client';

import React from 'react';
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
} from 'lucide-react';
import UserType from '~/lib/user/types/user';

// Extended UserType to include additional tutor-specific fields
interface ExtendedUserType extends UserType {
  activeClassesCount?: number;
}

interface TutorViewProps {
  open: boolean;
  onClose: () => void;
  tutor: ExtendedUserType | null;
}

const TutorView: React.FC<TutorViewProps> = ({ open, onClose, tutor }) => {
  if (!tutor) return null;

  const handleViewIdentityProof = () => {
    if (tutor.identity_url) {
      window.open(tutor.identity_url, '_blank');
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

        {/* Identity Verification */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-600">
            Identity Verification
          </h3>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Proof of Identity</p>
              <p className="font-medium">
                {tutor.identity_url
                  ? 'Document uploaded and verified'
                  : 'No document uploaded'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tutor.identity_url && (
                <>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Verified
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewIdentityProof}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Document
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default TutorView;
