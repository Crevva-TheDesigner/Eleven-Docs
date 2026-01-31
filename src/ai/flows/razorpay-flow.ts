'use server';
/**
 * @fileOverview Flows for handling Razorpay payment processing.
 *
 * - createRazorpayOrder - Creates an order on Razorpay's servers.
 * - verifyRazorpayPayment - Verifies the signature of a completed payment.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// --- Create Order Flow ---

const CreateOrderInputSchema = z.object({
  amount: z.number().describe("Amount in the smallest currency unit (e.g., paise for INR)"),
  currency: z.string().default('INR'),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

const OrderSchema = z.object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

const createRazorpayOrderFlow = ai.defineFlow({
    name: 'createRazorpayOrderFlow',
    inputSchema: CreateOrderInputSchema,
    outputSchema: OrderSchema,
}, async (input) => {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay API keys must be set in .env file');
    }
    const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
        amount: input.amount,
        currency: input.currency,
        receipt: `receipt_${new Date().getTime()}`,
    };
    const order = await razorpay.orders.create(options);
    return {
        id: order.id,
        amount: order.amount,
        currency: order.currency
    };
});

export async function createRazorpayOrder(input: CreateOrderInput): Promise<Order> {
    return createRazorpayOrderFlow(input);
}


// --- Verify Payment Flow ---

const VerifyPaymentInputSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentInputSchema>;

const VerifyPaymentOutputSchema = z.object({
    isValid: z.boolean(),
    vpa: z.string().nullable(),
});

const verifyRazorpayPaymentFlow = ai.defineFlow({
    name: 'verifyRazorpayPaymentFlow',
    inputSchema: VerifyPaymentInputSchema,
    outputSchema: VerifyPaymentOutputSchema,
}, async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
    if (!process.env.RAZORPAY_KEY_SECRET || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay API secret key must be set in .env file');
    }
    
    const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
        try {
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
            return { isValid: true, vpa: payment.vpa || null };
        } catch (error) {
            console.error("Error fetching payment details from Razorpay:", error);
            // Signature is valid, but we failed to fetch payment details from Razorpay's API.
            // This is a critical failure. It's safer to treat this as a payment verification failure.
            return { isValid: false, vpa: null };
        }
    }

    return { isValid: false, vpa: null };
});

export async function verifyRazorpayPayment(input: VerifyPaymentInput): Promise<{isValid: boolean, vpa: string | null}> {
    return verifyRazorpayPaymentFlow(input);
}
