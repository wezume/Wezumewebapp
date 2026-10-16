import { useState } from "react";
import { trustApi, useAdminAuth } from "../../context/AdminAuthContext";

// Shared by InstitutesRow (logos) and WorkshopsRow (photos). Immediately
// uploads on file select and reports the resulting URL back to the parent
// via onUploaded -- the parent decides whether that's a new tile's draft
// field or a PUT to replace an existing tile's image.
export default function ImageUploadField({ value, onUploaded, label = "Image" }) {
  const { authHeaders } = useAdminAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    trustApi
      .post("/uploads/image", formData, authHeaders())
      .then((res) => onUploaded(res.data.url))
      .catch((err) => setError(err.response?.data?.message || "Upload failed"))
      .finally(() => setUploading(false));
  }

  return (
    <div className="flex items-center gap-2">
      {value && (
        <img
          src={value}
          alt=""
          className="w-8 h-8 object-contain border border-gray-200 rounded bg-white flex-shrink-0"
        />
      )}
      <label
        className={`flex-1 text-[10px] text-center rounded px-2 py-1.5 cursor-pointer border border-dashed transition-colors ${
          uploading
            ? "border-gray-200 text-gray-400"
            : "border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600"
        }`}
      >
        {uploading ? "Uploading…" : value ? `Replace ${label}` : `Upload ${label}`}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
      {error && <span className="text-[10px] text-red-600 flex-shrink-0">{error}</span>}
    </div>
  );
}
