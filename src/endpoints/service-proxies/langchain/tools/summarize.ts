import { LLMChain } from 'langchain/chains';
import { summarize_prompt } from '../promptTemplates';


async function summarize(model_settings: any,goal: string,query: string,snippets: string[]): Promise<object> {
  try {
    const chain = new LLMChain({
      llm:  model_settings,
      prompt: summarize_prompt,
    });

    return await chain.call({
      goal: goal,
      query: query,
      snippets: snippets,
    })
  }catch(e){
    return {
      text: `Sorry, I'm unable to summerize this info: ${e}`
    }
  }
}


export default summarize;