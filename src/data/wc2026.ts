// Official FIFA World Cup 2026 — Draw held December 5, 2025, Kennedy Center, Washington D.C.

export interface Team {
  code: string
  name: string
  flag: string
  group: string
}

export interface Match {
  id: string
  group: string
  homeTeam: string
  awayTeam: string
  stage: 'group'
}

export interface Group {
  id: string
  teams: string[] // 4 team codes, in draw order
}

export const TEAMS: Team[] = [
  // Group A
  { code: 'MEX', name: 'México',        flag: '🇲🇽', group: 'A' },
  { code: 'RSA', name: 'África do Sul', flag: '🇿🇦', group: 'A' },
  { code: 'KOR', name: 'Coreia do Sul', flag: '🇰🇷', group: 'A' },
  { code: 'CZE', name: 'Tchéquia',      flag: '🇨🇿', group: 'A' },
  // Group B
  { code: 'CAN', name: 'Canadá',        flag: '🇨🇦', group: 'B' },
  { code: 'BIH', name: 'Bósnia e Herz.',flag: '🇧🇦', group: 'B' },
  { code: 'QAT', name: 'Catar',         flag: '🇶🇦', group: 'B' },
  { code: 'SUI', name: 'Suíça',         flag: '🇨🇭', group: 'B' },
  // Group C
  { code: 'BRA', name: 'Brasil',        flag: '🇧🇷', group: 'C' },
  { code: 'MAR', name: 'Marrocos',      flag: '🇲🇦', group: 'C' },
  { code: 'HAI', name: 'Haiti',         flag: '🇭🇹', group: 'C' },
  { code: 'SCO', name: 'Escócia',       flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  // Group D
  { code: 'USA', name: 'Estados Unidos',flag: '🇺🇸', group: 'D' },
  { code: 'PAR', name: 'Paraguai',      flag: '🇵🇾', group: 'D' },
  { code: 'AUS', name: 'Austrália',     flag: '🇦🇺', group: 'D' },
  { code: 'TUR', name: 'Turquia',       flag: '🇹🇷', group: 'D' },
  // Group E
  { code: 'GER', name: 'Alemanha',      flag: '🇩🇪', group: 'E' },
  { code: 'CUW', name: 'Curaçao',       flag: '🇨🇼', group: 'E' },
  { code: 'CIV', name: 'Costa do Marfim',flag:'🇨🇮', group: 'E' },
  { code: 'ECU', name: 'Equador',       flag: '🇪🇨', group: 'E' },
  // Group F
  { code: 'NED', name: 'Holanda',       flag: '🇳🇱', group: 'F' },
  { code: 'JPN', name: 'Japão',         flag: '🇯🇵', group: 'F' },
  { code: 'SWE', name: 'Suécia',        flag: '🇸🇪', group: 'F' },
  { code: 'TUN', name: 'Tunísia',       flag: '🇹🇳', group: 'F' },
  // Group G
  { code: 'BEL', name: 'Bélgica',       flag: '🇧🇪', group: 'G' },
  { code: 'EGY', name: 'Egito',         flag: '🇪🇬', group: 'G' },
  { code: 'IRN', name: 'Irã',           flag: '🇮🇷', group: 'G' },
  { code: 'NZL', name: 'Nova Zelândia', flag: '🇳🇿', group: 'G' },
  // Group H
  { code: 'ESP', name: 'Espanha',       flag: '🇪🇸', group: 'H' },
  { code: 'CPV', name: 'Cabo Verde',    flag: '🇨🇻', group: 'H' },
  { code: 'KSA', name: 'Arábia Saudita',flag: '🇸🇦', group: 'H' },
  { code: 'URU', name: 'Uruguai',       flag: '🇺🇾', group: 'H' },
  // Group I
  { code: 'FRA', name: 'França',        flag: '🇫🇷', group: 'I' },
  { code: 'SEN', name: 'Senegal',       flag: '🇸🇳', group: 'I' },
  { code: 'NOR', name: 'Noruega',       flag: '🇳🇴', group: 'I' },
  { code: 'IRQ', name: 'Iraque',        flag: '🇮🇶', group: 'I' },
  // Group J
  { code: 'ARG', name: 'Argentina',     flag: '🇦🇷', group: 'J' },
  { code: 'ALG', name: 'Argélia',       flag: '🇩🇿', group: 'J' },
  { code: 'AUT', name: 'Áustria',       flag: '🇦🇹', group: 'J' },
  { code: 'JOR', name: 'Jordânia',      flag: '🇯🇴', group: 'J' },
  // Group K
  { code: 'POR', name: 'Portugal',      flag: '🇵🇹', group: 'K' },
  { code: 'COD', name: 'RD Congo',      flag: '🇨🇩', group: 'K' },
  { code: 'UZB', name: 'Uzbequistão',   flag: '🇺🇿', group: 'K' },
  { code: 'COL', name: 'Colômbia',      flag: '🇨🇴', group: 'K' },
  // Group L
  { code: 'ENG', name: 'Inglaterra',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
  { code: 'CRO', name: 'Croácia',       flag: '🇭🇷', group: 'L' },
  { code: 'GHA', name: 'Gana',          flag: '🇬🇭', group: 'L' },
  { code: 'PAN', name: 'Panamá',        flag: '🇵🇦', group: 'L' },
]

export const GROUPS: Group[] = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'NOR', 'IRQ'] },
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
]

// Generate 72 group-stage fixtures (6 per group, 3 matchdays)
// Matchday 1: T1 vs T2, T3 vs T4
// Matchday 2: T1 vs T3, T2 vs T4
// Matchday 3: T1 vs T4, T2 vs T3
export const FIXTURES: Match[] = GROUPS.flatMap(({ id, teams: [t1, t2, t3, t4] }) => [
  { id: `${id}1`, group: id, homeTeam: t1, awayTeam: t2, stage: 'group' },
  { id: `${id}2`, group: id, homeTeam: t3, awayTeam: t4, stage: 'group' },
  { id: `${id}3`, group: id, homeTeam: t1, awayTeam: t3, stage: 'group' },
  { id: `${id}4`, group: id, homeTeam: t2, awayTeam: t4, stage: 'group' },
  { id: `${id}5`, group: id, homeTeam: t1, awayTeam: t4, stage: 'group' },
  { id: `${id}6`, group: id, homeTeam: t2, awayTeam: t3, stage: 'group' },
])
