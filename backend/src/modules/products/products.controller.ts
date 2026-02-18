import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    create(@Request() req, @Body() createProductDto: CreateProductDto) {
        const sellerId = req.user.userId;
        return this.productsService.create(sellerId, createProductDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all active products' })
    findAll() {
        return this.productsService.findAll();
    }

    @Get('seller/:sellerId')
    @ApiOperation({ summary: 'Get products by seller ID' })
    findBySeller(@Param('sellerId') sellerId: string) {
        return this.productsService.findBySeller(sellerId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a product' })
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete (deactivate) a product' })
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
