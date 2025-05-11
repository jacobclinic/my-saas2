import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { Mail, User, Phone } from 'lucide-react';

interface StudentInvitationFormProps {
  onClose: () => void;
}

export function StudentInvitationForm({ onClose }: StudentInvitationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              className="pl-10"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              className="pl-10"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john.doe@example.com"
            className="pl-10"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+94 71 234 5678"
            className="pl-10"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-neutral-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary-blue-600 hover:bg-primary-blue-700 text-white min-w-[100px]"
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogFooter>
    </form>
  );
}