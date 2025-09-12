// CHECK IF THIS VERIFICATION IS NECESARY O JUST REMOVE IT
// import crypto from 'crypto';


// const verifyWebhookSignature = (payload, signature, secret) => {
//   const hmac = crypto.createHmac('sha256', secret);
//   hmac.update(payload);
//   const calculatedSignature = hmac.digest('hex');
//   return crypto.timingSafeEqual(
//     Buffer.from(signature),
//     Buffer.from(calculatedSignature)
//   );
// };

export let lastPersonaVerification: { webHookReceived: any; status: any; referenceId: any } | null = null;

export const handlePersonaWebhook = async (req, res) => {
  console.log('🎯 Persona Webhook received:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  try {
    // const signature = req.headers['persona-signature'];
    // const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET;

    // if (webhookSecret && signature) {
    //   const isValid = verifyWebhookSignature(
    //     JSON.stringify(req.body),
    //     signature,
    //     webhookSecret
    //   );

    //   if (!isValid) {
    //     console.error('Invalid webhook signature');
    //     return res.status(401).json({ error: 'Invalid signature' });
    //   }
    // }

    const event = req.body;
    console.log('📥 Received Persona webhook event:', JSON.stringify(event, null, 2));

    // Extract data from webhook payload
    const inquiryId = event.data?.id || event.data?.attributes?.payload?.data?.id;
    const verificationStatus = event.data?.attributes?.status || event.data?.attributes?.payload?.data?.attributes?.status;
    const referenceId = event.data?.attributes?.['reference-id'] || event.data?.attributes?.payload?.data?.attributes?.['reference-id'];

    console.log('🔍 Extracted webhook data:', { inquiryId, verificationStatus, referenceId });

    if (!verificationStatus || !referenceId || !inquiryId) {
      console.error('❌ Missing required webhook data:', { verificationStatus, referenceId, inquiryId });
      return res.status(400).json({ error: 'Missing required webhook data' });
    }

    // The referenceId from Persona is our internal user ID
    const { personaValidationService } = require('../lib/database');
    console.log('🔍 Upserting validation with referenceId (user.id):', referenceId);

    // Update PersonaValidation record using our service with the user ID
    const result = await personaValidationService.upsert(referenceId, inquiryId, verificationStatus);
    console.log('✅ Updated PersonaValidation record:', result);

    // Keep the last verification for backward compatibility
    lastPersonaVerification = {
      webHookReceived: event,
      status: verificationStatus,
      referenceId: referenceId
    };

    console.log('✅ Processed Persona webhook:', { verificationStatus, referenceId, inquiryId });
    res.status(200).json({
      status: verificationStatus,
      inquiryId: inquiryId,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Don't expose internal errors to the webhook caller
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
