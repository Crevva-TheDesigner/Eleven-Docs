'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';


export default function PrivacyPolicyPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-14rem)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-8 text-center">Privacy Policy</h1>
        <Card>
          <CardHeader>
            <CardTitle>Your Privacy is Important to Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <p>Last updated: {currentDate}</p>
            
            <h2>1. Introduction</h2>
            <p>
              Eleven Docs ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Eleven Docs.
            </p>
            <p>
              This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy and our Terms of Service.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              We collect information that you provide to us directly, such as when you create an account, purchase a product, or communicate with us. This information may include:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Your name, email address, and password.</li>
              <li><strong>Profile Information:</strong> Your display name, photo URL, and any other information you add to your profile, such as interests from the survey.</li>
              <li><strong>Transaction Information:</strong> Details about the products you purchase, such as product IDs. We use a third-party payment processor (Razorpay) to handle payments, and we do not store your credit card details.</li>
              <li><strong>Communications:</strong> When you contact us, we may collect the content of your communications.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
                <li>Provide, operate, and maintain our Service.</li>
                <li>Process your transactions and fulfill your orders.</li>
                <li>Improve, personalize, and expand our Service, including providing personalized product recommendations.</li>
                <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes.</li>
                <li>Understand and analyze how you use our Service.</li>
            </ul>

            <h2>4. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share information with third-party vendors and service providers that perform services on our behalf, such as payment processing and hosting services.</p>

            <h2>5. Data Security</h2>
            <p>
              We use Firebase Authentication and Firestore Security Rules to help protect your information. However, no electronic transmission or storage of information can be entirely secure, so we cannot guarantee the absolute security of your personal information.
            </p>
            
            <h2>6. Your Data Rights</h2>
            <p>
              You have the right to access, update, or delete the information we have on you. You can access and update your profile information through your account settings.
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
            </p>

            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at the.designer.crevva@gmail.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
