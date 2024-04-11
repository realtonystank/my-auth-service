import app from './app';
import { Config } from './config/index';

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

startServer();
