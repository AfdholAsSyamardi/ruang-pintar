"use client";

export default function DeleteConfirmButton({
  action,
  hiddenFields = {},
  confirmMessage = "Apakah Anda yakin ingin menghapus data ini?",
  label = "Hapus",
  className = "px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer",
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {Object.entries(hiddenFields).map(([key, val]) => (
        <input key={key} type="hidden" name={key} value={val} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
