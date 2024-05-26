import { Repository } from 'typeorm';
import { ITenant } from '../types';
import { Tenant } from '../entity/Tenant';
import createHttpError from 'http-errors';

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}
    async create(tenantData: ITenant) {
        return this.tenantRepository.save(tenantData);
    }
    async fetchAll() {
        return this.tenantRepository.find();
    }
    async fetchById(id: number) {
        return this.tenantRepository.findOne({
            where: {
                id: id,
            },
        });
    }
    async deleteById(id: number) {
        return this.tenantRepository.delete(id);
    }
    async updateById({ name, address }: ITenant, id: number) {
        const oldData = await this.fetchById(id);
        if (!oldData) {
            const error = createHttpError(404, 'Possible incorrect id');
            throw error;
        }
        const updatedData = {
            name: name ? name : oldData.name,
            address: address ? address : oldData.address,
        };
        return this.tenantRepository.update(
            {
                id,
            },
            updatedData,
        );
    }
}
