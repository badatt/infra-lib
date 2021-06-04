/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CfnOutput, Construct } from '@aws-cdk/core';
import { HostedZone as AwsHostedZone } from '@aws-cdk/aws-route53';

export interface HostedZoneProps {
  readonly rootDomain: string;
}

export class HostedZone extends Construct {
  public zoneId: string;
  public zone: AwsHostedZone;
  constructor(scope: Construct, id: string, props: HostedZoneProps) {
    super(scope, id);

    this.zone = new AwsHostedZone(scope, `${id}HostedZone`, {
      zoneName: props.rootDomain,
      comment: 'DNS HostedZone',
    });

    this.zoneId = this.zone.hostedZoneId;

    new CfnOutput(scope, `${id}HostedZone`, {
      value: this.zoneId,
      description: `HostedZone Id for ${props.rootDomain}`,
    });
  }
}
