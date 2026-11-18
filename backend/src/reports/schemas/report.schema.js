var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
let Report = (() => {
    let _classDecorators = [Schema({ collection: 'reports', versionKey: false })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _customer_id_decorators;
    let _customer_id_initializers = [];
    let _customer_id_extraInitializers = [];
    let _total_indications_decorators;
    let _total_indications_initializers = [];
    let _total_indications_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    var Report = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _customer_id_decorators = [Prop({ type: Types.ObjectId, required: true })];
            _total_indications_decorators = [Prop({ required: true, default: 0, min: 0 })];
            _updated_at_decorators = [Prop({ required: true, default: Date.now })];
            __esDecorate(null, null, _customer_id_decorators, { kind: "field", name: "customer_id", static: false, private: false, access: { has: obj => "customer_id" in obj, get: obj => obj.customer_id, set: (obj, value) => { obj.customer_id = value; } }, metadata: _metadata }, _customer_id_initializers, _customer_id_extraInitializers);
            __esDecorate(null, null, _total_indications_decorators, { kind: "field", name: "total_indications", static: false, private: false, access: { has: obj => "total_indications" in obj, get: obj => obj.total_indications, set: (obj, value) => { obj.total_indications = value; } }, metadata: _metadata }, _total_indications_initializers, _total_indications_extraInitializers);
            __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Report = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        customer_id = __runInitializers(this, _customer_id_initializers, void 0);
        total_indications = (__runInitializers(this, _customer_id_extraInitializers), __runInitializers(this, _total_indications_initializers, void 0));
        updated_at = (__runInitializers(this, _total_indications_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
        constructor() {
            __runInitializers(this, _updated_at_extraInitializers);
        }
    };
    return Report = _classThis;
})();
export { Report };
export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ customer_id: 1 }, { unique: true, name: 'reports_customer_id_unique' });
