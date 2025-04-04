import AWS from "aws-sdk";

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Upload to S3 and return a pre-signed URL
export async function uploadToS3(fileStream: NodeJS.ReadableStream, fileName: string): Promise<string> {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `recordings/${fileName}`,
    Body: fileStream,
    ContentType: "video/mp4",
  };

  await s3.upload(params).promise();

  const signedUrl = await s3.getSignedUrlPromise("getObject", {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `recordings/${fileName}`,
    Expires: 604800, // 7 days
  });

  return signedUrl;
}