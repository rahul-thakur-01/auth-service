import 'reflect-metadata'
import express, { Request, Response, NextFunction } from 'express'
import logger from './config/logger'
import { HttpError } from 'http-errors'
import authRouter from './routes/auth'
import cookieParser from 'cookie-parser'
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello World' })
})

app.use('/auth', authRouter)

// global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || err.status || 500

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
