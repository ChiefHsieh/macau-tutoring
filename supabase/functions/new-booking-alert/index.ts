// Deno Edge Function stub — wire your email provider (Resend/SendGrid) + service role.
// Trigger via Database Webhook on `public.bookings` INSERT (see README.md).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type BookingRecord = {
  id: string;
  tutor_id: string;
  student_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  subject: string | null;
  payment_status: string;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "POST only" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { type?: string; record?: BookingRecord; old_record?: BookingRecord };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = body.record;
  if (!record?.tutor_id) {
    return new Response(JSON.stringify({ ok: false, error: "Missing booking record" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // TODO: create Supabase client with SERVICE_ROLE_KEY, load tutor email, send via Resend/SendGrid.
  console.log("new-booking-alert stub", { bookingId: record.id, tutorId: record.tutor_id });

  return new Response(
    JSON.stringify({
      ok: true,
      message: "Stub: implement email send + optional duplicate in-app notification.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
