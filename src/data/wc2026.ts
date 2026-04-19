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
  date: string   // ISO 8601 UTC
  venue: string
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

// Official FIFA World Cup 2026 group-stage schedule — 72 matches
// ID scheme: X1=T1vsT2, X2=T3vsT4, X3=T1vsT3, X4=T2vsT4, X5=T1vsT4, X6=T2vsT3
export const FIXTURES: Match[] = [
  // GROUP A (MEX, RSA, KOR, CZE)
  { id: 'A1', group: 'A', homeTeam: 'MEX', awayTeam: 'RSA', stage: 'group', date: '2026-06-11T23:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'A2', group: 'A', homeTeam: 'KOR', awayTeam: 'CZE', stage: 'group', date: '2026-06-12T02:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'A3', group: 'A', homeTeam: 'MEX', awayTeam: 'KOR', stage: 'group', date: '2026-06-16T23:00:00Z', venue: 'Rose Bowl, Los Angeles' },
  { id: 'A4', group: 'A', homeTeam: 'RSA', awayTeam: 'CZE', stage: 'group', date: '2026-06-17T02:00:00Z', venue: "Levi's Stadium, San Jose" },
  { id: 'A5', group: 'A', homeTeam: 'MEX', awayTeam: 'CZE', stage: 'group', date: '2026-06-21T02:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'A6', group: 'A', homeTeam: 'RSA', awayTeam: 'KOR', stage: 'group', date: '2026-06-21T02:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  // GROUP B (CAN, BIH, QAT, SUI)
  { id: 'B1', group: 'B', homeTeam: 'CAN', awayTeam: 'BIH', stage: 'group', date: '2026-06-12T23:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 'B2', group: 'B', homeTeam: 'QAT', awayTeam: 'SUI', stage: 'group', date: '2026-06-13T02:00:00Z', venue: 'Empower Field, Denver' },
  { id: 'B3', group: 'B', homeTeam: 'CAN', awayTeam: 'QAT', stage: 'group', date: '2026-06-17T23:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 'B4', group: 'B', homeTeam: 'BIH', awayTeam: 'SUI', stage: 'group', date: '2026-06-18T02:00:00Z', venue: "Levi's Stadium, San Jose" },
  { id: 'B5', group: 'B', homeTeam: 'CAN', awayTeam: 'SUI', stage: 'group', date: '2026-06-22T02:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 'B6', group: 'B', homeTeam: 'BIH', awayTeam: 'QAT', stage: 'group', date: '2026-06-22T02:00:00Z', venue: 'MetLife Stadium, New York' },
  // GROUP C (BRA, MAR, HAI, SCO)
  { id: 'C1', group: 'C', homeTeam: 'BRA', awayTeam: 'MAR', stage: 'group', date: '2026-06-13T23:00:00Z', venue: 'MetLife Stadium, New York' },
  { id: 'C2', group: 'C', homeTeam: 'HAI', awayTeam: 'SCO', stage: 'group', date: '2026-06-14T02:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'C3', group: 'C', homeTeam: 'BRA', awayTeam: 'HAI', stage: 'group', date: '2026-06-18T23:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 'C4', group: 'C', homeTeam: 'MAR', awayTeam: 'SCO', stage: 'group', date: '2026-06-19T02:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'C5', group: 'C', homeTeam: 'BRA', awayTeam: 'SCO', stage: 'group', date: '2026-06-23T02:00:00Z', venue: 'MetLife Stadium, New York' },
  { id: 'C6', group: 'C', homeTeam: 'MAR', awayTeam: 'HAI', stage: 'group', date: '2026-06-23T02:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  // GROUP D (USA, PAR, AUS, TUR)
  { id: 'D1', group: 'D', homeTeam: 'USA', awayTeam: 'PAR', stage: 'group', date: '2026-06-14T23:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'D2', group: 'D', homeTeam: 'AUS', awayTeam: 'TUR', stage: 'group', date: '2026-06-15T02:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'D3', group: 'D', homeTeam: 'USA', awayTeam: 'AUS', stage: 'group', date: '2026-06-19T23:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 'D4', group: 'D', homeTeam: 'PAR', awayTeam: 'TUR', stage: 'group', date: '2026-06-20T02:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'D5', group: 'D', homeTeam: 'USA', awayTeam: 'TUR', stage: 'group', date: '2026-06-24T02:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'D6', group: 'D', homeTeam: 'PAR', awayTeam: 'AUS', stage: 'group', date: '2026-06-24T02:00:00Z', venue: 'Empower Field, Denver' },
  // GROUP E (GER, CUW, CIV, ECU)
  { id: 'E1', group: 'E', homeTeam: 'GER', awayTeam: 'CUW', stage: 'group', date: '2026-06-14T18:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'E2', group: 'E', homeTeam: 'CIV', awayTeam: 'ECU', stage: 'group', date: '2026-06-14T21:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 'E3', group: 'E', homeTeam: 'GER', awayTeam: 'CIV', stage: 'group', date: '2026-06-19T18:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'E4', group: 'E', homeTeam: 'CUW', awayTeam: 'ECU', stage: 'group', date: '2026-06-19T21:00:00Z', venue: 'Rose Bowl, Los Angeles' },
  { id: 'E5', group: 'E', homeTeam: 'GER', awayTeam: 'ECU', stage: 'group', date: '2026-06-23T22:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 'E6', group: 'E', homeTeam: 'CUW', awayTeam: 'CIV', stage: 'group', date: '2026-06-23T22:00:00Z', venue: 'Gillette Stadium, Boston' },
  // GROUP F (NED, JPN, SWE, TUN)
  { id: 'F1', group: 'F', homeTeam: 'NED', awayTeam: 'JPN', stage: 'group', date: '2026-06-15T18:00:00Z', venue: "Levi's Stadium, San Jose" },
  { id: 'F2', group: 'F', homeTeam: 'SWE', awayTeam: 'TUN', stage: 'group', date: '2026-06-15T21:00:00Z', venue: 'Empower Field, Denver' },
  { id: 'F3', group: 'F', homeTeam: 'NED', awayTeam: 'SWE', stage: 'group', date: '2026-06-20T18:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'F4', group: 'F', homeTeam: 'JPN', awayTeam: 'TUN', stage: 'group', date: '2026-06-20T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'F5', group: 'F', homeTeam: 'NED', awayTeam: 'TUN', stage: 'group', date: '2026-06-24T22:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 'F6', group: 'F', homeTeam: 'JPN', awayTeam: 'SWE', stage: 'group', date: '2026-06-24T22:00:00Z', venue: 'Gillette Stadium, Boston' },
  // GROUP G (BEL, EGY, IRN, NZL)
  { id: 'G1', group: 'G', homeTeam: 'BEL', awayTeam: 'EGY', stage: 'group', date: '2026-06-15T23:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'G2', group: 'G', homeTeam: 'IRN', awayTeam: 'NZL', stage: 'group', date: '2026-06-16T02:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 'G3', group: 'G', homeTeam: 'BEL', awayTeam: 'IRN', stage: 'group', date: '2026-06-20T23:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 'G4', group: 'G', homeTeam: 'EGY', awayTeam: 'NZL', stage: 'group', date: '2026-06-21T02:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'G5', group: 'G', homeTeam: 'BEL', awayTeam: 'NZL', stage: 'group', date: '2026-06-25T02:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'G6', group: 'G', homeTeam: 'EGY', awayTeam: 'IRN', stage: 'group', date: '2026-06-25T02:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  // GROUP H (ESP, CPV, KSA, URU)
  { id: 'H1', group: 'H', homeTeam: 'ESP', awayTeam: 'CPV', stage: 'group', date: '2026-06-16T18:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 'H2', group: 'H', homeTeam: 'KSA', awayTeam: 'URU', stage: 'group', date: '2026-06-16T21:00:00Z', venue: 'MetLife Stadium, New York' },
  { id: 'H3', group: 'H', homeTeam: 'ESP', awayTeam: 'KSA', stage: 'group', date: '2026-06-21T18:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'H4', group: 'H', homeTeam: 'CPV', awayTeam: 'URU', stage: 'group', date: '2026-06-21T21:00:00Z', venue: 'Rose Bowl, Los Angeles' },
  { id: 'H5', group: 'H', homeTeam: 'ESP', awayTeam: 'URU', stage: 'group', date: '2026-06-25T22:00:00Z', venue: "Levi's Stadium, San Jose" },
  { id: 'H6', group: 'H', homeTeam: 'CPV', awayTeam: 'KSA', stage: 'group', date: '2026-06-25T22:00:00Z', venue: 'BMO Field, Toronto' },
  // GROUP I (FRA, SEN, NOR, IRQ)
  { id: 'I1', group: 'I', homeTeam: 'FRA', awayTeam: 'SEN', stage: 'group', date: '2026-06-17T18:00:00Z', venue: 'Empower Field, Denver' },
  { id: 'I2', group: 'I', homeTeam: 'NOR', awayTeam: 'IRQ', stage: 'group', date: '2026-06-17T21:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'I3', group: 'I', homeTeam: 'FRA', awayTeam: 'NOR', stage: 'group', date: '2026-06-22T18:00:00Z', venue: 'MetLife Stadium, New York' },
  { id: 'I4', group: 'I', homeTeam: 'SEN', awayTeam: 'IRQ', stage: 'group', date: '2026-06-22T21:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'I5', group: 'I', homeTeam: 'FRA', awayTeam: 'IRQ', stage: 'group', date: '2026-06-26T22:00:00Z', venue: 'Rose Bowl, Los Angeles' },
  { id: 'I6', group: 'I', homeTeam: 'SEN', awayTeam: 'NOR', stage: 'group', date: '2026-06-26T22:00:00Z', venue: 'Lumen Field, Seattle' },
  // GROUP J (ARG, ALG, AUT, JOR)
  { id: 'J1', group: 'J', homeTeam: 'ARG', awayTeam: 'ALG', stage: 'group', date: '2026-06-18T18:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'J2', group: 'J', homeTeam: 'AUT', awayTeam: 'JOR', stage: 'group', date: '2026-06-18T21:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 'J3', group: 'J', homeTeam: 'ARG', awayTeam: 'AUT', stage: 'group', date: '2026-06-23T18:00:00Z', venue: 'MetLife Stadium, New York' },
  { id: 'J4', group: 'J', homeTeam: 'ALG', awayTeam: 'JOR', stage: 'group', date: '2026-06-23T21:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'J5', group: 'J', homeTeam: 'ARG', awayTeam: 'JOR', stage: 'group', date: '2026-06-27T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'J6', group: 'J', homeTeam: 'ALG', awayTeam: 'AUT', stage: 'group', date: '2026-06-27T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  // GROUP K (POR, COD, UZB, COL)
  { id: 'K1', group: 'K', homeTeam: 'POR', awayTeam: 'COD', stage: 'group', date: '2026-06-19T18:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 'K2', group: 'K', homeTeam: 'UZB', awayTeam: 'COL', stage: 'group', date: '2026-06-19T21:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 'K3', group: 'K', homeTeam: 'POR', awayTeam: 'UZB', stage: 'group', date: '2026-06-24T18:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 'K4', group: 'K', homeTeam: 'COD', awayTeam: 'COL', stage: 'group', date: '2026-06-24T21:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 'K5', group: 'K', homeTeam: 'POR', awayTeam: 'COL', stage: 'group', date: '2026-06-28T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'K6', group: 'K', homeTeam: 'COD', awayTeam: 'UZB', stage: 'group', date: '2026-06-28T22:00:00Z', venue: 'Empower Field, Denver' },
  // GROUP L (ENG, CRO, GHA, PAN)
  { id: 'L1', group: 'L', homeTeam: 'ENG', awayTeam: 'CRO', stage: 'group', date: '2026-06-20T18:00:00Z', venue: "Levi's Stadium, San Jose" },
  { id: 'L2', group: 'L', homeTeam: 'GHA', awayTeam: 'PAN', stage: 'group', date: '2026-06-20T21:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 'L3', group: 'L', homeTeam: 'ENG', awayTeam: 'GHA', stage: 'group', date: '2026-06-25T18:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'L4', group: 'L', homeTeam: 'CRO', awayTeam: 'PAN', stage: 'group', date: '2026-06-25T21:00:00Z', venue: 'Rose Bowl, Los Angeles' },
  { id: 'L5', group: 'L', homeTeam: 'ENG', awayTeam: 'PAN', stage: 'group', date: '2026-06-29T22:00:00Z', venue: 'MetLife Stadium, New York' },
  { id: 'L6', group: 'L', homeTeam: 'CRO', awayTeam: 'GHA', stage: 'group', date: '2026-06-29T22:00:00Z', venue: 'BC Place, Vancouver' },
]
