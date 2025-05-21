import { useState } from "react";

export default function TestConfirmationForm() {
  const [form, setForm] = useState({
    to: "",
    name: "",
    propertyName: "",
    checkIn: "",
    checkOut: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>Test Booking Confirmation Email</h2>
      <input
        name="to"
        type="email"
        placeholder="Recipient Email"
        value={form.to}
        onChange={handleChange}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        name="name"
        placeholder="Recipient Name"
        value={form.name}
        onChange={handleChange}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        name="propertyName"
        placeholder="Property Name"
        value={form.propertyName}
        onChange={handleChange}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        name="checkIn"
        type="date"
        placeholder="Check-In Date"
        value={form.checkIn}
        onChange={handleChange}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input
        name="checkOut"
        type="date"
        placeholder="Check-Out Date"
        value={form.checkOut}
        onChange={handleChange}
        required
        style={{ width: "100%", marginBottom: 8 }}
      />
      <button type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Sending..." : "Send Test Email"}
      </button>
      {result && (
        <div style={{ marginTop: 16, color: result.success ? "green" : "red" }}>
          {result.success
            ? "Email sent successfully!"
            : `Error: ${result.error}`}
        </div>
      )}
    </form>
  );
} 