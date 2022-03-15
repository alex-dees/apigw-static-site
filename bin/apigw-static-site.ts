#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApigwStaticSiteStack } from '../lib/apigw-static-site-stack';

const app = new cdk.App();
new ApigwStaticSiteStack(app, 'ApigwStaticSiteStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});