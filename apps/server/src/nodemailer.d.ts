declare module "nodemailer" {
  const nodemailer: {
    createTransport(options: unknown): { sendMail(options: unknown): Promise<{ accepted: string[]; rejected: string[]; messageId: string }>;
  };
  };
  export default nodemailer;
}
