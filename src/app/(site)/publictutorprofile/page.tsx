import { CheckCircle, Calendar, Users } from "lucide-react";
const classes = [
  {
    title: "2024 A/L Revision Batch",
    category: "Accounting",
    description:
      "Final revision batch for 2024 A/L students covering past papers, exam techniques, and comprehensive subject revision",
    schedule: "Every Saturday at 2:00 PM",
    students: 35,
    features: [/*
      "Weekly model papers",
      "Personal progress tracking",
      "24/7 doubt clearing via WhatsApp",
      "Printed materials provided",*/
    ],
    price: "Rs. 4,000 per month",
    day: "Every Saturday",
  },
  {
    title: "2025 A/L Regular Batch",
    category: "Accounting",
    description:
      "Complete A/L accounting syllabus coverage with focus on fundamentals and advanced concepts",
    schedule: "Every Sunday at 8:00 AM",
    students: 40,
    features: [/*
      "Structured syllabus coverage",
      "Monthly assessments",
      "Study materials included",
      "Parent-teacher meetings",*/
    ],
    price: "Rs. 3,500 per month",
    day: "Every Sunday",
  },
  {
    title: "2025 A/L Paper Class",
    category: "Accounting",
    description:
      "Special paper class focusing on exam techniques and problem-solving strategies",
    schedule: "Every Wednesday at 4:00 PM",
    students: 25,
    features: [/*
      "Weekly past paper discussion",
      "Exam-oriented practice",
      "Performance analysis",
      "Extra support for weak areas",*/
    ],
    price: "Rs. 3,000 per month",
    day: "Every Wednesday",
  },
];




export default function Tutorprofilepage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      
      {/* Teacher Profile Section */}

      <div className="border p-6 rounded-lg shadow-md flex flex-col items-center text-center">
        <img
          src="/path-to-image.jpg"
          alt=""
          className="w-36 h-36 md:w-40 md:h-40 rounded-full object-cover bg-gray-300 border mb-4"
        />
        <div className="text-left w-full">
          <h1 className="text-xl font-bold">Kumara Perera</h1>
          <span className="px-2 py-1 text-sm bg-gray-200 rounded font-bold">Accounting</span>
          <div className="mt-2 text-gray-600 text-sm">
            <p>📅 12+ years teaching A/L Accounting</p>
            <p>🎓 BSc in Accounting (Special), University of Sri Jayewardenepura</p>
          </div>
          <p className="mt-4 text-gray-700">
            Experienced A/L Accounting teacher specializing in exam techniques and practical applications. My students
            consistently achieve excellent results in A/L examinations.
          </p>
        </div>
      </div>

      {/* Classes Section */}
      <div>
        <h1 className="text-2xl font-bold mb-4">A/L Accounting Classes</h1>
        <div className="space-y-6">
          {classes.map((cls, index) => (
            <div key={index} className="border p-4 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{cls.title}</h2>
            <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
             Join Class
             </button>
              </div>

              <p className="text-blue-600 text-sm mb-2">{cls.category}</p>
              <p className="mb-2">{cls.description}</p>
              <div className="flex justify-between items-center text-sm mb-2">
                 <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" /> {cls.schedule}
                           </div>
                   <div className="flex items-center text-grey-600">
                   <Users className="h-4 w-4 mr-2" /> {cls.students} students
                     </div>
                    </div>

              <ul className="text-sm text-gray-700 mb-2">
                {cls.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold mb-2">
                     <p>{cls.price}</p>
                     <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full">{cls.day}</span>
                    </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
