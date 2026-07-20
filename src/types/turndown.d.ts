/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "turndown" {
  interface TurndownOptions {
    headingStyle?: "setext" | "atx";
    hr?: string;
    br?: string;
    bulletListMarker?: "-" | "+" | "*";
    codeBlockStyle?: "indented" | "fenced";
    emDelimiter?: "_" | "*";
    fence?: string;
    linkStyle?: "inlined" | "referenced";
    linkReferenceStyle?: "full" | "collapsed" | "shortcut";
    preformattedCode?: boolean;
  }

  interface Rule {
    filter: string | string[] | ((node: any, options: any) => boolean);
    replacement: (content: string, node: any, options: any) => string;
  }

  class TurndownService {
    constructor(options?: TurndownOptions);
    addRule(key: string, rule: Rule): this;
    keep(filter: string | string[]): this;
    remove(filter: string | string[]): this;
    use(plugins: any[]): this;
    turndown(html: string | HTMLElement): string;
  }

  export default TurndownService;
}
