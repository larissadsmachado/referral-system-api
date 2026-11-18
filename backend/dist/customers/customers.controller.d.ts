import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<import("./customer.types").CustomerResponse>;
}
