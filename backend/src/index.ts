import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import multer from 'multer'
import path from 'path'
import { TransactionBuilder, Networks } from 'stellar-sdk'
import { prisma } from './lib/database'
import { userService, profileService, submissionService, authService, adminReviewService, draftService, personaValidationService } from './lib/database'
import { env } from './lib/env-validation'
import { handlePersonaWebhook, lastPersonaVerification } from './lib/personaWebhook'
import { certificateService } from './lib/certificate-service'

const app = express();
const PORT = env.PORT;
const personaApiKey = env.PERSONA_API_KEY;
const templateId = env.PERSONA_TEMPLATE_ID;

// Admin wallet configuration (matching backoffice config)
const ADMIN_WALLETS = [
  "GAA5LJQ5ADNUBIHOIUXK6JIQ643KZGHBFPNCEYZ23LUK2U5JVLPSZOGZ",
  "GCBA5O2JDZMG4TKBHAGWEQTMLTTHIPERZVQDQGGRYAIL3HAAJ3BAL3ZN",
  "GDGYOBHJVNGVBCIHKDR7H6NNYRSPPK2TWANH6SIY34DJLSXUOJNXA2SN",
  "GCLASRLEFVHLLYHIMTAC36E42OTZPKQDAL52AEKBVTIWNPVEC4GXMAFG",
  "GC6GCTEW7Y4GA6DH7WM26NEKSW4RPI3ZVN6E3FLW3ZVNILKLV77I43BK",
  "GCGZFA2PFQYHPGWCOL36J7DXQ3O3TFNIN24QAQ7J4BWQYH6OIGA7THOY",
  "GDEMUCID6QUJFLKFAH37YYZEVRBOY5ZMOMCE4AGI5ALQQBFQJC24PRDP"
];

// Check if wallet is admin (MVP mode allows any wallet)
async function checkAdminWallet(walletAddress: string): Promise<boolean> {
  console.log(`🔍 Checking admin status for wallet: ${walletAddress}`);

  // MVP mode: allow any wallet
  const isMVPMode = true; // Set to true for MVP phase
  if (isMVPMode) {
    console.log(`✅ MVP Mode: Treating wallet as admin: ${walletAddress.slice(0, 8)}...`);
    return true;
  }

  // Check against admin whitelist
  const isAdmin = ADMIN_WALLETS.includes(walletAddress);
  console.log(`🔍 Admin check result: ${isAdmin ? 'ADMIN' : 'NOT ADMIN'}`);
  return isAdmin;
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files
  },
});

// File upload endpoint
app.post("/api/files/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { originalname, mimetype, buffer } = req.file;
    const crypto = require("crypto");
    const fs = require("fs");
    const path = require("path");
    const sharp = require("sharp");

    // Calculate SHA256 hash
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, "..", "..", "uploads", "files");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let finalMimetype = mimetype;
    let fileBuffer = buffer;
    let ext = originalname.split(".").pop();

    // Compress JPEG/PNG to WebP
    if (mimetype === "image/jpeg" || mimetype === "image/png") {
      fileBuffer = await sharp(buffer)
        .resize({ width: 1920, height: 1080, fit: "inside" })
        .webp({ quality: 80 })
        .toBuffer();
      finalMimetype = "image/webp";
      ext = "webp";
    }

    // Generate unique filename using hash and extension
    const filenameOnDisk = `${hash}.${ext}`;
    const relativePath = path.join("uploads", "files", filenameOnDisk);
    const absolutePath = path.join(__dirname, "..", "..", relativePath);

    // Save file to disk
    fs.writeFileSync(absolutePath, fileBuffer);

    // Save metadata to DB
    const fileRecord = await prisma.file.create({
      data: {
        filename: originalname,
        mimetype: finalMimetype,
        path: relativePath,
        hash,
        size: fileBuffer.length,
      },
    });

    res.json({
      status: "ok",
      fileId: fileRecord.id,
      filename: fileRecord.filename,
      mimetype: fileRecord.mimetype,
      size: fileRecord.size,
      hash: fileRecord.hash,
      path: fileRecord.path,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// File download/view endpoint for demo visualization
app.get("/api/files/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fs = require("fs");
    const path = require("path");
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    const absolutePath = path.join(__dirname, "..", "..", file.path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }
    res.setHeader("Content-Type", file.mimetype);
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
    // Ensure all code paths return a value
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch file" });
    return;
  }
});

// Helper function to verify XDR transaction
async function verifyXDRTransaction(
  walletAddress: string,
  signedXDR: string,
  challenge: string,
): Promise<boolean> {
  try {
    // Parse the signed XDR transaction
    const transaction = TransactionBuilder.fromXDR(signedXDR, Networks.TESTNET);

    // Handle different transaction types
    if ("source" in transaction) {
      console.log("Transaction source:", transaction.source);
    } else {
      console.log("Fee bump transaction - using inner transaction source");
      if (
        transaction.innerTransaction &&
        "source" in transaction.innerTransaction
      ) {
        console.log(
          "Inner transaction source:",
          transaction.innerTransaction.source,
        );
      }
    }
    console.log(
      "Transaction operations count:",
      transaction.operations.length,
    );

    // Extract the challenge from manageData operation
    let transactionChallenge = null;
    for (let i = 0; i < transaction.operations.length; i++) {
      const operation = transaction.operations[i];
      console.log(`Operation ${i}:`, operation.type);

      if (operation.type === "manageData") {
        console.log("Found manageData operation");
        const manageDataOp = operation as any; // Type assertion for manageData operation
        console.log("Operation name:", manageDataOp.name);
        console.log("Operation value:", manageDataOp.value);

        if (manageDataOp.name === "auth_challenge") {
          transactionChallenge = manageDataOp.value;
          console.log("Found auth_challenge data:", transactionChallenge);
          console.log(
            "Transaction challenge type:",
            typeof transactionChallenge,
          );
          console.log(
            "Transaction challenge length:",
            transactionChallenge ? String(transactionChallenge).length : 0,
          );
          console.log(
            "Transaction challenge as string:",
            String(transactionChallenge),
          );
          break;
        }
      }
    }
    if (!transactionChallenge) {
      console.log("No auth_challenge data found in transaction");
      console.log("Available operations:");
      transaction.operations.forEach((op: any, i: number) => {
        console.log(`  ${i}: ${op.type} - ${op.name || "no name"}`);
      });
      return false;
    }

    console.log(
      "Transaction challenge (from manageData):",
      transactionChallenge,
    );

    // Check if the stored challenge starts with the transaction challenge
    // (since the transaction challenge is truncated to 28 bytes)
    const transactionChallengeStr = String(transactionChallenge);
    const storedChallengeStr = String(challenge);

    if (!storedChallengeStr.startsWith(transactionChallengeStr)) {
      console.log("Challenge mismatch");
      console.log("Expected (stored):", storedChallengeStr);
      console.log("Received (transaction):", transactionChallengeStr);
      console.log(
        "Stored starts with transaction?",
        storedChallengeStr.startsWith(transactionChallengeStr),
      );
      return false;
    }

    // Verify the transaction signature
    let sourceAccount: string;
    if ("source" in transaction) {
      sourceAccount = transaction.source;
    } else {
      // Handle fee bump transaction
      if (
        transaction.innerTransaction &&
        "source" in transaction.innerTransaction
      ) {
        sourceAccount = transaction.innerTransaction.source;
      } else {
        console.log("❌ Could not determine transaction source");
        return false;
      }
    }

    if (sourceAccount !== walletAddress) {
      console.log("❌ Wallet address mismatch");
      console.log("❌ Expected:", walletAddress);
      console.log("❌ Found:", sourceAccount);
      return false;
    }

    console.log("XDR transaction verification successful");
    return true;
  } catch (error) {
    console.error("Error verifying XDR transaction:", error);
    return false;
  }
}

// Enhanced security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS || 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs for other endpoints
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Commenting out rate limiting for e2e testing
// app.use('/api/auth', authLimiter)
// app.use('/api', apiLimiter)

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost on various ports for development
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        // Production domains
        "https://validator.dobprotocol.com",
        "https://backoffice.dobprotocol.com",
        "https://v.dobprotocol.com",
      ];

      // Allow ngrok domains in development
      if (process.env.NODE_ENV === "development" && origin.includes("ngrok-free.app")) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  }),
);

// Request size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files (profile images, uploads, etc.)
// Serve static files from uploads directory

app.use("/uploads", express.static(path.join(__dirname, "..", "..", "uploads")));

// Ping endpoint for basic connectivity testing
app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    message: "pong",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Persona inquiry one-time link generation
app.post('/persona/inquiry/:inquiryId/generate-one-time-link', async (req, res) => {
  try {
    if (!personaApiKey) {
      return res.status(500).json({ error: 'Error with persona api key' });
    }

    const { inquiryId } = req.params;
    if (!inquiryId) {
      return res.status(400).json({ error: 'inquiryId is required' });
    }

    const response = await fetch(
      `https://api.withpersona.com/api/v1/inquiries/${encodeURIComponent(inquiryId)}/generate-one-time-link`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personaApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json();

    const meta = (result && typeof result === "object" && "meta" in result) ? (result as any).meta : 'Cant find meta in response';
    const oneTimeLink = meta?.['one-time-link'];

    if (!oneTimeLink) {
      return res.status(500).json({ error: 'One-time link not found in Persona response' });
    }

    return res.json({ link: oneTimeLink });
  } catch (error) {
    console.error('Failed to generate one-time link', error);
    return res.status(500).json({ error: 'Failed to generate one-time link' });
  }
});

// Persona inquiry creation
app.post('/persona/inquiry', async (req, res) => {
  try {
    if (!personaApiKey) {
      return res.status(500).json({ error: 'Error with persona api key' });
    }

    const localProfile =
      (req.body?.localProfile as any) ||
      (req.body?.data?.attributes?.localProfile as any) ||
      null;

    const walletAddress =
      (req.body?.walletAddress as string) ||
      (req.body?.publicKey as string) ||
      (req.body?.stellarPublicKey as string) ||
      (req.body?.localWalletAddress as string) ||
      (localProfile?.walletAddress as string) ||
      (localProfile?.publicKey as string) ||
      (localProfile?.stellarPublicKey as string);

    if (!walletAddress) {
      console.error("Missing walletAddress Body:", req.body);
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    const referenceIdFromBody =
      (req.body?.['reference-id'] as string) ||
      (req.body?.reference_id as string) ||
      (req.body?.referenceId as string) ||
      (req.body?.data?.attributes?.['reference-id'] as string) ||
      (req.body?.data?.attributes?.reference_id as string);

    // Get or create user to use their ID as the reference ID
    const user = await userService.findOrCreateByWallet(walletAddress);
    const referenceId = user.id; // Using internal user ID as reference ID per Persona docs


    const payload = {
      data: {
        type: 'inquiry',
        attributes: {
          'inquiry-template-id': templateId,
          'reference-id': referenceId,
        },
      },
    };

    const response = await fetch('https://api.withpersona.com/api/v1/inquiries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${personaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return res.status(response.status).json({ result, referenceId });
  } catch (error) {
    console.error('Failed to create inquiry on persona', error);
    return res.status(500).json({ error: 'Failed to create inquiry on persona' });
  }
});

// Receive Persona webhooks and store the latest verification


app.post('/webhook/persona/', express.raw({ type: 'application/json' }), handlePersonaWebhook);

// Get Persona validation status by wallet address
app.get('/persona/inquiry/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    console.log('Checking Persona validation status for wallet:', walletAddress);

    // First get the user
    const user = await userService.getByWallet(walletAddress);
    if (!user) {
      console.log('User not found for wallet:', walletAddress);
      return res.status(404).json({ error: 'No validation found' }); // Changed to match frontend expectation
    }

    // First check our local validation record
    console.log('🔍 Checking local validation record for user:', user.id);
    const localValidation = await prisma.personaValidation.findFirst({
      where: {
        referenceId: user.id,
        status: {
          in: ['completed', 'approved', 'passed']
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (localValidation) {
      console.log('✅ Found completed local validation:', localValidation);
      return res.json({
        status: localValidation.status,
        inquiryId: localValidation.inquiryId,
        updatedAt: localValidation.updatedAt
      });
    }

    // If no local validation or not completed, check Persona API
    console.log('🔍 No completed local validation found, checking Persona API...');
    const url = `https://api.withpersona.com/api/v1/inquiries?filter%5Breference-id%5D=${encodeURIComponent(user.id)}&sort=-created-at&page%5Bsize%5D=1`;
    console.log('🔍 Fetching from Persona API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${personaApiKey}`,
        Accept: 'application/json',
      },
    });

    const result = await response.json();
    console.log('🔍 Persona API response:', result);

    const dataArray = Array.isArray((result as any)?.data) ? (result as any).data : [];
    if (dataArray.length === 0) {
      console.log('❌ No inquiries found for user:', user.id);
      return res.status(404).json({ error: 'No validation found' });
    }

    const status = dataArray[0]?.attributes?.status ?? null;
    const inquiryId = dataArray[0]?.id ?? null;

    // Update our local validation record
    const validation = await personaValidationService.upsert(user.id, inquiryId, status);
    console.log('✅ Updated local validation record:', validation);

    // Check if the status is completed/approved/passed
    if (['completed', 'approved', 'passed'].includes(validation.status)) {
      console.log('✅ Validation is completed:', validation);
      return res.json({
        status: validation.status,
        inquiryId: validation.inquiryId,
        updatedAt: validation.updatedAt
      });
    }

    // If not completed, return 404
    console.log('❌ Validation not completed:', validation);
    return res.status(404).json({ error: 'No completed validation found' });
  } catch (error) {
    console.error('❌ Error checking validation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/webhook/persona/:referenceId', (req, res) => {
  try {
    const { referenceId } = req.params;

    const webhooksArray = Array.isArray(lastPersonaVerification)
      ? lastPersonaVerification
      : (lastPersonaVerification ? [lastPersonaVerification] : []);
    const filteredWebhooks = webhooksArray.filter(webhook =>
      webhook.referenceId === referenceId && webhook.status === "completed"
    );
    if (filteredWebhooks.length === 0) {
      return res.status(404).json({ error: 'No completed webhooks found for this referenceId', referenceId });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error filtering webhooks by status:', error);
    return res.status(500).json({ error: 'Failed to filter webhooks' });
  }
});

// Persona get inquiry by ID, return data and update status in DB
app.get('/persona/inquiry/:referenceID', async (req, res) => {
  try {
    if (!personaApiKey) {
      return res.status(500).json({ error: 'Error with persona api key' });
    }

    const { referenceID } = req.params;
    if (!referenceID) {
      return res.status(400).json({ error: 'referenceID is required' });
    }

    const url =
      `https://api.withpersona.com/api/v1/inquiries` +
      `?filter%5Breference-id%5D=${encodeURIComponent(referenceID)}` +
      `&sort=-created-at&page%5Bsize%5D=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${personaApiKey}`,
        Accept: 'application/json',
      },
    });

    const result = await response.json();

    // get persona data from persona api
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch inquiries from Persona',
        personaStatus: response.status,
        personaBody: result,
      });
    }

    const dataArray = Array.isArray((result as any)?.data) ? (result as any).data : [];
    if (dataArray.length === 0) {
      return res.status(404).json({ error: 'No inquiries found for referenceID', referenceID });
    }

    const status = dataArray[0]?.attributes?.status ?? null;
    const inquiryID = dataArray[0]?.id ?? null;
    // update persona status in persona_validation table --
    try {
      const updateResult = await prisma.personaValidation.updateMany({
        where: { referenceId: referenceID },
        data: { status, inquiryId: inquiryID },
      });

      return res.status(200).json({ status, updatedRows: updateResult.count });
    } catch (dbError) {
      console.error('Failed to update persona_validation', dbError);
      return res.status(200).json({ status, dbUpdateError: true });
    }
  } catch (error) {
    console.error('Failed to fetch inquiries', error);
    return res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});
// CHECK IF NEEDS TO REMOVE THIS
// make status pending --> to development
app.post('/persona/inquiry/:referenceID', async (req, res) => {
  try {
    const { referenceID } = req.params;
    if (!referenceID) {
      return res.status(400).json({ error: 'referenceID is required' });
    }

    const updateResult = await prisma.personaValidation.updateMany({
      where: { referenceId: referenceID },
      data: { status: 'pending' },
    });

    return res.status(200).json({ status: 'pending', updatedRows: updateResult.count });
  } catch (error) {
    console.error('Failed to update persona_validation to pending', error);
    return res.status(500).json({ error: 'Failed to set status to pending' });
  }
});

// Create certificate
app.post("/certificate/generate/:submissionId/:stellarHash", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization header required" });
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);
    if (user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { submissionId, stellarTxHash } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: "submissionId is required" });
    }

    console.log('Generating certificate for submission:', submissionId);

    const metadata = { submissionId, stellarTxHash };

    const result = await certificateService.generateAndSendCertificate({
      submissionId,
      stellarTxHash,
      adminWalletAddress: walletAddress
    });

    if (result.success) {
      console.log('Certificate generated successfully:', result.certificate?.id);
      return res.json({
        success: true,
        message: "Certificate generated and sent successfully",
        certificate: result.certificate,
        emailSent: result.emailSent,
        certificatePath: result.certificatePath,
      });
    } else {
      console.error('Certificate generation failed:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to generate certificate"
      });
    }

  } catch (error) {
    console.error("Certificate generation endpoint error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during certificate generation"
    });
  }
});



// Database test endpoint
app.get("/test-db", async (req, res) => {
  try {
    console.log("Testing database connection...");

    // Test user service
    const testUser = await userService.getByWallet(
      "GCBA5O2JDZMG4TKBHAGWEQTMLTTHIPERZVQDQGGRYAIL3HAAJ3BAL3ZN",
    );
    console.log(
      "User service test:",
      testUser ? "User found" : "User not found",
    );

    // Test submission service
    const submissions = await submissionService.getAll({ limit: 1 });
    console.log(
      "Submission service test:",
      submissions.submissions.length,
      "submissions found",
    );

    res.json({
      status: "ok",
      userService: testUser ? "working" : "no user found",
      submissionService: "working",
      submissionCount: submissions.submissions.length,
    });
  } catch (error) {
    console.error("❌ Database test error:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Authentication endpoints
app.post("/api/auth/challenge", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({ error: "Wallet address is required" });
      return;
    }

    // Generate challenge
    const challenge = `DOB_VALIDATOR_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store challenge
    await authService.createChallenge(walletAddress, challenge, expiresAt);

    res.json({ success: true, challenge });
    return;
  } catch (error) {
    console.error("Challenge generation error:", error);
    res.status(500).json({ error: "Failed to generate challenge" });
    return;
  }
});

app.post("/api/auth/verify", async (req, res) => {
  try {
    const { walletAddress, signature, challenge } = req.body;

    if (!walletAddress || !signature || !challenge) {
      res.status(400).json({
        error: "Wallet address, signature, and challenge are required",
      });
      return;
    }

    // Get stored challenge
    const storedChallenge = await authService.getChallenge(challenge);
    if (!storedChallenge) {
      res.status(401).json({ error: "Invalid or expired challenge" });
      return;
    }

    // Verify signature - check if it's XDR or plain signature
    let isValid = false;

    if (signature.startsWith("AAAA") && signature.length > 100) {
      // XDR transaction signature - use proper verification
      console.log("Verifying XDR transaction signature...");
      isValid = await verifyXDRTransaction(walletAddress, signature, challenge);
    } else {
      // Plain signature - for backward compatibility, accept any for now
      console.log(
        "Plain signature detected, accepting for backward compatibility",
      );
      isValid = true;
    }

    if (!isValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Get existing user or create new one
    let user = await userService.getByWallet(walletAddress);
    if (!user) {
      user = await userService.findOrCreateByWallet(walletAddress);
    }

    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ walletAddress, userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await authService.createSession(walletAddress, token, expiresAt);

    // Clean up challenge
    await authService.deleteChallenge(challenge);
    // /api/auth/wallet-login DO THE SAME THING EXCEPT FOR THIS PART !!
    // CHECK WHICH OF THEM ITS BEEN USED !!
    //
    // Calculate expiresIn in seconds
    const expiresIn = env.JWT_EXPIRES_IN || "7d";
    const expiresInSeconds = expiresIn.includes("d")
      ? parseInt(expiresIn) * 24 * 60 * 60
      : expiresIn.includes("h")
        ? parseInt(expiresIn) * 60 * 60
        : parseInt(expiresIn);

    res.json({
      success: true,
      token,
      expiresIn: expiresInSeconds.toString(),
      user,
    });
    return;
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Failed to verify signature" });
    return;
  }
});

// Wallet login endpoint (alias for verify)
app.post("/api/auth/wallet-login", async (req, res) => {
  try {
    const { walletAddress, signature, challenge } = req.body;

    if (!walletAddress || !signature || !challenge) {
      res.status(400).json({
        error: "Wallet address, signature, and challenge are required",
      });
      return;
    }

    // Get stored challenge
    const storedChallenge = await authService.getChallenge(challenge);
    if (!storedChallenge) {
      res.status(401).json({ error: "Invalid or expired challenge" });
      return;
    }

    // Verify signature - check if it's XDR or plain signature
    let isValid = false;

    if (signature.startsWith("AAAA") && signature.length > 100) {
      // XDR transaction signature - use proper verification
      console.log("🔍 Verifying XDR transaction signature...");
      isValid = await verifyXDRTransaction(walletAddress, signature, challenge);
    } else {
      // Plain signature - for backward compatibility, accept any for now
      console.log(
        "🔍 Plain signature detected, accepting for backward compatibility",
      );
      isValid = true;
    }

    if (!isValid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Get existing user or create new one
    let user = await userService.getByWallet(walletAddress);
    if (!user) {
      user = await userService.findOrCreateByWallet(walletAddress);
    }

    // Generate JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ walletAddress, userId: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    // Store session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await authService.createSession(walletAddress, token, expiresAt);

    // Clean up challenge
    await authService.deleteChallenge(challenge);
    // /api/auth/verify DO THE SAME THING EXCEPT FOR THIS PART !!
    // CHECK WHICH OF THEM ITS BEEN USED !!
    //
    // Return in the format expected by the backoffice
    res.json({
      success: true,
      access_token: token,
      expiresIn: env.JWT_EXPIRES_IN || "7d",
      user,
    });
    return;
  } catch (error) {
    console.error("Wallet login error:", error);
    res.status(500).json({ error: "Failed to authenticate wallet" });
    return;
  }
});

// Profile endpoints
app.get("/api/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    console.log("Looking for profile with wallet:", walletAddress);

    const profile = await profileService.getByWallet(walletAddress);
    if (!profile) {
      console.log("Profile not found for wallet:", walletAddress);
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    console.log("Profile found:", profile.id);
    res.json({ success: true, profile });
    return;
  } catch (error: any) {
    console.error("Profile fetch error:", error);

    // Check if it's a JWT verification error
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }


    // For other errors, return 500 but with more details
    console.error("Unexpected error in profile fetch:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
    return;
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    console.log("Profile POST request received");
    console.log("Request body:", req.body);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header");
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    console.log("Verifying JWT token...");
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;
    console.log("JWT verified, wallet address:", walletAddress);

    const { name, company, email, profileImage } = req.body;
    console.log("Profile data:", { name, company, email, profileImage });

    // Get user
    console.log("Getting user by wallet...");
    const user = await userService.getByWallet(walletAddress);
    if (!user) {
      console.log("User not found for wallet:", walletAddress);
      res.status(404).json({ error: "User not found" });
      return;
    }
    console.log("User found:", user.id);

    // Create or update profile
    console.log("Creating/updating profile...");
    const profile = await profileService.create(user.id, {
      name,
      company,
      email,
      walletAddress,
      profileImage,
    });
    console.log("Profile created/updated:", profile.id);

    res.json({ success: true, profile });
    return;
  } catch (error) {
    console.error("Profile creation error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    res.status(500).json({ error: "Failed to create profile" });
    return;
  }
});

// Profile image upload endpoint
// VERIFICATE UPLOAD --> ENCRYPT NAME AND HASH IMAGE, USE SAME PROCESS AS LOAD DOCUMENTS FOR SUBMISSION REVIEW
// CHECK IF URL LOAD WORKS
app.post(
  "/api/profile/upload-image",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      console.log("Profile image upload request received");

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization header required" });
        return;
      }

      const token = authHeader.substring(7);
      const jwt = require("jsonwebtoken");

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const { walletAddress } = decoded;

      const user = await userService.getByWallet(walletAddress);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Validate file type
      if (!req.file.mimetype.startsWith("image/")) {
        res.status(400).json({ error: "File must be an image" });
        return;
      }

      // Validate file size (max 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({ error: "Image size must be less than 5MB" });
        return;
      }

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileExtension = req.file.originalname.split(".").pop();
      const filename = `profile-${walletAddress}-${timestamp}.${fileExtension}`;

      // For now, we'll store the file path as the URL
      // In production, you might want to upload to a CDN or cloud storage
      const imageUrl = `/uploads/profiles/${filename}`;

      // Save the file to the uploads directory
      const fs = require("fs");
      const path = require("path");
      const uploadDir = path.join(__dirname, "..", "..", "uploads", "profiles");

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      // Update the user's profile with the image URL
      const profile = await profileService.updateByWallet(walletAddress, {
        profileImage: imageUrl,
      });

      res.json({
        success: true,
        imageUrl,
        profile,
      });
      return;
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
      return;
    }
  },
);

// Submissions endpoints
app.get("/api/submissions", async (req, res) => {
  try {
    console.log("Submissions request received");

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No authorization header");
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    console.log("Verifying JWT token...");
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;
    console.log("JWT verified, wallet address:", walletAddress);

    const { status, limit = 10, offset = 0 } = req.query;

    // Check if this is a backoffice request
    const isBackofficeRequest = req.headers["x-backoffice-request"] === "true";
    console.log("Is backoffice request:", isBackofficeRequest);

    // Check if user is admin
    console.log("Getting user by wallet...");
    const user = await userService.getByWallet(walletAddress);
    const isAdmin = user?.role === "ADMIN";
    console.log("User found, isAdmin:", isAdmin, "role:", user?.role);

    let result;
    if (isAdmin && isBackofficeRequest) {
      // Admin in backoffice can see all submissions
      console.log("Getting all submissions (admin in backoffice)...");
      result = await submissionService.getAll({
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    } else {
      // All users (including admins) in frontend can only see their own submissions
      console.log("Getting user submissions...");
      result = await submissionService.getByUser(walletAddress, {
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    }

    console.log(
      "Submissions fetched successfully, count:",
      result.submissions?.length || 0,
    );
    res.json({ success: true, ...result });
    return;
  } catch (error) {
    console.error("❌ Submissions fetch error:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error(
      "❌ Error name:",
      error instanceof Error ? error.name : "Unknown",
    );
    console.error(
      "❌ Error message:",
      error instanceof Error ? error.message : "No message",
    );

    // Check if it's a JWT verification error
    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      console.error("❌ JWT verification failed:", error.message);
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    res.status(500).json({
      error: "Failed to fetch submissions",
      details: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
});

app.get("/api/submissions/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const { id } = req.params;

    const submission = await submissionService.getById(id);
    if (!submission) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    // Check if this is a backoffice request
    const isBackofficeRequest = req.headers["x-backoffice-request"] === "true";

    // Check if user is admin or owns the submission
    const user = await userService.getByWallet(walletAddress);
    const isAdmin = user?.role === "ADMIN";
    const isOwner = submission.user.walletAddress === walletAddress;

    // Admin in backoffice can access any submission, otherwise only owners can access
    if (!isAdmin || !isBackofficeRequest) {
      if (!isOwner) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    res.json({ success: true, submission });
    return;
  } catch (error) {
    console.error("Submission fetch error:", error);

    // Check if it's a JWT verification error
    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      console.error("❌ JWT verification failed:", error.message);
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    res.status(500).json({ error: "Failed to fetch submission" });
    return;
  }
});
// CHECK IF NEEDED TO REMOVE --> NEW IMPLEMENTATION -> ENDPOINT: /api/files/upload
// File upload endpoint for individual files during form process
app.post(
  "/api/upload-files",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 10 },
    { name: "field", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("🔍 File upload request received");
      console.log("🔍 Request headers:", req.headers);
      console.log("🔍 Request body:", req.body);
      console.log("🔍 Request files:", req.files);

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization header required" });
        return;
      }

      const token = authHeader.substring(7);
      const jwt = require("jsonwebtoken");

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const { walletAddress } = decoded;

      const user = await userService.getByWallet(walletAddress);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const field = req.body.field;
      const uploadedFiles = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      const files: Array<{
        id: string;
        filename: string;
        path: string;
        size: number;
        mimeType: string;
        documentType: string;
        uploadedAt: string;
      }> = [];

      // Get or create a draft for this user to store the files
      let draft = await prisma.draft.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });

      if (!draft) {
        // Create a new draft if none exists
        draft = await prisma.draft.create({
          data: {
            userId: user.id,
            deviceName: "",
            deviceType: "",
            serialNumber: "",
            manufacturer: "",
            model: "",
            yearOfManufacture: "",
            condition: "",
            specifications: "",
            purchasePrice: "",
            currentValue: "",
            expectedRevenue: "",
            operationalCosts: "",
            location: "",
          },
        });
      }

      // Process single file
      if (uploadedFiles.file && uploadedFiles.file.length > 0) {
        const file = uploadedFiles.file[0];

        // Store file in database
        const dbFile = await prisma.draftFile.create({
          data: {
            filename: file.originalname,
            path: `/uploads/${field}/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: field,
            draftId: draft.id,
          },
        });

        files.push({
          id: dbFile.id,
          filename: dbFile.filename,
          path: dbFile.path,
          size: dbFile.size,
          mimeType: dbFile.mimeType,
          documentType: dbFile.documentType,
          uploadedAt: dbFile.uploadedAt.toISOString(),
        });
      }

      // Process multiple files
      if (uploadedFiles.files && uploadedFiles.files.length > 0) {
        for (const file of uploadedFiles.files) {
          // Store file in database
          const dbFile = await prisma.draftFile.create({
            data: {
              filename: file.originalname,
              path: `/uploads/${field}/${file.filename}`,
              size: file.size,
              mimeType: file.mimetype,
              documentType: field,
              draftId: draft.id,
            },
          });

          files.push({
            id: dbFile.id,
            filename: dbFile.filename,
            path: dbFile.path,
            size: dbFile.size,
            mimeType: dbFile.mimeType,
            documentType: dbFile.documentType,
            uploadedAt: dbFile.uploadedAt.toISOString(),
          });
        }
      }

      console.log("🔍 Processed uploaded files:", files);
      console.log("🔍 Files stored in draft:", draft.id);

      res.json({ success: true, files });
      return;
    } catch (error) {
      console.error("❌ File upload error:", error);
      console.error(
        "❌ Error name:",
        error instanceof Error ? error.name : "Unknown",
      );
      console.error(
        "❌ Error message:",
        error instanceof Error ? error.message : "No message",
      );
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );

      // Check if it's a JWT verification error
      if (
        error instanceof Error &&
        (error.name === "JsonWebTokenError" ||
          error.name === "TokenExpiredError")
      ) {
        console.error("❌ JWT verification failed:", error.message);
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      res.status(500).json({ error: "Failed to upload files" });
      return;
    }
  },
);
// CREATES NEW SUBMISSION --> NEW UPLOAD FILES ADDED -> CHECK IF ALL WORKS
app.post("/api/submissions", upload.any(), async (req, res) => {
  try {
    console.log("Submission POST request received");
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Extract form data
    const submissionData = {
      deviceName: req.body.deviceName,
      deviceType: req.body.deviceType,
      location: req.body.location,
      serialNumber: req.body.serialNumber,
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      yearOfManufacture: req.body.yearOfManufacture,
      condition: req.body.condition,
      specifications: req.body.specifications,
      purchasePrice: req.body.purchasePrice,
      currentValue: req.body.currentValue,
      expectedRevenue: req.body.expectedRevenue,
      operationalCosts: req.body.operationalCosts,
    };

    // Process files from file IDs or actual files
    const files: Array<{
      filename: string;
      path: string;
      size: number;
      mimeType: string;
      documentType: string;
    }> = [];

    // Handle file IDs (files already uploaded to backend)
    if (req.body.technicalCertificationId) {
      const fileId = req.body.technicalCertificationId;
      const draftFile = await prisma.draftFile.findUnique({
        where: { id: fileId },
      });
      if (draftFile) {
        files.push({
          filename: draftFile.filename,
          path: draftFile.path,
          size: draftFile.size,
          mimeType: draftFile.mimeType,
          documentType: "technical_certification",
        });
      }
    }

    if (req.body.purchaseProofId) {
      const fileId = req.body.purchaseProofId;
      const draftFile = await prisma.draftFile.findUnique({
        where: { id: fileId },
      });
      if (draftFile) {
        files.push({
          filename: draftFile.filename,
          path: draftFile.path,
          size: draftFile.size,
          mimeType: draftFile.mimeType,
          documentType: "purchase_proof",
        });
      }
    }

    if (req.body.maintenanceRecordsId) {
      const fileId = req.body.maintenanceRecordsId;
      const draftFile = await prisma.draftFile.findUnique({
        where: { id: fileId },
      });
      if (draftFile) {
        files.push({
          filename: draftFile.filename,
          path: draftFile.path,
          size: draftFile.size,
          mimeType: draftFile.mimeType,
          documentType: "maintenance_records",
        });
      }
    }

    // Handle device image IDs
    const deviceImageIds = Object.keys(req.body)
      .filter((key) => key.startsWith("deviceImageIds["))
      .map((key) => req.body[key]);

    for (const fileId of deviceImageIds) {
      const draftFile = await prisma.draftFile.findUnique({
        where: { id: fileId },
      });
      if (draftFile) {
        files.push({
          filename: draftFile.filename,
          path: draftFile.path,
          size: draftFile.size,
          mimeType: draftFile.mimeType,
          documentType: "device_image",
        });
      }
    }

    // Handle actual files (fallback for direct file uploads)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedFiles = req.files as Express.Multer.File[];

      // Process any actual files that might be uploaded
      uploadedFiles.forEach((file) => {
        files.push({
          filename: file.originalname,
          path: `/uploads/submissions/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype,
          documentType: "submission_file",
        });
      });
    }

    console.log("Processed submission data:", submissionData);
    console.log("Processed files:", files);

    const submission = await submissionService.create(user.id, {
      ...submissionData,
      files: files.length > 0 ? files : undefined,
    });

    res.json({ success: true, submission });
    return;
  } catch (error) {
    console.error("Submission creation error:", error);
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown",
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "No message",
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    // Check if it's a JWT verification error
    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      console.error("❌ JWT verification failed:", error.message);
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    res.status(500).json({ error: "Failed to create submission" });
    return;
  }
});

// CHECK IF THIS DO THE SAME AS /api/submissions/:id
// Admin endpoints
app.put("/api/submissions/:id/status", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);

    // Check if user is admin either by database role or by admin config
    const isAdminByRole = user?.role === "ADMIN";
    const isAdminByConfig = await checkAdminWallet(walletAddress);

    if (!isAdminByRole && !isAdminByConfig) {
      res.status(403).json({ error: "Admin access required: Only whitelisted admin wallets can sign Stellar transactions for project validation" });
      return;
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const submission = await submissionService.update(id, {
      status,
      adminNotes,
    });

    res.json({ success: true, submission });
    return;
  } catch (error) {
    console.error("Submission update error:", error);
    res.status(500).json({ error: "Failed to update submission" });
    return;
  }
});

// General submission update endpoint (admin only)
// CHECK IF THIS DO THE SAME AS /api/submissions/:id/status
app.put("/api/submissions/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);

    // Check if user is admin either by database role or by admin config
    const isAdminByRole = user?.role === "ADMIN";
    const isAdminByConfig = await checkAdminWallet(walletAddress);

    if (!isAdminByRole && !isAdminByConfig) {
      res.status(403).json({ error: "Admin access required: Only whitelisted admin wallets can sign Stellar transactions for project validation" });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    // Handle admin review data separately
    const {
      adminNotes,
      adminScore,
      adminDecision,
      adminDecisionAt,
      ...submissionUpdates
    } = updates;

    // Create admin review data if provided
    if (
      adminNotes !== undefined ||
      adminScore !== undefined ||
      adminDecision !== undefined
    ) {
      const adminReviewData: any = {};

      if (adminNotes !== undefined) adminReviewData.notes = adminNotes;
      if (adminScore !== undefined) adminReviewData.overallScore = adminScore;
      if (adminDecision !== undefined)
        adminReviewData.decision = adminDecision.toUpperCase();
      if (adminDecisionAt !== undefined)
        adminReviewData.decisionAt = new Date(adminDecisionAt);

      await adminReviewService.upsert(id, adminReviewData);
    }

    // Update submission
    const submission = await submissionService.update(id, submissionUpdates);

    res.json({ success: true, submission });
    return;
  } catch (error) {
    console.error("Submission update error:", error);
    res.status(500).json({ error: "Failed to update submission" });
    return;
  }
});

// Admin reviews endpoints
app.post("/api/admin-reviews", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);
    if (user?.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    // CHECK NAME CONVENTION
    const {
      submission_id,
      notes,
      technical_score,
      regulatory_score,
      financial_score,
      environmental_score,
      overall_score,
      decision,
    } = req.body;

    if (!submission_id) {
      res.status(400).json({ error: "submission_id is required" });
      return;
    }

    const adminReviewData: any = {};

    if (notes !== undefined) adminReviewData.notes = notes;
    if (technical_score !== undefined)
      adminReviewData.technicalScore = technical_score;
    if (regulatory_score !== undefined)
      adminReviewData.regulatoryScore = regulatory_score;
    if (financial_score !== undefined)
      adminReviewData.financialScore = financial_score;
    if (environmental_score !== undefined)
      adminReviewData.environmentalScore = environmental_score;
    if (overall_score !== undefined)
      adminReviewData.overallScore = overall_score;
    if (decision !== undefined)
      adminReviewData.decision = decision.toUpperCase();

    const review = await adminReviewService.upsert(
      submission_id,
      adminReviewData,
    );

    res.json({ success: true, data: review });
    return;
  } catch (error) {
    console.error("Admin review creation error:", error);
    res.status(500).json({ error: "Failed to create admin review" });
    return;
  }
});

app.get("/api/admin-reviews/:submissionId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);
    if (user?.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const { submissionId } = req.params;

    const review = await adminReviewService.getBySubmission(submissionId);

    if (!review) {
      res.status(404).json({ error: "Admin review not found" });
      return;
    }

    res.json({ success: true, data: review });
    return;
  } catch (error) {
    console.error("Admin review fetch error:", error);
    res.status(500).json({ error: "Failed to fetch admin review" });
    return;
  }
});

// Drafts endpoints
app.get("/api/drafts", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const { limit = 10, offset = 0 } = req.query;

    // Get user
    const user = await userService.getByWallet(walletAddress);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get drafts for user
    const drafts = await prisma.draft.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.draft.count({
      where: { userId: user.id },
    });

    res.json({
      success: true,
      drafts,
      total,
      hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
    });
    return;
  } catch (error) {
    console.error("Drafts fetch error:", error);
    res.status(500).json({ error: "Failed to fetch drafts" });
    return;
  }
});


// FILES UPLOAD CHANGED --> CHECK IF IT WORKS
app.post(
  "/api/drafts",
  upload.fields([
    { name: "technicalCertification", maxCount: 1 },
    { name: "purchaseProof", maxCount: 1 },
    { name: "maintenanceRecords", maxCount: 1 },
    { name: "deviceImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Draft POST request received");
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No authorization header");
        res.status(401).json({ error: "Authorization header required" });
        return;
      }

      const token = authHeader.substring(7);
      console.log("Token received:", token.substring(0, 20) + "...");

      const jwt = require("jsonwebtoken");

      const decoded = jwt.verify(token, env.JWT_SECRET);
      console.log("JWT decoded:", decoded);
      const { walletAddress } = decoded;

      console.log("Looking for user with wallet:", walletAddress);
      const user = await userService.findOrCreateByWallet(walletAddress);
      console.log("User found/created:", user.id);

      // Extract form data
      const draftData = {
        deviceName: req.body.deviceName,
        deviceType: req.body.deviceType,
        location: req.body.location,
        serialNumber: req.body.serialNumber,
        manufacturer: req.body.manufacturer,
        model: req.body.model,
        yearOfManufacture: req.body.yearOfManufacture,
        condition: req.body.condition,
        specifications: req.body.specifications,
        purchasePrice: req.body.purchasePrice,
        currentValue: req.body.currentValue,
        expectedRevenue: req.body.expectedRevenue,
        operationalCosts: req.body.operationalCosts,
      };

      // Process files if any
      const files: Array<{
        filename: string;
        path: string;
        size: number;
        mimeType: string;
        documentType: string;
      }> = [];

      if (req.files) {
        const uploadedFiles = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        // Process technical certification
        if (uploadedFiles.technicalCertification) {
          const file = uploadedFiles.technicalCertification[0];
          files.push({
            filename: file.originalname,
            path: `/uploads/drafts/technical/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: "technical_certification",
          });
        }

        // Process purchase proof
        if (uploadedFiles.purchaseProof) {
          const file = uploadedFiles.purchaseProof[0];
          files.push({
            filename: file.originalname,
            path: `/uploads/drafts/purchase/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: "purchase_proof",
          });
        }

        // Process maintenance records
        if (uploadedFiles.maintenanceRecords) {
          const file = uploadedFiles.maintenanceRecords[0];
          files.push({
            filename: file.originalname,
            path: `/uploads/drafts/maintenance/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: "maintenance_records",
          });
        }

        // Process device images
        if (uploadedFiles.deviceImages) {
          uploadedFiles.deviceImages.forEach((file, index) => {
            files.push({
              filename: file.originalname,
              path: `/uploads/drafts/images/${file.filename}`,
              size: file.size,
              mimeType: file.mimetype,
              documentType: "device_image",
            });
          });
        }
      }

      console.log("Creating draft with data:", draftData);
      console.log("Files to save:", files);

      const draft = await draftService.create(user.id, {
        ...draftData,
        files: files.length > 0 ? files : undefined,
      });

      console.log("Draft created successfully:", draft.id);
      res.json({ success: true, draft });
      return;
    } catch (error: any) {
      console.error("Draft creation error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to create draft" });
      return;
    }
  },
);

app.get("/api/drafts/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.findOrCreateByWallet(walletAddress);
    const { id } = req.params;

    // Get draft by ID and user
    const draft = await prisma.draft.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!draft) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }

    res.json({ success: true, draft });
    return;
  } catch (error) {
    console.error("Draft fetch error:", error);
    res.status(500).json({ error: "Failed to fetch draft" });
    return;
  }
});

app.put(
  "/api/drafts/:id",
  upload.fields([
    { name: "technicalCertification", maxCount: 1 },
    { name: "purchaseProof", maxCount: 1 },
    { name: "maintenanceRecords", maxCount: 1 },
    { name: "deviceImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Draft PUT request received");
      console.log("Request body:", req.body);
      console.log("Request files:", req.files);

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authorization header required" });
        return;
      }

      const token = authHeader.substring(7);
      const jwt = require("jsonwebtoken");

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const { walletAddress } = decoded;

      const user = await userService.findOrCreateByWallet(walletAddress);
      const { id } = req.params;

      // Check if draft exists and belongs to user
      const existingDraft = await prisma.draft.findFirst({
        where: {
          id: id,
          userId: user.id,
        },
      });

      if (!existingDraft) {
        res.status(404).json({ error: "Draft not found" });
        return;
      }

      // Extract form data
      const updateData = {
        deviceName: req.body.deviceName,
        deviceType: req.body.deviceType,
        location: req.body.location,
        serialNumber: req.body.serialNumber,
        manufacturer: req.body.manufacturer,
        model: req.body.model,
        yearOfManufacture: req.body.yearOfManufacture,
        condition: req.body.condition,
        specifications: req.body.specifications,
        purchasePrice: req.body.purchasePrice,
        currentValue: req.body.currentValue,
        expectedRevenue: req.body.expectedRevenue,
        operationalCosts: req.body.operationalCosts,
      };

      // Process files if any
      const files: Array<{
        filename: string;
        path: string;
        size: number;
        mimeType: string;
        documentType: string;
      }> = [];

      if (req.files) {
        const uploadedFiles = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        // Process technical certification
        if (uploadedFiles.technicalCertification) {
          const file = uploadedFiles.technicalCertification[0];
          files.push({
            filename: file.originalname,
            path: `/uploads/drafts/technical/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: "technical_certification",
          });
        }

        // Process purchase proof
        if (uploadedFiles.purchaseProof) {
          const file = uploadedFiles.purchaseProof[0];
          files.push({
            filename: file.originalname,
            path: `/uploads/drafts/purchase/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: "purchase_proof",
          });
        }

        // Process maintenance records
        if (uploadedFiles.maintenanceRecords) {
          const file = uploadedFiles.maintenanceRecords[0];
          files.push({
            filename: file.originalname,
            path: `/uploads/drafts/maintenance/${file.filename}`,
            size: file.size,
            mimeType: file.mimetype,
            documentType: "maintenance_records",
          });
        }

        // Process device images
        if (uploadedFiles.deviceImages) {
          uploadedFiles.deviceImages.forEach((file, index) => {
            files.push({
              filename: file.originalname,
              path: `/uploads/drafts/images/${file.filename}`,
              size: file.size,
              mimeType: file.mimetype,
              documentType: "device_image",
            });
          });
        }
      }

      console.log("Updating draft with data:", updateData);
      console.log("Files to save:", files);

      // Update the draft
      const updatedDraft = await draftService.update(id, {
        ...updateData,
        files: files.length > 0 ? files : undefined,
      });

      res.json({ success: true, draft: updatedDraft });
      return;
    } catch (error) {
      console.error("Draft update error:", error);
      res.status(500).json({ error: "Failed to update draft" });
      return;
    }
  },
);

app.delete("/api/drafts/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.findOrCreateByWallet(walletAddress);
    const { id } = req.params;

    // Check if draft exists and belongs to user
    const existingDraft = await prisma.draft.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingDraft) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }

    // Delete the draft
    await prisma.draft.delete({
      where: { id: id },
    });

    res.json({ success: true, message: "Draft deleted successfully" });
    return;
  } catch (error) {
    console.error("Draft deletion error:", error);
    res.status(500).json({ error: "Failed to delete draft" });
    return;
  }
});

// Deployment endpoints
app.get("/api/deployments", async (req, res) => {
  try {
    const { limit = 10, environment } = req.query;

    const { deploymentService } = require("./lib/deployment-service");

    let deployments;
    if (environment) {
      deployments = await deploymentService.getDeploymentsByEnvironment(
        environment as string,
        parseInt(limit as string),
      );
    } else {
      deployments = await deploymentService.getRecentDeployments(
        parseInt(limit as string),
      );
    }
    res.json({
      success: true,
      deployments,
      total: deployments.length,
    });
  } catch (error) {
    console.error("Deployments fetch error:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
});

app.get("/api/deployments/stats", async (req, res) => {
  try {
    const { deploymentService } = require("./lib/deployment-service");
    const stats = await deploymentService.getDeploymentStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Deployment stats error:", error);
    res.status(500).json({ error: "Failed to fetch deployment stats" });
  }
});

app.get("/api/deployments/latest/:environment", async (req, res) => {
  try {
    const { environment } = req.params;
    const { deploymentService } = require("./lib/deployment-service");

    const latest = await deploymentService.getLatestDeployment(environment);

    if (!latest) {
      res.status(404).json({ error: "No deployment found for environment" });
      return;
    }

    res.json({
      success: true,
      deployment: latest,
    });
  } catch (error) {
    console.error("Latest deployment fetch error:", error);
    res.status(500).json({ error: "Failed to fetch latest deployment" });
  }
});

// Admin endpoints
// CHECK THIS STILL NECESARY?
app.get("/api/admin/profiles", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authorization header required" });
      return;
    }

    const token = authHeader.substring(7);
    const jwt = require("jsonwebtoken");

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const { walletAddress } = decoded;

    const user = await userService.getByWallet(walletAddress);
    if (user?.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const { limit = 50, offset = 0 } = req.query;

    // Get all profiles with user information
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              email: true,
              name: true,
              company: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.profile.count(),
    ]);

    res.json({
      success: true,
      profiles,
      total,
      hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
    });
    return;
  } catch (error) {
    console.error("Admin profiles fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profiles" });
    return;
  }
});

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ error: "Internal server error" });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Log deployment to database
    try {
      const { deploymentService } = require("./lib/deployment-service");
      const deploymentInfo = deploymentService.getCurrentDeploymentInfo();
      deploymentInfo.notes = "Backend startup deployment log";
      deploymentInfo.metadata = {
        ...deploymentInfo.metadata,
        startupTime: new Date().toISOString(),
        processId: process.pid,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      };

      await deploymentService.logDeployment(deploymentInfo);
      console.log("🚀 Deployment logged to database");
    } catch (deploymentError) {
      console.error(
        "⚠️ Failed to log deployment (continuing anyway):",
        deploymentError,
      );
    }

    // Start session cleanup job (runs every hour)
    setInterval(
      async () => {
        try {
          await authService.cleanupExpired();
          console.log("🧹 Cleaned up expired sessions and challenges");
        } catch (error) {
          console.error("❌ Session cleanup error:", error);
        }
      },
      60 * 60 * 1000,
    ); // Run every hour

    // Run initial cleanup
    await authService.cleanupExpired();
    console.log("🧹 Initial cleanup completed");

    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(
        `🔒 Security: Rate limiting, enhanced helmet, session cleanup active`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer(); // Force rebuild: Fri Jul  4 23:37:46 -04 2025 - F234C7A6-1C9B-4817-82F8-BA6B6BDC0612
 // last endpoints check: fri/sept 12/2025 -> Mati (WIP)
