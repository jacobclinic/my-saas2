interface UserType {
  id: string;
  photo_url?: string | null;
  display_name?: string | null;
  biography?: string | null;
  email: string;
  phoneNumber?: string | null;
  status?: string | null;
  bankDetails?: string | null;
  userRole?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export default UserType;
// export type { SessionsWithTableData, SessionTableData };