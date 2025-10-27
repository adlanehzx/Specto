declare module "passport-github2" {
  import { Strategy as PassportStrategy } from "passport";
  interface GitHubStrategyOptionsWithRequest {}
  export class Strategy implements PassportStrategy {
    constructor(options: any, verify: any);
    name: string;
    authenticate(req: any, options?: any): void;
  }
  export = Strategy;
}
