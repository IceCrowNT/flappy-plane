// ============================
//  FLAPPY PLANE - Overlay UI
// ============================

import { CONFIG, COLORS } from './config.js';

export class Overlay {
  drawIdle(ctx, frame, players) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const bestLine = players.map(player => `${player.label}:${player.bestScore}`).join('   ');

    ctx.fillStyle = COLORS.overlayScrim;
    ctx.fillRect(0, 0, W, H);

    this._panel(ctx, 34, 102, W - 68, 236);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.hudFrameDeep;
    ctx.font = '700 26px "Newsreader", serif';
    ctx.fillText('Flappy Plane', W / 2, H / 2 - 92);

    ctx.fillStyle = COLORS.ink;
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('Sky Cottage Pixel duo flight', W / 2, H / 2 - 58);

    if (Math.floor(frame / 20) % 2) {
      ctx.fillStyle = COLORS.houseRoof;
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText('[ SPACE / CLICK TO START ]', W / 2, H / 2 + 4);
    }

    ctx.fillStyle = COLORS.hudFrame;
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.fillText('P1 uses W  •  P2 uses Arrow Up', W / 2, H / 2 + 42);

    if (players.some(player => player.bestScore > 0)) {
      ctx.fillStyle = COLORS.ink;
      ctx.font = '9px "Press Start 2P"';
      ctx.fillText(`BEST  ${bestLine}`, W / 2, H / 2 + 84);
    }

    ctx.textAlign = 'left';
  }

  drawDead(ctx, players) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const standings = [...players].sort((a, b) => b.score - a.score);
    const leadScore = standings[0].score;
    const winners = standings.filter(player => player.score === leadScore);
    const winnerText = winners.length > 1 ? 'Draw in the valley skies' : `${winners[0].label} wins the run`;

    ctx.fillStyle = COLORS.overlayScrim;
    ctx.fillRect(0, 0, W, H);

    this._panel(ctx, 36, 122, W - 72, 204);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.houseRoof;
    ctx.font = '700 24px "Newsreader", serif';
    ctx.fillText('Flight Over', W / 2, H / 2 - 54);

    ctx.fillStyle = COLORS.ink;
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText(`P1 ${players[0].score}   P2 ${players[1].score}`, W / 2, H / 2 - 10);

    ctx.fillStyle = COLORS.hudFrame;
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.fillText(winnerText, W / 2, H / 2 + 20);

    ctx.fillStyle = COLORS.crystalDeep;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('SPACE / CLICK TO RESTART', W / 2, H / 2 + 48);

    ctx.textAlign = 'left';
  }

  _panel(ctx, x, y, w, h) {
    ctx.fillStyle = COLORS.overlayCard;
    ctx.strokeStyle = COLORS.overlayCardEdge;
    ctx.lineWidth = 3;
    this._roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.hudSurfaceStrong;
    this._roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 14);
    ctx.fill();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
