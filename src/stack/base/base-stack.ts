/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Construct, Stack, StackProps } from '@aws-cdk/core';

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
