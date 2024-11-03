import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical } from "lucide-react"
import { WallComponent, commonMaterials } from "./types"
import { Checkbox } from "@/components/ui/checkbox"

interface SortableTableRowProps {
  component: WallComponent;
  index: number;
  removeComponent: (id: number) => void;
  updateComponent: (id: number, updates: Partial<WallComponent>) => void;
  calculateRValue: (component: WallComponent) => number;
  toggleStuds: (id: number) => void;
  showStuds: boolean;
}

export function SortableTableRow({ 
  component, 
  index, 
  removeComponent, 
  updateComponent,
  calculateRValue,
  toggleStuds,
  showStuds
}: SortableTableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeComponent(component.id)}
          className="h-8 w-8 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell>
        <Select
          value={component.material}
          onValueChange={(value) => {
            const selectedMaterial = commonMaterials.find(m => m.name === value)
            updateComponent(component.id, {
              material: value,
              conductivity: selectedMaterial ? selectedMaterial.conductivity : 0,
              isInsulation: selectedMaterial ? selectedMaterial.isInsulation : false, // Set isInsulation
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {commonMaterials.map((material) => (
              <SelectItem key={material.name} value={material.name}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={component.thickness}
          onChange={(e) => updateComponent(component.id, { thickness: parseFloat(e.target.value) || 0 })}
          step="1"
          onFocus={(e) => e.target.select()}
        />
      </TableCell>
      <TableCell>{calculateRValue(component).toFixed(3)}</TableCell>
      {showStuds && (
        <TableCell>
          <Checkbox
            checked={component.hasStuds}
            onCheckedChange={() => toggleStuds(component.id)}
            disabled={!component.isInsulation}
          />
          <span className="ml-2">Stud Insulation</span>
        </TableCell>
      )}
    </TableRow>
  );
}
