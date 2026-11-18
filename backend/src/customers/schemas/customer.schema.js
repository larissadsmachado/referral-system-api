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
let Customer = (() => {
    let _classDecorators = [Schema({ collection: 'customers', versionKey: false })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _parent_customer_id_decorators;
    let _parent_customer_id_initializers = [];
    let _parent_customer_id_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    var Customer = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [Prop({ required: true, trim: true, maxlength: 120 })];
            _email_decorators = [Prop({ required: true, trim: true, lowercase: true, maxlength: 254 })];
            _type_decorators = [Prop({ required: true, enum: ['NORMAL'], default: 'NORMAL' })];
            _parent_customer_id_decorators = [Prop({ type: Types.ObjectId, ref: Customer.name, default: null })];
            _created_at_decorators = [Prop({ required: true, default: Date.now })];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _parent_customer_id_decorators, { kind: "field", name: "parent_customer_id", static: false, private: false, access: { has: obj => "parent_customer_id" in obj, get: obj => obj.parent_customer_id, set: (obj, value) => { obj.parent_customer_id = value; } }, metadata: _metadata }, _parent_customer_id_initializers, _parent_customer_id_extraInitializers);
            __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Customer = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        name = __runInitializers(this, _name_initializers, void 0);
        email = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        type = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _type_initializers, void 0));
        parent_customer_id = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _parent_customer_id_initializers, void 0));
        created_at = (__runInitializers(this, _parent_customer_id_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
        constructor() {
            __runInitializers(this, _created_at_extraInitializers);
        }
    };
    return Customer = _classThis;
})();
export { Customer };
export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ email: 1 }, { unique: true, name: 'customers_email_unique' });
