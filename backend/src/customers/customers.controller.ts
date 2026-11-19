import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers') //clientes
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post() //cria um cliente
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get() //lista todos os clientes
  findAll() {
    return this.customersService.findAll();
  }
}
