import "server-only";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

function getStorageConfig() {
  const {
    AWS_ENDPOINT_URL,
    AWS_DEFAULT_REGION,
    AWS_S3_BUCKET_NAME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
  } = process.env;

  if (
    !AWS_ENDPOINT_URL ||
    !AWS_DEFAULT_REGION ||
    !AWS_S3_BUCKET_NAME ||
    !AWS_ACCESS_KEY_ID ||
    !AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error("Die Speicher-Konfiguration ist unvollständig.");
  }

  return {
    endpoint: AWS_ENDPOINT_URL,
    region: AWS_DEFAULT_REGION,
    bucket: AWS_S3_BUCKET_NAME,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
}

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    const config = getStorageConfig();

    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: false,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return s3Client;
}

export async function uploadFile({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const config = getStorageConfig();

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return key;
}

export async function deleteFile(key: string) {
  const config = getStorageConfig();

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}

export async function downloadFile(key: string) {
  const config = getStorageConfig();

  const result = await getS3Client().send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );

  if (!result.Body) {
    throw new Error("Die Datei wurde im Speicher nicht gefunden.");
  }

  return {
    body: await result.Body.transformToByteArray(),
    contentType: result.ContentType || "application/octet-stream",
  };
}
