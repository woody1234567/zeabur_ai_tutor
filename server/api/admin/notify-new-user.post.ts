import nodemailer from "nodemailer";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const user = session.user;
  const config = useRuntimeConfig();

  const transporter = nodemailer.createTransport({
    host: config.smtpHost || process.env.SMTP_HOST,
    port: Number(config.smtpPort || process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.smtpUser || process.env.SMTP_USER,
      pass: config.smtpPass || process.env.SMTP_PASS,
    },
  });

  const adminEmail = config.adminEmail || process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not set, skipping email notification");
    return { success: false, message: "Admin email not configured" };
  }

  try {
    await transporter.sendMail({
      from: `"AI Tutor" <${config.smtpUser || process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: "New User Signup - AI Tutor",
      text: `A new user has signed up and is pending approval.\n\nName: ${user.name}\nEmail: ${user.email}\nID: ${user.id}`,
      html: `
        <h1>New User Signup</h1>
        <p>A new user has signed up and is pending approval.</p>
        <ul>
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>ID:</strong> ${user.id}</li>
        </ul>
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
