import React, { useEffect, useMemo, useState } from "react";
import { fetchTasks, createTask as apiCreateTask, patchTask, deleteTask as apiDeleteTask, updateTask as apiUpdateTask } from "../api/task";
import { Edit, Search, Check, X as XIcon, Trash } from "lucide-react";

function startOfWeekISO(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function isoDay(dateLike) {
  const d = new Date(dateLike);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatShortDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function getId(t) {
  return t._id || t.id;
}

const DEFAULT_TASKS = [
  { id: uid(), title: "Finishing Wireframe", description: "", datetime: new Date().toISOString(), priority: "Medium", completed: false },
  { id: uid(), title: "Meeting with team", description: "", datetime: new Date().toISOString(), priority: "Low", completed: false },
  { id: uid(), title: "Buy & eat food", description: "", datetime: new Date().toISOString(), priority: "Low", completed: true },
  { id: uid(), title: "Finishing daily commission", description: "", datetime: new Date().toISOString(), priority: "High", completed: true },
];

export default function DashboardScreen({ onAdd }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentWeekStart = useMemo(() => startOfWeekISO(new Date()), []);
  const currentWeekEnd = useMemo(() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 6); return d; }, [currentWeekStart]);

  const defaultSelected = useMemo(() => isoDay(new Date()), []);
  const [selectedDay, setSelectedDay] = useState(defaultSelected);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  async function loadWeekTasks() {
    setLoading(true);
    try {
      const startIso = currentWeekStart.toISOString();
      const end = new Date(currentWeekStart); end.setDate(end.getDate() + 7);
      const endIso = end.toISOString();
      const data = await fetchTasks({ start: startIso, end: endIso });
      setTasks(data);
    } catch (err) {
      console.error("API fetch failed, falling back to local tasks", err);
      setTasks(DEFAULT_TASKS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWeekTasks(); }, []);

  useEffect(() => {
    if (searchActive) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => (document.body.style.overflow = "auto");
  }, [searchActive]);

  const weekTasks = useMemo(() => {
    const start = currentWeekStart;
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return tasks.filter(t => {
      const d = new Date(t.datetime);
      return d >= start && d < end;
    });
  }, [tasks, currentWeekStart]);

  const completedThisWeek = weekTasks.filter(t => t.completed).length;
  const openThisWeek = weekTasks.length - completedThisWeek;
  const progressPct = weekTasks.length === 0 ? 0 : Math.round((completedThisWeek / weekTasks.length) * 100);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter(t => isoDay(t.datetime) === selectedDay)
      .filter(t => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (t.title || "").toLowerCase().includes(s) || (t.description || "").toLowerCase().includes(s);
      })
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [tasks, selectedDay, search]);

  const searchResults = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return [];
    return tasks.filter(t => (t.title || "").toLowerCase().includes(s) || (t.description || "").toLowerCase().includes(s));
  }, [tasks, search]);

  const weekDays = useMemo(() => {
    const arr = [];
    const base = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) { const d = new Date(base); d.setDate(base.getDate() + i); arr.push(d); }
    return arr;
  }, [currentWeekStart]);

  async function handleCreate(payload) {
    try {
      const created = await apiCreateTask(payload);
      setTasks(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error("create failed", err);
      const fallback = { id: uid(), ...payload, completed: false };
      setTasks(prev => [fallback, ...prev]);
      return fallback;
    }
  }

  async function handleToggleComplete(task) {
    const id = getId(task);
    const updated = { completed: !task.completed };
    setTasks(prev => prev.map(t => getId(t) === id ? { ...t, ...updated } : t));
    try {
      await patchTask(id, updated);
    } catch (err) {
      console.error('patch failed', err);
      setTasks(prev => prev.map(t => getId(t) === id ? { ...t, completed: task.completed } : t));
    }
  }

  async function handleDelete(_id) {
    const before = tasks;
    setTasks(prev => prev.filter(t => getId(t) !== _id));
    try {
      await apiDeleteTask(_id);
    } catch (err) {
      console.error('delete failed', err);
      setTasks(before);
    }
  }

  async function handleUpdateTask(serverId, updates) {
    const before = tasks;
    setTasks(prev => prev.map(t => getId(t) === serverId ? { ...t, ...updates } : t));
    try {
      const updated = await apiUpdateTask(serverId, updates);
      setTasks(prev => prev.map(t => getId(t) === serverId ? updated : t));
      return updated;
    } catch (err) {
      console.error('update failed', err);
      setTasks(before);
      throw err;
    }
  }

  function toggleComplete(id) {
    const task = tasks.find(t => getId(t) === id);
    if (!task) return;
    handleToggleComplete(task);
  }
  function removeTask(id) {
    if (!confirm('Delete this task?')) return;
    handleDelete(id);
  }
  function openAdd() {
    setShowAddModal(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    const dt = new Date(task.datetime);
    setForm({
      title: task.title || "",
      startTime: dt.toTimeString().slice(0,5),
      endTime: dt.toTimeString().slice(0,5),
      date: isoDay(task.datetime),
      description: task.description || "",
      priority: task.priority || "Medium"
    });
    setShowEditModal(true);
    setSearchActive(false);
  }

  const [form, setForm] = useState({ title: "", startTime: "09:00", endTime: "10:00", date: isoDay(new Date()), description: "", priority: "Medium" });
  useEffect(() => { if (showAddModal && !showEditModal) setForm(f => ({ ...f, date: isoDay(new Date()) })); }, [showAddModal, showEditModal]);

  async function createTask(e) {
    e && e.preventDefault();
    if (!form.title.trim()) return alert('Title is required');
    const datetime = new Date(`${form.date}T${form.startTime}`).toISOString();
    const payload = { title: form.title, description: form.description, datetime, priority: form.priority };
    await handleCreate(payload);
    setShowAddModal(false);
    setForm({ title: "", startTime: "09:00", endTime: "10:00", date: isoDay(new Date()), description: "", priority: "Medium" });
  }

  async function saveEdit(e) {
    e && e.preventDefault();
    if (!editingTask) return;
    if (!form.title.trim()) return alert('Title is required');
    const datetime = new Date(`${form.date}T${form.startTime}`).toISOString();
    const updates = { title: form.title, description: form.description, datetime, priority: form.priority };
    try {
      await handleUpdateTask(getId(editingTask), updates);
      setShowEditModal(false);
      setEditingTask(null);
      setForm({ title: "", startTime: "09:00", endTime: "10:00", date: isoDay(new Date()), description: "", priority: "Medium" });
    } catch (err) {
      alert('Failed to save changes. Try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading…</div>
      </div>
    );
  }

  const minDate = isoDay(currentWeekStart);
  const maxDate = isoDay(currentWeekEnd);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-6">
      <div className="w-[380px] bg-white shadow-md p-4 relative">
        {/* top search */}
        <div className="flex border border-gray-200 items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchActive(true)}
            className="flex-1 h-11 px-4 text-sm placeholder-gray-400"
            placeholder="Search for a task"
            onClick={() => setSearchActive(true)}
          />
          <button onClick={() => setSearchActive(true)} className="w-10 h-10 flex items-center justify-center" aria-label="search">
            <Search size={16} />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-3 text-xs text-gray-500 items-center">
            {weekDays.map((d,i) => {
              const dayShort = d.toLocaleDateString(undefined, { weekday: 'short' });
              const dayNum = d.toLocaleDateString(undefined, { day: '2-digit' });
              const iso = isoDay(d);
              const isSelected = iso === selectedDay;
              const isToday = iso === isoDay(new Date());
              return (
                <button key={i} onClick={() => setSelectedDay(iso)} className={`w-14 text-center ${isSelected ? 'bg-blue-600 text-white py-2' : 'py-1'} ${isToday && !isSelected ? 'ring-1 ring-blue-200' : ''}`}>
                  <div className="text-[11px]">{dayShort}</div>
                  <div className="text-sm font-medium">{dayNum}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 flex gap-3 items-center">
            <div className="w-10 h-10 bg-white flex items-center justify-center border border-blue-200">
              <Check size={16} color="#4F46E5" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Task Complete</div>
              <div className="mt-1 text-2xl font-bold text-gray-800">{completedThisWeek} <span className="text-sm font-normal text-gray-400">This Week</span></div>
            </div>
          </div>

          <div className="p-4 bg-red-50 flex gap-3 items-center">
            <div className="w-10 h-10 bg-white flex items-center justify-center border border-red-200">
              <XIcon size={16} color="#DC2626" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Task Pending</div>
              <div className="mt-1 text-2xl font-bold text-gray-800">{openThisWeek} <span className="text-sm font-normal text-gray-400">This Week</span></div>
            </div>
          </div>
        </div>

        {/* progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Weekly Progress</h3>
            <div className="text-sm text-gray-500">{progressPct}%</div>
          </div>
          <div className="bg-gray-200 h-5 overflow-hidden">
            <div className="h-5" style={{ width: `${progressPct}%`, background: '#2b2e83' }} />
          </div>
        </div>

        {/* tasks header */}
        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Tasks Today</h3>
          <div className="text-sm text-blue-600">View All</div>
        </div>

        {/* tasks list */}
        <div className="mt-4 divide-y divide-gray-100">
          {visibleTasks.length === 0 && <div className="py-6 text-center text-gray-400">No tasks for this day</div>}
          {visibleTasks.map(t => (
            <div key={getId(t)} className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleComplete(getId(t))} className={`w-6 h-6 flex items-center justify-center border ${t.completed ? 'bg-blue-50 border-blue-400':'border-gray-300'}`}>
                  {t.completed ? <Check size={16} color="#4F46E5" /> : null}
                </button>
                <div>
                  <div className={`text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</div>
                  <div className="text-xs text-gray-400">{new Date(t.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {t.priority} priority</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <button title="Edit" onClick={() => openEdit(t)} className="p-2 hover:bg-gray-50">
                  <Edit size={16} />
                </button>
                <button title="Delete" onClick={() => removeTask(getId(t))} className="p-2 hover:bg-gray-50">
                  <Trash size={16} color="#9CA3AF" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* floating add */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
          <button onClick={openAdd} className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-3xl">+</button>
        </div>

        {/* add modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-40 flex items-end justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowAddModal(false)} />

            <form onSubmit={createTask} className="relative z-50 w-full max-w-[380px] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add New Task</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-500">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600">Task title</label>
                  <input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" placeholder="Doing Homework" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Start</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm(s => ({ ...s, startTime: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Ends</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm(s => ({ ...s, endTime: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Set Date</label>
                  <input type="date" value={form.date} min={minDate} max={maxDate} onChange={(e) => setForm(s => ({ ...s, date: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" rows="4" placeholder="Add Description" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm(s => ({ ...s, priority: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white font-medium">Create task</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* edit modal (bottom-sheet) */}
        {showEditModal && editingTask && (
          <div className="fixed inset-0 z-40 flex items-end justify-center">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => { setShowEditModal(false); setEditingTask(null); }} />

            <form onSubmit={saveEdit} className="relative z-50 w-full max-w-[380px] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Task</h3>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingTask(null); }} className="text-gray-500">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600">Task title</label>
                  <input value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" placeholder="Doing Homework" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Start</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm(s => ({ ...s, startTime: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Ends</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm(s => ({ ...s, endTime: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Set Date</label>
                  <input type="date" value={form.date} min={minDate} max={maxDate} onChange={(e) => setForm(s => ({ ...s, date: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200" rows="4" placeholder="Add Description" />
                </div>

                <div>
                  <label className="block text-xs text-gray-600">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm(s => ({ ...s, priority: e.target.value }))} className="w-full mt-1 p-3 border border-gray-200">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <button type="submit" className="w-full py-3 bg-blue-600 text-white font-medium">Save changes</button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* search overlay */}
        {searchActive && (
          <div className="fixed inset-0 z-50 bg-white flex items-start justify-center">
            <div className="w-[380px] bg-white min-h-screen">
            <button onClick={() => { setSearchActive(false); setSearch(''); }} className="p-4">←</button>
              <div className="m-4 flex border border-gray-200 items-center gap-3">
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 h-11 px-4 text-sm" placeholder="Search for a task" />
                <button onClick={() => setSearchActive(true)} className="w-10 h-10 flex items-center justify-center" aria-label="search">
                  <Search size={16} color="#111827" />
                </button>
              </div>

              <div className="p-4">
                {search.trim() === '' ? <div className="text-gray-400">Type to search tasks</div> : (
                  <div className="space-y-2">
                    {searchResults.length === 0 && <div className="text-gray-400">No results</div>}
                    {searchResults.map(r => (
                      <div key={getId(r)} className="flex items-center space-x-2 p-3 border-b border-gray-200">
                        <div className="flex gap-2 items-center">
                          {/* <button onClick={() => handleToggleComplete(r)} className={`w-8 h-8 rounded flex items-center justify-center border ${r.completed ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}`}>✓</button> */}
                          <button onClick={() => toggleComplete(getId(r))} className={`w-6 h-6 flex items-center justify-center border ${r.completed ? 'bg-blue-50 border-blue-400':'border-gray-300'}`}>
                            {r.completed ? <Check size={16} color="#4F46E5" /> : null}
                        </button>
                        </div>
                        <div>
                          <div className="font-medium">{r.title}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
