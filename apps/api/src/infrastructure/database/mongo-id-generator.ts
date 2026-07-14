import mongoose from "mongoose";

import type { IdGenerator } from "../../core/identifiers/id-generator.js";

export class MongoIdGenerator implements IdGenerator {
  public generate(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }
}
