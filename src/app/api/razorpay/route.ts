import Razorpay from "razorpay"
import shortid from "shortid"
import { NextResponse } from "next/server"

// Initialize razorpay instance
// In production, use env variables: process.env.RAZORPAY_KEY and process.env.RAZORPAY_SECRET
const razorpay = new Razorpay({
    key_id: "rzp_test_SAMSrwBkHAr3ZE",
    key_secret: "JsK8dQj8gfDFF6RljHCqbt5c"
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { amount, currency } = body

        const options = {
            amount: (amount * 100).toString(), // Razorpay expects amount in subunits (paise for INR)
            currency: currency,
            receipt: shortid.generate(),
            payment_capture: 1
        }

        const order = await razorpay.orders.create(options)
        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount
        })

    } catch (error) {
        console.error("Error creating Razorpay order:", error)
        return NextResponse.json(
            { error: "Error creating order" },
            { status: 500 }
        )
    }
}
