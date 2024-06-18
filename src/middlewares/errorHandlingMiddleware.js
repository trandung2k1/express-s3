const { StatusCodes } = require('http-status-codes');
const errorHandlingMiddleware = (err, req, res, next) => {
    if (!err.statusCode) err.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    const responseError = {
        statusCode: err.statusCode,
        message: err.message || StatusCodes[err.statusCode],
        stack: err.stack,
        errors: err.errors,
    };
    if (process.env.BUILD_MODE !== 'dev') delete responseError.stack;
    res.status(responseError.statusCode).json(responseError);
};
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = StatusCodes.NOT_FOUND;
    next(error);
};
module.exports = { errorHandlingMiddleware, notFound };
