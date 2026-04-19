// Official FIFA World Cup 2026 — Draw held December 5, 2025, Kennedy Center, Washington D.C.

export interface Team {
  code: string
  name: string
  flag: string
  group: string
  rank: number
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
  { code: 'MEX', name: 'México',          flag: '🇲🇽', group: 'A', rank: 14 },
  { code: 'RSA', name: 'África do Sul',   flag: '🇿🇦', group: 'A', rank: 68 },
  { code: 'KOR', name: 'Coreia do Sul',   flag: '🇰🇷', group: 'A', rank: 22 },
  { code: 'CZE', name: 'Tchéquia',        flag: '🇨🇿', group: 'A', rank: 36 },
  // Group B
  { code: 'CAN', name: 'Canadá',          flag: '🇨🇦', group: 'B', rank: 46 },
  { code: 'BIH', name: 'Bósnia e Herz.',  flag: '🇧🇦', group: 'B', rank: 66 },
  { code: 'QAT', name: 'Catar',           flag: '🇶🇦', group: 'B', rank: 37 },
  { code: 'SUI', name: 'Suíça',           flag: '🇨🇭', group: 'B', rank: 16 },
  // Group C
  { code: 'BRA', name: 'Brasil',          flag: '🇧🇷', group: 'C', rank: 4  },
  { code: 'MAR', name: 'Marrocos',        flag: '🇲🇦', group: 'C', rank: 13 },
  { code: 'HAI', name: 'Haiti',           flag: '🇭🇹', group: 'C', rank: 156},
  { code: 'SCO', name: 'Escócia',         flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C', rank: 33 },
  // Group D
  { code: 'USA', name: 'Estados Unidos',  flag: '🇺🇸', group: 'D', rank: 11 },
  { code: 'PAR', name: 'Paraguai',        flag: '🇵🇾', group: 'D', rank: 63 },
  { code: 'AUS', name: 'Austrália',       flag: '🇦🇺', group: 'D', rank: 25 },
  { code: 'TUR', name: 'Turquia',         flag: '🇹🇷', group: 'D', rank: 30 },
  // Group E
  { code: 'GER', name: 'Alemanha',        flag: '🇩🇪', group: 'E', rank: 10 },
  { code: 'CUW', name: 'Curaçao',         flag: '🇨🇼', group: 'E', rank: 86 },
  { code: 'CIV', name: 'Costa do Marfim', flag: '🇨🇮', group: 'E', rank: 55 },
  { code: 'ECU', name: 'Equador',         flag: '🇪🇨', group: 'E', rank: 26 },
  // Group F
  { code: 'NED', name: 'Holanda',         flag: '🇳🇱', group: 'F', rank: 7  },
  { code: 'JPN', name: 'Japão',           flag: '🇯🇵', group: 'F', rank: 15 },
  { code: 'SWE', name: 'Suécia',          flag: '🇸🇪', group: 'F', rank: 28 },
  { code: 'TUN', name: 'Tunísia',         flag: '🇹🇳', group: 'F', rank: 29 },
  // Group G
  { code: 'BEL', name: 'Bélgica',         flag: '🇧🇪', group: 'G', rank: 8  },
  { code: 'EGY', name: 'Egito',           flag: '🇪🇬', group: 'G', rank: 38 },
  { code: 'IRN', name: 'Irã',             flag: '🇮🇷', group: 'G', rank: 21 },
  { code: 'NZL', name: 'Nova Zelândia',   flag: '🇳🇿', group: 'G', rank: 97 },
  // Group H
  { code: 'ESP', name: 'Espanha',         flag: '🇪🇸', group: 'H', rank: 5  },
  { code: 'CPV', name: 'Cabo Verde',      flag: '🇨🇻', group: 'H', rank: 80 },
  { code: 'KSA', name: 'Arábia Saudita',  flag: '🇸🇦', group: 'H', rank: 61 },
  { code: 'URU', name: 'Uruguai',         flag: '🇺🇾', group: 'H', rank: 12 },
  // Group I
  { code: 'FRA', name: 'França',          flag: '🇫🇷', group: 'I', rank: 2  },
  { code: 'SEN', name: 'Senegal',         flag: '🇸🇳', group: 'I', rank: 17 },
  { code: 'NOR', name: 'Noruega',         flag: '🇳🇴', group: 'I', rank: 34 },
  { code: 'IRQ', name: 'Iraque',          flag: '🇮🇶', group: 'I', rank: 73 },
  // Group J
  { code: 'ARG', name: 'Argentina',       flag: '🇦🇷', group: 'J', rank: 1  },
  { code: 'ALG', name: 'Argélia',         flag: '🇩🇿', group: 'J', rank: 42 },
  { code: 'AUT', name: 'Áustria',         flag: '🇦🇹', group: 'J', rank: 27 },
  { code: 'JOR', name: 'Jordânia',        flag: '🇯🇴', group: 'J', rank: 88 },
  // Group K
  { code: 'POR', name: 'Portugal',        flag: '🇵🇹', group: 'K', rank: 6  },
  { code: 'COD', name: 'RD Congo',        flag: '🇨🇩', group: 'K', rank: 70 },
  { code: 'UZB', name: 'Uzbequistão',     flag: '🇺🇿', group: 'K', rank: 118},
  { code: 'COL', name: 'Colômbia',        flag: '🇨🇴', group: 'K', rank: 9  },
  // Group L
  { code: 'ENG', name: 'Inglaterra',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L', rank: 3  },
  { code: 'CRO', name: 'Croácia',         flag: '🇭🇷', group: 'L', rank: 18 },
  { code: 'GHA', name: 'Gana',            flag: '🇬🇭', group: 'L', rank: 58 },
  { code: 'PAN', name: 'Panamá',          flag: '🇵🇦', group: 'L', rank: 78 },
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
