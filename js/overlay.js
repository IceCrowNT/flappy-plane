// ============================
//  FLAPPY PLANE - Overlay UI
// ============================

import { CONFIG } from './config.js';

export class Overlay {
  drawIdle(ctx, frame, players) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const bestLine = players.map(player => `${player.label}:${player.bestScore}`).join('   ');

    ctx.fillStyle = 'rgba(61, 40, 26, 0.18)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255, 245, 231, 0.78)';
    ctx.strokeStyle = 'rgba(143, 105, 76, 0.8)';
    ctx.lineWidth = 3;
    this._roundRect(ctx, 34, 108, W - 68, 220, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#7c5238';
    ctx.font = '18px "Press Start 2P"';
    ctx.shadowColor = '#fff1d6';
    ctx.shadowBlur = 10;
    ctx.fillText('FLAPPY PLANE', W / 2, H / 2 - 92);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#a46f4b';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('SKY DUO EDITION', W / 2, H / 2 - 58);

    if (Math.floor(frame / 20) % 2) {
      ctx.fillStyle = '#5d875e';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('[ SPACE / CLICK TO START ]', W / 2, H / 2 + 6);
    }

    ctx.fillStyle = '#5f6f80';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('P1: W    P2: ARROW UP', W / 2, H / 2 + 40);

    if (players.some(player => player.bestScore > 0)) {
      ctx.fillText(`BEST: ${bestLine}`, W / 2, H / 2 + 76);
    }

    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
  }

  drawDead(ctx, players) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const standings = [...players].sort((a, b) => b.score - a.score);
    const leadScore = standings[0].score;
    const winners = standings.filter(player => player.score === leadScore);
    const winnerText = winners.length > 1 ? 'DRAW' : `${winners[0].label} WINS`;

    ctx.fillStyle = 'rgba(47, 35, 27, 0.24)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(253, 243, 228, 0.82)';
    ctx.strokeStyle = 'rgba(143, 105, 76, 0.86)';
    ctx.lineWidth = 3;
    this._roundRect(ctx, 38, 126, W - 76, 188, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a25543';
    ctx.font = '15px "Press Start 2P"';
    ctx.shadowColor = '#fff4e7';
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER!', W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#7c5238';
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText(`P1: ${players[0].score}   P2: ${players[1].score}`, W / 2, H / 2 - 22);

    ctx.fillStyle = '#5f6f80';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(winnerText, W / 2, H / 2 + 4);

    ctx.fillStyle = '#5d875e';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText('SPACE / CLICK TO RESTART', W / 2, H / 2 + 30);

    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
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
