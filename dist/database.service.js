"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.DRIZZLE_DB = exports.DRIZZLE_POOL = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
exports.DRIZZLE_POOL = 'DRIZZLE_POOL';
exports.DRIZZLE_DB = 'DRIZZLE_DB';
let DatabaseService = class DatabaseService {
    constructor(dbInstance, pool, configService) {
        this.dbInstance = dbInstance;
        this.pool = pool;
        this.configService = configService;
    }
    get db() {
        return this.dbInstance;
    }
    async onModuleDestroy() {
        await this.pool.end();
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.DRIZZLE_DB)),
    __param(1, (0, common_1.Inject)(exports.DRIZZLE_POOL)),
    __metadata("design:paramtypes", [Object, pg_1.Pool,
        config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map