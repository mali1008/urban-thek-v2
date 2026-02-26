import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from "react";
/*import menu from "./menu"; */

// Constants for business 
const MIN_ORDER_FOR_DELIVERY = 299;
const MIN_ORDER_FREE_DELIVERY = 399;
const DELIVERY_CHARGE = 30;
const OPENING_HOUR = 10;  // 10:00 AM
const CLOSING_HOUR = 23; // 22:00 PM



export default function Home() {
  // --- 1. STATE & MEMORY ---
  const [menuItems, setMenuItems] = useState([]); // Holds Supabase data
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);

  // --- NEW: FETCH FROM SUPABASE ---
    
useEffect(() => {
  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase
  .from('food_items')
  .select('*')
  .order('image_url', { ascending: false, nullsFirst: false });
    if (error) {
      console.error("Fetch error:", error);
    } else {
      setMenuItems([...(data || [])]);
    }
    setLoading(false);
  };
  fetchMenu();
}, []);

/*useEffect(() => {
  if (menuItems.length > 0) {
    const timer = setTimeout(() => {
      setMenuItems(prev => [...prev]);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [menuItems.length]); */

  // ... rest of your LocalStorage effects (keep those!)

  // Load customer details from LocalStorage (Memory)
  const [customerDetails, setCustomerDetails] = useState(() => {
    const saved = localStorage.getItem('urbanThekCustomer');
    return saved ? JSON.parse(saved) : { name: '', phone: '', address: '', notes: '' };
  });

const [billNumber, setBillNumber] = useState(() => {
  const saved = localStorage.getItem('urbanThekBillNo');
  return saved ? parseInt(saved) : 1; // Starts at 1 if no history
});
useEffect(() => {
  localStorage.setItem('urbanThekBillNo', billNumber.toString());
}, [billNumber]);

  // Save details to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('urbanThekCustomer', JSON.stringify(customerDetails));
  }, [customerDetails]);

  // --- 2. TIME LOGIC ---
  const now = new Date();
  const currentHour = now.getHours();
  const isOpen = currentHour >= OPENING_HOUR && currentHour < CLOSING_HOUR;

  // --- 3. CART LOGIC ---
 
  const addItem = (id, type = "full") => {
    if (!isOpen) {
      alert("🏪 Urban Thek is currently CLOSED.");
      return;
    }
    // We force ID to string to avoid issues
    const key = `${String(id)}_${type}`;
    setCart((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const removeItem = (id, type) => {
    const key = `${String(id)}_${type}`;
    setCart((prev) => {
      if (!prev[key]) return prev;
      const newCart = { ...prev, [key]: prev[key] - 1 };
      if (newCart[key] <= 0) delete newCart[key];
      return newCart;
    });
  };

  /* const totalAmount = menuItems.reduce((sum, item) => 
     sum + (cart[`${item.id}_full`] || 0) * (item.full || 0) + (cart[`${item.id}_half`] || 0) * (item.half || 0), 0
   );
   */
  const subtotal = menuItems.reduce((sum, item) => {
    return (
      sum +
      (cart[`${item.id}_full`] || 0) * (item.full || 0) +
      (cart[`${item.id}_half`] || 0) * (item.half || 0)
    );
  }, 0);
  let discountPercent = 0;
  if (subtotal >= 2000) {
    discountPercent = 15;
  } else if (subtotal >= 1000) {
    discountPercent = 10;
  }
  const discountAmount = (subtotal * discountPercent) / 100;
  const totalAmount = subtotal - discountAmount;


  const canPlaceOrder = totalAmount >= MIN_ORDER_FOR_DELIVERY;
  const isFreeDelivery = totalAmount >= MIN_ORDER_FREE_DELIVERY;
  

const filteredMenu = [...(menuItems || [])].filter(item => {
  const itemName = item.name ? String(item.name).toLowerCase() : "";
  const search = (searchTerm || "").trim().toLowerCase();  // ← add .trim()
  return itemName.includes(search);
});

  // --- 4. WHATSAPP ORDER LOGIC ---
  const placeOrder = () => {
    if (!customerDetails.name || customerDetails.phone.length < 10 || !customerDetails.address) {
      alert("Please enter Name, 10-digit Phone, and Address!");
      return;
    }

    let msg = `*🍽️ Urban Thek Order*\n\n`;
    msg += `Note: Delivery within 2km radius_\n\n`;
    msg += `*👤 Customer:* ${customerDetails.name}\n`;
    msg += `*📞 Phone:* ${customerDetails.phone}\n`;
    msg += `*📍 Address:* ${customerDetails.address}\n\n`;
    msg += `*🛒 Order Summary:*\n`;

    // Loop through the items in the cart to build the list
    Object.entries(cart).forEach(([key, quantity]) => {
      const [id, type] = key.split('_');
      const item = menuItems.find(m => String(m.id) === String(id));
      if (item && quantity > 0) {
        const price = type === 'full' ? item.full : item.half;
        msg += `• ${item.name} (${type}) x${quantity} = ₹${price * quantity}\n`;
      }
    });

    const finalDelivery = isFreeDelivery ? 0 : DELIVERY_CHARGE;
    msg += `\n*🚚 Delivery:* ${isFreeDelivery ? "FREE" : "₹" + DELIVERY_CHARGE}`;
    msg += `\n*💰 Total Payable: ₹${totalAmount + finalDelivery}*`;

    if (customerDetails.notes) msg += `\n\n*📝 Notes:* ${customerDetails.notes}`;
    msg += `\n\n*🏪 Store:* Nawabpur, Near Akankha More`;

    const phoneNumber = "917596042167";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, "_blank");

    setCart({});
    setShowCustomerModal(false);
  };

  // --- 5. STYLES ---
  const styles = {
    page: { 
      maxWidth: 480, 
      margin: "0 auto", 
      paddingTop: "20px", 
      paddingBottom: "20px", 
      paddingLeft: "20px", 
      paddingRight: "20px",
      fontFamily: "sans-serif", 
      backgroundColor: "#f9fafb", 
      minHeight: "100vh" 
    },
    header: { textAlign: "center", color: "#059669", fontSize: "32px", fontWeight: "800", marginBottom: "5px" },
    addressText: { textAlign: "center", color: "#374151", fontSize: "14px", margin: "0", fontWeight: "600" },
    statusBadge: {
      backgroundColor: isOpen ? "#dcfce7" : "#fee2e2",
      color: isOpen ? "#166534" : "#991b1b",
      padding: "10px", borderRadius: "10px", textAlign: "center",
      fontSize: "14px", fontWeight: "bold", marginBottom: "15px",
      border: `1px solid ${isOpen ? "#166534" : "#991b1b"}`
    },
    deliveryBanner: { backgroundColor: isFreeDelivery ? "#d1fae5" : "#ffedd5", color: isFreeDelivery ? "#065f46" : "#9a3412", padding: "12px", borderRadius: "10px", textAlign: "center", fontSize: "14px", fontWeight: "bold", marginBottom: "15px", border: "1px solid" },
    search: { width: "100%", padding: "14px", borderRadius: "10px", border: "2px solid #d1d5db", marginBottom: "20px", boxSizing: "border-box", fontSize: "16px" },
    card: { backgroundColor: "#ffffff", borderRadius: "15px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb" },
    btn: { border: "none", width: "36px", height: "36px", borderRadius: "8px", cursor: "pointer", fontSize: "20px", fontWeight: "bold", color: "white" },
    footerCart: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "400px", backgroundColor: "#059669", color: "white", padding: "16px", borderRadius: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", cursor: "pointer", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", zIndex: 1000 }
  };

// --- 5. LOADING STATE ---
  if (loading) {
    return (
      <div style={{ ...styles.page, textAlign: 'center', paddingTop: '100px' }}>
        <h2 style={{ color: '#059669' }}>⌛ Loading Menu...</h2>
        <p>Fetching the latest deliciousness from Urban Thek</p>
      </div>
    );
  }

  // --- 6. MODAL VIEW ---

  if (showCustomerModal) {
    return (
      <div style={styles.page}>
        <div style={{ background: "white", padding: "24px", borderRadius: "20px", border: "1px solid #ddd" }}>
          <h2 style={{ color: "#111827", marginTop: 0 }}>Review Your Order 🛒</h2>

          {/* --- NEW: CART ITEM LIST --- */}
          <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "20px", borderBottom: "1px solid #eee" }}>
            {Object.entries(cart).map(([key, quantity]) => {
              const [id, type] = key.split('_');
              const item = menuItems.find(m => String(m.id) === String(id));
              if (!item) return null;
              const price = type === 'full' ? item.full : item.half;

              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingRight: '5px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name} ({type})</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>₹{price} x {quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => removeItem(id, type)} style={{ ...styles.btn, width: '28px', height: '28px', fontSize: '16px', backgroundColor: '#ef4444' }}>-</button>
                    <span style={{ fontWeight: 'bold' }}>{quantity}</span>
                    <button onClick={() => addItem(id, type)} style={{ ...styles.btn, width: '28px', height: '28px', fontSize: '16px', backgroundColor: '#10b981' }}>+</button>
                  </div>
                </div>
              );
            })}
          </div>


          <div style={{ padding: "12px", backgroundColor: "#f9f9f9", borderRadius: "8px", marginBottom: "15px", border: "1px solid #eee" }}>
            <p style={{ fontSize: "11px", color: "#15803d", textAlign: "center", fontWeight: "bold", margin: "0 0 8px 0" }}>
              ✨ 10% OFF > ₹1000 | 15% OFF > ₹2000
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>
            {discountPercent > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626", fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}>
                <span>Discount ({discountPercent}%):</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #ccc" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>To Pay:</span>
              <span style={{ fontWeight: "bold", fontSize: "16px", color: "#000" }}>₹{totalAmount}</span>
            </div>
          </div>




          <div style={{ marginBottom: "20px", color: "#4b5563", fontWeight: "700", fontSize: "16px" }}>
            Total Payable: ₹{isFreeDelivery ? totalAmount : totalAmount + DELIVERY_CHARGE}
            {!isFreeDelivery && <span style={{ fontSize: '12px', fontWeight: 'normal', display: 'block' }}>
              (Includes ₹{DELIVERY_CHARGE} Delivery)
            </span>}
          </div>

          {/* --- CUSTOMER DETAILS --- */}
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Delivery Details</h3>
          <input placeholder="Your Name" value={customerDetails.name} style={styles.search} onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })} />
          <input placeholder="10-digit Phone Number" value={customerDetails.phone} type="tel" maxLength="10" style={styles.search} onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })} />
          <textarea placeholder="Full Delivery Address" value={customerDetails.address} style={{ ...styles.search, height: "80px" }} onChange={e => setCustomerDetails({ ...customerDetails, address: e.target.value })} />


          {/* WhatsApp Button */}
          <button
            onClick={placeOrder}
            disabled={!canPlaceOrder}
            style={{
              width: "100%",
              padding: "16px",
              background: canPlaceOrder ? "#10b981" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: canPlaceOrder ? "pointer" : "not-allowed"
            }}
          >
            {canPlaceOrder ? "✅ Send Order to WhatsApp" : `Add ₹${MIN_ORDER_FOR_DELIVERY - totalAmount} more to Order`}
          </button>

          {/* New Print Button */}
        {/* Updated Print Button */}
<button
 
  
  onClick={() => {

 const saveToSupabase = async () => {
  const deliveryCharge = isFreeDelivery ? 0 : DELIVERY_CHARGE;
  const finalTotal = totalAmount + deliveryCharge;

  // This is ONE continuous command. Do not put anything between .from and .insert
  const { error } = await supabase
    .from('orders')
    .insert([
      { 
        bill_no: billNumber, 
        customer_name: customerDetails.name, 
        total_amount: finalTotal, 
        items: cart 
      }
    ]);

  if (error) {
    console.error('Supabase Error:', error.message);
  } else {
    console.log('Order successfully saved!');
  }
};
saveToSupabase();
  const content = document.getElementById('printable-receipt').innerHTML;
  setBillNumber(prev => prev + 1);
  const printWindow = window.open('', '', 'height=600,width=400');
  printWindow.document.write(`
    
    <html>
      <head>
        <title>Urban Thek</title>
        <style>
          @page { size: auto; margin: 0mm; }
          body { 
            font-family: 'Arial Black', Gadget, sans-serif; 
            width: 72mm; 
            padding: 2mm; 
            margin: 0; 
            font-size: 12px; 
            color: #000 !important;
            font-weight: 900 !important;
            -webkit-print-color-adjust: exact;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          
          table { width: 100%; border-collapse: collapse; }
          
          /* This is the fix for the pale items */
          th, td { 
            padding: 2px 0; 
            line-height: 1.2;
            color: #000 !important; 
            font-weight: 900 !important; 
            font-size: 11px;
          }

          .item { width: 50%; text-align: left; }
          .qty { width: 20%; text-align: center; }
          .price { width: 30%; text-align: right; }
          
          .dotted-line { 
            border-top: 2px dotted black; 
            margin: 4px 0;
            width: 100%;
          }
          
          .total-row { font-size: 14px; font-weight: 900; margin-top: 5px; }
        </style>
      </head>
      <body>
        ${content}
        <div style="height: 40px;">.</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}}
  style={{
    width: "100%",
    marginTop: "10px",
    padding: "12px",
    background: "#374151", // Darker color for better visibility
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer"
  }}

  

>
  🖨️ Print Thermal Receipt
</button>

          {/* Back to Menu Button */}
          <button
            onClick={() => setShowCustomerModal(false)}
            style={{
              width: "100%",
              marginTop: "15px",
              background: "none",
              border: "none",
              color: "#6b7280",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Back to Menu
          </button>


         <div id="printable-receipt" style={{ display: 'none' }}>
  <div className="center">
    <h2 style={{ margin: "0", fontSize: "18px" }}>URBAN THEK</h2>
    <p style={{ margin: "2px 0" }}>Nawabpur, Near Akankha More</p>
    <div style={{ fontSize: "11px", fontWeight: "bold" }}>GSTIN: 19DURPS84411D1ZY</div>
    <div style={{ fontSize: "11px", fontWeight: "bold" }}>FSSAI: 12823013000704</div>
    <div className="dotted-line"></div>
  </div>

 <div style={{ fontSize: "12px", marginBottom: "5px" }}>
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span>BILL NO: #{billNumber.toString().padStart(3, '0')}</span>
   
  <span>
  {new Date().toLocaleDateString('en-GB')} | {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
</span>
  </div> 
  <div style={{ fontSize: "11px", marginTop: "2px" }}>
  NAME: {customerDetails.name.toUpperCase()}
</div>
</div> 

  {/* Headers inside two dotted lines */}
  <div className="dotted-line"></div>

<table style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr> 
      {/* This creates the dotted line directly under ITEM NAME QTY PRICE */}
      <th className="item" style={{ textAlign: 'left', padding: '2px 0', fontSize: '11px' }}>ITEM NAME</th>
      <th className="qty" style={{ textAlign: 'center', padding: '2px 0', fontSize: '11px' }}>QTY</th>
      <th className="price" style={{ textAlign: 'right', padding: '2px 0', fontSize: '11px' }}>PRICE</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(cart).map(([key, quantity]) => {
      const [id, type] = key.split('_');
      const item = menuItems.find(m => String(m.id) === String(id));
      if (!item) return null;
      const price = type === 'full' ? item.full : item.half;
      return (
        <tr key={key}>
          <td className="item" style={{ padding: '2px 0', fontSize: '10px' }}>
            {item.name} ({type[0].toUpperCase()})
          </td>
          <td className="qty" style={{ textAlign: 'center', padding: '2px 0', fontSize: '10px' }}>
            {quantity}
          </td>
          <td className="price" style={{ textAlign: 'right', padding: '2px 0', fontSize: '10px' }}>
            {price * quantity}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

{/* Bottom Dotted Line (After all items) */}
<div className="dotted-line"></div>

  <div className="right">
    <div>Subtotal: ₹{subtotal}</div>
    {discountAmount > 0 && <div>Discount: -₹{discountAmount}</div>}
    <div className="total-row">TOTAL: ₹{totalAmount}</div>
  </div>

 <div className="dotted-line"></div>
  
  <div style={{ marginTop: "10px", width: "100%", borderTop: "1px dashed #000", paddingTop: "5px" }}>
  <div style={{ 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center",
    fontSize: "8px", 
    fontWeight: "900",
    width: "100%"
  }}>
    {/* This will now hit the far left edge */}
    <span style={{ textAlign: "left" }}>📞 7596042167/8583052933</span>
    
    {/* This will hit the far right edge */}
    <span style={{ textAlign: "right" }}>https://urban-thek.netlify.app 🌐</span>
  </div>
</div>

<div className="center" style={{ marginTop: "8px", fontSize: "12px" }}>
  THANK YOU! VISIT AGAIN
</div>

</div>

        </div>
      </div>
    );
  }

  return (
   
      <div style={styles.page}>
      <h1 style={styles.header}>Urban Thek</h1>
      <p style={styles.addressText}>Nawabpur, Near Akankha More, Newtown</p>

      <div style={styles.statusBadge}>
        {isOpen ? `● OPEN NOW (Closes ${CLOSING_HOUR}:00 PM)` : `○ CLOSED (Opens ${OPENING_HOUR}:00 AM)`}
      </div>

      <div style={styles.deliveryBanner}>
        <div>
          {isFreeDelivery
            ? "🎉 FREE Delivery Active!"
            : `🚚 Add ₹${MIN_ORDER_FREE_DELIVERY - totalAmount} more for FREE delivery`}
        </div>
        <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>
          📍 Only within 2km of Akankha More
        </div>
      </div>     

<input
  type="text"
  placeholder="🔍 Search dishes..."
  style={styles.search}
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

      {filteredMenu.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>📭 No dishes found.</p>
        </div>
      ) : (
        <>
          {filteredMenu.slice(0, visibleCount).map((item) => (
            <div key={item.id} style={styles.card}>
             
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "10px"
                  }}
                />
              )}
              <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold" }}>{item.category}</div>
              <h3 style={{ margin: "5px 0", fontSize: "18px" }}>{item.name}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {item.full && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Full: ₹{item.full}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {cart[`${item.id}_full`] > 0 && <button style={{ ...styles.btn, backgroundColor: "#ef4444" }} onClick={() => removeItem(item.id, "full")}>-</button>}
                      <span style={{ fontWeight: "bold" }}>{cart[`${item.id}_full`] || 0}</span>
                      <button style={{ ...styles.btn, backgroundColor: "#10b981" }} onClick={() => addItem(item.id, "full")}>+</button>
                    </div>
                  </div>
                )}
                {item.half && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Half: ₹{item.half}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {cart[`${item.id}_half`] > 0 && <button style={{ ...styles.btn, backgroundColor: "#ef4444" }} onClick={() => removeItem(item.id, "half")}>-</button>}
                      <span style={{ fontWeight: "bold" }}>{cart[`${item.id}_half`] || 0}</span>
                      <button style={{ ...styles.btn, backgroundColor: "#3b82f6" }} onClick={() => addItem(item.id, "half")}>+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {visibleCount < filteredMenu.length && (
            <button
              onClick={() => setVisibleCount(prev => prev + 20)}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#059669",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
                marginBottom: "80px"
              }}
            >
              Load More ({filteredMenu.length - visibleCount} more dishes)
            </button>
          )}
        </>
      )}

      {totalAmount > 0 && (
        <div style={styles.footerCart} onClick={() => setShowCustomerModal(true)}>
          <div>
            <div style={{ fontSize: "18px" }}>₹{isFreeDelivery ? totalAmount : totalAmount + DELIVERY_CHARGE}</div>
            <div style={{ fontSize: "11px" }}>{Object.keys(cart).length} Items | {isFreeDelivery ? "FREE Delivery" : "+₹30 Delivery"}</div>
          </div>
          <span>Review Order →</span>
        </div>
      )}
    </div>
  );
}