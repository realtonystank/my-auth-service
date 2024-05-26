import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenant';
import createJWKSMock from 'mock-jwks';
import { Roles } from '../../src/constants';

describe('DELETE /tenants/:id', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    let adminToken: string;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
        jwks = createJWKSMock('http://localhost:5501');
    });
    beforeEach(async () => {
        jwks.start();
        await connection.dropDatabase();
        await connection.synchronize();
        adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });
    });
    afterEach(() => {
        jwks.stop();
    });
    afterAll(async () => {
        connection.destroy();
    });

    describe('Given all fields', () => {
        it('should return 204 when admin attempts to delete', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };

            const tenantRepository = connection.getRepository(Tenant);
            await tenantRepository.save(tenantData);

            const res = await request(app)
                .delete('/tenants/1')
                .set('Cookie', [`accessToken=${adminToken}`])
                .send();

            expect(res.statusCode).toBe(204);

            const tenants = await tenantRepository.find();

            expect(tenants).toHaveLength(0);
        });
        it('should return 403 when non-admin user attempts to delete', async () => {
            const managerToken = jwks.token({ sub: '1', role: Roles.MANAGER });

            const res = await request(app)
                .delete('/tenants/1')
                .set({ Cookie: [`accessToken=${managerToken}`] });

            expect(res.statusCode).toBe(403);
        });
    });
    describe('Fields are missing', () => {});
});
