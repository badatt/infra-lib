/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CfnOutput, Construct } from '@aws-cdk/core';
import { HostedZone as AwsHostedZone } from '@aws-cdk/aws-route53';

/**
 * Hostedzone construct props
 */
export interface HostedZoneProps {
  readonly domainName: string;
}

/**
 * Creates a Hosted zone with the domain name.
 */
export class HostedZone extends Construct {
  public zoneId: string;
  public zone: AwsHostedZone;
  constructor(scope: Construct, id: string, props: HostedZoneProps) {
    super(scope, id);

    this.zone = new AwsHostedZone(scope, `${id}HostedZone`, {
      zoneName: props.domainName,
      comment: `DNS HostedZone ${props.domainName}`,
    });

    this.zoneId = this.zone.hostedZoneId;

    new CfnOutput(scope, `${id}HostedZoneId`, {
      value: this.zoneId,
      description: `HostedZone Id for ${props.domainName}`,
    });
  }
}
