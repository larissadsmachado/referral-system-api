import { Types } from 'mongoose';
export declare class Report {
    customer_id: Types.ObjectId;
    total_indications: number;
    updated_at: Date;
}
export declare const ReportSchema: import("mongoose").Schema<Report, import("mongoose").Model<Report, any, any, any, any, any, Report & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Report, import("mongoose").Document<unknown, {}, Report, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Report & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & import("mongoose").HydratedDocumentOverrides<{
    id: string;
}>, {
    customer_id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Report, import("mongoose").Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Report & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    total_indications?: import("mongoose").SchemaDefinitionProperty<number, Report, import("mongoose").Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Report & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
    updated_at?: import("mongoose").SchemaDefinitionProperty<Date, Report, import("mongoose").Document<unknown, {}, Report, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Report & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & import("mongoose").HydratedDocumentOverrides<{
        id: string;
    }>> | undefined;
}, Report>;
