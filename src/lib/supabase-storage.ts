import { createClient } from "@supabase/supabase-js";

const allowedLogoTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

const maxLogoSizeBytes = 2 * 1024 * 1024;

function getStorageConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "organization-assets";

  if (!url || !serviceRoleKey) {
    throw new Error("Konfigurasi Supabase Storage belum tersedia di environment.");
  }

  return { url, serviceRoleKey, bucket };
}

function getStorageClient() {
  const config = getStorageConfig();
  return {
    client: createClient(config.url, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    bucket: config.bucket,
  };
}

export function validateLogoFile(file: File) {
  const extension = allowedLogoTypes.get(file.type);
  if (!extension) {
    throw new Error("Logo harus berformat PNG, JPG, atau WEBP.");
  }

  if (file.size <= 0 || file.size > maxLogoSizeBytes) {
    throw new Error("Ukuran logo maksimal 2 MB.");
  }

  return extension;
}

export async function uploadOrganizationLogo(file: File, profileId: string) {
  const extension = validateLogoFile(file);
  const { client, bucket } = getStorageClient();
  const path = `profiles/${profileId}/logo-${Date.now()}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Logo gagal diunggah: ${error.message}`);
  return path;
}

export async function createOrganizationLogoSignedUrl(path: string | null) {
  if (!path) return null;
  const { client, bucket } = getStorageClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
