import express from 'express';
import { config } from './config/index.js';
import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Сервер запущен на http://localhost:${config.port}`);
});
