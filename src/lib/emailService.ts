export interface EmailParams {
  name: string;
  phone: string;
  email: string;
  company: string;
  service: string;
  message: string;
  selectedPackage?: {
    packageName: string;
    packageId: string;
    packagePrice: string;
    packageCategory: string;
    duration: string;
    addonsOrOptions?: string[];
    totalAmount: string;
  } | null;
  selectedBlueprint?: {
    projectName: string;
    projectCategory: string;
    designType: string;
    projectId: string;
    portfolioReference: string;
    estimatedBudget: string;
    projectUrl: string;
  } | null;
  freeConsultation?: {
    inquiryType: string;
    selectedItem: string;
    pageUrl: string;
    referenceId: string;
  } | null;
}

export interface ContactSubmissionResult {
  success: boolean;
  message: string;
  smtpConfigured: boolean;
  smtpSuccess: boolean;
  authentication?: 'SUCCESS' | 'FAILED';
  emailDelivery?: 'SUCCESS' | 'FAILED';
  error?: string;
  advice?: string;
}

/**
 * Submits contact or audit enquiries to the secure server-side backend (/api/contact).
 * The server validates input, saves the enquiry to the database first, and then dispatches
 * the Gmail SMTP notification to qbench.official@gmail.com without exposing any credentials.
 */
export const sendEmailJS = async (params: EmailParams): Promise<ContactSubmissionResult> => {
  const requestPayload: Record<string, any> = {
    fullName: params.name,
    businessName: params.company || 'Not specified',
    phoneNumber: params.phone,
    emailAddress: params.email,
    to: 'qbench.official@gmail.com',
    subject: `New QBENCH Website Enquiry — ${params.name}`,
    message: params.message,
    name: params.name,
    phone: params.phone,
    email: params.email,
    company: params.company || 'Not specified',
    service: params.service
  };

  if (params.selectedPackage) {
    requestPayload.selectedPackage = params.selectedPackage;
  }

  if (params.selectedBlueprint) {
    requestPayload.selectedBlueprint = params.selectedBlueprint;
  }

  if (params.freeConsultation) {
    requestPayload.freeConsultation = params.freeConsultation;
  }

  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'Unable to process your enquiry right now. Please try again.');
  }

  return {
    success: true,
    message: data.message || 'Thank you for contacting QBENCH. Our team will get back to you within 24 hours.',
    smtpConfigured: Boolean(data.smtpConfigured),
    smtpSuccess: Boolean(data.smtpSuccess),
    authentication: data.authentication,
    emailDelivery: data.emailDelivery,
    error: data.error,
    advice: data.advice
  };
};
