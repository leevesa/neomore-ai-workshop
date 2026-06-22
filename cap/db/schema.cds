namespace simple.cap.backend;

entity WorkOrder {
    key OrderId : String(12);
    Description : String(40);
    Workcenter : String(8);
    // WorkcenterDescr : String(40);
    WorkcenterData : Association to WorkCenter on WorkcenterData.WorkCenterId = $self.Workcenter;
    Plant : String(4);
    // PlantDescr : String(40);
    PlantData : Association to Plant on PlantData.PlantId = $self.Plant;
    Priority : String(2);
    // PriorityDescr : String(40);
    PriorityData : Association to Priority on PriorityData.PriorityId = $self.Priority;
    StartDate : DateTime;
    FinishDate : DateTime;
    StartTime : Time;
    FinishTime : Time;
    FunctLoc : String(40);
    // FunctLocDescr: String(40);
    FunctLocData : Association to FunctionalLocation on FunctLocData.FunctionalLocationId = $self.FunctLoc;
    Equipment : String(18);
    // EquipmentDescr : String(40);
    EquipmentData : Association to Equipment on EquipmentData.EquipmentId = $self.Equipment;
    NotifNo : String(12);
    RespPerson : String(12);
    // RespPersonName : String(40);
    RespPersonData : Association to Person on RespPersonData.PersonId = $self.RespPerson;
    Released : Boolean;
    Completed : Boolean;
    Operations : Composition of many Operation on Operations.OrderId = $self.OrderId;
}

entity Operation {
    key OrderId : String(12);
    key Activity : String(4);
    Description : String(40);
    Plant : String(4);
    // PlantDescr : String(40);
    PlantData : Association to Plant on PlantData.PlantId = $self.Plant;
    WorkCenter : String(8);
    // WorkCenterDescr : String(40);
    WorkCenterData : Association to WorkCenter on WorkCenterData.WorkCenterId = $self.WorkCenter;
    Duration : Decimal(9,2);
    DurationUnit : String(3);
    EarlSchedStartDate : DateTime; 
    EarlSchedStartTime : Time;
    EarlSchedFinDate : DateTime;
    EarlSchedFinTime : Time;
}

entity Invoice {
    key InvoiceId : String(12);
    ShipperName: String(40);
    ProductName: String(40);
    Quantity: Decimal(9, 2);
    ExtendedPrice: Decimal(9, 2);
    Status: String(1);
}

entity Plant {
    key PlantId : String(4);
    PlantDescription : String(40);
}

entity WorkCenter {
    key WorkCenterId : String(8);
    WorkCenterDescription : String(40);
}

entity Person {
    key PersonId : String(12);
    PersonName : String(40);
}

entity Priority {
    key PriorityId : String(2);
    PriorityDescription : String(40);
}

entity FunctionalLocation {
    key FunctionalLocationId : String(40);
    FunctionalLocationDescription : String(40);
}

entity Equipment {
    key EquipmentId : String(18);
    EquipmentDescription : String(40);
}