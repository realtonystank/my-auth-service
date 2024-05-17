import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { isJwt } from '../utils';
import bcrypt from 'bcrypt';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';

describe('POST /auth/login', () => {
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
        it('should return 200 status code', async () => {
            //user registers first
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const res = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            //successful login
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id');
            expect((res.body as { id: number }).id).toBeDefined;
        });
        it('should come with access and refresh token in cookies', async () => {
            //user registers first
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            const res = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: userData.password });

            interface Headers {
                ['set-cookie']: string[];
            }
            let accessToken: string | null = null;
            let refreshToken: string | null = null;

            const cookies =
                (res.headers as unknown as Headers)['set-cookie'] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1];
                }
            });

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });
    });
    describe('Some fields are missing', () => {
        it('should return 400 status code', async () => {
            //user registers first
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });

            //providing wrong password
            const res = await request(app)
                .post('/auth/login')
                .send({ email: userData.email, password: 'secret1234' });

            //login fails due to wrong password
            expect(res.statusCode).toBe(400);
        });
    });
});
