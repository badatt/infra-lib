/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CfnOutput, Construct, Duration } from '@aws-cdk/core';
import {
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  PriceClass,
  SecurityPolicyProtocol,
  ViewerCertificate,
} from '@aws-cdk/aws-cloudfront';
import { IHostedZone, ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { BlockPublicAccess, Bucket, ObjectOwnership } from '@aws-cdk/aws-s3';
import { ArnPrincipal, Effect, PolicyStatement } from '@aws-cdk/aws-iam';

/**
 * Web App construct props
 */
export interface WebAppProps {
  readonly siteUrl: string;

  readonly hostedZone: IHostedZone;

  readonly certificate: ICertificate;
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
  public bucket: Bucket;
  constructor(scope: Construct, id: string, props: WebAppProps) {
    super(scope, id);

    this.bucket = new Bucket(scope, `${id}DeploymentBucket`, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    const githubDroidAccessPolicy = new PolicyStatement({
      actions: ['s3:DeleteObject*', 's3:PutObject', 's3:Abort*', 's3:ListBucket', 's3:PutObjectAcl'],
      effect: Effect.ALLOW,
      principals: [new ArnPrincipal('arn:aws:iam::261778676253:user/github-droid')],
      resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
    });

    this.bucket.addToResourcePolicy(githubDroidAccessPolicy);

    // CloudFront Access Identity
    const cloudFrontAccessIdentity = new OriginAccessIdentity(scope, `${id}OriginAccessIdentity`, {
      comment: props.siteUrl + ' Access Identity',
    });

    // CloudFront distribution for site application
    const cloudfrontDistribution = new CloudFrontWebDistribution(scope, `${id}CloudfrontDistribution`, {
      comment: props.siteUrl + ' CloudFront distribution',
      enableIpV6: false,
      originConfigs: [
        {
          s3OriginSource: {
            originAccessIdentity: cloudFrontAccessIdentity,
            s3BucketSource: this.bucket,
          },
          behaviors: [
            {
              allowedMethods: CloudFrontAllowedMethods.ALL,
              compress: true,
              forwardedValues: {
                cookies: {
                  forward: 'none',
                },
                // Forward the origin header so that the S3 origin can react to CORS requests
                // and return the expected headers.
                headers: ['Origin'],
                queryString: false,
              },
              defaultTtl: Duration.seconds(5),
              isDefaultBehavior: true,
              minTtl: Duration.seconds(5),
            },
          ],
        },
      ],
      priceClass: PriceClass.PRICE_CLASS_100,
      viewerCertificate: ViewerCertificate.fromAcmCertificate(props.certificate, {
        securityPolicy: SecurityPolicyProtocol.TLS_V1_2_2018,
        aliases: [props.siteUrl],
      }),
      errorConfigurations: [
        {
          errorCode: 403,
          responsePagePath: '/index.html',
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responsePagePath: '/index.html',
          responseCode: 200,
          errorCachingMinTtl: 0,
        },
      ],
    });

    // Route53 arecord linking the cloudfront distribution
    new ARecord(scope, `${id}ARecord`, {
      recordName: props.siteUrl,
      target: RecordTarget.fromAlias(new CloudFrontTarget(cloudfrontDistribution)),
      zone: props.hostedZone,
    });

    new CfnOutput(scope, `${id}WebsiteBucket`, {
      value: this.bucket.bucketName,
      description: `The deployment bucket for ${props.siteUrl}`,
    });
  }
}
