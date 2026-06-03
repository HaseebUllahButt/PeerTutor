import crypto from 'crypto';

// FastPay Integration Config
const FASTPAY_MERCHANT_MOBILE = process.env.FASTPAY_MERCHANT_MOBILE;
const FASTPAY_STORE_PASSWORD = process.env.FASTPAY_STORE_PASSWORD;
const FASTPAY_ENVIRONMENT = process.env.FASTPAY_ENVIRONMENT || 'sandbox';

const FASTPAY_BASE_URL = FASTPAY_ENVIRONMENT === 'production'
  ? 'https://secure.fast-pay.cash'
  : 'https://test-gateway.fast-pay.cash';

// PayFast Pakistan Config (JazzCash, EasyPaisa, etc.)
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_SECURED_KEY = process.env.PAYFAST_SECURED_KEY;
const PAYFAST_ENVIRONMENT = process.env.PAYFAST_ENVIRONMENT || 'sandbox';

const PAYFAST_BASE_URL = PAYFAST_ENVIRONMENT === 'production'
  ? 'https://ipg.gopayfast.com/api'
  : 'https://sandbox.gopayfast.com/api';

// Stripe Config
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export interface PaymentInitiationResult {
  success: boolean;
  transactionId: string;
  redirectUrl?: string;
  message?: string;
}

/**
 * Initiates a payment with FastPay (Iraq)
 */
export async function initiateFastPay(
  orderId: string,
  amount: number,
  customerMobile: string,
  redirectUrl: string
): Promise<PaymentInitiationResult> {
  // If credentials are not filled, use our mock fallback
  if (!FASTPAY_MERCHANT_MOBILE || !FASTPAY_STORE_PASSWORD) {
    console.warn('FastPay credentials not configured. Using sandbox redirect mock.');
    const mockRedirect = `/dashboard/payments/mock-gateway?gateway=fastpay&orderId=${orderId}&amount=${amount}&method=jazzcash`;
    return {
      success: true,
      transactionId: `FP-MOCK-${Date.now()}`,
      redirectUrl: mockRedirect,
    };
  }

  try {
    const successRedirect = `${redirectUrl}?sessionId=${orderId}&status=success&method=jazzcash`;
    const response = await fetch(`${FASTPAY_BASE_URL}/api/v1/public/initiate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_mobile_number: FASTPAY_MERCHANT_MOBILE,
        store_password: FASTPAY_STORE_PASSWORD,
        amount: amount.toString(),
        order_id: orderId,
        bill_number: `BILL-${orderId}-${Date.now().toString().slice(-4)}`,
        refund_address: successRedirect,
      }),
    });

    const data = await response.json();
    if (response.ok && data.code === 200 && data.data?.redirect_url) {
      return {
        success: true,
        transactionId: data.data.token || `FP-${Date.now()}`,
        redirectUrl: data.data.redirect_url,
      };
    }

    return {
      success: false,
      transactionId: '',
      message: data.messages?.join(', ') || 'Failed to initiate FastPay transaction',
    };
  } catch (error) {
    console.error('FastPay initiation error:', error);
    return {
      success: false,
      transactionId: '',
      message: error instanceof Error ? error.message : 'Internal error initiating FastPay',
    };
  }
}

/**
 * Initiates a PayFast Pakistan (for JazzCash/EasyPaisa/Cards)
 */
export async function initiatePayFast(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerMobile: string,
  paymentMethod: string, // 'jazzcash' | 'easypaisa'
  redirectUrl: string
): Promise<PaymentInitiationResult> {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_SECURED_KEY) {
    console.warn('PayFast Pakistan credentials not configured. Using sandbox redirect mock.');
    const mockRedirect = `/dashboard/payments/mock-gateway?gateway=payfast&orderId=${orderId}&amount=${amount}&method=${paymentMethod}`;
    return {
      success: true,
      transactionId: `PF-MOCK-${Date.now()}`,
      redirectUrl: mockRedirect,
    };
  }

  try {
    const successRedirect = `${redirectUrl}?sessionId=${orderId}&status=success&method=${paymentMethod}`;
    // Generate secure signature or call the initiation endpoint
    // Normally PayFast requires a payload containing order details and merchant ID
    const response = await fetch(`${PAYFAST_BASE_URL}/ipg/v1/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_id: PAYFAST_MERCHANT_ID,
        secured_key: PAYFAST_SECURED_KEY,
        order_id: orderId,
        amount: amount.toString(),
        email_address: customerEmail || 'customer@peertutor.pk',
        mobile_number: customerMobile || '03001234567',
        payment_method: paymentMethod, // e.g. jazzcash, easypaisa
        return_url: successRedirect,
      }),
    });

    const data = await response.json();
    if (response.ok && data.redirect_url) {
      return {
        success: true,
        transactionId: data.transaction_id || `PF-${Date.now()}`,
        redirectUrl: data.redirect_url,
      };
    }

    return {
      success: false,
      transactionId: '',
      message: data.message || 'Failed to initiate PayFast transaction',
    };
  } catch (error) {
    console.error('PayFast initiation error:', error);
    return {
      success: false,
      transactionId: '',
      message: error instanceof Error ? error.message : 'Internal error initiating PayFast',
    };
  }
}

/**
 * Initiates a Stripe Checkout Session
 */
export async function initiateStripe(
  orderId: string,
  amount: number,
  subject: string,
  redirectUrl: string
): Promise<PaymentInitiationResult> {
  if (!STRIPE_SECRET_KEY) {
    console.warn('Stripe key not configured. Using sandbox redirect mock.');
    const mockRedirect = `/dashboard/payments/mock-gateway?gateway=stripe&orderId=${orderId}&amount=${amount}&method=stripe`;
    return {
      success: true,
      transactionId: `ST-MOCK-${Date.now()}`,
      redirectUrl: mockRedirect,
    };
  }

  try {
    const params = new URLSearchParams({
      'success_url': `${redirectUrl}?sessionId=${orderId}&status=success&txnId={CHECKOUT_SESSION_ID}&method=stripe`,
      'cancel_url': `${redirectUrl}?sessionId=${orderId}&status=cancelled&method=stripe`,
      'line_items[0][price_data][currency]': 'pkr',
      'line_items[0][price_data][product_data][name]': `Tutoring Session: ${subject}`,
      'line_items[0][price_data][unit_amount]': Math.round(amount * 100).toString(), // Stripe expects cents/paise
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'metadata[order_id]': orderId,
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (response.ok && data.url) {
      return {
        success: true,
        transactionId: data.id,
        redirectUrl: data.url,
      };
    }

    return {
      success: false,
      transactionId: '',
      message: data.error?.message || 'Failed to initiate Stripe transaction',
    };
  } catch (error) {
    console.error('Stripe initiation error:', error);
    return {
      success: false,
      transactionId: '',
      message: error instanceof Error ? error.message : 'Internal error initiating Stripe',
    };
  }
}
