import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventsTable1755794626391 implements MigrationInterface {
    name = 'UpdateEventsTable1755794626391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign key constraints
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_25a11c1451261c86b4e9c05f6b7"`);
        
        // Drop existing columns
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "customerId"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "updatedAt"`);
        
        // Change id column from uuid to varchar
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "PK_40731c7151fe4be3116e45ddf73"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "id" TYPE character varying(255)`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")`);
        
        // Rename data column to props
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "data" TO "props"`);
        
        // Add new columns
        await queryRunner.query(`ALTER TABLE "events" ADD "ts" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" ADD "userId" character varying(255) NOT NULL`);
        
        // Add indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_events_ts" ON "events" ("ts")`);
        await queryRunner.query(`CREATE INDEX "IDX_events_userId" ON "events" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_events_name" ON "events" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_events_tenantId" ON "events" ("tenantId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new indexes
        await queryRunner.query(`DROP INDEX "IDX_events_tenantId"`);
        await queryRunner.query(`DROP INDEX "IDX_events_name"`);
        await queryRunner.query(`DROP INDEX "IDX_events_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_events_ts"`);
        
        // Drop new columns
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "ts"`);
        
        // Rename props column back to data
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "props" TO "data"`);
        
        // Change id column back to uuid
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "PK_40731c7151fe4be3116e45ddf73"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "id" TYPE uuid USING id::uuid`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")`);
        
        // Add back old columns
        await queryRunner.query(`ALTER TABLE "events" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "events" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "events" ADD "customerId" uuid`);
        
        // Recreate foreign key constraint
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_25a11c1451261c86b4e9c05f6b7" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
