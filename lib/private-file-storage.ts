import { createClient } from "@supabase/supabase-js";

export type PrivateBucket = "uploads" | "result";

const SUPABASE_BUCKET_NAME =
  process.env.PRIVATE_FILES_BUCKET?.trim() || "documentos-privados";

let cachedClient:
  | ReturnType<typeof createClient>
  | null = null;

function getSupabaseAdminClient() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL não configurada.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

function assertValidSavedName(savedName: string) {
  if (!savedName || !savedName.trim()) {
    throw new Error("Nome de arquivo privado inválido.");
  }

  if (
    savedName.includes("..") ||
    savedName.includes("/") ||
    savedName.includes("\\")
  ) {
    throw new Error("Nome de arquivo privado inseguro.");
  }
}

function buildObjectPath(bucket: PrivateBucket, savedName: string) {
  assertValidSavedName(savedName);
  return `${bucket}/${savedName}`;
}

export async function ensurePrivateRootDir() {
  return;
}

export function getPrivateBucketDir(bucket: PrivateBucket) {
  return bucket;
}

export function getPrivateFilePath(bucket: PrivateBucket, savedName: string) {
  return buildObjectPath(bucket, savedName);
}

export async function ensurePrivateBucket(bucket: PrivateBucket) {
  return bucket;
}

export async function savePrivateFile(
  bucket: PrivateBucket,
  savedName: string,
  buffer: Buffer,
  contentType = "application/octet-stream"
) {
  const supabase = getSupabaseAdminClient();
  const objectPath = buildObjectPath(bucket, savedName);

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .upload(objectPath, buffer, {
      upsert: true,
      contentType,
      cacheControl: "0",
    });

  if (error) {
    throw new Error(`Erro ao enviar arquivo para o Supabase: ${error.message}`);
  }

  return objectPath;
}

export async function readPrivateFile(
  bucket: PrivateBucket,
  savedName: string
) {
  const supabase = getSupabaseAdminClient();
  const objectPath = buildObjectPath(bucket, savedName);

  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .download(objectPath);

  if (error) {
    throw new Error(`Erro ao ler arquivo privado: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deletePrivateFile(
  bucket: PrivateBucket,
  savedName?: string | null
) {
  if (!savedName) return;

  const supabase = getSupabaseAdminClient();
  const objectPath = buildObjectPath(bucket, savedName);

  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET_NAME)
    .remove([objectPath]);

  if (error) {
    console.error("Erro ao remover arquivo privado do Supabase:", error.message);
  }
}