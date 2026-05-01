import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { PlusCircle, Filter, ArrowUpDown, IndianRupee, Loader2, Trash2, Calendar, Tag, FileText, PieChart } from 'lucide-react';

const API_BASE_URL = 'https://fintrack-api-w290.onrender.com';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filters and Sorting
  const [filterCategory, setFilterCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/expenses`, {
        params: {
          category: filterCategory || undefined,
          sort: sortOrder
        }
      });
      setExpenses(response.data);

      // Fetch categories for the filter
      const catRes = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(catRes.data);

      setError(null);
    } catch (err) {
      setError('Failed to fetch expenses. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, sortOrder]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    // Basic validation
    if (!formData.amount || !formData.category || !formData.description || !formData.date) {
      setError('All fields are required.');
      setSubmitting(false);
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0.');
      setSubmitting(false);
      return;
    }

    // Generate idempotency key
    const idempotencyKey = crypto.randomUUID();

    try {
      await axios.post(`${API_BASE_URL}/expenses`, {
        ...formData,
        amount: parseFloat(formData.amount),
        idempotency_key: idempotencyKey,
        date: new Date(formData.date).toISOString()
      });

      // Reset form
      setFormData({
        amount: '',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });

      // Refresh list
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals = {};
    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount);
      if (totals[exp.category]) {
        totals[exp.category] += amt;
      } else {
        totals[exp.category] = amt;
      }
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          FinTrack
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Manage your expenses with precision and style.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Sidebar: Form */}
        <aside>
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <PlusCircle size={24} color="var(--primary)" />
              Add Expense
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="0.00"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    name="category"
                    placeholder="e.g. Food, Rent"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="date"
                    name="date"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
                  <textarea
                    name="description"
                    placeholder="What was this for?"
                    rows="3"
                    style={{ paddingLeft: '2.5rem' }}
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? <Loader2 className="loader" /> : 'Record Expense'}
              </button>

              {error && (
                <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* Summary View */}
          {categoryTotals.length > 0 && !loading && (
            <div className="glass-card" style={{ marginTop: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                <PieChart size={20} color="var(--accent)" />
                Spending Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {categoryTotals.map(([cat, amount]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                    <span className="category-tag">{cat}</span>
                    <span style={{ fontWeight: 600 }}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content: List */}
        <main>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Transaction History</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                  <Filter size={16} color="var(--text-muted)" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.875rem', width: 'auto' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                  <ArrowUpDown size={16} color="var(--text-muted)" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '0.875rem', width: 'auto' }}
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {loading && expenses.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <Loader2 className="loader" style={{ width: '40px', height: '40px' }} />
              </div>
            ) : expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <p>No expenses found. Start by adding one!</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="expense-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="expense-row animate-fade-in">
                          <td>{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{expense.description}</div>
                          </td>
                          <td>
                            <span className="category-tag">{expense.category}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="amount">₹{parseFloat(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Spending</p>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
