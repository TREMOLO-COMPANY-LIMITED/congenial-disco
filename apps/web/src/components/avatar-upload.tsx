"use client";

import { useState, useRef } from "react";
import { Button } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@starter/shared";
import type { PresignedUrlResponse } from "@starter/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type AvatarUploadProps = {
  currentImageUrl?: string | null;
  onUploadComplete?: (newImageUrl: string) => void;
};

export function AvatarUpload({
  currentImageUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPublicUrl, setLastPublicUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || currentImageUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      setError("JPEG、PNG、WebP、GIF形式のみ対応しています");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("ファイルサイズは5MB以下にしてください");
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    uploadFile(file);
  };

  const retryUpdateUser = async (publicUrl: string) => {
    setUploading(true);
    setError(null);
    try {
      const { error: updateError } = await authClient.updateUser({
        image: publicUrl,
      });
      if (updateError) {
        throw new Error(updateError.message ?? "プロフィールの更新に失敗しました");
      }
      setLastPublicUrl(null);
      onUploadComplete?.(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "プロフィールの更新に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setLastPublicUrl(null);

    try {
      // Step 1: Get presigned URL
      const res = await fetch(`${API_URL}/api/upload/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `アップロードURLの取得に失敗しました (${res.status})`);
      }

      const { presignedUrl, publicUrl }: PresignedUrlResponse = await res.json();

      // Step 2: Upload to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("画像のアップロードに失敗しました");
      }

      // Step 3: Update user profile via Better Auth
      const { error: updateError } = await authClient.updateUser({
        image: publicUrl,
      });

      if (updateError) {
        // R2 upload succeeded but DB update failed — retain publicUrl for retry
        setLastPublicUrl(publicUrl);
        throw new Error(updateError.message ?? "プロフィールの更新に失敗しました。リトライボタンで再試行できます。");
      }

      onUploadComplete?.(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "アップロードに失敗しました");
      // Keep preview so user sees the uploaded image
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="プロフィール画像"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400 text-2xl">
            ?
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-sm text-white">アップロード中...</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "アップロード中..." : "画像を変更"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {lastPublicUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => retryUpdateUser(lastPublicUrl)}
          disabled={uploading}
        >
          プロフィール更新をリトライ
        </Button>
      )}
    </div>
  );
}
