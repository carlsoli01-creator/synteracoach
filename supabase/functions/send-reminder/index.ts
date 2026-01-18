import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  invoiceId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with user's auth token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { invoiceId }: ReminderRequest = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    // Fetch invoice with client info
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (name, email, company)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Invoice fetch error:", invoiceError);
      throw new Error("Invoice not found");
    }

    // Fetch user profile for sender info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.full_name || "Your service provider";
    const clientName = invoice.clients?.name || "Valued Customer";
    const clientEmail = invoice.clients?.email;
    const companyName = invoice.clients?.company || "";

    if (!clientEmail) {
      throw new Error("Client email not found");
    }

    const isOverdue = new Date(invoice.due_date) < new Date();
    const subject = isOverdue
      ? `Overdue Payment Reminder - ${formatCurrency(invoice.amount)}`
      : `Payment Reminder - ${formatCurrency(invoice.amount)}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Dear ${clientName}${companyName ? ` (${companyName})` : ""},</p>
    
    <p>This is a friendly reminder about your ${isOverdue ? "<strong style='color: #e74c3c;'>overdue</strong> " : ""}invoice.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Amount Due:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 18px; color: ${isOverdue ? "#e74c3c" : "#2ecc71"};">${formatCurrency(invoice.amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Due Date:</td>
          <td style="padding: 8px 0; text-align: right; ${isOverdue ? "color: #e74c3c; font-weight: bold;" : ""}">${formatDate(invoice.due_date)}</td>
        </tr>
        ${invoice.description ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Description:</td>
          <td style="padding: 8px 0; text-align: right;">${invoice.description}</td>
        </tr>
        ` : ""}
      </table>
    </div>
    
    ${isOverdue ? `
    <p style="color: #e74c3c; font-weight: 500;">
      ⚠️ This payment is now overdue. Please arrange payment at your earliest convenience to avoid any late fees.
    </p>
    ` : `
    <p>Please ensure payment is made by the due date to avoid any late fees.</p>
    `}
    
    <p>If you have already made this payment, please disregard this message. If you have any questions, please don't hesitate to reach out.</p>
    
    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>${senderName}</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>This is an automated reminder. Please do not reply directly to this email.</p>
  </div>
</body>
</html>
    `;

    console.log(`Sending reminder email to ${clientEmail} for invoice ${invoiceId}`);

    const emailResponse = await resend.emails.send({
      from: "Payment Reminder <onboarding@resend.dev>",
      to: [clientEmail],
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invoice reminder count
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        reminders_sent: invoice.reminders_sent + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Failed to update invoice:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reminder email sent successfully",
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
