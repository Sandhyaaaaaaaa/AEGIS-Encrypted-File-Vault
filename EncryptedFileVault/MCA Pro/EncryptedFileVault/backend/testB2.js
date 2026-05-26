import dotenv from "dotenv";
dotenv.config();

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION || "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
  forcePathStyle: true,
});

const B2_BUCKET = process.env.B2_BUCKET_NAME;

async function testB2() {
  console.log("Starting B2 Connection Test...");
  const testKey = `test-aegis-${Date.now()}.txt`;
  
  try {
    console.log("1. Uploading test object...");
    await s3Client.send(new PutObjectCommand({
      Bucket: B2_BUCKET,
      Key: testKey,
      Body: "AEGIS B2 integration test successful!",
      ContentType: "text/plain",
    }));
    console.log("✅ Upload successful!");

    console.log("2. Deleting test object...");
    await s3Client.send(new DeleteObjectCommand({
      Bucket: B2_BUCKET,
      Key: testKey,
    }));
    console.log("✅ Deletion successful!");
    
    console.log("🎉 B2 Integration is fully functional and credentials are valid.");
    process.exit(0);
  } catch (error) {
    import("fs").then(fs => fs.writeFileSync("testB2_error.txt", JSON.stringify(error, null, 2) + "\n" + error.message));
    console.error("❌ B2 Test Failed. Error written to file.");
    process.exit(1);
  }
}

testB2();
