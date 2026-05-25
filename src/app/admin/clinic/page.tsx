"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Bell, Users, Phone, ChevronRight, Trash2, RefreshCw, Plus, X } from "lucide-react";

type Medicine = { id: string; name: string; price: number; stock: number };
type PatientMed = {
  id: string;
  dosage: string;
  daysSupply: number;
  quantityPerRefill: number;
  lastRefillDate: string;
  nextRefillDate: string;
  medicine: { id: string; name: string; category?: { name: string } };
};
type Patient = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  medicines: PatientMed[];
};
type Reminder = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  medicineName: string;
  dosage: string;
  quantityPerRefill: number;
  nextRefillDate: string;
  daysLeft: number;
  overdue: boolean;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("sw-TZ");

const MONTHS_SW = ["Januari","Februari","Machi","Aprili","Mei","Juni","Julai","Agosti","Septemba","Oktoba","Novemba","Desemba"];
const DAYS_SW = ["J","P","L","J","A","I","J"];

function MiniCalendar({ startDate, endDate }: { startDate: string; endDate: string }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(endDate); end.setHours(0,0,0,0);
  const start = new Date(startDate); start.setHours(0,0,0,0);

  // Show the month of the end date
  const viewYear = end.getFullYear();
  const viewMonth = end.getMonth();

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startWeekday = firstDay.getDay(); // 0=Sun

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs">
      <p className="text-center font-semibold text-gray-600 mb-2">{MONTHS_SW[viewMonth]} {viewYear}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {DAYS_SW.map((d, i) => <div key={i} className="text-gray-400 font-medium text-[10px]">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const thisDate = new Date(viewYear, viewMonth, day); thisDate.setHours(0,0,0,0);
          const isToday = thisDate.getTime() === today.getTime();
          const isEnd = thisDate.getTime() === end.getTime();
          const isStart = thisDate.getTime() === start.getTime() && viewMonth === start.getMonth() && viewYear === start.getFullYear();
          const inRange = thisDate > start && thisDate < end;
          const isPast = thisDate < today && thisDate >= start;

          let cls = "w-6 h-6 flex items-center justify-center rounded-full mx-auto text-[10px] font-medium ";
          if (isEnd) cls += "bg-red-500 text-white font-bold";
          else if (isStart) cls += "bg-green-500 text-white font-bold";
          else if (isToday) cls += "bg-blue-500 text-white";
          else if (isPast) cls += "bg-gray-200 text-gray-400";
          else if (inRange) cls += "bg-orange-100 text-orange-700";
          else cls += "text-gray-500";

          return <div key={i} className={cls} title={isEnd ? "Kuisha" : isStart ? "Kuanza" : isToday ? "Leo" : ""}>{day}</div>;
        })}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>Ilianza</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>Leo</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>Inaisha</span>
      </div>
    </div>
  );
}

export default function ClinicPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"patients" | "reminders">("reminders");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Forms
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);
  const [patientForm, setPatientForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [medForm, setMedForm] = useState({ medicineId: "", dosage: "", daysSupply: "30", quantityPerRefill: "1", lastRefillDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && user?.role !== "admin") router.push("/");
  }, [status, user, router]);

  const loadData = () => {
    Promise.all([
      fetch("/api/clinic").then((r) => r.json()),
      fetch("/api/clinic/reminders").then((r) => r.json()),
      fetch("/api/medicines").then((r) => r.json()),
    ]).then(([p, r, m]) => {
      setPatients(p);
      setReminders(r);
      setMedicines(m);
      setLoading(false);
    });
  };

  useEffect(() => { if (user?.role === "admin") loadData(); }, [user]);

  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/clinic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientForm),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type: "err", text: data.error }); }
    else {
      setPatients((p) => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
      setPatientForm({ name: "", phone: "", address: "", notes: "" });
      setShowAddPatient(false);
      setMsg({ type: "ok", text: "Mteja ameongezwa!" });
      setTimeout(() => setMsg(null), 3000);
    }
    setSaving(false);
  };

  const deletePatient = async (id: string) => {
    if (!confirm("Futa mteja huyu?")) return;
    await fetch(`/api/clinic/${id}`, { method: "DELETE" });
    setPatients((p) => p.filter((x) => x.id !== id));
    if (selectedPatient?.id === id) setSelectedPatient(null);
  };

  const addMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/clinic/${selectedPatient.id}/medicines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(medForm),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type: "err", text: data.error }); }
    else {
      const updated = { ...selectedPatient, medicines: [...selectedPatient.medicines, data] };
      setSelectedPatient(updated);
      setPatients((p) => p.map((x) => x.id === selectedPatient.id ? updated : x));
      setMedForm({ medicineId: "", dosage: "", daysSupply: "30", quantityPerRefill: "1", lastRefillDate: new Date().toISOString().slice(0, 10) });
      setShowAddMed(false);
      // Reload reminders
      fetch("/api/clinic/reminders").then((r) => r.json()).then(setReminders);
    }
    setSaving(false);
  };

  const removeMedicine = async (patientId: string, medId: string) => {
    if (!confirm("Futa dawa hii kwa mteja?")) return;
    await fetch(`/api/clinic/${patientId}/medicines/${medId}`, { method: "DELETE" });
    if (selectedPatient) {
      const updated = { ...selectedPatient, medicines: selectedPatient.medicines.filter((m) => m.id !== medId) };
      setSelectedPatient(updated);
      setPatients((p) => p.map((x) => x.id === patientId ? updated : x));
    }
    fetch("/api/clinic/reminders").then((r) => r.json()).then(setReminders);
  };

  const doRefill = async (patientId: string, medId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/clinic/${patientId}/medicines/${medId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastRefillDate: today }),
    });
    const data = await res.json();
    if (res.ok && selectedPatient) {
      const updated = { ...selectedPatient, medicines: selectedPatient.medicines.map((m) => m.id === medId ? data : m) };
      setSelectedPatient(updated);
      setPatients((p) => p.map((x) => x.id === patientId ? updated : x));
    }
    fetch("/api/clinic/reminders").then((r) => r.json()).then(setReminders);
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center py-20 text-gray-400">Inapakia...</div></div>;

  const overdueCount = reminders.filter((r) => r.overdue).length;
  const soonCount = reminders.filter((r) => !r.overdue).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Rudi Dashboard
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            🏥 Kliniki — Wateja wa Dawa
          </h1>
          <button
            onClick={() => setShowAddPatient(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition font-semibold shadow"
          >
            <UserPlus size={18} /> Ongeza Mteja
          </button>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${msg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl"><Users size={24} className="text-blue-600" /></div>
            <div><p className="text-gray-500 text-sm">Wateja wa Kliniki</p><p className="text-2xl font-bold text-gray-800">{patients.length}</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-red-50 p-3 rounded-xl"><Bell size={24} className="text-red-600" /></div>
            <div><p className="text-gray-500 text-sm">Dawa Zilizochelewa</p><p className="text-2xl font-bold text-red-600">{overdueCount}</p></div>
          </div>
          <div className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
            <div className="bg-orange-50 p-3 rounded-xl"><Bell size={24} className="text-orange-500" /></div>
            <div><p className="text-gray-500 text-sm">Zinazokaribia (siku 7)</p><p className="text-2xl font-bold text-orange-500">{soonCount}</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "reminders", label: `Vikumbusho (${reminders.length})`, icon: <Bell size={15} /> },
            { id: "patients", label: `Wateja (${patients.length})`, icon: <Users size={15} /> },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as "patients" | "reminders")}
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${tab === t.id ? "bg-blue-600 text-white shadow" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"}`}>
              {t.icon}{t.label}
              {t.id === "reminders" && overdueCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{overdueCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* REMINDERS TAB */}
        {tab === "reminders" && (
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                <Bell size={40} className="mx-auto mb-3 opacity-30" />
                <p>Hakuna vikumbusho vya sasa hivi.</p>
                <p className="text-sm mt-1">Wateja wote wana dawa za kutosha kwa siku 7 zijazo.</p>
              </div>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className={`bg-white rounded-2xl shadow p-5 flex flex-wrap items-center justify-between gap-4 border-l-4 ${r.overdue ? "border-red-500" : "border-orange-400"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${r.overdue ? "bg-red-50" : "bg-orange-50"}`}>
                      <Bell size={20} className={r.overdue ? "text-red-500" : "text-orange-500"} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{r.patientName}</p>
                      <p className="text-sm text-gray-600">💊 <span className="font-medium">{r.medicineName}</span> — {r.dosage}</p>
                      <p className="text-sm text-gray-500">📞 {r.patientPhone} | Kujaza: {r.quantityPerRefill} vitengo</p>
                      <p className="text-sm mt-1">
                        <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${r.overdue ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {r.overdue ? `Imechelewa siku ${Math.abs(r.daysLeft)}` : `Inabaki siku ${r.daysLeft}`}
                        </span>
                        <span className="text-gray-400 text-xs ml-2">Tarehe ya kujaza: {fmtDate(r.nextRefillDate)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { const p = patients.find((x) => x.id === r.patientId); if (p) { setSelectedPatient(p); setTab("patients"); } }}
                      className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                    >
                      Angalia Mteja
                    </button>
                    <button
                      onClick={() => doRefill(r.patientId, r.id)}
                      className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                    >
                      <RefreshCw size={13} /> Jaza
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PATIENTS TAB */}
        {tab === "patients" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">Orodha ya Wateja</div>
                {patients.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">Hakuna wateja bado</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {patients.map((p) => {
                      const hasReminder = reminders.some((r) => r.patientId === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-center justify-between ${selectedPatient?.id === p.id ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}
                        >
                          <div>
                            <p className="font-semibold text-gray-800 flex items-center gap-2">
                              {p.name}
                              {hasReminder && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} />{p.phone}</p>
                            <p className="text-xs text-gray-400">{p.medicines.length} dawa</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Detail */}
            <div className="lg:col-span-2">
              {!selectedPatient ? (
                <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Chagua mteja upande wa kushoto kuona maelezo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Patient Info */}
                  <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                        <p className="text-gray-500 flex items-center gap-1 mt-1"><Phone size={14} />{selectedPatient.phone}</p>
                        {selectedPatient.address && <p className="text-gray-500 text-sm mt-1">📍 {selectedPatient.address}</p>}
                        {selectedPatient.notes && <p className="text-gray-400 text-sm mt-2 italic">{selectedPatient.notes}</p>}
                      </div>
                      <button onClick={() => deletePatient(selectedPatient.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Medicines */}
                  <div className="bg-white rounded-2xl shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-gray-800">Dawa za Mteja</h3>
                      <button onClick={() => setShowAddMed(true)}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                        <Plus size={14} /> Ongeza Dawa
                      </button>
                    </div>

                    {selectedPatient.medicines.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-sm">Hakuna dawa zilizoongezwa</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {selectedPatient.medicines.map((pm) => {
                          const today = new Date(); today.setHours(0,0,0,0);
                          const next = new Date(pm.nextRefillDate); next.setHours(0,0,0,0);
                          const last = new Date(pm.lastRefillDate); last.setHours(0,0,0,0);
                          const daysLeft = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const daysUsed = Math.max(0, Math.ceil((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)));
                          const totalDays = pm.daysSupply;
                          const pct = Math.min(100, Math.round((daysUsed / totalDays) * 100));
                          const pillsPerDay = (pm.quantityPerRefill / pm.daysSupply).toFixed(1);
                          const pillsLeft = Math.max(0, Math.round((pm.quantityPerRefill / pm.daysSupply) * daysLeft));
                          const isOverdue = daysLeft < 0;
                          const isSoon = daysLeft >= 0 && daysLeft <= 7;
                          return (
                            <div key={pm.id} className="px-6 py-5">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <p className="font-bold text-gray-800 text-base">{pm.medicine.name}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">💊 {pm.dosage}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button onClick={() => doRefill(selectedPatient.id, pm.id)}
                                    className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1">
                                    <RefreshCw size={13} /> Jaza
                                  </button>
                                  <button onClick={() => removeMedicine(selectedPatient.id, pm.id)}
                                    className="text-sm text-red-400 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Stats row */}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                  <p className="text-xs text-gray-500 mb-0.5">Alipewa</p>
                                  <p className="text-lg font-bold text-blue-700">{pm.quantityPerRefill}</p>
                                  <p className="text-[10px] text-gray-400">vidonge</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3 text-center">
                                  <p className="text-xs text-gray-500 mb-0.5">Kwa Siku</p>
                                  <p className="text-lg font-bold text-purple-700">{pillsPerDay}</p>
                                  <p className="text-[10px] text-gray-400">vidonge/siku</p>
                                </div>
                                <div className={`rounded-xl p-3 text-center ${isOverdue ? "bg-red-50" : isSoon ? "bg-orange-50" : "bg-green-50"}`}>
                                  <p className="text-xs text-gray-500 mb-0.5">Vilivyobaki</p>
                                  <p className={`text-lg font-bold ${isOverdue ? "text-red-600" : isSoon ? "text-orange-600" : "text-green-600"}`}>{isOverdue ? 0 : pillsLeft}</p>
                                  <p className="text-[10px] text-gray-400">vidonge</p>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mb-1">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Imeanza: {fmtDate(pm.lastRefillDate)}</span>
                                  <span>
                                    <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${isOverdue ? "bg-red-100 text-red-600" : isSoon ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                                      {isOverdue ? `Imechelewa siku ${Math.abs(daysLeft)}` : `Siku ${daysLeft} zimebaki`}
                                    </span>
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`h-3 rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-orange-400" : "bg-green-500"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                  <span>Siku {Math.min(daysUsed, totalDays)}/{totalDays} zimepita</span>
                                  <span>Kuisha: {fmtDate(pm.nextRefillDate)}</span>
                                </div>
                              </div>

                              {/* Mini Calendar */}
                              <MiniCalendar startDate={pm.lastRefillDate} endDate={pm.nextRefillDate} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">Ongeza Mteja wa Kliniki</h3>
              <button onClick={() => setShowAddPatient(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={addPatient} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jina Kamili *</label>
                <input value={patientForm.name} onChange={(e) => setPatientForm((f) => ({ ...f, name: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Namba ya Simu *</label>
                <input value={patientForm.phone} onChange={(e) => setPatientForm((f) => ({ ...f, phone: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Makazi</label>
                <input value={patientForm.address} onChange={(e) => setPatientForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Maelezo ya Afya (si lazima)</label>
                <textarea value={patientForm.notes} onChange={(e) => setPatientForm((f) => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              {msg?.type === "err" && <p className="text-red-600 text-sm">{msg.text}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddPatient(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition">Ghairi</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {saving ? "Inahifadhi..." : "Hifadhi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddMed && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold text-gray-800">Ongeza Dawa — {selectedPatient.name}</h3>
              <button onClick={() => setShowAddMed(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={addMedicine} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dawa *</label>
                <select value={medForm.medicineId} onChange={(e) => setMedForm((f) => ({ ...f, medicineId: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">-- Chagua dawa --</option>
                  {medicines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kipimo cha Dawa *</label>
                <input value={medForm.dosage} onChange={(e) => setMedForm((f) => ({ ...f, dosage: e.target.value }))} required
                  placeholder="mfano: 1 kidonge asubuhi na jioni"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vidonge Anavyopewa *</label>
                  <input type="number" min={1} value={medForm.quantityPerRefill} onChange={(e) => setMedForm((f) => ({ ...f, quantityPerRefill: e.target.value }))} required
                    placeholder="mfano: 60"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Zinatosha Siku Ngapi *</label>
                  <input type="number" min={1} value={medForm.daysSupply} onChange={(e) => setMedForm((f) => ({ ...f, daysSupply: e.target.value }))} required
                    placeholder="mfano: 30"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              {medForm.quantityPerRefill && medForm.daysSupply && (
                <div className="bg-blue-50 rounded-xl px-4 py-2.5 text-sm text-blue-700 flex items-center gap-2">
                  💊 Anatumia <strong>{(Number(medForm.quantityPerRefill) / Number(medForm.daysSupply)).toFixed(1)}</strong> vidonge kwa siku
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tarehe ya Kujaza Mara ya Mwisho *</label>
                <input type="date" value={medForm.lastRefillDate} onChange={(e) => setMedForm((f) => ({ ...f, lastRefillDate: e.target.value }))} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">Mfumo utahesabu tarehe ya kujaza ijayo kiotomatiki</p>
              </div>
              {msg?.type === "err" && <p className="text-red-600 text-sm">{msg.text}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMed(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition">Ghairi</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {saving ? "Inahifadhi..." : "Hifadhi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
