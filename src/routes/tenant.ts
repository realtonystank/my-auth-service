import express, {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/TenantService';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import { CreateTenantRequest } from '../types';
import logger from '../config/logger';
import authenticate from '../middlewares/authenticate';
import { canAccess } from '../middlewares/canAccess';
import { Roles } from '../constants';
import validateTenant from '../validators/tenant-validator';
const router = express.Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

router.post(
    '/',
    authenticate,
    canAccess([Roles.ADMIN]) as RequestHandler,
    validateTenant,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.create(req as CreateTenantRequest, res, next),
);

router.get('/', (req: Request, res: Response, next: NextFunction) =>
    tenantController.fetchAllTenants(req, res, next),
);
router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
    tenantController.fetchTenantById(req, res, next),
);
router.delete(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]) as RequestHandler,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.deleteTenantById(req, res, next),
);
router.patch(
    '/:id',
    authenticate,
    canAccess([Roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.updateTenantById(req, res, next),
);

export default router;
