import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1755794626390 implements MigrationInterface {
    name = 'InitialMigration1755794626390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenants_status_enum" AS ENUM('active', 'inactive', 'suspended', 'pending')`);
        await queryRunner.query(`CREATE TYPE "public"."tenants_tier_enum" AS ENUM('basic', 'premium', 'enterprise', 'custom')`);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "domain" character varying(255) NOT NULL, "description" character varying(500), "status" "public"."tenants_status_enum" NOT NULL DEFAULT 'pending', "tier" "public"."tenants_tier_enum" NOT NULL DEFAULT 'basic', "configuration" jsonb, "metadata" jsonb, "contactEmail" character varying(255), "contactPhone" character varying(255), "address" character varying(255), "city" character varying(100), "state" character varying(100), "postalCode" character varying(20), "country" character varying(100), "timezone" character varying(10), "locale" character varying(10), "isActive" boolean NOT NULL DEFAULT true, "subscriptionExpiresAt" TIMESTAMP, "maxUsers" integer NOT NULL DEFAULT '0', "maxStorageGB" integer NOT NULL DEFAULT '0', "monthlyFee" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying(50), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_da4054294eaae43ec7f85b6a3a1" UNIQUE ("domain"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f3ac01dff74764444003a242a" ON "tenants" ("tier") `);
        await queryRunner.query(`CREATE INDEX "IDX_c59559e7872bc9726adef4669f" ON "tenants" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_da4054294eaae43ec7f85b6a3a" ON "tenants" ("domain") `);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(255) NOT NULL, "tenantId" uuid, CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "data" jsonb NOT NULL, "customerId" uuid, "tenantId" uuid, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_37c1a605468d156e6a8f78f1dc5" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_25a11c1451261c86b4e9c05f6b7" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_d1fa9d89714a7ad4c84351f489f" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_d1fa9d89714a7ad4c84351f489f"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_25a11c1451261c86b4e9c05f6b7"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_37c1a605468d156e6a8f78f1dc5"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da4054294eaae43ec7f85b6a3a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c59559e7872bc9726adef4669f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f3ac01dff74764444003a242a"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_tier_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tenants_status_enum"`);
    }

}
