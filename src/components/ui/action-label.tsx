import type { LucideIcon } from "lucide-react";
import {
  Check,
  Download,
  FileOutput,
  FileSpreadsheet,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

const actionIcons = {
  add: Plus,
  cancel: X,
  delete: Trash2,
  download: Download,
  edit: Pencil,
  export: FileOutput,
  filter: Filter,
  import: Upload,
  reset: RotateCcw,
  search: Search,
  submit: Check,
  template: FileSpreadsheet,
} satisfies Record<string, LucideIcon>;

export type ActionIconName = keyof typeof actionIcons;

type ActionLabelProps = {
  action: ActionIconName;
  children: ReactNode;
  className?: string;
};

/** Standard visual treatment for text action buttons. */
export function ActionLabel({ action, children, className }: ActionLabelProps) {
  const Icon = actionIcons[action];

  return (
    <span className={`inline-flex items-center justify-center gap-2 ${className ?? ""}`}>
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </span>
  );
}
