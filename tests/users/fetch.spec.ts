import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import createJWKSMock from 'mock-jwks';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';

describe('GET /users', () => {
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
        it('should return 200 status', async () => {
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const res = await request(app)
                .get('/users')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send();

            expect(res.statusCode).toBe(200);
        });
        it('should return all users', async () => {
            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
                role: Roles.MANAGER,
            };

            const userRepository = AppDataSource.getRepository(User);

            await userRepository.save(userData);

            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const res = await request(app)
                .get('/users')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send();

            expect(res.body).toHaveProperty('users');
            expect(res.body.users).toHaveLength(1);
            expect(res.body.users[0]).toHaveProperty('firstName');
            expect(res.body.users[0].firstName).toBe(userData.firstName);
        });
        it('should return 403 for non-admin users', async () => {
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER });

            const res = await request(app)
                .get('/users')
                .set({ Cookie: [`accessToken=${managerToken}`] })
                .send();

            expect(res.statusCode).toBe(403);
        });
    });
});
