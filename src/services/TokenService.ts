import path from 'path';
import fs from 'fs';
import createHttpError from 'http-errors';
import { JwtPayload, sign } from 'jsonwebtoken';
import { Config } from '../config';
import { User } from '../entity/User';
import { RefreshToken } from '../entity/RefreshToken';
import { Repository } from 'typeorm';
export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: Buffer;
        try {
            privateKey = fs.readFileSync(
                path.join(__dirname, '../../certs/private.pem'),
            );
        } catch (err) {
            const error = createHttpError(
                500,
                'Error while reading private key',
            );
            throw error;
        }
        const accessToken = sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1h',
            issuer: 'auth-service',
        });
        return accessToken;
    }
    async generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: payload.id,
        });

        return refreshToken;
    }
    async persistRefreshToken(user: User) {
        const currentYear = new Date().getFullYear();
        let isLeapYear = false;
        if (currentYear % 4 === 0) {
            if (currentYear % 100 === 0) {
                if (currentYear % 400 === 0) {
                    isLeapYear = true;
                }
            } else {
                isLeapYear = true;
            }
        }

        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * (isLeapYear ? 366 : 365);

        const newRefreshToken = await this.refreshTokenRepository.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_YEAR),
        });
        return newRefreshToken;
    }
}
