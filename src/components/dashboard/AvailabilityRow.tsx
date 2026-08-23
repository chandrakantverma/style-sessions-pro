import type { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailabilityValues } from "./schemas";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Props = {
  index: number;
  form: UseFormReturn<AvailabilityValues>;
};

export function AvailabilityRow({ index, form }: Props) {
  const isOpen = form.watch(`days.${index}.is_open`);
  const dayOfWeek = form.watch(`days.${index}.day_of_week`);
  const closesError = form.formState.errors.days?.[index]?.closes_at;

  return (
    <div className="grid grid-cols-[120px_auto_1fr_1fr] items-center gap-4">
      <span className="text-sm font-medium text-foreground">{DAY_NAMES[dayOfWeek]}</span>

      <div className="flex items-center gap-2">
        <Switch
          id={`day-${index}-open`}
          checked={isOpen}
          onCheckedChange={(v) => form.setValue(`days.${index}.is_open`, v)}
        />
        <Label htmlFor={`day-${index}-open`} className="text-xs text-muted-foreground">
          {isOpen ? "Open" : "Closed"}
        </Label>
      </div>

      <div>
        <Input
          type="time"
          disabled={!isOpen}
          className="text-sm"
          {...form.register(`days.${index}.opens_at`)}
        />
      </div>

      <div>
        <Input
          type="time"
          disabled={!isOpen}
          className="text-sm"
          {...form.register(`days.${index}.closes_at`)}
        />
        {closesError && (
          <p className="mt-1 text-xs text-destructive">{closesError.message}</p>
        )}
      </div>
    </div>
  );
}
