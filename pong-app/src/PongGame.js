import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import './App.css';

export const PADDLE_WIDTH = 120;
export const PADDLE_HEIGHT = 20;
export const REFRESH_MS = 10;
export const BALL_VELOCITY = 5;
export const BALL_RADIUS = 10;
export const GAME_GOD_MODE = true;
export const PADDLE_KEY_BUMP = 75;
export const WS_ENABLE = true;

class PongGame extends Component {
    
    constructor(props) {
        super(props);

        let width = parseInt(props.width);
        let height = parseInt(props.height);

        // randomize direction
        var x = 0;
        var y = 0;
        var incX = 0;
        var direction = 0;
        if (Math.random() > 0.5)
        {
            x = (Math.random() * (width - (2*BALL_RADIUS))) + BALL_RADIUS;
            let destX = (Math.random() * (width - (2*BALL_RADIUS))) + BALL_RADIUS;
            incX = (destX - x) / height;
            y = PADDLE_HEIGHT + BALL_RADIUS + 1;
            direction = 1;
        }
        else
        {
            x = (Math.random() * (width - (2*BALL_RADIUS))) + BALL_RADIUS;
            let destX = (Math.random() * (width - (2*BALL_RADIUS))) + BALL_RADIUS;
            incX = (destX - x) / height;
            y = height - PADDLE_HEIGHT - BALL_RADIUS - 1;
            direction = -1;
        }

        this.state = {
            width: width,
            height: height,
            playerTopX: 0,
            playerBottomX: 0,
            ballX: x,
            ballY: y,
            ballIncX: incX,
            ballIncDirection: direction,
            winner: 0
        }

        this.renderCanvas = this.renderCanvas.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.canvasRef = React.createRef();

        setInterval(this.gameLoop, REFRESH_MS);

        console.log("Let the game of Pong begin!");

        this.wsClient = null;
        if (WS_ENABLE)
        {
            this.wsClient = new W3CWebSocket('ws://127.0.0.1:8080/game/123');
            this.wsClient.onopen = () => {
                console.log('WebSocket Client Connected');
            };
            this.wsClient.onerror = function() {
                console.log('Connection Error');
            };
            this.wsClient.onmessage = this.handleWebSocketMessage;
        }
    }

    handleWebSocketMessage = (message) => {
        console.log(message);
    }

    sendWebSocketBallMove() {
        if (this.wsClient.readyState === this.wsClient.OPEN) {
            const e = {eventType: "Update", objectType: "Ball", x: this.state.ballX, y: this.state.ballY};
            const json = JSON.stringify(e);
            this.wsClient.send(json);
        }
    }

    sendWebSocketPaddleTopMove() {
        if (this.wsClient.readyState === this.wsClient.OPEN) {
            const e = {eventType: "Update", objectType: "PaddleTop", x: this.state.playerTopX, y: 0};
            const json = JSON.stringify(e);
            this.wsClient.send(json);
        }
    }

    sendWebSocketPaddleBottomMove() {
        if (this.wsClient.readyState === this.wsClient.OPEN) {
            const e = {eventType: "Update", objectType: "PaddleBottom", x: this.state.playerBottomX, y: this.state.height - PADDLE_HEIGHT};
            const json = JSON.stringify(e);
            this.wsClient.send(json);
        }
    }

    handleCursor = (e) => {
        this.setState(
            prevState => ({ playerBottomX: e.pageX })
          );

        // this render is redundant but does increase the refresh rate/frame rate
        this.renderCanvas();

        this.sendWebSocketPaddleBottomMove();
    }

    handleKeyDown = (e) => {
        var x = 0;
        if((e.key === 'a') || (e.key === 'A'))
        {
//            console.log('Left Direction!');
            x = this.state.playerTopX - PADDLE_KEY_BUMP;
            if (x < 0)
                x = 0;

            this.sendWebSocketPaddleTopMove();
        }
        else if((e.key === 'd') || (e.key === 'D'))
        {
//            console.log('Right Direction!');
            x = this.state.playerTopX + PADDLE_KEY_BUMP;
            if (x > (this.state.width - PADDLE_WIDTH))
                x = this.state.width - PADDLE_WIDTH;
        }

        this.setState(
            prevState => ({ playerTopX: x })
          );
    }

    render() {
      return    <div className="PongBorder" style={{ width: this.state.width + 'px', height: this.state.height + 'px' }} onMouseMove={ this.handleCursor } onKeyDown={ this.handleKeyDown } tabIndex={-1}>
                    <canvas className="PongCanvas" ref={this.canvasRef} width={this.state.width} height={this.state.height} />
                </div>;
    }

    gameLoop() {
        if (this.canvasRef.current != null) 
        {
            this.renderCanvas();
            if (this.state.winner === 0)
            {
                this.progressBall();
            }
        }
    }

    renderCanvas() {
        var context = this.canvasRef.current.getContext('2d');
        if (this.state.winner === 0)
        {
            context.fillStyle = '#282c34';
            context.fillRect(0, 0, this.state.width, this.state.height);

            this.drawFoulLine(context);
            this.drawBall(context, this.state.ballX, this.state.ballY);
            
            this.drawPaddle(context,this.state.playerTopX, 0);
            this.drawPaddle(context,this.state.playerBottomX, this.state.height - PADDLE_HEIGHT);
        }
        else if (this.state.winner === 1)
        {
            context.fillStyle = '#00ff00';
            context.fillRect(0, 0, this.state.width, this.state.height);
        }
        else if (this.state.winner === 2)
        {
            context.fillStyle = '#ff0000';
            context.fillRect(0, 0, this.state.width, this.state.height);
        }
        else
        {
            console.log("ERROR - unknown value for winner! " + this.state.winner);
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, this.state.width, this.state.height);
        }
    }

    drawBall(context, ballX, ballY) {
        context.beginPath();
        context.lineWidth = 1;
        context.arc(ballX, ballY, BALL_RADIUS, 0, 2 * Math.PI, false);
        context.fillStyle = 'green';
        context.fill();
    }

    drawFoulLine(context) {
        context.lineWidth = 4;
        var y = (this.state.height / 2) - (context.lineWidth / 2);

        context.strokeStyle = 'white';
        context.beginPath();
        context.setLineDash([22, 22]);
        context.moveTo(0, y);
        context.lineTo(this.state.width, y);
        context.stroke();
    }

    progressBall() {

        var x = this.state.ballX + (this.state.ballIncX * BALL_VELOCITY);
        var y = this.state.ballY + BALL_VELOCITY * this.state.ballIncDirection;
        var dir = this.state.ballIncDirection;
        var incX = this.state.ballIncX;
        var winner = this.state.winner;

        // bounce off top of screen instead of declaring a winner
        if (GAME_GOD_MODE === true) 
        {
            if ((this.state.ballIncDirection > 0) && (y >= this.state.height))
            {
                dir = -1;
            }
            else if ((this.state.ballIncDirection < 0) && (y <= 0))
            {
                dir = 1;
            }
        }
        else
        {
            // game over?
            if ((dir > 0) && (this.state.ballY >= this.state.height))
            {
                winner = 2;
                console.log("Game Over!  Player 1 won!  You lost :(");
            }
            else if ((dir < 0) && (this.state.ballY <= 0))
            {
                winner = 1;
                console.log("Game Over!  You won!");
            }
        }

        // bounce off sides before reaching min/max Y
        if (x >= (this.state.width - BALL_RADIUS - 1))
        {
            x = this.state.width - BALL_RADIUS;
            incX = incX * -1;
        }
        else if (x <= BALL_RADIUS)
        {
            x = BALL_RADIUS;
            incX = incX * -1;
        }

        // paddle collision?
        if ((dir > 0) && ((this.state.ballY + BALL_RADIUS) >= (this.state.height - PADDLE_HEIGHT)))
        {
            if ((this.state.ballX >= this.state.playerBottomX) && (this.state.ballX <= (this.state.playerBottomX + PADDLE_WIDTH)))
            {
                dir = -1;
                y = this.state.height - PADDLE_HEIGHT - BALL_RADIUS - 1;
            }
        }
        else if ((dir < 0) && ((this.state.ballY - BALL_RADIUS) <= PADDLE_HEIGHT))
        {
            if ((this.state.ballX >= this.state.playerTopX) && (this.state.ballX <= (this.state.playerTopX + PADDLE_WIDTH)))
            {
                dir = 1;
                y = PADDLE_HEIGHT + BALL_RADIUS + 1;
            }
        }

        this.setState(
            prevState => ({ ballX: x,
                            ballY: y,
                            ballIncDirection: dir,
                            ballIncX: incX,
                            winner: winner })
        );
        
        this.sendWebSocketBallMove();
    }

    drawPaddle(context, playerX, playerY) {
//            console.log("drawPaddle(" + playerX + ", " + playerY + ")");
        var x = playerX;
        var y = playerY;
        if (x < 0)
            x = 0;
        if (y < 0)
            y = 0;
        if (x > (this.state.width - PADDLE_WIDTH))
            x = this.state.width - PADDLE_WIDTH;
        if (y > (this.state.height - PADDLE_HEIGHT))
            y = this.state.height - PADDLE_HEIGHT;

        context.fillStyle = 'white';
        context.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
    }
}

export default PongGame;
