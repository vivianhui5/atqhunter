import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToCloudflare(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const key = `artwork/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the public URL
  const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${key}`;
  return publicUrl;
}

export async function deleteFromCloudflare(imageUrl: string): Promise<void> {
  try {
    // Extract the key from the URL
    // URL format: https://pub-xxxxx.r2.dev/artwork/123456-filename.jpg
    const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL!;
    const key = imageUrl.replace(`${publicUrl}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);
    console.log('Deleted from Cloudflare:', key);
  } catch (error) {
    console.error('Error deleting from Cloudflare:', error);
    // Don't throw - we still want to delete from database even if storage delete fails
  }
}

