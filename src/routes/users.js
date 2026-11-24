import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../config/index.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('USER', 'ADMIN').default('USER'),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid('USER', 'ADMIN'),
}).min(1);

// GET /api/users — список с пагинацией
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — пользователь с постами (сортировка по убыванию даты)
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: { tags: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /api/users — создать пользователя
router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id — обновить пользователя
router.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

    const user = await prisma.user.update({
      where: { id },
      data: req.body,
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id — удалить пользователя
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

    await prisma.user.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
