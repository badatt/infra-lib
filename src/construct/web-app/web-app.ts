/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CfnOutput, Construct } from '@aws-cdk/core';
import { IHostedZone } from '@aws-cdk/aws-route53';
import { ICertificate } from '@aws-cdk/aws-certificatemanager';
import { BlockPublicAccess, Bucket, ObjectOwnership } from '@aws-cdk/aws-s3';

/**
 * Web App construct props
 */
export interface WebAppProps {
  readonly rootDomain: string;

  readonly subDomain: string;

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

    const hostedZoneName = props.hostedZone.zoneName;
    const siteUrl = props.subDomain ? `${props.subDomain}.${hostedZoneName}` : hostedZoneName;

    this.bucket = new Bucket(scope, `${id}DeploymentBucket`, {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
    });

    new CfnOutput(this, 'WebsiteBucket', {
      value: this.bucket.bucketName,
      description: `The deployment bucket for ${siteUrl}`,
    });
  }
}
