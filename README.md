# Blog Platform REST API (kt03)

## Запуск проекта

1. Установите зависимости:
```bash
npm install
```

2. Выполните миграцию базы данных и сгенерируйте Prisma Client:
```bash
npx prisma migrate dev --name init
```

3. Запустите сервер:
```bash
npm run dev
```
