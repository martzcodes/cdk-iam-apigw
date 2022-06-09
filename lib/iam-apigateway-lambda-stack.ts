import { Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  AccountPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class IamApigatewayLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ["execute-api:Invoke"],
          principals: [
            new AccountPrincipal(this.account),
            // for cross-account access add other account principals here
          ],
        }),
      ],
    });
    const apiFn = new NodejsFunction(this, `iamApiFn`, {
      runtime: Runtime.NODEJS_16_X,
      entry: `${__dirname}/api-lambda.ts`,
    });
    const api = new RestApi(this, `iam-backed-api`, {
      defaultMethodOptions: {
        authorizationType: AuthorizationType.IAM, // IAM-based authorization
      },
      policy: apiPolicy, // our API policy that allows cross-account access
      defaultIntegration: new LambdaIntegration(apiFn)
    });
    api.root.addMethod("GET");
    
    // This could be a construct!
    const requestorFn = new NodejsFunction(this, `requestorFn`, {
      runtime: Runtime.NODEJS_16_X,
      entry: `${__dirname}/requestor.ts`,
    });
    requestorFn.addEnvironment("IAM_API", api.url);
    requestorFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["execute-api:Invoke"],
        resources: [api.arnForExecuteApi()],
      })
    );
  }
}
