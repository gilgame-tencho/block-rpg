const yaml = require('yaml');
const fs = require('fs');
console.log("Server Load gameClass.");
const CONF = Object.assign(
    yaml.parse(fs.readFileSync(__dirname + '/../conf/server_conf.yml', 'utf-8')),
    yaml.parse(fs.readFileSync(__dirname + '/../conf/apl_conf.yml', 'utf-8')),
);

CONF.DEAD_LINE = CONF.MONITOR_HEIGHT + CONF.BLK * 1;
CONF.DEAD_END = CONF.MONITOR_HEIGHT + CONF.BLK * 3;
CONF.MAX_HEIGHT = CONF.MONITOR_HEIGHT / CONF.BLK - 1;
CONF.MAX_WIDTH = CONF.MONITOR_WIDTH / CONF.BLK;
CONF.FPMS = Math.round(CONF.RTms_Psec / CONF.FPS * 100) / 100;
CONF.MV_SPEED = CONF.FPMS / (CONF.RTms_Psec + CONF.Debug_Slow) * CONF.move_speed;
CONF.FALL_SPEED = CONF.FPMS / (CONF.RTms_Psec + CONF.Debug_Slow) * CONF.fall_speed;
CONF.JUMP_SPEED = CONF.FPMS / (CONF.RTms_Psec + CONF.Debug_Slow) * CONF.jump_speed;
CONF.BALL_SPEED = CONF.FPMS / (CONF.RTms_Psec + CONF.Debug_Slow) * CONF.ball_speed;

// File access is there. ====

// function local_load_stage(){
//     let stage = fs.readFileSync(__dirname + '/../conf/stages/s1.txt', 'utf-8');
//     let lines = stage.split("\r\n");
//     let st = [];
// }

// CONF.STAGE = [];


// **vvv** START_MARK

console.log("Load gameClass");

class loggerClass{
    constructor(obj={}){
      this.server_name = obj.server_name;
        this.level_no = {
            debug: 1,
            info: 2,
            error: 3,
        };
        this.log_level = this.level_no[obj.log_level];
        this.iam = obj.name;
    }
    // not use.
    log(msg, level='debug'){
        let logmsg = '';
        logmsg += `[${this.server_name}] `;
        logmsg += `[${level} ${this.iam}] `;
        logmsg += msg;
        if(this.level_no[level] >= this.log_level){
            console.log(logmsg);
        }
    }
    debug(msg){
      this.log(msg, 'debug');
    }
    info(msg){
        this.log(msg, 'info');
    }
    error(msg){
        this.log(msg, 'error');
    }
}

const logger = new loggerClass({
    server_name: CONF.SERVER_NAME,
    log_level: 'debug',
    name: this.constructor.name,
});

function random(range){
    return Math.round(Math.random() * range * 10, 0) % range;
}

// ## Defind Class. -----###

class ClientCommonDataManager{
    constructor(obj={}){
        this.id = Math.floor(Math.random()*1000000000);
    }
    toJSON(){
        return {
            id: this.id,
        };
    }
}
class CCDM extends ClientCommonDataManager{
    constructor(obj={}){
        super(obj);
        this.players = {};
        this.enemys = {};
        this.blocks = {};
        this.balls = {};
        this.items = {};
        this.stage = new Stage();
        this.goal = null;
        this.conf = CONF;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            players: this.players,
            enemys: this.enemys,
            blocks: this.blocks,
            balls: this.balls,
            items: this.items,
            stage: this.stage,
            conf: this.conf,
            goal: this.goal,
        });
    }
}

class OriginObject{
    constructor(obj={}){
        this.id = Math.floor(Math.random()*1000000000);
        this.logger = new loggerClass({
            server_name: CONF.SERVER_NAME,
            log_level: 'debug',
            name: this.constructor.name,
        });
    }
    toJSON(){
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }
}
class PhysicsObject extends OriginObject{
    constructor(obj={}){
        super(obj);
        this.x = obj.x;
        this.y = obj.y;
        this.width = obj.width;
        this.height = obj.height;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        });
    }
}
class GeneralObject extends OriginObject{
    constructor(obj={}){
        super(obj);
        this.name = obj.name;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            name: this.name,
        });
    }
}
class GameObject extends PhysicsObject{
    constructor(obj={}){
        super(obj);
        this.angle = obj.angle;
        this.direction = obj.direction;
        this.END_POINT = obj.END_POINT ? obj.END_POINT : CONF.MONITOR_WIDTH;
    }
    collistion(oldX, oldY){
        let collision = false;
        if(this.intersectField()){
                collision = true;
        }
        if(this.intersectBlock()){
            collision = true;
        }
        if(collision){
            this.x = oldX; this.y = oldY;
        }
        return collision;
    }
    move(distance){
        const oldX = this.x, oldY = this.y;

        let dis_x = distance * Math.cos(this.angle);
        let dis_y = distance * Math.sin(this.angle);
        this.x += dis_x;
        this.y += dis_y;

        return !this.collistion(oldX, oldY);
    }
    fall(distance){
        const oldX = this.x, oldY = this.y;

        this.y += distance;

        return !this.collistion(oldX, oldY);
    }
    rise(distance){
        const oldX = this.x, oldY = this.y;

        this.y -= distance;

        return !this.collistion(oldX, oldY);
    }
    intersect(obj){
        return (this.x < obj.x + obj.width) &&
            (this.x + this.width > obj.x) &&
            (this.y < obj.y + obj.height) &&
            (this.y + this.height > obj.y);
    }
    intersectBlock(){
        return Object.keys(ccdm.blocks).some((id)=>{
            if(this.intersect(ccdm.blocks[id])){
                return true;
            }
        });
    }
    intersectField(){
        return (
            this.x < 0 ||
            this.x + this.width >= this.END_POINT ||
            this.y < 0 ||
            this.y + this.height >= CONF.DEAD_END
        )
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            angle: this.angle,
            direction: this.direction,
            END_POINT: this.END_POINT,
        });
    }
}
class SystemObject extends PhysicsObject{
    constructor(obj={}){
        super(obj);
        this.system = true;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            system: this.system,
        });
    }
}
class SystemFrame extends SystemObject{
}
class FiledArea extends SystemFrame{
}
class DeadLine extends SystemFrame{
}

class Ball extends GameObject{
    constructor(obj={}){
        super(obj);
        this.type = 'normal';
        this.speed = CONF.BALL_SPEED;
        this.dead_flg = false;
        this.caller = obj.caller;
        if(obj.id){ this.id = obj.id }

        this.width = CONF.CHAR_W;
        this.height = CONF.CHAR_Y;
        this.angle = 0;
        this.touched = {
            upper: false,
            under: false,
            left: false,
            right: false,
        }
        this.direction_LR = true;
        this.direction_UD = true;

        this.direction = 'r';  // direction is right:r, left:l;

        this.auto_move = true;
        this.debug_info = {
            collistion: '',
        };
    }
    frame(){
        if(this.auto_move){
            if(this.direction_LR){
                this.angle = Math.PI * 0;
                this.direction = 'r';
            }else{
                this.angle = Math.PI * 1;
                this.direction = 'l';
            }
            this.move(this.speed);
        }
        if(this.direction_UD){
            this.fall(this.speed);
        }else{
            this.rise(this.speed);
        }

        // # After
        if(this.touched.upper){
            this.direction_UD = true;
        }
        if(this.touched.under){
            this.direction_UD = false;
        }
        if(this.touched.left){
            this.direction_LR = true;
        }
        if(this.touched.right){
            this.direction_LR = false;
        }
        this.touched = {
            upper: false,
            under: false,
            left: false,
            right: false,
        }
        this.isDead();
    }
    intersect(obj){
        let collision = super.intersect(obj);
        if(collision){
            this.collistionDetectionObj(obj);
        }
        return collision;
    }
    intersectBlock(){
        let blk = Object.assign({}, ccdm.blocks, ccdm.players);
        return Object.keys(blk).some((id)=>{
            if(this.intersect(blk[id])){
                if(blk[id].attr === "Block"){
                    ccdm.blocks[id].touched = true;
                    ccdm.players[this.caller].score_cal();
                }
                // if(blk[id].constructor.name === 'PlayerStick'){
                //     // this.direction_UD = !this.direction_UD;
                // }
                return true;
            }
        });
    }
    collistionDetectionObj(obj){
        let line = {
            flat: false,
            updown: false,
        };
        let area = {
            height: 0,
            width: 0,
        };
        if(this.x < obj.x){
            if(this.x + this.width < obj.x + obj.width){
                area.width = this.x + this.width - obj.x;
            }else{
                area.width = obj.width;
            }
        }else{
            if(this.x + this.width < obj.x + obj.width){
                area.width = obj.width;
            }else{
                area.width = obj.x + obj.width - this.x;
            }
        }
        if(this.y < obj.y){
            if(this.y + this.height < obj.y + obj.height){
                area.height = this.y + this.height - obj.y;
            }else{
                area.height = obj.height;
            }
        }else{
            if(this.y + this.height < obj.y + obj.height){
                area.height = obj.height;
            }else{
                area.height = obj.y + obj.height - this.y;
            }
        }
        if(area.width == area.height){
            line.flat = true;
            line.updown = true;
        }else if(area.width > area.height){
            line.updown = true;
        }else{
            // area.width < area.height
            line.flat = true;
        }
        if(line.flat){
            if(this.x < obj.x){
                this.touched.right = true;
            }else{
                this.touched.left = true;
            }
        }
        if(line.updown){
            if(this.y < obj.y){
                this.touched.under = true;
            }else{
                this.touched.upper = true;
            }
        }
    }
    intersectField(){
        if(this.x < 0){
            this.touched.left = true;
        }
        if(this.y < 0){
            this.touched.upper = true;
        }
        if(this.x + this.width >= this.END_POINT){
            this.touched.right = true;
        }
        if(this.y + this.height >= this.MAX_HEIGHT){
            // drop.
            this.touched.under = true;
        }

        return super.intersectField();
    }
    isDead(){
        if(this.y > CONF.DEAD_LINE){
            this.dead_flg = true;
            this.remove();
        }
    }
    remove(){
        console.log(`delete Ball: ${this.type}\t${this.id}`);
        delete ccdm.players[this.caller].balls[this.id];
        delete ccdm.balls[this.id];
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            type: this.type,
            dead_flg: this.dead_flg,
            caller: this.caller,
        });
    }
}

class Camera extends SystemFrame{
    constructor(obj={}){
        super(obj);
        this.x = 0;
        this.y = 0;
    }
    set(obj){
        this.x = obj.x;
        this.y = obj.y;
    }
}

class PlayerStick extends GameObject{
    constructor(obj={}){
        super(obj);
        this.socketId = obj.socketId;
        this.nickname = obj.nickname;
        this.type = 'normal';
        this.camera = new Camera(obj);
        this.speed = 1;
        this.dead_flg = false;
        if(obj.id){ this.id = obj.id }
        this.balls = {};
        this.life = CONF.LIFE;

        this.menu = {
            name:       { x: CONF.BLK*1, y: CONF.BLK*1, v:this.nickname },
            score:      { x: CONF.BLK*1, y: CONF.BLK*2, v:0 },

            coin:       { x: CONF.BLK*5, y: CONF.BLK*2, v:0 },
            stage_name: { x: CONF.BLK*9, y: CONF.BLK*1, v:"WORLD" },
            stage_no:   { x: CONF.BLK*9, y: CONF.BLK*2, v:"1-1" },
            time_title: { x: CONF.BLK*13, y: CONF.BLK*1, v:"TIME" },
            time:       { x: CONF.BLK*13, y: CONF.BLK*2, v:300 },
            life_name:  { x: CONF.BLK*17, y: CONF.BLK*1, v:"LIFE" },
            life:       { x: CONF.BLK*17, y: CONF.BLK*2, v:this.life},
        }
        this.score_interval = CONF.FPS;
        this.score_i = 0;

        this.movement = {};

        this.width = CONF.STICK_W;
        this.height = CONF.STICK_Y;
        this.angle = 0;
        this.direction = 'r';  // direction is right:r, left:l;

        this.status = 'standby';

        this.cmd_unit = {
            // jump: {
            //     type: 'single',
            //     in_action: false,
            //     e: 0,
            //     max_e: CONF.jump_power * CONF.BLK,
            //     cooltime: 0,
            // }
        };

        this.cmd_his = []; //command history. FIFO.
        for(let i=0; i<CONF.CMD_HIS; i++){
            this.cmd_his.push({});
        }
        this.auto_move = false;
        this.debug_info = {
            collistion: '',
        };
    }
    command(param){
        this.movement = param;
    }
    frame(){
        // this.score_cal();
        let command = this.movement;
        // movement
        if(command.forward){
            this.move(CONF.MV_SPEED);
        }
        if(command.back){
            this.move(-CONF.MV_SPEED);
        }
        if(command.left){
            this.angle = Math.PI * 1;
            this.direction = 'l';
            this.move(CONF.MV_SPEED);
        }
        if(command.right){
            this.angle = Math.PI * 0;
            this.direction = 'r';
            this.move(CONF.MV_SPEED);
        }
        if(command.up){
        }
        if(command.down){
        }

        // command reflesh.
        this.cmd_his.push(command);
        if(this.cmd_his.length > CONF.CMD_HIS){
            this.cmd_his.shift();
        }

        if(this.auto_move){
            this.angle = Math.PI * 0;
            this.direction = 'r';
            this.move(CONF.MV_SPEED);
        }
        // auto shoot
        let balls = Object.values(this.balls);
        if(balls.length < 1){
            this.shoot();
        }
        this.isDead();
    }
    shoot(){
        if(!this.life_down()){ return }
        let param = {
            x: this.x + this.width / 2,
            y: this.y - CONF.CHAR_Y,
            caller: this.id,
        }
        let ball = new Ball(param);
        this.balls[ball.id] = ball;
        ccdm.balls[ball.id] = ball;
        if(this.status === 'standby'){
            this.status = 'play';
        }
    }
    life_down(score=1){
        if(this.life <= 0){
            this.dead_flg = true;
            return false;
        }
        this.life = this.life - score;
        this.menu.life.v = this.life;
        return true;
    }
    collistion(oldX, oldY, oldCamera){
        let collision = false;
        if(this.intersectField()){
                collision = true;
                this.debug_info.collistion = 'intersectField';
        }
        if(this.intersectBlock(oldX, oldY)){
            collision = true;
            this.debug_info.collistion = 'intersectBlock';
        }
        if(collision){
            this.x = oldX; this.y = oldY;
            this.camera.set(oldCamera);
        }else{
            this.debug_info.collistion = '';
        }
        return collision;
    }
    move(distance){
        const oldX = this.x, oldY = this.y;
        const oldCamera = {
            x: this.camera.x,
            t: this.camera.y,
        };

        let range = distance * this.speed;
        let dis_x = range * Math.cos(this.angle);
        let dis_y = range * Math.sin(this.angle);
        if(this.x + dis_x <= this.camera.x + CONF.CENTER){
            this.x += dis_x;
            this.y += dis_y;
        }else{
            this.camera.x += dis_x;
            this.x += dis_x;
            this.y += dis_y;
        }

        let collision = this.collistion(oldX, oldY, oldCamera);

        if(!collision){
            Object.keys(ccdm.items).forEach((id)=>{
                if(ccdm.items[id] && this.intersect(ccdm.items[id])){
                    ccdm.items[id].touched = this.id;
                    this.menu.coin.v++;
                    delete ccdm.items[id];
                }
            });
        }
        return !collision;
    }
    isDead(){
        if(this.status != 'play'){
            return;
        }
        let dead_flg = false;
        if(this.y > CONF.DEAD_LINE){
            dead_flg = true;
        }

        if(dead_flg){
            this.dead_flg = true;
            // this.respone();
        }
    }
    score_cal(){
        this.menu.score.v += 1;
    }
    remove(){
        delete ccdm.players[this.id];
        io.to(this.socketId).emit('dead');
    }
    respone(){
        this.dead_flg = false;
        this.menu.score.v = 0;
        this.life = CONF.LIFE;
        this.menu.life.v = this.life;
    }
    toJSON(){
        return Object.assign(super.toJSON(), {
            socketId: this.socketId,
            nickname: this.nickname,
            type: this.type,
            camera: this.camera,
            menu: this.menu,
            dead_flg: this.dead_flg,
        });
    }
}

class Stage extends GeneralObject{
    constructor(obj={}){
        super(obj);
        this.no = obj.no;
        // ### Explanation. ###
        // # height max 14, width max 500
        // # height min 14, width min 16
        // # mark{ 'b':hardblock '.': nothing 'n':normalblock}
        // ###
        this.map = this.load_stage();
        this.END_POINT = this.map.length * CONF.BLK;
    }
    def(){
        let st = [];
        let blk_y = CONF.MAX_HEIGHT - 1;
        let blk_exist = false;
        let blk_viewing = false;
        let blk_height = 3;
        let blocks = [
            'r',
            'b',
            'g',
            'y',
        ];
        let hool = Math.round(CONF.CHAR_W / CONF.BLK) + 2;
        for(let x=0; x<CONF.MAX_WIDTH; x++){
            st.push([]);
            for(let y=0; y<CONF.MAX_HEIGHT; y++){
                if(y == 7 || y == 12){
                    if(x % hool == 0){
                        st[x].push(blocks[random(blocks.length)]);
                    }else{
                        st[x].push('.');
                    }
                }else{
                    st[x].push('.');
                }
            }
        }
        return st;
    }
    load_stage(){
        return this.def();
    }
    rand_step(step){
        // range: 5 ~ max -1
        let min = 5;
        let max = CONF.MAX_HEIGHT - 1;
        return random(max - min) + min;
    }
    toJSON(){
        return Object.assign(super.toJSON(),{
            no: this.no,
            map: this.map,
            END_POINT: this.END_POINT,
        });
    }
}

class commonBlock extends PhysicsObject{
    constructor(obj={}){
        super(obj);
        this.attr = "Block";
        this.type = obj.type;
        this.height = CONF.BLK * 1;
        this.width = CONF.BLK;
        this.touched = null;
        this.bounding = false;
        this.effect = false;
        this.event = false;
    }
    frame(){
        if(this.touched){
            this.remove();
        }
    }
    remove(){
        console.log(`delete Block: ${this.type}\t${this.id}`);
        delete ccdm.blocks[this.id];
    }
    toJSON(){
        return Object.assign(super.toJSON(),{
            type: this.type,
            attr: this.attr,
            touched: this.touched,
            bounding: this.bounding,
            effect: this.effect,
            event: this.event,
        });
    }
}
class redBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "red";
        this.height = CONF.BLK * 1;
    }
}
class blueBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "blue";
        this.height = CONF.BLK * 1;
    }
}
class greenBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "green";
        this.height = CONF.BLK * 1;
    }
}
class yellowBlock extends commonBlock{
    constructor(obj={}){
        super(obj);
        this.type = "yellow";
        this.height = CONF.BLK * 1;
    }
}
const ccdm = new CCDM();

// ### ---
class GameMaster{
    constructor(){
        this.create_stage(ccdm);
        logger.debug("game master.");
        // console.log(ccdm.stage.load_stage());
    }
    create_stage(ccdm){
        let x = 0;
        let y = 0;
        let goal_flg = false;
        ccdm.stage.map.forEach((line)=>{
            y = 0;
            line.forEach((point)=>{
                let param = {
                    x: x * CONF.BLK,
                    y: y * CONF.BLK,
                };
                if(point === 'r'){
                    let block = new redBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                if(point === 'b'){
                    let block = new blueBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                if(point === 'y'){
                    let block = new yellowBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                if(point === 'g'){
                    let block = new greenBlock(param);
                    ccdm.blocks[block.id] = block;
                }
                y++;
            });
            x++;
        });
    }
}

const gameMtr = new GameMaster();

// **vvv** END_MARK
// ## build cut static.
// ## modules

module.exports = {
    GM: GameObject,
    PlayerStick: PlayerStick,
    Ball: Ball,
    CONF: CONF,
    ccdm: ccdm,
    gameMtr: gameMtr,
}
