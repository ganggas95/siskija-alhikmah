"use client";

import { useState } from "react";

import { deleteRegionAction } from "../actions";

type DeleteRegionFormProps = {
  regionId: string;
};

export function DeleteRegionForm({ regionId }: DeleteRegionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action={async (formData) => {
        await deleteRegionAction(formData);
      }}
      onSubmit={(event) => {
        if (!window.confirm("Hapus wilayah ini?")) {
          event.preventDefault();
          return;
        }

        setIsSubmitting(true);
      }}
    >
      <input type="hidden" name="id" value={regionId} />
      <button
        type="submit"
        disabled={isSubmitting}
        className="text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Menghapus..." : "Hapus"}
      </button>
    </form>
  );
}
