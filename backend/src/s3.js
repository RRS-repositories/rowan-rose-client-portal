/**
 * S3 access for client documents — same bucket the CRM "client landing page"
 * uses (client.landing.page, eu-north-1). Files live under the client's prefix
 * `{first_name}_{last_name}_{contactId}/` with sub-folders (Documents/, Lenders/…).
 * We LIST a client's whole prefix to show all their files, presign GETs for
 * viewing, and PUT new uploads under `…/Documents/`.
 */
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET_NAME;
let client = null;

export const s3Enabled = () => Boolean(process.env.AWS_ACCESS_KEY_ID && bucket);

function getClient() {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

/** Build a client's folder prefix, matching the CRM convention. */
export const contactPrefix = (contact) =>
  `${contact.first_name}_${contact.last_name}_${contact.id}/`;

/** List every object under a prefix (paginated, capped for safety). */
export async function listByPrefix(prefix) {
  if (!s3Enabled()) return [];
  const out = [];
  let token;
  do {
    const r = await getClient().send(new ListObjectsV2Command({
      Bucket: bucket, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000,
    }));
    (r.Contents || []).forEach((o) => out.push(o));
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token && out.length < 3000);
  return out;
}

/** Short-lived (1h) presigned GET URL so a client can view their own file. */
export async function presignGet(key, expiresIn = 3600) {
  if (!key || !s3Enabled()) return null;
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function putObject(key, body, contentType) {
  if (!s3Enabled()) throw new Error("S3 not configured");
  await getClient().send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: body, ContentType: contentType || "application/octet-stream",
  }));
  return key;
}
