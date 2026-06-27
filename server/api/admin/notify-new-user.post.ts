import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { roleRequests } from "../../../db/schema";
import { eq } from "drizzle-orm";

// Load .env first
dotenv.config();
// Load .env.local to override
dotenv.config({ path: ".env.local", override: true });

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  const user = session.user;
  const config = useRuntimeConfig();

  const transporter = nodemailer.createTransport({
    host: config.smtpHost || process.env.SMTP_HOST,
    port: Number(config.smtpPort || process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS,
    },
  } as nodemailer.TransportOptions);

  const adminEmail = config.adminEmail || process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set, skipping email notification");
    return { success: false, message: "Admin email not configured" };
  }

  // Fetch requested role
  const roleRequest = await useDrizzle().query.roleRequests.findFirst({
    where: eq(roleRequests.userId, user.id),
  });

  const requestedRole = roleRequest?.role || "Not specified";

  try {
    await transporter.sendMail({
      from: `"AI Tutor" <${config.smtpUser || process.env.SMTP_USER}>`,
      to: adminEmail as string,
      subject: "New User Signup - AI Tutor",
      text: `A new user has signed up and is pending approval.\n\nName: ${user.name}\nEmail: ${user.email}\nID: ${user.id}\nRequested Role: ${requestedRole}`,
      html: `
        <h1>New User Signup</h1>
        <p>A new user has signed up and is pending approval.</p>
        <ul>
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>ID:</strong> ${user.id}</li>
          <li><strong>Requested Role:</strong> ${requestedRole}</li>
        </ul>
        <a href=${config.public.baseURL}
            style="
              display: inline-block;
              padding: 12px 20px;
              margin-top: 16px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          target="_blank">
          Go to Admin Panel
        </a>

        <p>Please login to the admin dashboard to assign a role.</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send email",
    });
  }
});
