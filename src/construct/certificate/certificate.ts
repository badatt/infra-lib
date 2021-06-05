/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CfnOutput, Construct } from '@aws-cdk/core';
import { Certificate as AwsCertificate, CertificateValidation } from '@aws-cdk/aws-certificatemanager';
import { HostedZone } from '@aws-cdk/aws-route53';

/**
 * Certificate props
 *
 * 'prefix' defaults to '*'
 */
export interface CertificateProps {
  readonly rootDomain: string;
  readonly prefix: string;
  readonly validate?: boolean;
  readonly hostedZone?: HostedZone;
}

/**
 * Certificate construct
 */
export class Certificate extends Construct {
  public certificate: AwsCertificate;
  public certificateArn: string;
  constructor(scope: Construct, id: string, props: CertificateProps) {
    super(scope, id);

    const domainName = props.prefix ? `${props.prefix}.${props.rootDomain}` : `*.${props.rootDomain}`;

    this.certificate = new AwsCertificate(scope, `${id}Certificate`, {
      domainName,
      validation: props.validate ? CertificateValidation.fromDns(props.hostedZone) : undefined,
    });

    this.certificateArn = this.certificate.certificateArn;

    new CfnOutput(scope, `${id}CertificateArn`, {
      value: this.certificateArn,
      description: `Certificate Arn for ${domainName}`,
    });
  }
}
