const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `${process.env.EMAIL_USER}`,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send event creation notification
exports.sendEventCreationEmail = async (userEmail, eventTitle) => {
  const message = `
    <h2>Event Created Successfully!</h2>
    <p>Your event "${eventTitle}" has been created and is now live.</p>
    <p>You can manage your event from your dashboard.</p>
  `;

  await sendEmail({
    email: userEmail,
    subject: 'Event Created Successfully',
    message: message,
  });
};

// Send registration confirmation email
exports.sendRegistrationConfirmationEmail = async (userEmail, eventTitle, eventDate) => {
  const message = `
    <h2>Registration Confirmed!</h2>
    <p>You have successfully registered for the event "${eventTitle}".</p>
    <p>Event Date: ${new Date(eventDate).toLocaleDateString()}</p>
    <p>We look forward to seeing you there!</p>
  `;

  await sendEmail({
    email: userEmail,
    subject: 'Event Registration Confirmed',
    message: message,
  });
};

// Send cancellation email
exports.sendCancellationEmail = async (userEmail, eventTitle) => {
  const message = `
    <h2>Registration Cancelled</h2>
    <p>Your registration for "${eventTitle}" has been cancelled.</p>
  `;

  await sendEmail({
    email: userEmail,
    subject: 'Registration Cancelled',
    message: message,
  });
};

