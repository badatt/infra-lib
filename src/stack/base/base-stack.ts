/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Construct, Stack, StackProps, Tags } from '@aws-cdk/core';

/**
 * Base stack that every stack can extend to get extra benefits.
 * It is highly recomended to extend this base class while creation
 * of your stacks.
 */
export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    Tags.of(this).add('IacSource', 'cdk');
  }
}
