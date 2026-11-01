const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 64;
const FLAP_HEIGHT = 104;

const PRINT_FACE = '"League Gothic", "Arial Narrow", sans-serif';
const FORM_FACE = '"Libre Franklin", "Helvetica Neue", sans-serif';
const TYPED_FACE = '"Courier Prime", "Courier New", monospace';

const MANILA = "#e2b33c";
const FLAP = "#d4a32c";
const NAVY = "#14213d";
const COBALT = "#1e38b0";
const RED_STRING = "#c8102e";
const FOIL_LIGHT = "#f6e29c";
const FOIL_MID = "#c99a2e";
const FOIL_DEEP = "#a67c1c";
const FOIL_INK = "#5e4409";
const SEAL_POINTS = 28;

export interface ShareCard {
  company: string;
  title: string;
  stamp: string;
  fields: { label: string; value: string }[];
  disclaimer: string;
}

function drawGround(context: CanvasRenderingContext2D) {
  context.fillStyle = MANILA;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = FLAP;
  context.fillRect(0, 0, WIDTH, FLAP_HEIGHT);
  context.strokeStyle = RED_STRING;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(32, 0);
  context.lineTo(32, HEIGHT);
  context.stroke();
}

function drawHeading(context: CanvasRenderingContext2D, card: ShareCard) {
  context.fillStyle = NAVY;
  context.textBaseline = "alphabetic";
  context.font = `400 44px ${PRINT_FACE}`;
  context.fillText(card.company.toUpperCase(), MARGIN, 68);
  context.font = `400 196px ${PRINT_FACE}`;
  context.fillText(card.title.toUpperCase(), MARGIN, 288);
}

function drawFields(context: CanvasRenderingContext2D, card: ShareCard) {
  card.fields.forEach(({ label, value }, index) => {
    const baseline = 366 + index * 62;
    context.strokeStyle = NAVY;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(MARGIN, baseline + 18);
    context.lineTo(WIDTH - MARGIN - 260, baseline + 18);
    context.stroke();
    context.fillStyle = NAVY;
    context.font = `600 20px ${FORM_FACE}`;
    context.fillText(label.toUpperCase(), MARGIN, baseline);
    context.font = `700 32px ${TYPED_FACE}`;
    context.fillText(value, MARGIN + 190, baseline);
  });
}

function drawStamp(context: CanvasRenderingContext2D, text: string) {
  context.save();
  context.translate(WIDTH - 196, 352);
  context.rotate(-0.12);
  context.strokeStyle = COBALT;
  context.fillStyle = COBALT;
  context.lineWidth = 6;
  context.font = `400 76px ${PRINT_FACE}`;
  const width = context.measureText(text.toUpperCase()).width;
  context.strokeRect(-width / 2 - 20, -62, width + 40, 88);
  context.textAlign = "center";
  context.fillText(text.toUpperCase(), 0, 8);
  context.restore();
}

function drawSeal(context: CanvasRenderingContext2D) {
  const centerX = WIDTH - 196;
  const centerY = 500;
  const gradient = context.createLinearGradient(centerX - 70, centerY - 70, centerX + 70, centerY + 70);
  gradient.addColorStop(0, FOIL_LIGHT);
  gradient.addColorStop(0.5, FOIL_MID);
  gradient.addColorStop(1, FOIL_DEEP);
  context.fillStyle = gradient;
  context.beginPath();
  for (let index = 0; index < SEAL_POINTS * 2; index += 1) {
    const radius = index % 2 === 0 ? 74 : 65;
    const angle = (Math.PI * index) / SEAL_POINTS;
    context.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
  }
  context.closePath();
  context.fill();
  context.strokeStyle = FOIL_INK;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(centerX, centerY, 50, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(centerX - 24, centerY + 1);
  context.lineTo(centerX - 7, centerY + 18);
  context.lineTo(centerX + 26, centerY - 19);
  context.stroke();
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
  drawGround(context);
  drawHeading(context, card);
  drawFields(context, card);
  drawStamp(context, card.stamp);
  drawSeal(context);
  context.fillStyle = NAVY;
  context.font = `400 20px ${FORM_FACE}`;
  context.fillText(card.disclaimer, MARGIN, HEIGHT - 26);
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
