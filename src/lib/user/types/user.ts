interface UserType {
  id: string;
  photo_url?: string | null;
  display_name?: string | null;
  biography?: string | null;
  email?: string;
  phone_number?: string | null;
  status?: string | null;
  bank_details?: any | null;
  user_role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string
}

export default UserType;
// export type { SessionsWithTableData, SessionTableData };