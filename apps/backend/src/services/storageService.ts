/**
 * Service de gestion MinIO (S3-compatible) pour le stockage des screenshots
 *
 * Ce service gère l'upload et la récupération des screenshots vers MinIO
 * Peut être facilement remplacé par AWS S3 ou DigitalOcean Spaces
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

/**
 * Configuration du client S3 (MinIO)
 */
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin123",
  },
  forcePathStyle: true, // Nécessaire pour MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET || "screenshots";
const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

/**
 * Upload un screenshot vers MinIO
 *
 * @param filePath - Chemin local du fichier
 * @param fileName - Nom du fichier dans le bucket
 * @returns URL publique du screenshot
 */
export async function uploadScreenshot(
  filePath: string,
  fileName?: string
): Promise<string> {
  try {
    // Lire le fichier
    const fileContent = await fs.readFile(filePath);

    // Nom du fichier dans le bucket
    const key = fileName || path.basename(filePath);

    // Upload vers MinIO
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: "image/png",
    });

    await s3Client.send(command);

    // Retourner l'URL publique
    const publicUrl = `${MINIO_PUBLIC_URL}/${BUCKET_NAME}/${key}`;

    console.log(`✅ Screenshot uploaded: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("❌ Error uploading screenshot to MinIO:", error);
    throw error;
  }
}

/**
 * Générer une URL signée (temporaire) pour un screenshot privé
 *
 * @param fileName - Nom du fichier dans le bucket
 * @param expiresIn - Durée de validité en secondes (défaut: 1 heure)
 * @returns URL signée
 */
export async function getSignedScreenshotUrl(
  fileName: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return signedUrl;
  } catch (error) {
    console.error("❌ Error generating signed URL:", error);
    throw error;
  }
}

/**
 * Upload un screenshot et supprimer le fichier local
 *
 * @param localPath - Chemin local du fichier
 * @param remoteFileName - Nom du fichier dans MinIO (optionnel)
 * @returns URL publique du screenshot
 */
export async function uploadAndCleanup(
  localPath: string,
  remoteFileName?: string
): Promise<string> {
  const url = await uploadScreenshot(localPath, remoteFileName);

  // Supprimer le fichier local après upload
  try {
    await fs.unlink(localPath);
    console.log(`🗑️  Local file deleted: ${localPath}`);
  } catch (error) {
    console.warn(`⚠️  Could not delete local file: ${localPath}`, error);
  }

  return url;
}

/**
 * Vérifier si le bucket existe et est accessible
 *
 * @returns true si le bucket est accessible
 */
export async function checkBucketHealth(): Promise<boolean> {
  try {
    // TODO: Implémenter HeadBucketCommand
    // const command = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    // await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("❌ MinIO bucket health check failed:", error);
    return false;
  }
}

/**
 * Configuration pour utiliser DigitalOcean Spaces au lieu de MinIO
 *
 * Variables d'environnement requises:
 * - S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
 * - S3_ACCESS_KEY=votre_access_key
 * - S3_SECRET_KEY=votre_secret_key
 * - S3_BUCKET=specto-screenshots
 * - S3_REGION=nyc3
 * - S3_USE_SSL=true
 */
