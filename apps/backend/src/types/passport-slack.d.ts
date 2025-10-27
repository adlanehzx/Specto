declare module "@aoberoi/passport-slack" {
  import { Strategy as PassportStrategy } from "passport";
  export class Strategy implements PassportStrategy {
    constructor(options: any, verify: any);
    name: string;
    authenticate(req: any, options?: any): void;
  }
  export = Strategy;
}
