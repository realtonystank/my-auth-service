import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import createJWKSMock from 'mock-jwks';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import bcrypt from 'bcrypt';

describe('POST /auth/login', () => {
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
        it('should return the 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });
            const res = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send();

            expect(res.statusCode).toBe(200);
        });
        it('should return the user data', async () => {
            //Register user
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };
            const userRepository = AppDataSource.getRepository(User);
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user = await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
            //Generate tokens
            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            });

            const res = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send();

            expect(res.body.id).toBe(user.id);
        });
        it('should not return the password field', async () => {
            //Register user
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
            };
            const userRepository = AppDataSource.getRepository(User);
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user = await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
            //Generate tokens
            const accessToken = jwks.token({
                sub: String(user.id),
                role: user.role,
            });

            const res = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken};`])
                .send();

            expect(res.body).not.toHaveProperty('password');
        });
    });
});
