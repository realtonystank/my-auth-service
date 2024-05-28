import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import createJWKSMock from 'mock-jwks';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import { createTenant } from '../utils';
import { Tenant } from '../../src/entity/Tenant';

describe('POST /users', () => {
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
        it('should return 201 status', async () => {
            const tenant = await createTenant(
                AppDataSource.getRepository(Tenant),
            );

            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const userData = {
                firstName: 'Name',
                lastName: 'Last',
                email: 'email@gmail.com',
                password: 'secret12345',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            };

            const res = await request(app)
                .post('/users')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send(userData);
            expect(res.statusCode).toBe(201);
        });
        it('should persist the user in the database', async () => {
            const tenant = await createTenant(
                AppDataSource.getRepository(Tenant),
            );
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            };

            await request(app)
                .post('/users')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send(userData);

            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].email).toBe(userData.email);
        });
        it('should persist user with manager role', async () => {
            const tenant = await createTenant(
                AppDataSource.getRepository(Tenant),
            );
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
                role: Roles.MANAGER,
                tenantId: tenant.id,
            };

            await request(app)
                .post('/users')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send(userData);

            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].role).toBe(Roles.MANAGER);
        });
        it('should return 403 status when non-admin attempts to create a manager', async () => {
            const tenant = await createTenant(
                AppDataSource.getRepository(Tenant),
            );
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER });

            const userData = {
                firstName: 'Priyansh',
                lastName: 'Rajwar',
                email: 'rajwars.priyansh@gmail.com',
                password: 'secret12345',
                tenantId: tenant.id,
            };

            const res = await request(app)
                .post('/users')
                .set({ Cookie: [`accessToken=${managerToken}`] })
                .send(userData);

            expect(res.statusCode).toBe(403);

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });
});
