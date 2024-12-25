'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../base-v2/ui/Card";
import { Button } from "../base-v2/ui/Button";
import { Badge } from "../base-v2/ui/Badge";
import { Alert, AlertDescription } from "../base-v2/ui/Alert";
import { Input } from "../base-v2/ui/Input";
import {
  Video,
  FileText,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Link2,
  Info,
  User,
  Key,
  LogIn
} from 'lucide-react';

const StudentRegistration = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    parentName: '',
    hometown: '',
    address: '',
    year: '2024'
  });
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState({});

  // Sample class data
  const classData = {
    name: "2025 A/L Accounting - Batch 04",
    nextClass: {
      date: "Monday, Dec 18, 2024",
      time: "4:00 PM - 6:00 PM",
      zoomLink: "https://zoom.us/j/123456789",
    },
    materials: [
      { name: "Manufacturing Accounts Notes.pdf", link: "https://example.com/materials/1" },
      { name: "Practice Problems Set.pdf", link: "https://example.com/materials/2" }
    ],
    portal: {
      username: "student2024",
      password: "welcome123"
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(?:\+94|0)?[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid Sri Lankan phone number';
    }
    if (formData.secondaryPhone.trim() && !/^(?:\+94|0)?[0-9]{9}$/.test(formData.secondaryPhone.replace(/\s/g, ''))) {
      newErrors.secondaryPhone = 'Invalid Sri Lankan phone number';
    }
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
    if (!formData.hometown.trim()) newErrors.hometown = 'Hometown is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.year.trim()) newErrors.year = 'Year is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleCopy = (type, text) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-blue-600">
            {step === 1 ? 'Join Your Class' : 'Welcome to Comma Education!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="font-semibold text-lg mb-2">{classData.name}</h2>
                <p className="text-blue-600">Next Class: {classData.nextClass.date}</p>
                <p className="text-blue-600">{classData.nextClass.time}</p>
              </div>

              <div className="space-y-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Personal Information</h3>
                  
                  <div>
                    <Input
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Input
                      placeholder="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        placeholder="Phone Number (Ex: 077 123 4567)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <Input
                        placeholder="Secondary Phone (Optional)"
                        value={formData.secondaryPhone}
                        onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                        className={errors.secondaryPhone ? 'border-red-500' : ''}
                      />
                      {errors.secondaryPhone && <p className="text-red-500 text-sm mt-1">{errors.secondaryPhone}</p>}
                    </div>
                  </div>

                  <div>
                    <Input
                      placeholder="Parent/Guardian Name"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className={errors.parentName ? 'border-red-500' : ''}
                    />
                    {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName}</p>}
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Location Information</h3>
                  
                  <div>
                    <Input
                      placeholder="Hometown"
                      value={formData.hometown}
                      onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
                      className={errors.hometown ? 'border-red-500' : ''}
                    />
                    {errors.hometown && <p className="text-red-500 text-sm mt-1">{errors.hometown}</p>}
                  </div>

                  <div>
                    <Input
                      placeholder="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>
                </div>

                {/* Academic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Academic Information</h3>
                  
                  <div>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className={`w-full h-10 px-3 rounded-md border ${errors.year ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="2024">A/L 2024</option>
                      <option value="2025">A/L 2025</option>
                      <option value="2026">A/L 2026</option>
                    </select>
                    {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-lg"
                onClick={handleSubmit}
              >
                Complete Registration
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Next Class Info */}
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h3 className="font-medium">Your Next Class</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">{classData.nextClass.date}</p>
                  <p className="text-gray-600">{classData.nextClass.time}</p>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleCopy('zoom', classData.nextClass.zoomLink)}
                  >
                    {copied.zoom ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Video className="h-4 w-4 mr-2" />
                    )}
                    {copied.zoom ? 'Zoom Link Copied!' : 'Copy Zoom Link'}
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
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Username</p>
                          <p className="font-medium">{classData.portal.username}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('username', classData.portal.username)}
                      >
                        {copied.username ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center">
                        <Key className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Password</p>
                          <p className="font-medium">{classData.portal.password}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy('password', classData.portal.password)}
                      >
                        {copied.password ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
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
              <div className="space-y-3">
                <h3 className="font-medium">Class Materials</h3>
                <div className="space-y-2">
                  {classData.materials.map((material, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between text-left"
                      onClick={() => handleCopy(`material-${index}`, material.link)}
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="truncate">{material.name}</span>
                      </div>
                      {copied[`material-${index}`] ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : (
                        <Link2 className="h-4 w-4 shrink-0" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <BookOpen className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  We've sent these details to your email ({formData.email}). Please check your inbox!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegistration;