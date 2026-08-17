import { useEffect, useState } from "react";
import { LogoMark } from "../components/ui.jsx";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { formatTime, formatDateKey } from "../booking/schedule.js";

const STATUSES = ["all", "pending", "confirmed", "cancelled"];
const STATUS_NEXT = { pending: "confirmed", confirmed: "cancelled", cancelled: "pending" };

export default function AdminPanel() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <NotConfigured />;
  if (checking) return <Centered>Loading…</Centered>;
  if (!session) return <Login />;
  return <Bookings email={session.user.email} />;
}

/* ── shells ──────────────────────────────────────────────── */
function Shell({ children, right }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <header className="dd-admin-bar">
        <a href="#top" className="dd-admin-brand">
          <span style={{ color: "var(--color-accent)", display: "inline-flex" }}>
            <LogoMark size={22} />
          </span>
          <span>
            Dev<span style={{ color: "var(--accent-text)" }}>Dart</span> Admin
          </span>
        </a>
        {right}
      </header>
      <main className="dd-admin-main">{children}</main>
    </div>
  );
}

function Centered({ children }) {
  return (
    <Shell>
      <p style={{ color: "color-mix(in srgb, var(--color-text) 65%, transparent)" }}>
        {children}
      </p>
    </Shell>
  );
}

function NotConfigured() {
  return (
    <Shell>
      <div className="dd-admin-card" style={{ maxWidth: 520 }}>
        <h2 className="dd-admin-h2">Supabase not connected</h2>
        <p className="dd-admin-p">
          Add <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file (see{" "}
          <code>.env.example</code>), run the SQL in{" "}
          <code>supabase/schema.sql</code>, then reload this page.
        </p>
        <a href="#top" className="btn btn-secondary" style={{ marginTop: 8 }}>
          ← Back to site
        </a>
      </div>
    </Shell>
  );
}

/* ── login ───────────────────────────────────────────────── */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <Shell>
      <form onSubmit={submit} className="dd-admin-card" style={{ maxWidth: 400 }}>
        <h2 className="dd-admin-h2">Sign in</h2>
        <p className="dd-admin-p">Admin access to DevDart bookings.</p>
        <label className="dd-field">
          <span>Email</span>
          <input
            className="dd-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </label>
        <label className="dd-field">
          <span>Password</span>
          <input
            className="dd-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="dd-form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Shell>
  );
}

/* ── bookings ────────────────────────────────────────────── */
function Bookings({ email }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("slot", { ascending: true });
    if (error) setError(error.message);
    else setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cycleStatus(row) {
    const next = STATUS_NEXT[row.status] || "pending";
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    const { error } = await supabase
      .from("bookings")
      .update({ status: next })
      .eq("id", row.id);
    if (error) load();
  }

  async function remove(row) {
    if (!window.confirm(`Delete booking for ${row.name}?`)) return;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    const { error } = await supabase.from("bookings").delete().eq("id", row.id);
    if (error) load();
  }

  const filtered =
    filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const counts = rows.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc),
    {}
  );

  return (
    <Shell
      right={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="dd-admin-email">{email}</span>
          <button
            className="btn btn-secondary"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      }
    >
      <div className="dd-admin-toolbar">
        <div className="dd-admin-filters">
          {STATUSES.map((s) => (
            <button
              key={s}
              className="dd-admin-filter"
              data-active={filter === s}
              onClick={() => setFilter(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
              {s !== "all" && counts[s] ? ` (${counts[s]})` : ""}
              {s === "all" ? ` (${rows.length})` : ""}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="dd-form-error">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="dd-admin-card">
          <p className="dd-admin-p" style={{ margin: 0 }}>
            No {filter === "all" ? "" : filter} bookings yet.
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="dd-admin-tablewrap">
          <table className="dd-admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Notes</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="dd-admin-when">
                    <strong>{formatDateKey(r.date)}</strong>
                    <span>{formatTime(r.slot)}</span>
                  </td>
                  <td>{r.name}</td>
                  <td className="dd-admin-contact">
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                    {r.phone && <span>{r.phone}</span>}
                  </td>
                  <td className="dd-admin-notes">{r.notes || "—"}</td>
                  <td>
                    <button
                      className="dd-admin-status"
                      data-status={r.status}
                      onClick={() => cycleStatus(r)}
                      title="Click to change status"
                    >
                      {r.status}
                    </button>
                  </td>
                  <td>
                    <button
                      className="dd-admin-del"
                      onClick={() => remove(r)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}
