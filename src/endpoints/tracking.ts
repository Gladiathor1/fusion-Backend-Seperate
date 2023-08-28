import Logger from '../logger';


const logger = new Logger(true)

export default class Tracking {
    async handler(socket?: any) {
        socket.on("save-log", (data: any) => {
            if(data.message){
                logger.write(data.message,data.type)
                socket.emit("log-status", {message: "success"})
            }else{
                socket.emit("log-status", {message: "failed"})
            }
        })
        
    }
}