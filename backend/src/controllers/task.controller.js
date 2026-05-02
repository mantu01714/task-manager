const prisma = require('../utils/prisma');
const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(), // ISO string
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, dueDate } = createTaskSchema.parse(req.body);

    // Check project membership
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id },
    });
    if (!member) {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Created task: ${title}`,
      },
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = updateTaskSchema.parse(req.body);

    // Find task and verify membership
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const member = await prisma.projectMember.findFirst({
      where: { projectId: existingTask.projectId, userId: req.user.id },
    });
    if (!member) {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      },
    });

    // Log Activity
    let actionStr = `Updated task: ${task.title}`;
    if (updateData.status && updateData.status !== existingTask.status) {
      actionStr = `Moved task "${task.title}" to ${updateData.status}`;
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: actionStr,
      },
    });

    res.json({ success: true, task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const member = await prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: req.user.id },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only admins can delete tasks' });
    }

    await prisma.task.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: `Deleted task: ${task.title}`,
      },
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get all projects the user is part of
    const projects = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      select: { projectId: true },
    });

    const projectIds = projects.map(p => p.projectId);

    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const pendingTasks = tasks.filter(t => t.status !== 'DONE').length;
    
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status === 'TODO').length;

    // Recent activity
    const activity = await prisma.activityLog.findMany({
      where: {
        user: {
          projects: {
            some: { projectId: { in: projectIds } }
          }
        }
      },
      include: { user: { select: { name: true } } },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      stats: { totalTasks, completedTasks, pendingTasks, overdueTasks },
      activity
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
