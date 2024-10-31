import app from './app'
import { Config } from './config'

const startServer = async () => {
    const PORT = Config.PORT
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    } catch (err) {
        console.error('Error starting server:', err)
        process.exit(1)
    }
}

startServer()
