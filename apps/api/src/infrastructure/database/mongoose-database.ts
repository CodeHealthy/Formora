import mongoose from "mongoose";

import type { ReadinessCheck } from "../../modules/health/application/readiness-check.js";

export interface MongoConnectionOptions {
  databaseName: string;
  uri: string;
}

export class MongooseDatabase {
  public async connect(options: MongoConnectionOptions): Promise<void> {
    await mongoose.connect(options.uri, {
      dbName: options.databaseName,
    });
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  public readonly readinessCheck: ReadinessCheck = () => {
    if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
      return Promise.reject(new Error("MongoDB is not connected."));
    }

    return Promise.resolve();
  };
}
