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
import { isJwt } from '../utils';

describe('POST /auth/refresh', () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });
    beforeEach(async () => {
        await connection.dropDatabase();
        await connection.synchronize();
    });
    afterAll(async () => {
        connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return access token', async () => {
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

            const newRefreshToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + MS_IN_YEAR),
            });

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };
            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
                jwtid: String(newRefreshToken.id),
            });

            const res = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken};`])
                .send();
            interface Headers {
                ['set-cookie']: string[];
            }
            let accessToken: string;
            const cookies =
                (res.headers as unknown as Headers)['set-cookie'] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }

                expect(accessToken).not.toBeNull();
                expect(isJwt(accessToken)).toBeTruthy();
            });
        });
    });
});
