import AWS from "aws-sdk";
import getLogger from "~/core/logger";

const logger = getLogger();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Upload to S3 and return a pre-signed URL
export async function uploadToS3(fileStream: NodeJS.ReadableStream, fileName: string): Promise<string> {
  // Determine the content type based on file extension
  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const contentType = fileExtension === "mp4" ? "video/mp4" : fileExtension === "m4a" ? "audio/mp4" : "application/octet-stream";

  const params = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `recordings/${fileName}`,
    Body: fileStream,
    ContentType: contentType,
  };

  logger.info(`[S3] Uploading file ${fileName} to S3...`);
  await s3.upload(params).promise();

  const signedUrl = await s3.getSignedUrlPromise("getObject", {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `recordings/${fileName}`,
    Expires: 604800, // 7 days
  });

  logger.info(`[S3] File uploaded successfully. Signed URL: ${signedUrl}`);
  return signedUrl;
}