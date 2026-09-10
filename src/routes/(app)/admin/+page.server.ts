import { StatsService } from "$lib/server/services/stats";

const stats = new StatsService();

export const load = async () => ({ stats: await stats.forInstance() });
