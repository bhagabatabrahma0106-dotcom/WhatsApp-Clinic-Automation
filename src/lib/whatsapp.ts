import { clinicStore } from './storage';

export interface SendWhatsAppTextMessageParams {
  to: string;
  body: string;
}

export interface SendWhatsAppTemplateMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters: string[];
}

export async function sendWhatsAppTextMessage({ to, body }: SendWhatsAppTextMessageParams) {
  const settings = clinicStore.getSettings();
  const phoneNumberId = settings.metaPhoneNumberId;
  const token = settings.metaAccessToken;

  // Clean phone number (strip + and spaces)
  const cleanPhone = to.replace(/[^0-9]/g, '');

  if (!phoneNumberId || !token) {
    console.warn(`[WhatsApp API Simulated] Message to ${cleanPhone}: "${body}"`);
    return { success: true, simulated: true, to: cleanPhone, body };
  }

  try {
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: { body }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[WhatsApp Cloud API Error]', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[WhatsApp Network Error]', err?.message);
    return { success: false, error: err?.message };
  }
}

export async function sendWhatsAppTemplateMessage({
  to,
  templateName = 'appointment_reminder',
  languageCode = 'en',
  parameters
}: SendWhatsAppTemplateMessageParams) {
  const settings = clinicStore.getSettings();
  const phoneNumberId = settings.metaPhoneNumberId;
  const token = settings.metaAccessToken;

  const cleanPhone = to.replace(/[^0-9]/g, '');

  if (!phoneNumberId || !token) {
    console.warn(`[WhatsApp Template Simulated] Template: ${templateName} to ${cleanPhone} with params:`, parameters);
    return { success: true, simulated: true, to: cleanPhone, template: templateName, parameters };
  }

  try {
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p }))
          }
        ]
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[WhatsApp Template Error]', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[WhatsApp Template Network Error]', err?.message);
    return { success: false, error: err?.message };
  }
}
