import fs from 'fs'

export default class Logger {
    private logFile:any;
    public logType = "INFO";
    public logMessage = "";
    public frontend: boolean = false;


    constructor(frontend: boolean = false){
        this.logFile = this.getFileName()
        this.frontend = frontend
        this.checkLogFile()
    }

    createLogFile(): void{
        try{
            const isFolderExist = fs.existsSync("logs")
            if(!isFolderExist){
                fs.mkdirSync("logs")
            }
            fs.writeFile(`logs/${this.logFile}`,"",(cb)=>{
                // console.log(cb)
            })
        }catch(e){
            console.log("[Error] Error while creating file and folder:",e)
        }
    }

    checkLogFile(): void{
        this.logFile = this.getFileName()
        const isFileExist = fs.existsSync(`logs/${this.logFile}`)

        if(!isFileExist) this.createLogFile()

    }

    write(logMessage: string, type:string = "INFO"){
        this.checkLogFile()
        this.logMessage = logMessage
        this.logType = type
        this.generateLogPattern()
        
        try{
            fs.appendFile(`logs/${this.logFile}`, this.logMessage,(cb)=>{
                console.log(this.logMessage)
            })  
        }catch(e){
            console.log("[Error] Error while writing log:", e)
        }      
    }

    generateLogPattern(): void{

        switch(this.logType.toLowerCase()){
            case "info":
                this.logMessage = `[${this.getDateTime(true)}] [INFO] ${this.logMessage}\n`
                return;
            case "error":
                this.logMessage = `[${this.getDateTime(true)}] [ERROR] ${this.logMessage}\n`
                return;
            case "warn":
                this.logMessage = `[${this.getDateTime(true)}] [WARN] ${this.logMessage}\n`
                return;
            case "debug":
                this.logMessage = `[${this.getDateTime(true)}] [DEBUG] ${this.logMessage}\n`
                return;
            default:
                this.logMessage = `[${this.getDateTime(true)}] [INFO] ${this.logMessage}\n`
        }

    }

    getFileName(): string{
        let file:string = `${this.getDateTime()}-${!this.frontend ? "logs" : "frontend"}.txt`

        return file;
    }

    getDateTime(getTime:boolean = false){
        const today = new Date();
        let date:string 

        if(!getTime){
            date = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`
        }else{
            date = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
        }

        return date;
    }
}


export const logger = new Logger()