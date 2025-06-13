import { pgGenerate } from "drizzle-dbml-generator";
/* eslint-disable no-restricted-imports */
import * as schema from "../../src/lib/server/db/schema";

const out = "./docs/db-diagram.dbml";
const relational = false;

pgGenerate({ schema, out, relational });
