import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCustomersTable1755794626392 implements MigrationInterface {
    name = 'UpdateCustomersTable1755794626392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add userId column
        await queryRunner.query(`ALTER TABLE "customers" ADD "userId" uuid`);
        
        // Make existing fields nullable
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "phone" DROP NOT NULL`);
        
        // Add created and updated timestamps
        await queryRunner.query(`ALTER TABLE "customers" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        
        // Create unique index on userId + tenantId combination
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_customers_userId_tenantId" ON "customers" ("userId", "tenantId")`);
        
        // Create index on userId for performance
        await queryRunner.query(`CREATE INDEX "IDX_customers_userId" ON "customers" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_customers_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_customers_userId_tenantId"`);
        
        // Drop timestamp columns
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "createdAt"`);
        
        // Drop tenantId column
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "tenantId"`);
        
        // Make fields required again
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "phone" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customers" ALTER COLUMN "name" SET NOT NULL`);
        
        // Drop userId column
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "userId"`);
    }
}
