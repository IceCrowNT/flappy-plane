// ============================
//  FLAPPY PLANE - Overlay UI
// ============================

import { CONFIG } from './config.js';

export class Overlay {
  drawIdle(ctx, frame, players) {
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const bestLine = players.map(player => `${player.label}:${player.bestScore}`).join('   ');

    ctx.fillStyle = 'rgba(10,4,30,0.55)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe066';
    ctx.font = '18px "Press Start 2P"';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 22;
    ctx.fillText('FLAPPY PLANE', W / 2, H / 2 - 65);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#7f5af0';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('DUO MODE LOCAL', W / 2, H / 2 - 32);

    if (Math.floor(frame / 20) % 2) {
      ctx.fillStyle = '#2cb67d';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('[ SPACE / CLICK TO START ]', W / 2, H / 2 + 8);
    }

    ctx.fillStyle = '#a7c4f5';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('P1: W    P2: ARROW UP', W / 2, H / 2 + 42);

    if (players.some(player => player.bestScore > 0)) {
      ctx.fillText(`BEST: ${bestLine}`, W / 2, H / 2 + 74);
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

    ctx.fillStyle = 'rgba(10,4,30,0.65)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '15px "Press Start 2P"';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 18;
    ctx.fillText('GAME OVER!', W / 2, H / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffe066';
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText(`P1: ${players[0].score}   P2: ${players[1].score}`, W / 2, H / 2 - 22);

    ctx.fillStyle = '#a7c4f5';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(winnerText, W / 2, H / 2 + 4);

    ctx.fillStyle = '#8ee3ff';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText('SPACE / CLICK TO RESTART', W / 2, H / 2 + 30);

    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
  }
}
