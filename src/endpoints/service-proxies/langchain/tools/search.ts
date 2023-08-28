import axios from 'axios'; // If using axios for HTTP requests
import { config } from '../../../../config';
import summarize from './summarize';

interface SerperSearchResults {
  answerBox?: {
    answer?: string;
    snippet?: string;
    snippetHighlighted?: string[];
  };
  knowledgeGraph?: {
    title?: string;
    type?: string;
    description?: string;
    attributes?: Record<string, string>;
  };
  organic?: {
    snippet?: string;
    link?: string;
    attributes?: Record<string, string>;
  }[];
}

interface SerperApiResponse {
  search_term: string;
  search_type: string;
}

interface Tool {
  available(): boolean;
  call(goal: string, task: string, input_str: string): Promise<any>;
}

export default class Search implements Tool {
  public description: string =
    'Search Google for short up to date searches for simple questions news and people.\n' +
    'The argument should be the search query.';
  public public_description: string = 'Search google for information about current events.';
  model_settings: any; 

  public available(): boolean {
    // Implement the available() method as in the Python code
    return config.services?.serperapi?.apiKey !== null && config.services?.serperapi?.apiKey !== '';
  }

  constructor(model_settings: any) {
    this.model_settings = model_settings;
  }

  public async call(goal: string, task: string, input_str: string): Promise<any> {

    const results: SerperSearchResults = await this._googleSerperSearchResults(input_str);

    try {

    const k: number = 6; // Number of results to return
    const max_links: number = 3; // Number of links to return
    const snippets: string[] = [];
    const links: string[] = [];

    if (results.answerBox) {
      const answer_values: string[] = [];
      const answer_box = results.answerBox;
      if (answer_box.answer) {
        answer_values.push(answer_box.answer);
      } else if (answer_box.snippet) {
        answer_values.push(answer_box.snippet.replace(/\n/g, ' '));
      } else if (answer_box.snippetHighlighted) {
        answer_values.push(answer_box.snippetHighlighted.join(', '));
      }

      if (answer_values.length > 0) {
        return answer_values.join('\n')
      }
    }

    if (results.knowledgeGraph) {
      const kg = results.knowledgeGraph;
      const title = kg.title;
      const entity_type = kg.type;
      if (entity_type) {
        snippets.push(`${title}: ${entity_type}.`);
      }
      const description = kg.description;
      if (description) {
        snippets.push(description);
      }
      for (const [attribute, value] of Object.entries(kg.attributes || {})) {
        snippets.push(`${title} ${attribute}: ${value}.`);
      }
    }

    for (const result of results.organic?.slice(0, k) || []) {
      if (result.snippet) {
        snippets.push(result.snippet);
      }
      if (result.link && links.length < max_links) {
        links.push(result.link);
      }
      for (const [attribute, value] of Object.entries(result.attributes || {})) {
        snippets.push(`${attribute}: ${value}.`);
      }
    }

    if (snippets.length === 0) {
      return {text:"I couldn't find anything about that."};
    }

    return summarize(this.model_settings,goal, task, snippets);
  }catch(e){
    return false;
  }
    // TODO: Stream with formatting
    // return `${summary}\n\nLinks:\n${links.map(link => `- ${link}`).join('\n')}`;
  }

  private async _googleSerperSearchResults(searchTerm: string, searchType: string = 'search'): Promise<SerperSearchResults> {
    try{
      const headers = {
        'X-API-KEY': config.services?.serperapi?.apiKey || '',
        'Content-Type': 'application/json',
      };
      const params = {
        q: searchTerm,
      };

      const response = await axios.post(`https://google.serper.dev/${searchType}`, params, { headers });
      return response.data;
    }catch(e){
      console.log(e)
      return {
        organic: []
      }
    }
  }

}
