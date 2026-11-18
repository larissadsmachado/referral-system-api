import { HydratedDocument, Types } from 'mongoose';
export type CustomerDocument = HydratedDocument<Customer>;
export declare class Customer {
    name: string;
    email: string;
    type: 'NORMAL';
    parent_customer_id: Types.ObjectId | null;
    created_at: Date;
}
export declare const CustomerSchema: import("mongoose").Schema<Customer, import("mongoose").Model<Customer, any, any, any, any, any, Customer & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Customer, import("mongoose").Document<unknown, {}, Customer, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Customer & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Customer, import("mongoose").Document<unknown, {}, Customer, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Customer & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, Customer, import("mongoose").Document<unknown, {}, Customer, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Customer & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    type?: import("mongoose").SchemaDefinitionProperty<"NORMAL", Customer, import("mongoose").Document<unknown, {}, Customer, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Customer & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    parent_customer_id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId | null, Customer, import("mongoose").Document<unknown, {}, Customer, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Customer & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    created_at?: import("mongoose").SchemaDefinitionProperty<Date, Customer, import("mongoose").Document<unknown, {}, Customer, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Customer & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Customer>;
