let game = null;
let cache_control = 0;
let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
canvas.width = canvas.height = 800;
let play_button = document.querySelector('.play_button');
let pause_button = document.querySelector('.pause_button');
let score_board = document.querySelector('.score_board');

function starting() {
    play_button.style.display = 'none';
    play_button.innerHTML = 'PLAY AGAIN';
    pause_button.style.display = 'block';
    score_board.style.display = 'block';
    score_board.innerHTML = `Score: 0`;
    game = new Game();
    game.start();
}

function random_position(number_blocks, start_block) {
    return 32 * Math.floor(Math.random() * number_blocks + start_block);
}

function stopping() {
    if (pause_button.getAttribute('class') === 'pause_button') {
        pause_button.setAttribute('class', 'resume_button');
        game.stop();
    } else {
        pause_button.setAttribute('class', 'pause_button');
        game.resume();
    }
}

function key_to_start(event) {
    if (!game && event.which === 13) {
        starting();
    }
}

function control(event) {
    let key = event.which;
    if (cache_control) {
        let current_direction = game.snake.direction_movement[game.snake.direction_movement.length - 1];
        if (key === 37 && current_direction !== 'right') {
            game.snake.change_direction('left');
        } else if (key === 38 && current_direction !== 'down') {
            game.snake.change_direction('up');
        } else if (key === 39 && current_direction !== 'left') {
            game.snake.change_direction('right')
        } else if (key === 40 && current_direction !== 'up') {
            game.snake.change_direction('down')
        }
    }
    if (key === 32) {
        stopping();
    }
}

play_button.addEventListener('click', starting);
pause_button.addEventListener('click', stopping);
window.addEventListener('keydown', key_to_start);

class Game {
    constructor() {
        this.time_begin = 1;
        this.snake = new Snake();
        this.score = 0;
        this.speed = 120;
    }

    start() {
        this.render();
        this.snake.array_body.push(new Body(random_position(23, 1), random_position(25, 0)));
        this.snake.array_body.push(new Body(this.snake.array_body[0].x - 32, this.snake.array_body[0].y));
        window.addEventListener('keydown', control);
        this.snake.food.emerge();
        this.snake.move();
    }

    render() {
        ctx.fillStyle = 'lawngreen';
        ctx.fillRect(0, 0, 800, 800);
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        for (let i = 0; i <= 800; i += 32) {
            ctx.moveTo(0, i);
            ctx.lineTo(800, i);
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 800);
            ctx.stroke();
        }
    }

    stop() {
        this.time_begin = 0;
    }

    resume() {
        this.time_begin = 1;
        this.snake.move();
    }

    end() {
        play_button.style.display = 'block';
        pause_button.style.display = 'none';
        window.removeEventListener('keydown', control);
        game = null;
    }
}

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Snake {
    constructor() {
        this.food = new Food();
        this.array_body = [];
        this.isCollision = 0;
        this.direction_movement = ['right'];
    }

    change_direction(direction) {
        if(this.direction_movement[this.direction_movement.length - 1] !== direction){
            this.direction_movement.push(direction);
        }
    }

    move() {
        setTimeout(() => {
            if (game.time_begin) {
                let head = {
                    x: this.array_body[0].x,
                    y: this.array_body[0].y
                };
                switch (this.direction_movement[0]) {
                    case 'left':
                        this.array_body[0].x -= 32;
                        break;
                    case 'right':
                        this.array_body[0].x += 32;
                        break;
                    case 'up':
                        this.array_body[0].y -= 32;
                        break;
                    case 'down':
                        this.array_body[0].y += 32;
                        break;
                }
                let head_nextX = this.array_body[0].x;
                let head_nexY = this.array_body[0].y;
                this.check_border(head_nextX, head_nexY);
                if (this.check_collision(head_nextX, head_nexY)) {
                    game.end();
                } else {
                    requestAnimationFrame(this.move);
                    if(this.direction_movement.length > 1){
                        this.direction_movement.shift();
                    }
                    game.render();
                    this.food.render();
                    this.render_body(head.x, head.y);
                    cache_control = 1;
                    this.move();
                }
            }
        }, game.speed);
    }

    render_body(nextX, nextY) {
        let saveX, saveY;
        this.array_body.forEach((body, index) => {
            saveX = body.x;
            saveY = body.y;
            if (index === 0) {
                if (saveX === this.food.x && saveY === this.food.y) {
                    this.ate(saveX, saveY);
                }
            } else {
                body.x = nextX;
                body.y = nextY;
                nextX = saveX;
                nextY = saveY;
            }
            body.render();
        });
    }

    check_collision(x, y) {
        this.array_body.forEach((body, index) => {
            if (body.x === x && body.y === y && index > 0) {
                this.isCollision = 1;
            }
        });
        return this.isCollision;
    }

    check_border(x, y) {
        if (x < 0) {
            this.array_body[0].x = 768;
        } else if (x >= 800) {
            this.array_body[0].x = 0;
        } else if (y < 0) {
            this.array_body[0].y = 768;
        } else if (y >= 800) {
            this.array_body[0].y = 0;
        }
    }

    ate(x, y) {
        this.array_body.push(new Body(x, y));
        this.food.emerge();
        score_board.innerHTML = `Score: ${++game.score}`;
    }
}

class Body extends Position {
    constructor(x, y) {
        super(x, y);
    }

    render() {
        ctx.fillStyle = 'deepskyblue';
        ctx.fillRect(this.x + 4, this.y + 4, 24, 24);
    }
}

class Food extends Position {
    constructor() {
        super();
    }

    emerge() {
        let isFree = 0;
        while (!isFree) {
            isFree = 1;
            this.x = random_position(25, 0);
            this.y = random_position(25, 0);
            game.snake.array_body.forEach((body) => {
                if (body.x === this.x && body.y === this.y) {
                    isFree = 0;
                }
            });
        }
        this.render();
    }

    render() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x + 16, this.y + 16, 12, 0, 2 * Math.PI);
        ctx.fill();
    }
}