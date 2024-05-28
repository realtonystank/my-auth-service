import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import createJWKSMock from 'mock-jwks';
import { Tenant } from '../../src/entity/Tenant';
import { Roles } from '../../src/constants/';

describe('GET /tenants', () => {
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
                .get('/tenants')
                .set({ Cookie: [`accessToken=${adminToken}`] });
            expect(res.statusCode).toBe(200);
        });
        it('should return tenant when tenant id is given', async () => {
            const tenantData = {
                name: 'Tenant Name',
                address: 'Tenant Address',
            };

            const tenantRepository = connection.getRepository(Tenant);
            tenantRepository.save(tenantData);

            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const res = await request(app)
                .get('/tenants/1')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send();

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('tenant');
            expect(res.body.tenant).toHaveProperty('name');
            expect(res.body.tenant.name).toBe(tenantData.name);
            expect(res.body.tenant).toHaveProperty('address');
            expect(res.body.tenant.address).toBe(tenantData.address);
        });
    });
    describe('Fields are missing', () => {
        it('should return 404 when wrong tenant id is fetched', async () => {
            const adminToken = jwks.token({ sub: '1', role: Roles.ADMIN });

            const res = await request(app)
                .get('/tenants/1')
                .set({ Cookie: [`accessToken=${adminToken}`] })
                .send();

            expect(res.statusCode).toBe(404);
        });
    });
});
