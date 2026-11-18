"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicationsModule = void 0;
const common_1 = require("@nestjs/common");
const reports_module_1 = require("../reports/reports.module");
const indication_events_service_1 = require("./indication-events.service");
let IndicationsModule = class IndicationsModule {
};
exports.IndicationsModule = IndicationsModule;
exports.IndicationsModule = IndicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [reports_module_1.ReportsModule],
        providers: [indication_events_service_1.IndicationEventsService],
        exports: [indication_events_service_1.IndicationEventsService],
    })
], IndicationsModule);
//# sourceMappingURL=indications.module.js.map