import AWS from 'aws-sdk';
import getLogger from '~/core/logger';

const logger = getLogger();

// Configure AWS S3
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Upload to S3 and return a pre-signed URL
export async function uploadToS3(
  fileStream: NodeJS.ReadableStream,
  fileName: string,
): Promise<void> {
  // Determine the content type based on file extension
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const contentType =
    fileExtension === 'mp4'
      ? 'video/mp4'
      : fileExtension === 'm4a'
        ? 'audio/mp4'
        : 'application/octet-stream';

  const params = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `recordings/${fileName}`,
    Body: fileStream,
    ContentType: contentType,
    ACL: 'public-read',
    ContentDisposition: 'inline',
  };

  logger.info(`[S3] Uploading file ${fileName} to S3...`);
  await s3.upload(params).promise();
  logger.info(`[S3] File ${fileName} uploaded successfully.`);

  return;
}

export async function getSignedUrl(
  fileName: string,
  expiresIn: number = 4 * 60 * 60, // Default expiration time is 4 hour
): Promise<string> {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `recordings/${fileName}`,
    Expires: expiresIn,
  };

  const url = await s3.getSignedUrlPromise('getObject', params);
  logger.info(`[S3] Signed URL generated successfully.`);

  return url;
}
