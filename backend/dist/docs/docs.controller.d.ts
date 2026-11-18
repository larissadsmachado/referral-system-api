export declare class DocsController {
    getOpenApiJson(): {
        openapi: string;
        info: {
            title: string;
            version: string;
            description: string;
        };
        servers: {
            url: string;
            description: string;
        }[];
        tags: {
            name: string;
            description: string;
        }[];
        paths: {
            '/customers': {
                post: {
                    tags: string[];
                    summary: string;
                    description: string;
                    requestBody: {
                        required: boolean;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                                examples: {
                                    semIndicacao: {
                                        summary: string;
                                        value: {
                                            name: string;
                                            email: string;
                                        };
                                    };
                                    comIndicacao: {
                                        summary: string;
                                        value: {
                                            name: string;
                                            email: string;
                                            parent_customer_id: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    responses: {
                        '201': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                        '400': {
                            description: string;
                        };
                        '409': {
                            description: string;
                        };
                    };
                };
                get: {
                    tags: string[];
                    summary: string;
                    responses: {
                        '200': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        type: string;
                                        items: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            '/reports': {
                get: {
                    tags: string[];
                    summary: string;
                    description: string;
                    responses: {
                        '200': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        type: string;
                                        items: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        components: {
            schemas: {
                CreateCustomerDto: {
                    type: string;
                    required: string[];
                    properties: {
                        name: {
                            type: string;
                            example: string;
                        };
                        email: {
                            type: string;
                            format: string;
                            example: string;
                        };
                        parent_customer_id: {
                            type: string;
                            nullable: boolean;
                            description: string;
                            example: string;
                        };
                    };
                };
                CustomerResponse: {
                    type: string;
                    properties: {
                        customer_id: {
                            type: string;
                            example: string;
                        };
                        name: {
                            type: string;
                            example: string;
                        };
                        email: {
                            type: string;
                            example: string;
                        };
                        type: {
                            type: string;
                            enum: string[];
                            example: string;
                        };
                        parent_customer_id: {
                            type: string;
                            nullable: boolean;
                            example: null;
                        };
                        created_at: {
                            type: string;
                            format: string;
                        };
                    };
                };
                ReportResponse: {
                    type: string;
                    properties: {
                        customer_id: {
                            type: string;
                            example: string;
                        };
                        total_indications: {
                            type: string;
                            example: number;
                        };
                    };
                };
            };
        };
    };
    getSwaggerUi(): string;
}
