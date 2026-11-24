import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../config/index.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().allow('', null),
  published: Joi.boolean().default(false),
  authorId: Joi.number().integer().positive().required(),
  tags: Joi.array().items(Joi.string().trim().min(1)).default([]),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  content: Joi.string().allow('', null),
  published: Joi.boolean(),
  tags: Joi.array().items(Joi.string().trim().min(1)),
}).min(1);

// GET /api/posts — список с фильтрацией и пагинацией
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const { search, published, authorId } = req.query;
    const where = {};

    if (search) {
      where.title = {
        contains: String(search),
      };
    }

    if (published !== undefined) {
      where.published = published === 'true';
    }

    if (authorId !== undefined && !isNaN(parseInt(authorId, 10))) {
      where.authorId = parseInt(authorId, 10);
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
          tags: true,
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      data: posts,
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

// GET /api/posts/:id — пост с автором и тегами
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        tags: true,
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// POST /api/posts — создать пост с тегами через connectOrCreate
router.post('/', validate(createPostSchema), async (req, res, next) => {
  try {
    const { title, content, published, authorId, tags } = req.body;
    const uniqueTags = [...new Set(tags)];

    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId,
        tags: {
          connectOrCreate: uniqueTags.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
      },
      include: {
        author: true,
        tags: true,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/posts/:id — обновить пост
router.patch('/:id', validate(updatePostSchema), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

    const { title, content, published, tags } = req.body;
    const data = {};

    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;

    if (tags !== undefined) {
      const uniqueTags = [...new Set(tags)];
      data.tags = {
        set: [],
        connectOrCreate: uniqueTags.map((tagName) => ({
          where: { name: tagName },
          create: { name: tagName },
        })),
      };
    }

    const post = await prisma.post.update({
      where: { id },
      data,
      include: {
        author: true,
        tags: true,
      },
    });

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/posts/:id — удалить пост
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Некорректный ID' });

    await prisma.post.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
