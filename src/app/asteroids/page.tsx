"use client";

import React, { useRef, useEffect } from 'react';

const AsteroidsGame = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let parent = canvas.parentElement;
        if (!parent) return;

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        // Game variables
        const SHIP_SIZE = 20;
        const SHIP_THRUST = 4;
        const SHIP_TURN_SPEED = 250;
        const FRICTION = 0.7;
        const BULLET_SPEED = 500;
        const BULLET_MAX = 4;
        const ASTEROID_NUM = 1;
        const ASTEROID_SIZE = 50;
        const ASTEROID_SPEED = 50;
        const ASTEROID_VERT = 10;
        const ASTEROID_JAG = 0.4;
        const SHIP_INV_DUR = 3;
        const SHIP_EXPLODE_DUR = 0.3;
        const UFO_SPEED = 150;
        const UFO_SIZE = 20;
        const UFO_FIRE_RATE = 1.0;
        const UFO_ACCURACY = 0.5;

        // Game state
        let ship: any;
        let asteroids: any[] = [];
        let bullets: any[] = [];
        let ufos: any[] = [];
        let lives: number;
        let score: number;
        let level: number;
        let gameOver: boolean;
        let ufoTimer: number;

        const newGame = () => {
            lives = 3;
            score = 0;
            level = 0;
            ship = newShip();
            newLevel();
            gameOver = false;
            ufoTimer = 0;
        };

        const newShip = () => {
            return {
                x: canvas.width / 2,
                y: canvas.height / 2,
                r: SHIP_SIZE / 2,
                a: 90 / 180 * Math.PI,
                rot: 0,
                thrusting: false,
                thrust: { x: 0, y: 0 },
                explodeTime: 0,
                invincible: true,
                invincibleTime: SHIP_INV_DUR,
                canShoot: true,
            };
        };

        const newLevel = () => {
            level++;
            createAsteroidBelt();
        };

        const createAsteroidBelt = () => {
            asteroids = [];
            let x, y;
            for (let i = 0; i < ASTEROID_NUM + level; i++) {
                do {
                    x = Math.floor(Math.random() * canvas.width);
                    y = Math.floor(Math.random() * canvas.height);
                } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.r);
                asteroids.push(newAsteroid(x, y, ASTEROID_SIZE));
            }
        };

        const newAsteroid = (x: number, y: number, r: number) => {
            const lvlMult = 1 + 0.1 * level;
            const roid = {
                x: x,
                y: y,
                xv: Math.random() * ASTEROID_SPEED * lvlMult / 30 * (Math.random() < 0.5 ? 1 : -1),
                yv: Math.random() * ASTEROID_SPEED * lvlMult / 30 * (Math.random() < 0.5 ? 1 : -1),
                r: r,
                a: Math.random() * Math.PI * 2,
                vert: Math.floor(Math.random() * (ASTEROID_VERT + 1) + ASTEROID_VERT / 2),
                offs: [] as number[]
            };

            for (let i = 0; i < roid.vert; i++) {
                roid.offs.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG);
            }
            return roid;
        };

        const distBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }

        const shootBullet = () => {
            if (ship.canShoot && bullets.length < BULLET_MAX) {
                bullets.push({
                    x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
                    y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
                    xv: BULLET_SPEED / 30 * Math.cos(ship.a),
                    yv: -BULLET_SPEED / 30 * Math.sin(ship.a),
                    dist: 0,
                    explodeTime: 0
                });
            }
        };

        const explodeShip = () => {
            ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * 30);
            lives--;
            if (lives <= 0) {
                gameOver = true;
            }
        };

        const destroyAsteroid = (index: number) => {
            const roid = asteroids[index];

            // score
            let oldScore = score;
            if (roid.r == Math.ceil(ASTEROID_SIZE)) {
                score += 20;
            } else if (roid.r == Math.ceil(ASTEROID_SIZE / 2)) {
                score += 50;
            } else {
                score += 100;
            }

            if (Math.floor(score / 10000) > Math.floor(oldScore / 10000)) {
                lives++;
            }

            // break it up
            if (roid.r > ASTEROID_SIZE / 4) {
                asteroids.push(newAsteroid(roid.x, roid.y, Math.ceil(roid.r / 2)));
                asteroids.push(newAsteroid(roid.x, roid.y, Math.ceil(roid.r / 2)));
            }
            asteroids.splice(index, 1);

            if (asteroids.length === 0 && ufos.length === 0) {
                newLevel();
            }
        };

        const spawnUfo = () => {
            const isLarge = Math.random() < 0.5;
            ufos.push({
                x: Math.random() < 0.5 ? 0 : canvas.width,
                y: Math.random() * canvas.height,
                r: UFO_SIZE,
                isLarge: isLarge,
                xv: (Math.random() < 0.5 ? -1 : 1) * UFO_SPEED / 30,
                yv: 0,
                fireTime: 0,
                bullets: []
            });
        };

        const destroyUfo = (index: number) => {
            let oldScore = score;
            score += ufos[index].isLarge ? 200 : 1000;
            if (Math.floor(score / 10000) > Math.floor(oldScore / 10000)) {
                lives++;
            }
            ufos.splice(index, 1);
            if (asteroids.length === 0 && ufos.length === 0) {
                newLevel();
            }
        };

        const hyperspace = () => {
            if (ship.invincible) return;
            ship.x = Math.random() * canvas.width;
            ship.y = Math.random() * canvas.height;
            if (Math.random() < 0.25) {
                explodeShip();
            }
        }

        newGame();

        // Event listeners
        const keyDown = (ev: KeyboardEvent) => {
            if (gameOver) {
                if (ev.code === 'Enter') {
                    newGame();
                    requestAnimationFrame(gameLoop);
                }
                return;
            }
            switch (ev.code) {
                case 'Space':
                    shootBullet();
                    break;
                case 'ArrowLeft':
                    ship.rot = SHIP_TURN_SPEED / 180 * Math.PI / 30;
                    break;
                case 'ArrowRight':
                    ship.rot = -SHIP_TURN_SPEED / 180 * Math.PI / 30;
                    break;
                case 'ArrowUp':
                    ship.thrusting = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    hyperspace();
                    break;
            }
        };
        const keyUp = (ev: KeyboardEvent) => {
            if (gameOver) return;
            switch (ev.code) {
                case 'Space':
                    ship.canShoot = true;
                    break;
                case 'ArrowLeft':
                    ship.rot = 0;
                    break;
                case 'ArrowRight':
                    ship.rot = 0;
                    break;
                case 'ArrowUp':
                    ship.thrusting = false;
                    break;
            }
        };

        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);

        // Game loop
        let lastTime = 0;
        let frameId: number;
        const gameLoop = (time: number) => {
            if (gameOver) {
                ctx.textAlign = "center";
                ctx.font = "40px sans-serif";
                ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
                ctx.font = "20px sans-serif";
                ctx.fillText("Press Enter to play again", canvas.width / 2, canvas.height / 2 + 50);
                return; // Stop the loop
            }

            if (!canvas) return;
            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'white';
            ctx.lineWidth = SHIP_SIZE / 20;

            // ufo
            ufoTimer += deltaTime;
            if (ufos.length === 0 && ufoTimer > 10 && asteroids.length > 0) {
                spawnUfo();
                ufoTimer = 0;
            }

            // ship
            if (ship.explodeTime > 0) {
                ship.explodeTime--;
                // draw explosion
                ctx.fillStyle = "darkred";
                ctx.beginPath();
                ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.fillStyle = "orange";
                ctx.beginPath();
                ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.fillStyle = "yellow";
                ctx.beginPath();
                ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
                ctx.fill();

                if (ship.explodeTime === 0 && !gameOver) {
                    ship = newShip();
                }
            } else {
                if (ship.thrusting) {
                    ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / 30;
                    ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / 30;

                    // draw thruster
                    if (!ship.invincible) {
                        ctx.fillStyle = "red";
                        ctx.strokeStyle = "yellow";
                        ctx.lineWidth = SHIP_SIZE / 10;
                        ctx.beginPath();
                        ctx.moveTo(
                            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
                            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
                        );
                        ctx.lineTo(
                            ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
                            ship.y + ship.r * 6 / 3 * Math.sin(ship.a)
                        );
                        ctx.lineTo(
                            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
                            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
                        );
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }

                } else {
                    ship.thrust.x -= FRICTION * ship.thrust.x / 30;
                    ship.thrust.y -= FRICTION * ship.thrust.y / 30;
                }

                // draw ship
                if (ship.invincible) {
                    if (ship.invincibleTime > 0 && Math.floor(ship.invincibleTime * 5) % 2 === 0) {
                        ctx.beginPath();
                        ctx.moveTo(
                            ship.x + 5 / 3 * ship.r * Math.cos(ship.a),
                            ship.y - 5 / 3 * ship.r * Math.sin(ship.a)
                        );
                        ctx.lineTo(
                            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
                            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
                        );
                        ctx.lineTo(
                            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
                            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
                        );
                        ctx.closePath();
                        ctx.stroke();
                    }
                    ship.invincibleTime -= deltaTime;
                    if (ship.invincibleTime <= 0) {
                        ship.invincible = false;
                        ship.canShoot = true;
                    }
                } else {
                    ctx.beginPath();
                    ctx.moveTo(
                        ship.x + 5 / 3 * ship.r * Math.cos(ship.a),
                        ship.y - 5 / 3 * ship.r * Math.sin(ship.a)
                    );
                    ctx.lineTo(
                        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
                        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
                    );
                    ctx.lineTo(
                        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
                        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
                    );
                    ctx.closePath();
                    ctx.stroke();
                }

                // move ship
                ship.a += ship.rot;
                ship.x += ship.thrust.x;
                ship.y += ship.thrust.y;

                // handle edge of screen
                if (ship.x < 0 - ship.r) ship.x = canvas.width + ship.r;
                else if (ship.x > canvas.width + ship.r) ship.x = 0 - ship.r;
                if (ship.y < 0 - ship.r) ship.y = canvas.height + ship.r;
                else if (ship.y > canvas.height + ship.r) ship.y = 0 - ship.r;
            }

            // bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].x += bullets[i].xv;
                bullets[i].y += bullets[i].yv;

                // check for hits
                for (let j = asteroids.length - 1; j >= 0; j--) {
                    if (distBetweenPoints(bullets[i].x, bullets[i].y, asteroids[j].x, asteroids[j].y) < asteroids[j].r) {
                        destroyAsteroid(j);
                        bullets.splice(i, 1);
                        break;
                    }
                }

                for (let j = ufos.length - 1; j >= 0; j--) {
                    if (distBetweenPoints(bullets[i].x, bullets[i].y, ufos[j].x, ufos[j].y) < ufos[j].r) {
                        destroyUfo(j);
                        bullets.splice(i, 1);
                        break;
                    }
                }

                // remove offscreen bullets
                if (bullets[i] && (bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height)) {
                    bullets.splice(i, 1);
                }
            }

            // draw bullets
            for (const bullet of bullets) {
                ctx.fillStyle = "white";
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
                ctx.fill();
            }

            // asteroids
            for (let i = 0; i < asteroids.length; i++) {
                asteroids[i].x += asteroids[i].xv;
                asteroids[i].y += asteroids[i].yv;

                // handle edge of screen
                if (asteroids[i].x < 0 - asteroids[i].r) asteroids[i].x = canvas.width + asteroids[i].r;
                else if (asteroids[i].x > canvas.width + asteroids[i].r) asteroids[i].x = 0 - asteroids[i].r;
                if (asteroids[i].y < 0 - asteroids[i].r) asteroids[i].y = canvas.height + asteroids[i].r;
                else if (asteroids[i].y > canvas.height + asteroids[i].r) asteroids[i].y = 0 - asteroids[i].r;

                // draw asteroid
                ctx.beginPath();
                ctx.moveTo(
                    asteroids[i].x + asteroids[i].r * asteroids[i].offs[0] * Math.cos(asteroids[i].a),
                    asteroids[i].y + asteroids[i].r * asteroids[i].offs[0] * Math.sin(asteroids[i].a)
                );
                for (let j = 1; j < asteroids[i].vert; j++) {
                    ctx.lineTo(
                        asteroids[i].x + asteroids[i].r * asteroids[i].offs[j] * Math.cos(asteroids[i].a + j * Math.PI * 2 / asteroids[i].vert),
                        asteroids[i].y + asteroids[i].r * asteroids[i].offs[j] * Math.sin(asteroids[i].a + j * Math.PI * 2 / asteroids[i].vert)
                    );
                }
                ctx.closePath();
                ctx.stroke();
            }

            // ufos
            for (let i = ufos.length - 1; i >= 0; i--) {
                ufos[i].x += ufos[i].xv;
                ufos[i].y += ufos[i].yv;

                // fire
                ufos[i].fireTime += deltaTime;
                if (ufos[i].fireTime > UFO_FIRE_RATE) {
                    ufos[i].fireTime = 0;
                    let angle;
                    if (ufos[i].isLarge) {
                        angle = Math.random() * 2 * Math.PI;
                    } else {
                        angle = Math.atan2(ship.y - ufos[i].y, ship.x - ufos[i].x) + (Math.random() - 0.5) * (1 - UFO_ACCURACY) * 2 * Math.PI;
                    }
                    ufos[i].bullets.push({
                        x: ufos[i].x,
                        y: ufos[i].y,
                        xv: BULLET_SPEED / 30 * Math.cos(angle),
                        yv: BULLET_SPEED / 30 * Math.sin(angle)
                    });
                }

                // draw ufo
                ctx.beginPath();
                ctx.moveTo(ufos[i].x - ufos[i].r, ufos[i].y);
                ctx.lineTo(ufos[i].x + ufos[i].r, ufos[i].y);
                ctx.moveTo(ufos[i].x - ufos[i].r * 0.5, ufos[i].y - ufos[i].r * 0.5);
                ctx.lineTo(ufos[i].x + ufos[i].r * 0.5, ufos[i].y - ufos[i].r * 0.5);
                ctx.moveTo(ufos[i].x - ufos[i].r * 0.3, ufos[i].y - ufos[i].r * 0.5);
                ctx.lineTo(ufos[i].x + ufos[i].r * 0.3, ufos[i].y - ufos[i].r);
                ctx.lineTo(ufos[i].x - ufos[i].r * 0.3, ufos[i].y - ufos[i].r);
                ctx.closePath();
                ctx.stroke();

                // ufo bullets
                for (let j = ufos[i].bullets.length - 1; j >= 0; j--) {
                    ufos[i].bullets[j].x += ufos[i].bullets[j].xv;
                    ufos[i].bullets[j].y += ufos[i].bullets[j].yv;

                    // check for hits
                    if (distBetweenPoints(ufos[i].bullets[j].x, ufos[i].bullets[j].y, ship.x, ship.y) < ship.r) {
                        if (!ship.invincible) explodeShip();
                        ufos[i].bullets.splice(j, 1);
                        continue;
                    }

                    if (ufos[i].bullets[j].x < 0 || ufos[i].bullets[j].x > canvas.width || ufos[i].bullets[j].y < 0 || ufos[i].bullets[j].y > canvas.height) {
                        ufos[i].bullets.splice(j, 1);
                    }
                }

                // draw ufo bullets
                for (const bullet of ufos[i].bullets) {
                    ctx.fillStyle = "white";
                    ctx.beginPath();
                    ctx.arc(bullet.x, bullet.y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
                    ctx.fill();
                }

                if (ufos[i].x < 0 - ufos[i].r || ufos[i].x > canvas.width + ufos[i].r) {
                    ufos.splice(i, 1);
                }
            }

            // collision detection
            if (!ship.invincible && ship.explodeTime === 0) {
                for (let i = 0; i < asteroids.length; i++) {
                    if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.r + asteroids[i].r) {
                        explodeShip();
                        destroyAsteroid(i);
                        break;
                    }
                }
                for (let i = 0; i < ufos.length; i++) {
                    if (distBetweenPoints(ship.x, ship.y, ufos[i].x, ufos[i].y) < ship.r + ufos[i].r) {
                        explodeShip();
                        destroyUfo(i);
                        break;
                    }
                }
            }

            // text
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "white";
            ctx.font = "20px sans-serif";
            ctx.fillText(score.toString(), canvas.width - 20, 30);

            // lives
            for (let i = 0; i < lives; i++) {
                let lifeShip = { x: 30 + i * SHIP_SIZE * 1.5, y: 30, r: SHIP_SIZE / 2, a: 90 / 180 * Math.PI };
                ctx.beginPath();
                ctx.moveTo(
                    lifeShip.x + 4 / 3 * lifeShip.r * Math.cos(lifeShip.a),
                    lifeShip.y - 4 / 3 * lifeShip.r * Math.sin(lifeShip.a)
                );
                ctx.lineTo(
                    lifeShip.x - lifeShip.r * (2 / 3 * Math.cos(lifeShip.a) + Math.sin(lifeShip.a)),
                    lifeShip.y + lifeShip.r * (2 / 3 * Math.sin(lifeShip.a) - Math.cos(lifeShip.a))
                );
                ctx.lineTo(
                    lifeShip.x - lifeShip.r * (2 / 3 * Math.cos(lifeShip.a) - Math.sin(lifeShip.a)),
                    lifeShip.y + lifeShip.r * (2 / 3 * Math.sin(lifeShip.a) + Math.cos(lifeShip.a))
                );
                ctx.closePath();
                ctx.stroke();
            }

            frameId = requestAnimationFrame(gameLoop);
        };

        frameId = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
            cancelAnimationFrame(frameId);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} />;
};


const AsteroidsPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-4">Asteroids</h1>
            <div className="w-full max-w-6xl aspect-video bg-black border border-white">
                <AsteroidsGame />
            </div>
            <div className="mt-4 text-sm text-center text-gray-400">
                <p className="font-bold">Controls</p>
                <p><span className="font-semibold">ARROW KEYS</span> to rotate and thrust</p>
                <p><span className="font-semibold">SPACEBAR</span> to shoot</p>
                <p><span className="font-semibold">SHIFT</span> for hyperspace</p>
            </div>
        </div>
    );
};

export default AsteroidsPage; 