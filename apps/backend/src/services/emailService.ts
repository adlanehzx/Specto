interface InvitationEmailData {
  to: string;
  projectName: string;
  role: string;
  invitationLink: string;
}

/**
 * Send project invitation email
 * TODO: Implement with Resend, SendGrid, or other email service
 */
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<void> {
  console.log("📧 Sending invitation email:", {
    to: data.to,
    subject: `You've been invited to ${data.projectName}`,
    role: data.role,
    link: data.invitationLink,
  });

  // TODO: Implement real email sending
  // Example with Resend:
  /*
  import { Resend } from 'resend';
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'LeynAI <noreply@leynai.com>',
    to: data.to,
    subject: `You've been invited to ${data.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Project Invitation</h2>
        <p>You've been invited to join <strong>${data.projectName}</strong> as <strong>${data.role}</strong>.</p>
        <p>
          <a href="${data.invitationLink}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          This invitation was sent by LeynAI. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    `
  });
  */
}
