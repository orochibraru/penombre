import { StatsService } from "#lib/server/services/stats.js";

const stats = new StatsService();

export const load = async () => ({ stats: await stats.forInstance() });
