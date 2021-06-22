/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CfnOutput, Construct } from '@aws-cdk/core';
import {
  AllowedMethods,
  BehaviorOptions,
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { IHostedZone, ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { DnsValidatedCertificate, ICertificate } from '@aws-cdk/aws-certificatemanager';
import { BlockPublicAccess, Bucket, ObjectOwnership } from '@aws-cdk/aws-s3';
import { ArnPrincipal, Effect, PolicyStatement } from '@aws-cdk/aws-iam';

/**
 * Web App construct props
 */
export interface WebAppProps {
  readonly siteUrl: string;

  readonly hostedZone: IHostedZone;

  readonly certificate: ICertificate;

  readonly routes?: string[];

  readonly dnsValidationCertficate?: boolean;
}

/**
 * Creates a serverless SPA Web application. Hosted on S3 bucket.
 * Cloudfront backs it up as CDN and distributes the content over all Edges.
 *
 * This construct expects
 *
 *  - A hosted zone to add DNS records, not mandatory. Mandated only
 *    if you want custom domain attached.
 *
 *  - A Certificate with custom domain name, to attach to the cloudfront.
 *    No custom domain attached in case of absense of the certificate.
 */
export class WebApp extends Construct {
  //public bucket: Bucket;
  constructor(scope: Construct, id: string, props: WebAppProps) {
    super(scope, id);

    let cert: ICertificate;

    if (props?.dnsValidationCertficate) {
      cert = new DnsValidatedCertificate(scope, `${id}DnsValidationCertificate`, {
        domainName: props.siteUrl,
        hostedZone: props.hostedZone,
        region: 'us-east-1',
      });
    } else {
      cert = props.certificate;
    }

    const rootBucket = this.createDeploymentBucket(scope, 'Root');

    // CloudFront Access Identity
    const cloudFrontAccessIdentity = new OriginAccessIdentity(scope, `${id}OriginAccessIdentity`, {
      comment: props.siteUrl + ' Access Identity',
    });

    // CloudFront distribution for site application
    const additionalBehaviours: Record<string, BehaviorOptions> = {};

    props.routes?.forEach((value, index) => {
      const bucket = this.createDeploymentBucket(scope, value);
      additionalBehaviours[value] = {
        origin: new S3Origin(bucket, {
          originAccessIdentity: cloudFrontAccessIdentity,
        }),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      };
    });

    const cloudfrontDistribution = new Distribution(scope, `${id}CloudfrontDistribution`, {
      comment: props.siteUrl + ' CloudFront distribution',
      defaultBehavior: {
        origin: new S3Origin(rootBucket),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: additionalBehaviours,
      certificate: cert,
      domainNames: [props.siteUrl],
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: '/index.html',
          responseHttpStatus: 403,
        },
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 404,
        },
      ],
    });

    // Route53 arecord linking the cloudfront distribution
    new ARecord(scope, `${id}ARecord`, {
      recordName: props.siteUrl,
      target: RecordTarget.fromAlias(new CloudFrontTarget(cloudfrontDistribution)),
      zone: props.hostedZone,
    });
  }

  createDeploymentBucket = (scope: Construct, id: string): Bucket => {
    const bucket = new Bucket(scope, `${id}DeploymentBucket`, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    const githubDroidAccessPolicy = new PolicyStatement({
      actions: ['s3:DeleteObject*', 's3:PutObject', 's3:Abort*', 's3:ListBucket', 's3:PutObjectAcl'],
      effect: Effect.ALLOW,
      principals: [new ArnPrincipal('arn:aws:iam::261778676253:user/github-droid')],
      resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
    });

    bucket.addToResourcePolicy(githubDroidAccessPolicy);

    new CfnOutput(scope, `${id}WebsiteBucket`, {
      value: bucket.bucketName,
    });

    return bucket;
  };
}
