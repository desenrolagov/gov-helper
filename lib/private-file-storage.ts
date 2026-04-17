import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

export type PrivateBucket = "uploads" | "result";

function getProjectRootDir() {
  return process.cwd();
}

function getPrivateRootDir() {
  return path.join(getProjectRootDir(), "storage", "private");
}

function assertValidSavedName(savedName: string) {
  if (!savedName || !savedName.trim()) {
    throw new Error("Nome de arquivo privado inválido.");
  }

  if (savedName.includes("..") || savedName.includes("/") || savedName.includes("\\")) {
    throw new Error("Nome de arquivo privado inseguro.");
  }
}

export async function ensurePrivateRootDir() {
  await mkdir(getPrivateRootDir(), { recursive: true });
}

export function getPrivateBucketDir(bucket: PrivateBucket) {
  return path.join(getPrivateRootDir(), bucket);
}

export function getPrivateFilePath(bucket: PrivateBucket, savedName: string) {
  assertValidSavedName(savedName);
  return path.join(getPrivateBucketDir(bucket), savedName);
}

export async function ensurePrivateBucket(bucket: PrivateBucket) {
  await ensurePrivateRootDir();
  await mkdir(getPrivateBucketDir(bucket), { recursive: true });
}

export async function savePrivateFile(
  bucket: PrivateBucket,
  savedName: string,
  buffer: Buffer
) {
  await ensurePrivateBucket(bucket);

  const filePath = getPrivateFilePath(bucket, savedName);
  await writeFile(filePath, buffer);

  return filePath;
}

export async function readPrivateFile(
  bucket: PrivateBucket,
  savedName: string
) {
  const filePath = getPrivateFilePath(bucket, savedName);
  return await readFile(filePath);
}

export async function deletePrivateFile(
  bucket: PrivateBucket,
  savedName?: string | null
) {
  if (!savedName) return;

  try {
    const filePath = getPrivateFilePath(bucket, savedName);
    await rm(filePath, { force: true });
  } catch {
    // não bloqueia o fluxo se o arquivo já não existir
  }
}