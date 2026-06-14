export interface CuratedAccount {
  username: string;
  displayName: string;
  description: string;
}

export const CURATED_ACCOUNTS: CuratedAccount[] = [
  { username: "chamath",        displayName: "Chamath Palihapitiya", description: "Venture capitalist, SPAC investor" },
  { username: "elonmusk",       displayName: "Elon Musk",            description: "CEO of Tesla & SpaceX" },
  { username: "jimcramer",      displayName: "Jim Cramer",           description: "CNBC Mad Money host" },
  { username: "cathiewood",     displayName: "Cathie Wood",          description: "ARK Invest CEO" },
  { username: "aleabitoreddit", displayName: "Alea Bit",             description: "Finance creator" },
];
