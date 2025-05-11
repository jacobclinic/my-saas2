"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserCircle, Mail, Calendar, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover rounded-full" />
              ) : (
                <UserCircle className="h-24 w-24 text-muted-foreground" />
              )}
            </Avatar>
            {isEditing && (
              <div className="absolute bottom-0 right-0">
                <Label htmlFor="picture" className="cursor-pointer">
                  <div className="rounded-full bg-primary-blue-600 p-2 text-white hover:bg-primary-blue-700">
                    <Upload size={16} />
                  </div>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue="John"
                disabled={!isEditing}
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue="Doe"
                disabled={!isEditing}
                className="max-w-md"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2 text-muted-foreground max-w-md">
              <Mail className="h-4 w-4" />
              <span>user@example.com</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              disabled={!isEditing}
              className="max-w-2xl h-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Member Since</Label>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>January 2024</span>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              variant={isEditing ? "outline" : "default"}
              className={isEditing ? "" : "bg-primary-blue-600 hover:bg-primary-blue-700 text-white"}
              onClick={() => {
                if (isEditing) {
                  // Save changes logic here
                }
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}