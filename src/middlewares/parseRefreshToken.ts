import { expressjwt } from 'express-jwt';
import { Config } from '../config';
import { Request } from 'express';
export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ['HS256'],
    getToken(req: Request) {
        type AuthCookie = {
            refreshToken: string;
        };
        const { refreshToken } = req.cookies as AuthCookie;
        return refreshToken;
    },
});
