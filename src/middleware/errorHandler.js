export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 'P2002') {
    return res.status(409).json({
      status: 'error',
      message: `Запись с таким значением поля (${err.meta?.target}) уже существует`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      status: 'error',
      message: 'Запрашиваемый ресурс не найден',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      status: 'error',
      message: 'Указана ссылка на несуществующую связанную запись',
    });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Внутренняя ошибка сервера',
  });
};
