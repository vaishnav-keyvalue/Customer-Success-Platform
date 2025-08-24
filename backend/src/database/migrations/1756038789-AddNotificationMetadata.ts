import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationMetadata1756038789 implements MigrationInterface {
    name = 'AddNotificationMetadata1756038789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD COLUMN "metadata" JSONB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "metadata"`);
    }
}
