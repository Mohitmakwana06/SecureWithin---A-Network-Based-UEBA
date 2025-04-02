import smtplib
from pydantic import EmailStr
import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

def send_email(email: EmailStr, subject: str, message: str):
    smtp_email = "newprojectueba69@gmail.com" #os.getenv("EMAIL_USERNAME")
    smtp_password = "jygg isrf xgbx mwjt" #os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("EMAIL_SERVER")
    smtp_port = int(os.getenv("EMAIL_PORT"))

    subject = subject

    message = message

    email_body = f"Subject: {subject}\n\n{message}"

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.sendmail(smtp_email, email, email_body)
        server.quit()
        return True
    except Exception as e:
        print("Error sending email: ",e)
        return False
