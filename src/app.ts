import express, { Request, Response, NextFunction } from 'express'
import logger from './config/logger'
import createHttpError, { HttpError } from 'http-errors'
const app = express()

app.get('/', (req, res, next) => {
    const err = createHttpError(401, 'This is a test error')
    next(err)
})

// global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || 500

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: '',
                location: '',
            },
        ],
    })
})

export default app
