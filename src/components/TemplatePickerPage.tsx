import type { HouseholdTemplate } from "../types/domain";

interface TemplatePickerPageProps {
  open: boolean;
  templates: HouseholdTemplate[];
  onSelect: (templateId: string) => void;
  onClose: () => void;
  requireSelection?: boolean;
}

export function TemplatePickerPage({ open, templates, onSelect, onClose, requireSelection = false }: TemplatePickerPageProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !requireSelection && onClose()}>
      <div className="modal-card template-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-picker-header">
          <div>
            <h2>Household Templates</h2>
            <p>Choose a pre-defined household to load into memory.</p>
          </div>
          {!requireSelection && (
            <button type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>

        <div className="template-grid">
          {templates.map((template) => (
            <button className="template-card" key={template.id} onClick={() => onSelect(template.id)}>
              <h3>{template.name}</h3>
              <p>{template.bedrooms} bedrooms</p>
              <p>{template.occupants} occupants</p>
              <p>{template.appliances.length} appliances</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
