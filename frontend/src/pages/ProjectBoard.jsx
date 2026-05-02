import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  DndContext, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragOverlay, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Calendar, AlertCircle, CheckCircle2, PlayCircle, UserPlus, Users, X } from 'lucide-react';
import clsx from 'clsx';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-50' },
  { id: 'DONE', title: 'Done', color: 'bg-green-50' },
];

function SortableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'TODO';

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={clsx(
        "bg-white p-4 rounded-lg shadow-sm border cursor-grab active:cursor-grabbing",
        isOverdue ? "border-red-400" : "border-gray-200"
      )}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
        {isOverdue && (
          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
            <AlertCircle size={12} /> Overdue
          </span>
        )}
        {!isOverdue && task.status === 'IN_PROGRESS' && (
          <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
            <PlayCircle size={12} /> In Progress
          </span>
        )}
        {!isOverdue && task.status === 'DONE' && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
            <CheckCircle2 size={12} /> Done
          </span>
        )}
      </div>
      {task.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1 bg-primary-50 border border-primary-200 px-2 py-0.5 rounded-full">
            <div className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-[9px]">
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-primary-700 font-medium truncate max-w-[60px]">{task.assignee.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ col, tasks }) {
  const { setNodeRef } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} className={`w-80 shrink-0 flex flex-col rounded-xl border border-gray-200 max-h-full ${col.color}`}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white/70 rounded-t-xl">
        <h3 className="font-bold text-gray-700">{col.title}</h3>
        <span className="bg-white text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm border border-gray-200">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto min-h-[150px]">
        <SortableContext id={col.id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-full">
            {tasks.map(task => <SortableTask key={task.id} task={task} />)}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  // Task modal
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.project);
        setTasks(res.data.project.tasks || []);
      }
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isAdmin = project?.members?.find(m => m.user.id === user?.id)?.role === 'ADMIN';
  const members = project?.members || [];

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc,
        projectId: id,
        dueDate: newTaskDue || undefined,
        assigneeId: newTaskAssignee || undefined,
      });
      setShowNewTask(false);
      setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDue(''); setNewTaskAssignee('');
      fetchProject();
    } catch (error) {
      console.error("Error creating task", error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError(''); setInviteSuccess(''); setInviting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: inviteEmail });
      setInviteSuccess(`Successfully invited ${inviteEmail}!`);
      setInviteEmail('');
      fetchProject();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this project?`)) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    const overId = over.id;
    let newStatus = null;
    if (COLUMNS.find(c => c.id === overId)) {
      newStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }
    if (newStatus && activeTask.status !== newStatus) {
      setTasks(tasks.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
      try {
        await api.put(`/tasks/${active.id}`, { status: newStatus });
      } catch {
        fetchProject();
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading project...</div>;
  if (!project) return <div className="text-gray-500">Project not found</div>;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm";

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <Users size={14} className="text-gray-400" />
            <div className="flex -space-x-2">
              {members.map(m => (
                <div
                  key={m.user.id}
                  title={`${m.user.name} (${m.role})`}
                  className={clsx(
                    "w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white",
                    m.role === 'ADMIN' ? 'bg-primary-500' : 'bg-gray-400'
                  )}
                >
                  {m.user.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400">{members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => { setShowInvite(true); setInviteError(''); setInviteSuccess(''); }}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              <UserPlus size={16} /> Invite Member
            </button>
          )}
          <button
            onClick={() => setShowNewTask(true)}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full items-start pb-4 min-w-max">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return <Column key={col.id} col={col} tasks={colTasks} />;
            })}
          </div>
          <DragOverlay>
            {activeId ? <SortableTask task={tasks.find(t => t.id === activeId)} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Invite Member Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleInvite}>
              <p className="text-sm text-gray-500 mb-4">Enter the email address of a registered user to add them as a Member.</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email" required
                value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                className={inputClass}
              />
              {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
              {inviteSuccess && <p className="text-green-600 text-sm mt-2">{inviteSuccess}</p>}
              
              {members.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Members</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {members.map(m => (
                      <div key={m.user.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                            <p className="text-xs text-gray-400">{m.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            m.role === 'ADMIN' ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"
                          )}>
                            {m.role}
                          </span>
                          {m.role !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Remove member"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Close</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50">
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Task</h2>
              <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input type="text" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className={inputClass} placeholder="Task title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className={inputClass} placeholder="Optional description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className={inputClass}>
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewTask(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
