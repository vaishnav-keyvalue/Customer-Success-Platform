export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean | { rejectUnauthorized: boolean };
}

export interface DatabaseConfigOptions {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'oracle' | 'mssql';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: string[];
  synchronize: boolean;
  logging: boolean;
  ssl: boolean | { rejectUnauthorized: boolean };
}
