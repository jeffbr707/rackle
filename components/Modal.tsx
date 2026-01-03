"use client";

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button
          className="modalClose"
          onClick={onClose}
          aria-label="Close dialog"
          title="Close"
        >
          ×
        </button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
