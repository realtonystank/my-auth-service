import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import { RefreshToken } from '../../src/entity/RefreshToken';
import { JwtPayload } from 'jsonwebtoken';
import { sign } from 'jsonwebtoken';
import { Config } from '../../src/config';
import createJWKSMock from 'mock-jwks';

describe('POST /auth/logout', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
        jwks = createJWKSMock('http://localhost:5501');
    });
    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
    });
    afterEach(() => {
        jwks.stop();
    });
    afterAll(async () => {
        connection.destroy();
    });

    describe('Given all fields', () => {
        it('refresh token should be cleared from database', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };
            const userRepository = AppDataSource.getRepository(User);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);

            const newRefreshToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
                id: String(newRefreshToken.id),
            };
            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
                jwtid: String(newRefreshToken.id),
            });
            const accessToken = jwks.token({
                sub: String(user.id),
                role: Roles.CUSTOMER,
            });
            await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `accessToken=${accessToken};refreshToken=${refreshToken}`,
                ])
                .send();

            const refreshTokenFromDB = await refreshTokenRepository.find({
                where: { id: newRefreshToken.id },
            });

            expect(refreshTokenFromDB.length).toBe(0);
        });
        it('should not have access and refresh tokens in cookies', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };
            const userRepository = AppDataSource.getRepository(User);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);

            const newRefreshToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };
            const refreshToken = sign(
                { ...payload, id: String(newRefreshToken.id) },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: 'HS256',
                    expiresIn: '1y',
                    issuer: 'auth-service',
                    jwtid: String(newRefreshToken.id),
                },
            );

            const accessToken = jwks.token({
                sub: String(user.id),
                role: Roles.CUSTOMER,
            });

            const res = await request(app)
                .post('/auth/logout')
                .set('Cookie', [
                    `refreshToken=${refreshToken};`,
                    `accessToken=${accessToken}`,
                ])
                .send();

            interface Headers {
                ['set-cookie']: string[];
            }
            let accessTokenFromCookie: string | null = null;
            let refreshTokenFromCookie: string | null = null;

            const cookies =
                (res.headers as unknown as Headers)['set-cookie'] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessTokenFromCookie = cookie.split(';')[0].split('=')[1];
                }
                if (cookie.startsWith('refreshToken=')) {
                    refreshTokenFromCookie = cookie.split(';')[0].split('=')[1];
                }
            });

            expect(accessTokenFromCookie).toBeFalsy();
            expect(refreshTokenFromCookie).toBeFalsy();
        });
    });
});
