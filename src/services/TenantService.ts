import { Repository } from 'typeorm';
import { ITenant } from '../types';
import { Tenant } from '../entity/Tenant';

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
    async updateById(tenantData: ITenant, id: number) {
        return this.tenantRepository.update(
            {
                id,
            },
            tenantData,
        );
    }
}
