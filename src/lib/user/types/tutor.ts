import UserType from "./user";

interface TutorType extends UserType {

}

// Extended Tutors Type for fetched data
interface TutorsWithTableData extends TutorType {
  name: string;
}

type TutorTableData = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
  action: string;
};

export default TutorType;
export type { TutorsWithTableData, TutorTableData };