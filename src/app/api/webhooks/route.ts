import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET as string;
const MAX_TIMESTAMP_WINDOW = 5 * 60 * 1000; // 5 minutes

// Function to parse the signature header
function parseSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) return { timestamp: undefined, signature: undefined };

  const timestampMatch = signatureHeader.match(/t=(\d+)/);
  const signatureMatch = signatureHeader.match(/v1=([\w]+)/);

  return {
    timestamp: timestampMatch ? timestampMatch[1] : undefined,
    signature: signatureMatch ? signatureMatch[1] : null,
  };
  undefined;
}

// Function to validate the signature
async function isValidSignature(
  req: NextRequest,
  timestamp: string,
  signature: string
): Promise<boolean> {
  if (!signature || !timestamp) return false;

  // Validate timestamp (must be within 5 minutes)
  const now = Date.now();
  const timestampMs = parseInt(timestamp, 10);

  // Check if the timestamp is within the allowed window
  if (Math.abs(now - timestampMs) > MAX_TIMESTAMP_WINDOW) {
    console.warn("❌ Webhook rejected: timestamp outside valid window");
    return false;
  }

  // Get raw request body
  const reqClone = req.clone();
  const rawBody = await reqClone.text();

  // Construct payload for hashing
  const payload = `${timestamp}.${rawBody}`;

  // Compute HMAC SHA256 hash using the webhook secret
  const hmac = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("hex");

  // Compare both signatures
  return crypto.timingSafeEqual(
    Buffer.from(hmac, "hex"),
    Buffer.from(signature, "hex")
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signatureHeader = req.headers.get("workos-signature");
  const { timestamp, signature } = parseSignatureHeader(signatureHeader);

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: "Missing or invalid signature" },
      { status: 400 }
    );
  }

  const valid = await isValidSignature(req, timestamp, signature);

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid signature or timestamp" },
      { status: 401 }
    );
  }

  // Do something with event:
  // const reqClone = req.clone();
  // const event = await reqClone.json();

  return NextResponse.json(
    { message: "Webhook received successfully" },
    { status: 200 }
  );
}
