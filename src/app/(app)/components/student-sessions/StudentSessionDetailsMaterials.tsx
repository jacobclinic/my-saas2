import { Card, CardContent } from '../base-v2/ui/Card';
import { Button } from '../base-v2/ui/Button';
import { File, Download } from 'lucide-react';
import { Material } from '~/lib/sessions/types/upcoming-sessions';

interface StudentSessionDetailsMaterialsProps {
  materials: Material[];
  type: 'upcoming' | 'past' | 'next';
}

const StudentSessionDetailsMaterials = ({
  materials,
  type,
}: StudentSessionDetailsMaterialsProps) => {
  // console.log("materials", materials)
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Class Materials</h2>
      {materials.length > 0 ? (
        <div className="grid gap-3">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border"
            >
              <div className="flex items-center">
                <File className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium">{material.name}</p>
                  <p className="text-sm text-gray-600">{material.file_size}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(material.url || '', '_blank')}
                disabled={!material.url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center p-2 bg-white rounded-lg border">
          <p className="text-gray-500">
            No materials available for this session.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentSessionDetailsMaterials;
