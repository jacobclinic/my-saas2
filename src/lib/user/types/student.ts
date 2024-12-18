import UserType from "./user";

interface StudentType extends UserType {

}

// Extended Students Type for fetched data
interface StudentsWithTableData extends StudentType {
  name: string;
}

type StudentTableData = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
  action: string;
};

export default StudentType;
export type { StudentsWithTableData, StudentTableData };