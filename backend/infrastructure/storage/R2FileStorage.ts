import {S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sanitize from "sanitize-filename";
import { IFileStorageFactory }   from "../../application/ports/file/IFileStorageFactory";
import { IUUIDGenerator } from "../../application/ports/IUUIDGenerator";

export class R2FileStorage implements IFileStorageFactory {
  private readonly client:    S3Client;
  private readonly bucket:    string;
  // private readonly publicUrl: string;

  constructor(
    private readonly UUIDGenerator: IUUIDGenerator,
  ) {
    const accountId       = process.env.R2_ACCOUNT_ID;
    const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket    = process.env.R2_BUCKET_NAME ?? "tutorsmd";
    // this.publicUrl = process.env.R2_PUBLIC_URL  ?? "";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 credentials are not set in environment variables");
    }

    this.client = new S3Client({
      region:   "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  // Единственное место где строится ключ — никакой дублирующей логики в хендлерах
  buildKey(namespace: string, ownerId: string, fileName: string): string {
    const cleanName = sanitize(fileName || "file");
    const id = this.UUIDGenerator.generate();
    return `${namespace}/${id}/${Date.now()}_${cleanName}`;
  }

  async getPresignedUploadUrl(
    key:             string,
    mimeType:        string,
    expiresInSeconds = 300,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket:      this.bucket,
        Key:         key,
        ContentType: mimeType,
        // ACL: 'private',
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  async getPresignedDownloadUrl(
    key:             string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    /*
    // Если есть публичный URL (R2 public bucket) — presigned не нужен
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
      */
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }
}