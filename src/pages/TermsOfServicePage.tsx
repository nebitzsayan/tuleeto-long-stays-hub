
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TermsOfServicePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16 md:pt-24 px-4 bg-tuleeto-off-white">
        <div className="container max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last Updated: 27 November 2025</p>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-lg text-gray-700 mb-6">
                Welcome to Tuleeto, a service by NeBitz Technology. By accessing or using our platform, 
                you agree to comply with and be bound by the following Terms of Service ("Terms"). 
                Please read them carefully.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing Tuleeto (https://tuleetotest.netlify.app), you confirm that you are at least 18 years old 
                  and agree to these Terms, our Privacy Policy, and any other policies referenced herein. 
                  If you do not agree, you may not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Platform Description</h2>
                <p className="text-gray-700 mb-4">
                  Tuleeto is an online platform operated by NeBitz Technology that allows users to:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700">
                  <li>List their property for long-term rental.</li>
                  <li>Search for and rent long-term residential properties.</li>
                </ul>
                <p className="text-gray-700">
                  We are a facilitator only and do not own or manage any listed properties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You must register an account to list or rent a property.</li>
                  <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                  <li>You agree to provide accurate, current, and complete information during the registration and listing process.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Listings & Rentals</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Property owners ("Hosts") may create listings, which include property details, rental prices, availability, and other terms.</li>
                  <li>Renters ("Guests") may browse listings and make rental inquiries or bookings.</li>
                  <li>Tuleeto is not a party to any rental agreement between Hosts and Guests.</li>
                  <li>Hosts are solely responsible for ensuring the accuracy of their listings and complying with local laws and rental regulations.</li>
                  <li>Guests are responsible for conducting due diligence and respecting property rules.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payments</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Tuleeto may provide or integrate with third-party payment processors.</li>
                  <li>All payment terms, including rent, deposits, and fees, are determined by the Host.</li>
                  <li>Tuleeto is not responsible for payment disputes, refunds, or non-payment.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Activities</h2>
                <p className="text-gray-700 mb-4">Users agree not to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Post false or misleading listings.</li>
                  <li>Use the platform for illegal or unauthorized purposes.</li>
                  <li>Attempt to interfere with the platform's security or functionality.</li>
                  <li>Harass, threaten, or defraud other users.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
                <p className="text-gray-700">
                  We may suspend or terminate your access to Tuleeto at any time, with or without notice, 
                  if we suspect violation of these Terms or other harmful behavior.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Tuleeto is provided "as is" without warranties of any kind.</li>
                  <li>NeBitz Technology is not liable for property conditions, disputes, damages, or legal issues between Hosts and Guests.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-700">
                  To the maximum extent permitted by law, NeBitz Technology and its affiliates are not liable 
                  for indirect, incidental, or consequential damages arising out of or relating to the use of Tuleeto.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
                <p className="text-gray-700">
                  You agree to defend, indemnify, and hold harmless NeBitz Technology and its affiliates 
                  from any claims, damages, liabilities, and expenses arising out of your use of the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to the Terms</h2>
                <p className="text-gray-700">
                  We reserve the right to modify these Terms at any time. Continued use of Tuleeto after 
                  such modifications indicates your acceptance of the revised Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
                <p className="text-gray-700">
                  These Terms shall be governed by the laws, without regard to its conflict of law principles.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">📧 Email: support@nebitz.tech</p>
                  <p className="text-gray-700">🌐 Website: www.nebitz.tech</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
