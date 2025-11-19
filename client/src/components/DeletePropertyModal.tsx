// src/components/DeletePropertyModal.tsx
"use client";

import { useState } from "react";
import { useDeletePropertyMutation } from "@/state/api";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";

interface DeletePropertyModalProps {
  property: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function DeletePropertyModal({
  property,
  open,
  onOpenChange,
  onSuccess,
}: DeletePropertyModalProps) {
  const [deleteProperty, { isLoading, error }] = useDeletePropertyMutation();
  const [confirmText, setConfirmText] = useState("");

  if (!open) return null;

  const handleDelete = async () => {
    try {
      await deleteProperty(property.id).unwrap();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Xóa thất bại:", err);
    }
  };

  const apiError = error as any;
  const isActiveTenant = apiError?.data?.error === "Không thể xóa căn hộ";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
          <h3 className="text-xl font-bold">Xóa căn hộ</h3>
        </div>

        <p className="text-gray-700 mb-4">
          Bạn có chắc chắn muốn xóa <strong>{property.name}</strong>?
        </p>

        {isActiveTenant ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-medium">
              {apiError?.data?.message || "Căn hộ đang có người thuê, không thể xóa."}
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhập <code className="bg-gray-100 px-1 rounded">XÓA</code> để xác nhận
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="XÓA"
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={
              isLoading ||
              (isActiveTenant ? false : confirmText !== "XÓA")
            }
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}