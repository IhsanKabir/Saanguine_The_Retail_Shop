export const metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <>
      <div className="legal-kicker">SHIPPING & DELIVERY</div>
      <h1>How your parcel reaches you.</h1>
      <p className="legal-lede">Updated: 2 May 2026.</p>

      <h2>Delivery within Bangladesh</h2>
      <ul>
        <li><b>Inside Dhaka</b>: ৳80, delivered in 1–2 working days by Pathao Courier.</li>
        <li><b>Outside Dhaka</b>: ৳150, delivered in 3–5 working days by Pathao or Steadfast.</li>
        <li>Orders over ৳3,000 ship complimentary.</li>
      </ul>

      <h2>Cash on Delivery</h2>
      <p>Pay our courier in cash on arrival. We do not charge a COD handling fee at launch. Please have the exact balance ready — couriers do not always carry change.</p>

      <h2>Order tracking</h2>
      <p>Once your parcel is booked, you will receive an SMS and an email with the tracking code. You can also track from your <a href="/account">account page</a> or the order confirmation page.</p>

      <h2>Failed delivery</h2>
      <p>If our courier cannot reach you on the first attempt, they will try again the following day. After two failed attempts the parcel returns to the atelier and the order is closed. We may decline future Cash-on-Delivery orders to addresses with repeated failures.</p>

      <h2>International delivery</h2>
      <p>We do not currently ship outside Bangladesh. Subscribe to <a href="/account">Letters from the Maison</a> to be the first to hear when we do.</p>

      <h2>Couriers we use</h2>
      <ul>
        <li><b>Pathao Courier</b> — primary for Dhaka and major cities.</li>
        <li><b>Steadfast Courier</b> — primary for outside-Dhaka and remote postcodes.</li>
      </ul>

      <h2>Damaged in transit</h2>
      <p>Please open your parcel in front of the courier where possible. If anything is damaged, photograph it immediately and email <a href="mailto:concierge@saanguine.com">concierge@saanguine.com</a> within forty-eight hours.</p>
    </>
  );
}
