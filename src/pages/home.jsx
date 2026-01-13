import { useState, useEffect } from "react";
import menu from "./menu";

// Constants for business logic
const MIN_ORDER_FREE_DELIVERY = 399;
const DELIVERY_CHARGE = 30;
const OPENING_HOUR = 10;  // 9:00 AM
const CLOSING_HOUR = 22.30; // 11:00 PM

export default function Home() {
  // --- 1. STATE & MEMORY ---
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // Load customer details from LocalStorage (Memory)
  const [customerDetails, setCustomerDetails] = useState(() => {
    const saved = localStorage.getItem('urbanThekCustomer');
    return saved ? JSON.parse(saved) : { name: '', phone: '', address: '', notes: '' };
  });

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
      alert("🏪 Urban Thek is currently CLOSED.\nOrders are accepted 9:00 AM - 11:00 PM."); 
      return; 
    }
    const key = `${id}_${type}`;
    setCart((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const removeItem = (id, type) => {
    const key = `${id}_${type}`;
    setCart((prev) => {
      if (!prev[key]) return prev;
      const newCart = { ...prev, [key]: prev[key] - 1 };
      if (newCart[key] <= 0) delete newCart[key];
      return newCart;
    });
  };

  const totalAmount = menu.reduce((sum, item) => 
    sum + (cart[`${item.id}_full`] || 0) * (item.full || 0) + (cart[`${item.id}_half`] || 0) * (item.half || 0), 0
  );

  const isFreeDelivery = totalAmount >= MIN_ORDER_FREE_DELIVERY;
  const filteredMenu = menu.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- 4. WHATSAPP ORDER LOGIC ---
  const placeOrder = () => {
    if (!customerDetails.name || customerDetails.phone.length < 10 || !customerDetails.address) {
      alert("Please enter Name, 10-digit Phone, and Address!");
      return;
    }
    
    let msg = `*🍽️ Urban Thek Order*\n\n`;
    msg += `*👤 Customer:* ${customerDetails.name}\n`;
    msg += `*📞 Phone:* ${customerDetails.phone}\n`;
    msg += `*📍 Address:* ${customerDetails.address}\n\n`;
    msg += `*🛒 Order Summary:*\n`;

    // Loop through the items in the cart to build the list
    Object.entries(cart).forEach(([key, quantity]) => {
      const [id, type] = key.split('_');
      const item = menu.find(m => String(m.id) === String(id));
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
    page: { maxWidth: 480, margin: "0 auto", padding: "20px", fontFamily: "sans-serif", backgroundColor: "#f9fafb", minHeight: "100vh" },
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
              const item = menu.find(m => String(m.id) === String(id));
              if (!item) return null;
              const price = type === 'full' ? item.full : item.half;
              
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingRight: '5px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name} ({type})</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>₹{price} x {quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => removeItem(id, type)} style={{...styles.btn, width: '28px', height: '28px', fontSize: '16px', backgroundColor: '#ef4444'}}>-</button>
                    <span style={{ fontWeight: 'bold' }}>{quantity}</span>
                    <button onClick={() => addItem(id, type)} style={{...styles.btn, width: '28px', height: '28px', fontSize: '16px', backgroundColor: '#10b981'}}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: "20px", color: "#4b5563", fontWeight: "700", fontSize: "16px" }}>
            Total Payable: ₹{isFreeDelivery ? totalAmount : totalAmount + DELIVERY_CHARGE}
            {!isFreeDelivery && <span style={{ fontSize: '12px', fontWeight: 'normal', display: 'block' }}>(Includes ₹50 Delivery)</span>}
          </div>

          {/* --- CUSTOMER DETAILS --- */}
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Delivery Details</h3>
          <input placeholder="Your Name" value={customerDetails.name} style={styles.search} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} />
          <input placeholder="10-digit Phone Number" value={customerDetails.phone} type="tel" maxLength="10" style={styles.search} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} />
          <textarea placeholder="Full Delivery Address" value={customerDetails.address} style={{...styles.search, height: "80px"}} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} />
          
          <button onClick={placeOrder} style={{ width: "100%", padding: "16px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Send Order to WhatsApp</button>
          <button onClick={() => setShowCustomerModal(false)} style={{ width: "100%", marginTop: "15px", background: "none", border: "none", color: "#6b7280", fontWeight: "bold" }}>Back to Menu</button>
        </div>
      </div>
    );
  }


  // --- 7. MAIN MENU VIEW ---
  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Urban Thek</h1>
      <p style={styles.addressText}>Nawabpur, Near Akankha More, Newtown</p>
      
      <div style={styles.statusBadge}>
        {isOpen ? `● OPEN NOW (Closes ${CLOSING_HOUR}:00 PM)` : `○ CLOSED (Opens ${OPENING_HOUR}:00 AM)`}
      </div>
      
      <div style={styles.deliveryBanner}>
        {isFreeDelivery 
          ? "🎉 FREE Delivery Active!" 
          : `🚚 Add ₹${MIN_ORDER_FREE_DELIVERY - totalAmount} more for FREE delivery`}
      </div>

      <input type="text" placeholder="🔍 Search dishes..." style={styles.search} onChange={(e) => setSearchTerm(e.target.value)} />

      {filteredMenu.map((item) => (
        <div key={item.id} style={styles.card}>
          <div style={{ color: "#059669", fontSize: "12px", fontWeight: "bold" }}>{item.category}</div>
          <h3 style={{ margin: "5px 0", fontSize: "18px" }}>{item.name}</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {item.full && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Full: ₹{item.full}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {cart[`${item.id}_full`] > 0 && <button style={{...styles.btn, backgroundColor: "#ef4444"}} onClick={() => removeItem(item.id, "full")}>-</button>}
                  <span style={{ fontWeight: "bold" }}>{cart[`${item.id}_full`] || 0}</span>
                  <button style={{...styles.btn, backgroundColor: "#10b981"}} onClick={() => addItem(item.id, "full")}>+</button>
                </div>
              </div>
            )}
            {item.half && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Half: ₹{item.half}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {cart[`${item.id}_half`] > 0 && <button style={{...styles.btn, backgroundColor: "#ef4444"}} onClick={() => removeItem(item.id, "half")}>-</button>}
                  <span style={{ fontWeight: "bold" }}>{cart[`${item.id}_half`] || 0}</span>
                  <button style={{...styles.btn, backgroundColor: "#3b82f6"}} onClick={() => addItem(item.id, "half")}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ height: "100px" }}></div>

      {totalAmount > 0 && (
        <div style={styles.footerCart} onClick={() => setShowCustomerModal(true)}>
          <div>
            <div style={{ fontSize: "18px" }}>₹{isFreeDelivery ? totalAmount : totalAmount + DELIVERY_CHARGE}</div>
            <div style={{ fontSize: "11px" }}>{Object.keys(cart).length} Items | {isFreeDelivery ? "FREE Delivery" : "+₹50 Delivery"}</div>
          </div>
          <span>Review Order →</span>
        </div>
      )}
    </div>
  );
}
