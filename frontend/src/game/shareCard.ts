const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 72;
const STOPS = 9;
const ROUTE_Y = 318;
const ROUTE_START = 96;
const ROUTE_STEP = 104;
const HOLE_RADIUS = 15;
const EXIT_WIDTH = 132;
const EXIT_HEIGHT = 64;

const PRINT_FACE = '"League Gothic", "Arial Narrow", sans-serif';
const FORM_FACE = '"Libre Franklin", "Helvetica Neue", sans-serif';
const TYPED_FACE = '"Courier Prime", "Courier New", monospace';

const STOCK = "#f6b8c4";
const MANILA = "#e2b33c";
const NAVY = "#14213d";
const COBALT = "#1e38b0";
const RED_STRING = "#c8102e";

export interface ShareCard {
  company: string;
  title: string;
  stamp: string;
  exit: string;
  fields: { label: string; value: string }[];
  disclaimer: string;
}

function drawGround(context: CanvasRenderingContext2D) {
  context.fillStyle = STOCK;
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawHeading(context: CanvasRenderingContext2D, card: ShareCard) {
  context.fillStyle = NAVY;
  context.font = `400 196px ${PRINT_FACE}`;
  context.fillText(card.title.toUpperCase(), MARGIN, 232);
  context.font = `400 36px ${PRINT_FACE}`;
  context.textAlign = "right";
  context.fillText(card.company.toUpperCase(), WIDTH - MARGIN, 78);
  context.textAlign = "left";
}

function drawRoute(context: CanvasRenderingContext2D, exitLabel: string) {
  const lastStop = ROUTE_START + ROUTE_STEP * (STOPS - 1);
  const exitX = WIDTH - MARGIN - EXIT_WIDTH;

  for (let stop = 0; stop < STOPS; stop += 1) {
    const x = ROUTE_START + ROUTE_STEP * stop;
    context.fillStyle = MANILA;
    context.beginPath();
    context.arc(x, ROUTE_Y, HOLE_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = NAVY;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = NAVY;
    context.font = `700 22px ${TYPED_FACE}`;
    context.textAlign = "center";
    context.fillText(String(stop + 1), x, ROUTE_Y + 50);
  }

  context.strokeStyle = RED_STRING;
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(ROUTE_START, ROUTE_Y);
  context.lineTo(exitX, ROUTE_Y);
  context.stroke();
  context.lineWidth = 2;
  context.fillStyle = NAVY;
  context.fillRect(exitX, ROUTE_Y - EXIT_HEIGHT / 2, EXIT_WIDTH, EXIT_HEIGHT);
  context.fillStyle = MANILA;
  context.font = `400 46px ${PRINT_FACE}`;
  context.fillText(exitLabel.toUpperCase(), exitX + EXIT_WIDTH / 2, ROUTE_Y + 17);
  context.textAlign = "left";

  if (lastStop >= exitX) {
    throw new RangeError("Route overlaps the exit");
  }
}

function drawFields(context: CanvasRenderingContext2D, card: ShareCard) {
  const columnStarts = [MARGIN, MARGIN + 200, MARGIN + 340];
  card.fields.forEach(({ label, value }, index) => {
    const x = columnStarts[index] ?? MARGIN;
    context.fillStyle = NAVY;
    context.font = `600 20px ${FORM_FACE}`;
    context.fillText(label.toUpperCase(), x, 456);
    context.font = `700 36px ${TYPED_FACE}`;
    context.fillText(value, x, 502);
  });
}

function drawStamp(context: CanvasRenderingContext2D, text: string) {
  context.save();
  context.translate(WIDTH - 202, 196);
  context.rotate(-0.09);
  context.strokeStyle = COBALT;
  context.fillStyle = COBALT;
  context.lineWidth = 7;
  context.font = `400 92px ${PRINT_FACE}`;
  const width = context.measureText(text.toUpperCase()).width;
  context.strokeRect(-width / 2 - 22, -76, width + 44, 104);
  context.textAlign = "center";
  context.fillText(text.toUpperCase(), 0, 8);
  context.restore();
}

async function fontsReady() {
  await Promise.all([
    document.fonts.load(`400 44px ${PRINT_FACE}`),
    document.fonts.load(`600 20px ${FORM_FACE}`),
    document.fonts.load(`700 32px ${TYPED_FACE}`),
  ]);
}

export async function drawShareCard(canvas: HTMLCanvasElement, card: ShareCard): Promise<void> {
  await fontsReady();
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }
  context.textBaseline = "alphabetic";
  drawGround(context);
  drawHeading(context, card);
  drawRoute(context, card.exit);
  drawFields(context, card);
  drawStamp(context, card.stamp);
  context.fillStyle = NAVY;
  context.font = `400 20px ${FORM_FACE}`;
  context.fillText(card.disclaimer, MARGIN, HEIGHT - 34);
}

export function downloadCanvas(canvas: HTMLCanvasElement, fileName: string): void {
  canvas.toBlob((blob) => {
    if (blob === null) {
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
