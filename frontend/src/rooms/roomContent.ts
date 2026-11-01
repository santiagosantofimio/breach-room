export interface RoomForm {
  reference: string;
  columns: string[];
  rows: string[][];
}

export interface RoomContent {
  letterhead: string;
  form: RoomForm;
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
