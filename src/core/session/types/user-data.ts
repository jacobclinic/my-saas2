/**
 * This interface represents the user record in the Database
 * Not to be confused with {@link User} defined in Supabase Auth
 * This data is always present in {@link UserSession}
 */
interface UserData {
  id: string;
  photoUrl: string | null;
  displayName: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  address: string | null;
  birthday: string | null;
  city: string | null;
  district: string | null;
}

export default UserData;
