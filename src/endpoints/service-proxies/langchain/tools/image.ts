import {Configuration,OpenAIApi} from 'openai'
import { config } from '../../../../config';

async function getOpenAiImage(inputStr: string): Promise<string> {
  const apiKey = config.services?.openai?.apiKey;

  const openai:any = new OpenAIApi(new Configuration({ apiKey: apiKey }))
  const response: any = await openai.createImage({
    prompt: inputStr,
    n: 1,
    size: '256x256'
  });


  return response.data.data[0];
}

export default class Image {
  description =
    'Used to sketch, draw, or generate an image. The input string ' +
    'should be a detailed description of the image touching on image ' +
    'style, image focus, color, etc';
  public_description = 'Generate AI images.';

  async call(
    goal: string,
    task: string,
    inputStr: string
  ): Promise<any> {
    try {
        const url = await getOpenAiImage(inputStr);
        return url
    }catch(e) {
        console.log("Error Found: ",e)
        return false;
    }
  }
}
