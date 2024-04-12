import app from './app';
import { Config } from './config/index';
import logger from './config/logger';

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
    } catch (err) {
        if (err instanceof Error) {
            logger.error(err.message);
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
    }
};

startServer();
