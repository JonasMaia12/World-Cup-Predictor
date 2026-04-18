import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const teamStats = sqliteTable('team_stats', {
  teamCode:    text('team_code').primaryKey(),
  championPct: real('champion_pct').notNull().default(0),
  top4Pct:     real('top4_pct').notNull().default(0),
  top8Pct:     real('top8_pct').notNull().default(0),
  totalVotes:  integer('total_votes').notNull().default(0),
  updatedAt:   text('updated_at').notNull(),
})

export type TeamStat = typeof teamStats.$inferSelect
