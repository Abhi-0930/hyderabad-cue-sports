import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/lib/supabase";
import type { OrderRecord } from "@/types/admin";

/**
 * Clean Web Audio API chime (2-tone soft bell) so admin hears new orders
 * without downloading any heavy external audio files.
 */
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.8);
  } catch {
    // Audio autoplay restrictions or headless context fallback
  }
}

interface RawDbOrder {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  subtotal?: number;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  shipping_address?: Record<string, unknown> | string;
  created_at: string;
}

export function useRealtimeOrders({
  onNewOrder,
  onUpdateOrder,
}: {
  onNewOrder: (order: Partial<OrderRecord>) => void;
  onUpdateOrder: (order: Partial<OrderRecord>) => void;
}) {
  const onNewOrderRef = useRef(onNewOrder);
  const onUpdateOrderRef = useRef(onUpdateOrder);

  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
    onUpdateOrderRef.current = onUpdateOrder;
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("admin-orders-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const raw = payload.new as RawDbOrder;
          if (!raw || !raw.order_number) return;

          if (payload.eventType === "INSERT") {
            playOrderChime();
            toast.success(`New order placed: #${raw.order_number}`, {
              description: `₹${Number(raw.total_amount || 0).toLocaleString("en-IN")} · ${raw.customer_name || "Guest Customer"}`,
              duration: 8000,
            });

            onNewOrderRef.current({
              id: raw.order_number,
              customerId: raw.customer_id || `cust-${Date.now()}`,
              customer: raw.customer_name || "New Customer",
              email: "Customer (Encrypted PII)",
              mobile: "Phone (Encrypted PII)",
              orderDate: new Date(raw.created_at || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              items: [],
              subtotal: Number(raw.subtotal || raw.total_amount || 0),
              gst: 0,
              shipping: 0,
              total: Number(raw.total_amount || 0),
              paymentStatus: (raw.payment_status === "paid" ? "Paid" : "Pending") as OrderRecord["paymentStatus"],
              orderStatus: (raw.order_status === "confirmed" ? "Confirmed" : "Pending") as OrderRecord["orderStatus"],
              paymentMethod: raw.payment_method || "Online",
              transactionId: "TXN-REALTIME",
              billingAddress: "Billing address on file",
              shippingAddress: typeof raw.shipping_address === "string" ? raw.shipping_address : "Verified address",
              courier: "Delhivery / BlueDart",
              trackingNumber: "Pending dispatch",
              timeline: [
                { label: "Order placed", detail: "Customer completed checkout", date: "Just now", done: true },
                { label: "Payment verification", detail: raw.payment_status || "Pending", date: "In progress", done: raw.payment_status === "paid" },
              ],
            });
          } else if (payload.eventType === "UPDATE") {
            toast.info(`Order #${raw.order_number} status updated to ${raw.order_status}`);
            onUpdateOrderRef.current({
              id: raw.order_number,
              orderStatus: (raw.order_status || "Pending") as OrderRecord["orderStatus"],
              paymentStatus: (raw.payment_status === "paid" ? "Paid" : "Pending") as OrderRecord["paymentStatus"],
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("⚡ Supabase Realtime connected: Listening for live orders without polling.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
