export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <div className="legal-kicker">PRIVACY POLICY</div>
      <h1>What we keep, and why we keep it.</h1>
      <p className="legal-lede">Last updated: 2 May 2026.</p>

      <h2>What we collect</h2>
      <p>When you place an order with the maison, we collect your name, delivery address, phone number, and email so we can send your parcel and tell you where it is. When you create an account, we additionally store an encrypted password and a record of your past orders.</p>
      <p>When you browse, we set a single session cookie so your bag is remembered between pages and a small analytics cookie so we can understand which pieces are most-loved. We do not run advertising trackers and we do not sell our visitor lists.</p>

      <h2>What we do with it</h2>
      <p>We use your details to fulfil your order, to answer your questions if you write to us, and — only if you opt in — to send you the seasonal Letter from the Maison. We never share your information with anyone except the courier delivering your parcel and the payment provider processing your payment.</p>

      <h2>How long we keep it</h2>
      <p>Order records are kept for seven years to comply with Bangladeshi tax law (NBR retention requirements). Marketing email subscriptions are kept until you unsubscribe. Browsing analytics are aggregated after thirty days; we cannot identify individual visitors past that point.</p>

      <h2>Your rights</h2>
      <p>You may at any time email <a href="mailto:concierge@saanguine.com">concierge@saanguine.com</a> to ask for a copy of the information we hold on you, to correct it, or to delete it (other than the seven-year tax-record retention required by law). You may unsubscribe from the Letter from the Maison via the link at the foot of every newsletter.</p>

      <h2>Cookies</h2>
      <ul>
        <li><b>ssg-cart-v1</b> — your bag, kept in your browser only, expires when you clear your browser data.</li>
        <li><b>ssg-wish-v1</b> — your wishlist, same.</li>
        <li><b>ssg-route</b> — last-visited route, for back-button etiquette.</li>
        <li><b>ssg_sid</b> — anonymous session identifier so we can count visits, not visitors. Expires in 30 days.</li>
        <li><b>ssg-cookie-consent-v1</b> — your preference about whether we use the analytics cookie above.</li>
      </ul>

      <h2>Contact</h2>
      <p>Maison Saanguine, Dhaka, Bangladesh. <a href="mailto:concierge@saanguine.com">concierge@saanguine.com</a></p>
    </>
  );
}
