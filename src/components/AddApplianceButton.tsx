interface AddApplianceButtonProps {
  onClick: () => void;
}

export function AddApplianceButton({ onClick }: AddApplianceButtonProps) {
  return (
    <button type="button" className="add-btn" onClick={onClick}>
      + Add Appliance
    </button>
  );
}
