import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import createJWKSMock from 'mock-jwks';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';

describe('PATCH /users/:id', () => {
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
        it('should return 204 status', async () => {
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const updatedUser = {
                firstName: 'firstname updated',
                lastName: 'lastname',
                email: 'firstname@gmail.com',
                password: 'secret12345',
                role: Roles.CUSTOMER,
            };

            const res = await request(app)
                .patch('/users/1')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send(updatedUser);

            expect(res.statusCode).toBe(204);
        });
        it('should store updated user', async () => {
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const oldUser = {
                firstName: 'firstname',
                lastName: 'lastname',
                email: 'firstname@gmail.com',
                password: 'secret12345',
                role: Roles.CUSTOMER,
            };

            const userRepository = connection.getRepository(User);
            await userRepository.save(oldUser);

            oldUser.firstName = 'firstname updated';

            await request(app)
                .patch('/users/1')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send(oldUser);

            const updatedUsers = await userRepository.find();
            expect(updatedUsers).toHaveLength(1);
            expect(updatedUsers[0]).toHaveProperty('firstName');
            expect(updatedUsers[0].firstName).toBe('firstname updated');
        });
    });
    describe('Some fields are missing', () => {
        it('should return 400 status', async () => {
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const updatedUser = {
                firstName: 'firstname updated',
                lastName: 'lastname',
                email: 'firstname@gmail.com',
                password: 'secret12345',
            };

            const res = await request(app)
                .patch('/users/1')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send(updatedUser);

            expect(res.statusCode).toBe(400);
        });
    });
});
