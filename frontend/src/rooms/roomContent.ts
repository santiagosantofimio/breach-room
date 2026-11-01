export interface RoomContent {
  letterhead: string;
  story: string;
  objective: string;
  hints: [string, string, string];
  debrief: {
    happened: string;
    why: string;
    detection: string;
    owasp: string;
  };
}
