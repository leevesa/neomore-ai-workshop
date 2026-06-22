const cds = require('@sap/cds')

class SimpleCapBackendService extends cds.ApplicationService {
    async init() {
        const {
            WorkOrder,
            Plant,
            WorkCenter,
            Person,
            Priority,
            FunctionalLocation,
            Equipment
        } = cds.entities('simple.cap.backend');


        this.before(['CREATE', 'UPDATE'], 'WorkOrders', async (req) => {
            const aWorkCenters = await SELECT.from(WorkCenter).where({ WorkCenterId: req.data.Workcenter });
            if (aWorkCenters.length === 0) {
                req.reject(400, 'Given Work Center does not exist');
            }
            const aPlants = await SELECT.from(Plant).where({ PlantId: req.data.Plant });
            if (aPlants.length === 0) {
                req.reject(400, 'Given Plant does not exist');
            }
            const aPriorities = await SELECT.from(Priority).where({ PriorityId: req.data.Priority });
            if (aPriorities.length === 0) {
                req.reject(400, 'Given Priority does not exist');
            }
            const aFunctionalLocations = await SELECT.from(FunctionalLocation).where({ FunctionalLocationId: req.data.FunctLoc });
            if (aFunctionalLocations.length === 0) {
                req.reject(400, 'Given Functional Location does not exist');
            }
            const aEquipments = await SELECT.from(Equipment).where({ EquipmentId: req.data.Equipment });
            if (aEquipments.length === 0) {
                req.reject(400, 'Given Equipment does not exist');
            }
            const aPersons = await SELECT.from(Person).where({ PersonId: req.data.RespPerson });
            if (aPersons.length === 0) {
                req.reject(400, 'Given Person does not exist');
            }
            // Check operations if deep structure
            if (req.data.Operations && req.data.Operations.length > 0) {
                for (const operation of req.data.Operations) {
                    const aPlants = await SELECT.from(Plant).where({ PlantId: operation.Plant });
                    if (aPlants.length === 0) {
                        req.reject(400, `Given Plant for operation ${operation.Activity} does not exist`);
                    }
                    const aWorkCenters = await SELECT.from(WorkCenter).where({ WorkCenterId: operation.WorkCenter });
                    if (aWorkCenters.length === 0) {
                        req.reject(400, `Given Work Center for operation ${operation.Activity} does not exist`);
                    }
                }
            }
            if (!req.data.OrderId) {
                // Generate OrderId
                const aWorkOrders = await SELECT.from(WorkOrder).orderBy({ OrderId: 'desc' });
                if (aWorkOrders.length === 0) {
                    req.data.OrderId = '0000000001';
                } else {
                    const iOrderId = parseInt(aWorkOrders[0].OrderId);
                    req.data.OrderId = (iOrderId + 1).toString().padStart(10, '0');
                }
            }
            return req.data;
        });

        this.before(['CREATE', 'UPDATE'], 'Operations', async (req) => {
            const aPlants = await SELECT.from(Plant).where({ PlantId: req.data.Plant });
            if (aPlants.length === 0) {
                req.reject(400, 'Given Plant does not exist');
            }
            const aWorkCenters = await SELECT.from(WorkCenter).where({ WorkCenterId: req.data.WorkCenter });
            if (aWorkCenters.length === 0) {
                req.reject(400, 'Given Work Center does not exist');
            }
            return req.data;
        });

        await super.init();
    }
}

module.exports = {
    SimpleCapBackendService
};