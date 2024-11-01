import app from './app'
import { Config } from './config'
import { AppDataSource } from './config/data-source'
import logger from './config/logger'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        await AppDataSource.initialize()
        logger.info('Database connected successfully')
        app.listen(PORT, () => {
            logger.info(`Server listing on port ${PORT}`)
        })
    } catch (err) {
        logger.error('Error starting server:', err)
        process.exit(1)
    }
}

startServer()
