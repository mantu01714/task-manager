import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  AlertCircle,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // New project state
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, projectsRes] = await Promise.all([
        api.get('/tasks/stats'),
        api.get('/projects')
      ]);
      
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setActivity(statsRes.data.activity);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name: newProjectName, description: newProjectDesc });
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectDesc('');
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error creating project", error);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your projects and tasks in one place.</p>
        </div>
        <button 
          onClick={() => setShowNewProject(true)}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                  <input 
                    type="text" required 
                    value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                  <textarea 
                    value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewProject(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Tasks" 
          value={stats?.totalTasks || 0} 
          icon={<ListTodo size={24} className="text-blue-600 dark:text-blue-400" />} 
          colorClass="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard 
          title="Completed" 
          value={stats?.completedTasks || 0} 
          icon={<CheckCircle2 size={24} className="text-green-600 dark:text-green-400" />} 
          colorClass="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard 
          title="Pending" 
          value={stats?.pendingTasks || 0} 
          icon={<Clock size={24} className="text-yellow-600 dark:text-yellow-400" />} 
          colorClass="bg-yellow-50 dark:bg-yellow-900/20"
        />
        <StatCard 
          title="Overdue" 
          value={stats?.overdueTasks || 0} 
          icon={<AlertCircle size={24} className="text-red-600 dark:text-red-400" />} 
          colorClass="bg-red-50 dark:bg-red-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-dark-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No projects yet. Create one to get started!</p>
              </div>
            ) : (
              projects.map(project => (
                <Link 
                  key={project.id} 
                  to={`/project/${project.id}`}
                  className="bg-white dark:bg-dark-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group block"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{project.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-md">
                      {project.members?.length || 1} Member(s)
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 pl-4">No recent activity.</p>
            ) : (
              activity.map((log, i) => (
                <div key={log.id} className="relative pl-6 sm:pl-8 py-2">
                  <div className="absolute left-0 sm:left-2 w-2 h-2 bg-primary-500 rounded-full mt-1.5 ring-4 ring-white dark:ring-dark-800"></div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{log.user.name}</span> {log.action.toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
