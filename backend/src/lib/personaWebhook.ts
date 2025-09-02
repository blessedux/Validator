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

    const verificationStatus = event.data?.attributes?.payload?.data?.attributes?.status;
    const referenceId = event.data?.attributes?.payload?.data?.attributes?.reference_id;
    lastPersonaVerification = {
      webHookReceived: event,
      status: verificationStatus,
      referenceId: referenceId
    };

    console.log('Received Persona webhook event:', event.data?.attributes?.payload?.data?.attributes?.status);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
