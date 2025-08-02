interface UserType {
  id: string;
  photo_url?: string | null;
  display_name?: string | null;
  biography?: string | null;
  email?: string;
  phone_number?: string | null;
  address?: string | null;
  status?: string | null;
  bank_details?: any | null;
  user_role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
  is_approved?: boolean;
  subjects_teach?: string[] | null;
  birthday?: string | null;
  education_level?: string | null;
  class_size?: string | null;
  identity_url?: string | null;
  district?: string | null;
  city?: string | null;
}

export default UserType;
