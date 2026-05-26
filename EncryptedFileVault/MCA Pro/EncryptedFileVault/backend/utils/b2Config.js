import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

// ── Placeholder sentinel values that mean "not configured" ──────────────────
const B2_PLACEHOLDERS = [
  "your_bucket_name", "your_key_id", "your_app_key",
  "your_b2_bucket", "your_b2_key_id", "your_b2_app_key",
  "", undefined, null,
];

/**
 * Returns true only when all four B2 env vars are present and non-placeholder.
 * Call this before any S3 operation to give a clear error instead of a cryptic SDK throw.
 */
export const isB2Configured = () => {
  const vars = [
    process.env.B2_ENDPOINT,
    process.env.B2_KEY_ID,
    process.env.B2_APP_KEY,
    process.env.B2_BUCKET_NAME,
  ];
  return vars.every(v => v && !B2_PLACEHOLDERS.includes(v?.trim()));
};

// Trim any accidental trailing whitespace from the endpoint URL (common copy-paste issue)
const endpoint = process.env.B2_ENDPOINT?.trim();

/**
 * Configure AWS SDK v3 to use Backblaze B2 S3-compatible API.
 * Requires: B2_ENDPOINT, B2_REGION, B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME
 */
const s3Client = new S3Client({
  endpoint,
  region: process.env.B2_REGION?.trim() || "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID?.trim() || "unconfigured",
    secretAccessKey: process.env.B2_APP_KEY?.trim() || "unconfigured",
  },
  forcePathStyle: true, // Required for Backblaze B2 path-style URLs
});

export const B2_BUCKET = process.env.B2_BUCKET_NAME?.trim();

// Startup warning if B2 is not configured
if (!isB2Configured()) {
  console.warn("⚠️  [B2Config] Backblaze B2 is NOT configured. Cloud storage uploads will be disabled.");
  console.warn("   Set B2_ENDPOINT, B2_KEY_ID, B2_APP_KEY, B2_BUCKET_NAME in your .env file.");
}

export default s3Client;
