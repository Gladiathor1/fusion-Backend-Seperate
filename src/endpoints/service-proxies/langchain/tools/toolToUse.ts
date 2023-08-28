import Code from './code';
import Image from './image';
import Search from './search';
import summarize from './summarize';



class ToolToUse {
    tool: string;
    model_settings: any; // changed type to any for now only

  constructor(model_settings: any, tool: string) { // changed type to any for now only
    // super();
    this.model_settings = model_settings;
    this.tool = tool;
  }

    async get_tool_result({ goal, task, analysis }: { goal: string, task: string, analysis: any }): Promise<any> {

        if(this.tool === "search") {
            return new Search(this.model_settings).call(goal, task, analysis.arg)
        }else if(this.tool === "image"){
            return new Image().call(goal, task, analysis.arg)
        }else if(this.tool === "code"){
          return new Code(this.model_settings).call(goal,task)
        }
    }        


}

export default ToolToUse;
