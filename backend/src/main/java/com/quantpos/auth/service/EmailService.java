package com.quantpos.auth.service;

import com.quantpos.config.AppProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;
    private final String senderEmail;
    private final String senderName;

    public EmailService(JavaMailSender mailSender, AppProperties appProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;
        this.senderName = appProperties.getMail().getSenderName();
        
        String configuredSenderEmail = appProperties.getMail().getSenderEmail();
        if (configuredSenderEmail != null && !configuredSenderEmail.isBlank()) {
            this.senderEmail = configuredSenderEmail;
        } else if (mailSender instanceof JavaMailSenderImpl impl) {
            this.senderEmail = impl.getUsername();
        } else {
            this.senderEmail = "[EMAIL_ADDRESS]";
        }
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(new InternetAddress(senderEmail, senderName));
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildHtmlEmail(String content) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px; color: #374151;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <h1 style="color: #4f46e5; margin-top: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">QuantPOS</h1>
                    <div style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
                        %s
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 24px;" />
                    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                        Securely sent by QuantPOS<br/>
                        If you did not request this, please ignore this email.
                    </p>
                </div>
            </body>
            </html>
            """, content);
    }

    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String otp) {
        String subject = "Your QuantPOS verification code";
        String content = String.format("""
                <p>Hi %s,</p>
                <p>Welcome to QuantPOS! Use the verification code below to confirm your email address:</p>
                
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">%s</span>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">This code expires in 10 minutes. Do not share it with anyone.</p>
                """, fullName, otp);

        sendEmail(toEmail, subject, buildHtmlEmail(content));
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
        String subject = "Reset your QuantPOS account access";
        String url = appProperties.getBaseUrl() + "/reset-password?token=" + token;
        String content = String.format("""
                <p>Hi %s,</p>
                <p>We received a request to reset the password for your QuantPOS account.</p>
                
                <div style="margin: 32px 0; text-align: center;">
                    <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">This link expires in 1 hour. If you cannot click the button, copy and paste this link into your browser:<br/>
                <a href="%s" style="color: #4f46e5;">%s</a></p>
                """, fullName, url, url, url);

        sendEmail(toEmail, subject, buildHtmlEmail(content));
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String fullName, String businessName) {
        String subject = "Welcome to QuantPOS — Your account is ready";
        String url = appProperties.getBaseUrl() + "/login";
        String content = String.format("""
                <p>Hi %s,</p>
                <p>Great news! Your account for <strong>%s</strong> is now active on QuantPOS.</p>
                
                <div style="margin: 32px 0;">
                    <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Log In to Dashboard</a>
                </div>
                """, fullName, businessName, url);

        sendEmail(toEmail, subject, buildHtmlEmail(content));
    }

    @Async
    public void send2faEmail(String toEmail, String fullName, String otp) {
        String subject = "Your QuantPOS login code";
        String content = String.format("""
                <p>Hi %s,</p>
                <p>Complete your login with this 6-digit secure code:</p>
                
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #111827;">%s</span>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">This code expires in 10 minutes. Do not share it with anyone.</p>
                <p style="font-size: 14px; color: #ef4444; margin-top: 16px;">If you did not attempt to log in, please change your password immediately.</p>
                """, fullName, otp);

        sendEmail(toEmail, subject, buildHtmlEmail(content));
    }
}
