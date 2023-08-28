import { LLMChain } from 'langchain/chains';

import { code_prompt } from '../promptTemplates';
export default class Code {
    model_settings: any;

    constructor(model_settings: any) {
        this.model_settings = model_settings;
    }
  async call(goal: string, task: string) {
    try{
      const chain = new LLMChain({
        llm: this.model_settings,
        prompt: code_prompt,
      });

      const response = await chain.call({
        goal,
        task,
        language: "en"
      })

      return response
    }catch(e){
      return false;
    }
  }
}
