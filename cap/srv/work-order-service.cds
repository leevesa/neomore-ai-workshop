using { simple.cap.backend as service } from '../db/schema';

@path: '/sap/opu/odata/sap/ZCAP_BACKEND_SRV'
service SimpleCapBackendService {

    // entity WorkOrders as projection on service.WorkOrder;
    entity WorkOrders as projection on service.WorkOrder {
        OrderId,
        Description,
        Workcenter,
        WorkcenterData.WorkCenterDescription as WorkcenterDescr,
        Plant,
        PlantData.PlantDescription as PlantDescr,
        Priority,
        PriorityData.PriorityDescription as PriorityDescr,
        StartDate,
        FinishDate,
        StartTime,
        FinishTime,
        FunctLoc,
        FunctLocData.FunctionalLocationDescription as FunctLocDescr,
        Equipment,
        EquipmentData.EquipmentDescription as EquipmentDescr,
        NotifNo,
        RespPerson,
        RespPersonData.PersonName as RespPersonName,
        Released,
        Completed,
        Operations
    }

    entity Operations as projection on service.Operation {
        OrderId,
        Activity,
        Description,
        Plant,
        PlantData.PlantDescription as PlantDescr,
        WorkCenter,
        WorkCenterData.WorkCenterDescription as WorkCenterDescr,
        Duration,
        DurationUnit,
        EarlSchedStartDate,
        EarlSchedStartTime,
        EarlSchedFinDate,
        EarlSchedFinTime
    };
    
    entity Plants as projection on service.Plant;
    entity WorkCenters as projection on service.WorkCenter;
    entity Persons as projection on service.Person;
    entity Priorities as projection on service.Priority;
    entity FunctionalLocations as projection on service.FunctionalLocation;
    entity Equipments as projection on service.Equipment;


    entity Invoices as projection on service.Invoice;

}