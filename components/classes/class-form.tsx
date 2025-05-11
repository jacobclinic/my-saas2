"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ClassFormProps {
  onSuccess?: () => void;
}

export function ClassForm({ onSuccess }: ClassFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (onSuccess) onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Basic Information
          </h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Input
                id="class-name"
                placeholder="e.g., Physics 2026 A/L Group 1"
                className="focus-visible:ring-primary-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Select>
                  <SelectTrigger
                    id="subject"
                    className="focus-visible:ring-primary-blue-500"
                  >
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="year-grade">Year/Grade</Label>
                <Select>
                  <SelectTrigger
                    id="year-grade"
                    className="focus-visible:ring-primary-blue-500"
                  >
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026 A/L</SelectItem>
                    <SelectItem value="2027">2027 A/L</SelectItem>
                    <SelectItem value="2028">2028 A/L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn in this class..."
                className="focus-visible:ring-primary-blue-500 min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Schedule & Fees
          </h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="starting-date">Starting Date</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Calendar size={16} className="text-neutral-500" />
                </div>
                <Input
                  id="starting-date"
                  type="date"
                  className="pl-10 focus-visible:ring-primary-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="day">Day of Week</Label>
                <Select>
                  <SelectTrigger
                    id="day"
                    className="focus-visible:ring-primary-blue-500"
                  >
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Clock size={16} className="text-neutral-500" />
                  </div>
                  <Input
                    id="start-time"
                    type="time"
                    className="pl-10 focus-visible:ring-primary-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Clock size={16} className="text-neutral-500" />
                  </div>
                  <Input
                    id="end-time"
                    type="time"
                    className="pl-10 focus-visible:ring-primary-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fee">Monthly Fee (Rs.)</Label>
              <Input
                id="fee"
                type="number"
                placeholder="Enter monthly fee amount"
                className="focus-visible:ring-primary-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" className="border-neutral-200">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white min-w-[100px]"
        >
          {loading ? "Creating..." : "Create Class"}
        </Button>
      </DialogFooter>
    </form>
  );
}
