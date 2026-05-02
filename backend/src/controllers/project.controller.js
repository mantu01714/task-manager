const prisma = require('../utils/prisma');
const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
});


exports.createProject = async (req, res) => {
  try {
    const { name, description } = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
          },
        },
      },
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: req.user.id },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findFirst({
      where: {
        id,
        members: {
          some: { userId: req.user.id },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          include: { assignee: { select: { id: true, name: true } } },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = addMemberSchema.parse(req.body);

    // 1. Verify requester is admin of the project
    const requesterMember = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: req.user.id },
    });
    
    if (!requesterMember || requesterMember.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Admins can invite members' });
    }

    // 2. Find target user by email
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User with this email not found' });
    }

    // 3. Check if they are already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: targetUser.id },
    });

    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    // 4. Add them to the project
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: targetUser.id,
        role: 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json({ success: true, member: newMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Invalid email', errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id: projectId, userId: targetUserId } = req.params;

    // 1. Verify requester is ADMIN
    const requester = await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id },
    });
    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Admins can remove members' });
    }

    // 2. Cannot remove yourself (the Admin)
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot remove yourself from the project' });
    }

    // 3. Delete membership
    const deleted = await prisma.projectMember.deleteMany({
      where: { projectId, userId: targetUserId },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ success: false, message: 'Member not found in this project' });
    }

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

