import { useEffect, useState } from "react";
import api, { usesDatabase } from "./api";
import "./App.css";

const emptyForm = { visitorName: "", mobile: "", category: "", date: "", status: "Planned", fee: "" };
const categories = ["Heritage Sites", "Temples", "Beaches", "Hill Stations", "Wildlife Safari", "Local Food Trail"];
const statuses = ["Planned", "Confirmed", "Completed"];

function validate(form) {
  const errors = {};
  if (!/^[A-Za-z ]+$/.test(form.visitorName.trim())) errors.visitorName = "Enter a name using letters and spaces only.";
  if (!/^\d{10}$/.test(form.mobile)) errors.mobile = "Enter exactly 10 digits.";
  if (!form.category) errors.category = "Select a tour category.";
  if (!form.date) errors.date = "Select a visit date.";
  if (!/^\d{1,6}$/.test(String(form.fee))) errors.fee = "Enter the guide fee in rupees (numbers only).";
  return errors;
}

const rupees = (n) => "\u20B9" + Number(n).toLocaleString("en-IN");

function App() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setRecords(await api.list());
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      const text = editId ? await api.update(editId, form) : await api.create(form);
      setMessage({ type: "success", text });
      resetForm();
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const startEdit = (record) => {
    const { visitorName, mobile, category, date, status, fee } = record;
    setForm({ visitorName, mobile, category, date, status, fee: String(fee) });
    setEditId(record._id);
    setErrors({});
    setMessage(null);
    document.getElementById("book").scrollIntoView();
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete the tour booked by ${record.visitorName}?`)) return;
    try {
      const text = await api.remove(record._id);
      setMessage({ type: "success", text });
      if (editId === record._id) resetForm();
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  return (
    <>
      <header>
        <a className="brand" href="#home">Local<span>Trails</span></a>
        <nav>
          <a href="#book">Book</a>
          <a href="#tours">Tours</a>
        </nav>
      </header>

      <section className="banner" id="home">
        <h1>Discover Your Local Journey</h1>
        <p>Pick a place, choose a date and explore with a trusted local guide.</p>
      </section>

      <main>
        <section className="card" id="book">
          <h2>{editId ? "Edit Tour" : "New Tour Booking"}</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="fields">
              <div>
                <label htmlFor="visitorName">Visitor Name</label>
                <input id="visitorName" name="visitorName" value={form.visitorName} onChange={updateField} placeholder="Enter full name" />
                {errors.visitorName && <small>{errors.visitorName}</small>}
              </div>
              <div>
                <label htmlFor="mobile">Mobile Number</label>
                <input id="mobile" name="mobile" type="tel" maxLength={10} value={form.mobile} onChange={updateField} placeholder="10-digit mobile number" />
                {errors.mobile && <small>{errors.mobile}</small>}
              </div>
              <div>
                <label htmlFor="category">Tour Category</label>
                <select id="category" name="category" value={form.category} onChange={updateField}>
                  <option value="">Select tour category</option>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <small>{errors.category}</small>}
              </div>
              <div>
                <label htmlFor="date">Visit Date</label>
                <input id="date" name="date" type="date" value={form.date} onChange={updateField} />
                {errors.date && <small>{errors.date}</small>}
              </div>
              <div>
                <label htmlFor="fee">Guide Fee (&#8377;)</label>
                <input id="fee" name="fee" type="text" inputMode="numeric" maxLength={6} value={form.fee} onChange={updateField} placeholder="Amount in rupees" />
                {errors.fee && <small>{errors.fee}</small>}
              </div>
              <div>
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={form.status} onChange={updateField}>
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="actions">
              <button type="submit">{editId ? "Update Tour" : "Book Tour"}</button>
              {editId && <button type="button" className="plain" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
          {message && <p className={`message ${message.type}`} role="status">{message.text}</p>}
        </section>

        <section className="card" id="tours">
          <h2>Tour Bookings ({records.length})</h2>
          {!loading && records.length === 0 && <p className="empty">No tours booked yet.</p>}
          {records.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Visitor</th><th>Mobile</th><th>Category</th><th>Date</th><th>Fee</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>{record.visitorName}</td>
                      <td>{record.mobile}</td>
                      <td>{record.category}</td>
                      <td>{record.date}</td>
                      <td>{rupees(record.fee)}</td>
                      <td><span className={`status ${record.status.toLowerCase()}`}>{record.status}</span></td>
                      <td className="row-actions">
                        <button className="small" onClick={() => startEdit(record)}>Edit</button>
                        <button className="small danger" onClick={() => handleDelete(record)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!usesDatabase && <p className="note">Demo copy: bookings on this page are saved only in your browser. Please do not enter real personal details.</p>}
        </section>
      </main>

      <footer>&copy; 2026 LocalTrails Tourism Guide. All rights reserved.</footer>
    </>
  );
}

export default App;
