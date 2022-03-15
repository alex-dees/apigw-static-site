import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as s3Deploy from 'aws-cdk-lib/aws-s3-deployment';

let response = {
  statusCode: '200',
  responseParameters: {
    'method.response.header.Content-Type': true,
  }
};

let s3Integration: any = {
  service: 's3',
  integrationHttpMethod: 'GET',
  options: {
    passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
    integrationResponses: [
      {
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': 'integration.response.header.Content-Type'
        }
      }
    ]  
  }  
};

export class ApigwStaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bkt = new s3.Bucket(this, 'Bucket', {
      bucketName: 'site-bkt'
    });

    new s3Deploy.BucketDeployment(this, 'Deployment', {
      sources: [s3Deploy.Source.asset('./src')],
      destinationBucket: bkt
    });

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    s3Integration.region = this.region;
    s3Integration.options.credentialsRole = role;

    const api = new apigw.RestApi(this, 'S3Proxy', {
      restApiName: 'site-api',
      endpointTypes: [
        apigw.EndpointType.REGIONAL
      ]
    });
    
    const bucketResource = api.root.addResource('{folder}');
    const objectResource = bucketResource.addResource('{item}');
    
    lsBuckets(api.root);
    lsObjects(bucketResource);
    getObject(objectResource);
  }  
}


function lsBuckets(resource: apigw.IResource){
  const integration = {
    ...s3Integration, 
    path: '/'
  };

  resource.addMethod('GET', new apigw.AwsIntegration(integration), {    
    authorizationType: apigw.AuthorizationType.IAM,
    methodResponses: [ response ]
  });
}

function lsObjects(resource: apigw.IResource) {
  const integration = {
    ...s3Integration,
    path: '{bucket}'
  };

  integration.options.requestParameters = {
    'integration.request.path.bucket': 'method.request.path.folder'
  };

  resource.addMethod('GET', new apigw.AwsIntegration(integration), {
    methodResponses: [ response ],
    requestParameters: {
      'method.request.path.folder': true
    }
  });
}

function getObject(resource: apigw.IResource) {
  const integration = {
    ...s3Integration,
    path: '{bucket}/{object}'
  };

  integration.options.requestParameters = {
    'integration.request.path.bucket': 'method.request.path.folder',
    'integration.request.path.object': 'method.request.path.item',
    'integration.request.path.Accept': 'method.request.path.Accept',
  };

  resource.addMethod('GET', new apigw.AwsIntegration(integration), {
    methodResponses: [ response ],
    requestParameters: {
      'method.request.path.folder': true,
      'method.request.path.item': true,
      'method.request.path.Accept': true,
    }
  });
}