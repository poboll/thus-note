import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import Task from '../models/Task';
// (Types not used in this route)

const router = Router();

// Get Tasks
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Find tasks for user
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    
    return res.json(successResponse({
      list: tasks,
      total: tasks.length
    }));
  } catch (error: any) {
    return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
  }
});

// Create Task
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, category, deadline, allowAnonymous, requireLogin } = req.body;
    
    if (!title) {
        return res.status(400).json(errorResponse('BAD_REQUEST', 'Title is required'));
    }
    
    // Validate deadline if provided and map to dueDate
    let dueDate: Date | undefined = undefined;
    if (deadline !== undefined && deadline !== null) {
      const parsed = new Date(deadline);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json(errorResponse('BAD_REQUEST', 'Invalid deadline'));
      }
      dueDate = parsed;
    }

    const newTask = new Task({
        userId,
        title,
        description,
        category: category || 'default',
        status: 'todo',
        dueDate,
        subtasks: [],
        allowAnonymous: allowAnonymous !== undefined ? allowAnonymous : false,
        requireLogin: requireLogin !== undefined ? requireLogin : true,
    });

    await newTask.save();
    
    return res.status(201).json(successResponse(newTask));
  } catch (error: any) {
    console.error("Task Create Error:", error);
    // Log full error details for debugging
    if (error.errors) {
        console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
    }
    return res.status(500).json(errorResponse('INTERNAL_ERROR', error.message));
  }
});

export default router;
