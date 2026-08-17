import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon, EASE } from "../components/ui.jsx";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { useBooking } from "./BookingContext.jsx";
import {
  TIME_SLOTS,
  WEEKDAYS,
  MONTHS,
  dateKey,
  startOfToday,
  isBookable,
  isWorkingDay,
  formatTime,
} from "./schedule.js";

/* build the day cells for a given month view (leading blanks + days) */
function useMonthGrid(viewDate) {
  return useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);
}

export default function BookingModal() {
  const { open, closeBooking } = useBooking();
  const reduce = useReducedMotion();

  const [step, setStep] = useState(1); // 1 date · 2 time · 3 details · 4 done
  const [viewDate, setViewDate] = useState(() => startOfToday());
  const [selectedDate, setSelectedDate] = useState(null); // "YYYY-MM-DD"
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const grid = useMonthGrid(viewDate);
  const today = startOfToday();

  // reset everything when the modal is (re)opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setViewDate(startOfToday());
      setSelectedDate(null);
      setSelectedTime(null);
      setForm({ name: "", email: "", phone: "", notes: "" });
      setError("");
    }
  }, [open]);

  // lock body scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && closeBooking();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeBooking]);

  // fetch already-booked slots for the chosen day (privacy-safe RPC)
  useEffect(() => {
    if (!selectedDate || !isSupabaseConfigured) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    supabase
      .rpc("get_booked_slots", { day: selectedDate })
      .then(({ data, error }) => {
        if (cancelled) return;
        setBookedSlots(error || !data ? [] : data.map((r) => r.slot ?? r));
        setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const canGoPrevMonth =
    viewDate.getFullYear() > today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() &&
      viewDate.getMonth() > today.getMonth());

  const shiftMonth = (delta) =>
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  function pickDate(d) {
    setSelectedDate(dateKey(d));
    setSelectedTime(null);
    setStep(2);
  }

  function pickTime(t) {
    setSelectedTime(t);
    setStep(3);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim()) {
      setError("Please add your name and email.");
      return;
    }
    if (!isSupabaseConfigured) {
      setError(
        "Booking isn't connected yet. Add your Supabase keys (see .env.example) to go live."
      );
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from("bookings").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      date: selectedDate,
      slot: selectedTime,
      status: "pending",
    });
    setSubmitting(false);
    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That slot was just taken — please pick another time."
          : "Something went wrong. Please try again or email team@devdart.in."
      );
      if (insertError.code === "23505") setStep(2);
      return;
    }
    setStep(4);
  }

  const overlay = reduce
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  const panel = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 24, scale: 0.98 },
        transition: { duration: 0.4, ease: EASE },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dd-modal-overlay"
          {...overlay}
          onMouseDown={(e) => e.target === e.currentTarget && closeBooking()}
          role="dialog"
          aria-modal="true"
          aria-label="Book a free call"
        >
          <motion.div className="dd-modal blueprint" {...panel}>
            {/* header */}
            <div className="dd-modal-head">
              <div>
                <span className="dd-modal-kicker">Free 30-min call</span>
                <h3 className="dd-modal-title">
                  {step === 4 ? "You're booked" : "Book a free call"}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={closeBooking}
                aria-label="Close"
              >
                <Icon.Close />
              </button>
            </div>

            {/* steps indicator */}
            {step < 4 && (
              <div className="dd-modal-steps">
                {["Date", "Time", "Details"].map((label, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={label}
                      type="button"
                      className="dd-modal-step"
                      data-active={step === n}
                      data-done={step > n}
                      disabled={n > step}
                      onClick={() => n < step && setStep(n)}
                    >
                      <span className="dd-modal-step-n">{step > n ? "✓" : n}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="dd-modal-body">
              {/* ── step 1 · date ── */}
              {step === 1 && (
                <div>
                  <div className="dd-cal-head">
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => shiftMonth(-1)}
                      disabled={!canGoPrevMonth}
                      aria-label="Previous month"
                    >
                      ‹
                    </button>
                    <span className="dd-cal-month">
                      {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon"
                      onClick={() => shiftMonth(1)}
                      aria-label="Next month"
                    >
                      ›
                    </button>
                  </div>
                  <div className="dd-cal-grid dd-cal-dow">
                    {WEEKDAYS.map((d) => (
                      <span key={d} className="dd-cal-dow-cell">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="dd-cal-grid">
                    {grid.map((d, i) => {
                      if (!d) return <span key={`b${i}`} />;
                      const bookable = isBookable(d);
                      const isToday = dateKey(d) === dateKey(today);
                      const selected = selectedDate === dateKey(d);
                      return (
                        <button
                          key={dateKey(d)}
                          type="button"
                          className="dd-cal-day"
                          data-selected={selected}
                          data-today={isToday}
                          disabled={!bookable}
                          onClick={() => pickDate(d)}
                          title={
                            !isWorkingDay(d) ? "Closed on Sundays" : undefined
                          }
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  <p className="dd-modal-hint">Mon–Sat · times shown in your local timezone</p>
                </div>
              )}

              {/* ── step 2 · time ── */}
              {step === 2 && (
                <div>
                  <p className="dd-modal-hint" style={{ marginTop: 0 }}>
                    {loadingSlots ? "Checking availability…" : "Pick a time"}
                  </p>
                  <div className="dd-slot-grid">
                    {TIME_SLOTS.map((t) => {
                      const taken = bookedSlots.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          className="dd-slot"
                          data-selected={selectedTime === t}
                          disabled={taken}
                          onClick={() => pickTime(t)}
                        >
                          {formatTime(t)}
                          {taken && <span className="dd-slot-taken">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── step 3 · details ── */}
              {step === 3 && (
                <form onSubmit={submit} className="dd-form">
                  <label className="dd-field">
                    <span>Name *</span>
                    <input
                      className="dd-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      autoFocus
                    />
                  </label>
                  <label className="dd-field">
                    <span>Email *</span>
                    <input
                      className="dd-input"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                    />
                  </label>
                  <label className="dd-field">
                    <span>Phone / WhatsApp</span>
                    <input
                      className="dd-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Optional"
                    />
                  </label>
                  <label className="dd-field">
                    <span>What do you want to build?</span>
                    <textarea
                      className="dd-input"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="A sentence or two is plenty (optional)"
                    />
                  </label>
                  {error && <p className="dd-form-error">{error}</p>}
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={submitting}
                  >
                    {submitting ? "Booking…" : "Confirm booking"}
                  </button>
                </form>
              )}

              {/* ── step 4 · done ── */}
              {step === 4 && (
                <div className="dd-done">
                  <div className="dd-done-check" aria-hidden="true">
                    ✓
                  </div>
                  <p className="dd-done-lead">
                    Thanks {form.name.split(" ")[0]} — your call is reserved.
                  </p>
                  <p className="dd-done-sub">
                    We'll email <strong>{form.email}</strong> a confirmation. See
                    you then.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={closeBooking}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* selection summary footer */}
            {selectedDate && step > 1 && step < 4 && (
              <div className="dd-modal-summary">
                <span>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    undefined,
                    { weekday: "short", day: "numeric", month: "short" }
                  )}
                  {selectedTime ? ` · ${formatTime(selectedTime)}` : ""}
                </span>
              </div>
            )}

            {!isSupabaseConfigured && step < 4 && (
              <p className="dd-modal-note">
                Demo mode — connect Supabase to store real bookings.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
